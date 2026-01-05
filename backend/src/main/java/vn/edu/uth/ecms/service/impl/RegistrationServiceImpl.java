package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.response.RegistrationResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.exception.*;
import vn.edu.uth.ecms.repository.*;
import vn.edu.uth.ecms.service.ClassService;
import vn.edu.uth.ecms.service.RegistrationService;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RegistrationServiceImpl implements RegistrationService {

    private final CourseRegistrationRepository registrationRepository;
    private final ClassRepository classRepository;
    private final StudentRepository studentRepository;
    private final ClassService classService;

    @Override
    public RegistrationResponse registerForClass(Long classId) {
        log.info("🎓 Student registering for class ID: {}", classId);

        // Get current student
        Student student = getCurrentStudent();
        log.info("👤 Student: {} ({})", student.getFullName(), student.getStudentCode());
        
        // Get class
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found"));
        
        log.info("📚 Class: {} - {}", classEntity.getClassCode(), 
                classEntity.getSubject().getSubjectName());

        // ✅ CRITICAL: Get semester of THIS class
        Semester semester = classEntity.getSemester();
        Subject subject = classEntity.getSubject();
        
        log.info("📅 Class semester: {} (Status: {}, Registration: {})", 
                semester.getSemesterCode(), 
                semester.getStatus(), 
                semester.getRegistrationEnabled());

        // ✅ VALIDATE: Semester of THIS class
        validateRegistration(student, classEntity, semester, subject);

        // ✅ CHECK: Already registered (and dropped)?
        Optional<CourseRegistration> existingReg = registrationRepository
                .findByStudentAndClass(student.getStudentId(), classEntity.getClassId());

        CourseRegistration registration;

        if (existingReg.isPresent() && existingReg.get().getStatus() == RegistrationStatus.DROPPED) {
            // ✅ RE-REGISTER (previously dropped)
            log.info("♻️ Re-registering for previously dropped class");
            registration = existingReg.get();
            registration.setStatus(RegistrationStatus.REGISTERED);
            registration.setRegisteredAt(LocalDateTime.now());
            registration.setDroppedAt(null);
        } else {
            // ✅ NEW REGISTRATION
            log.info("✨ Creating new registration");
            registration = CourseRegistration.builder()
                    .student(student)
                    .classEntity(classEntity)
                    .semester(semester)
                    .status(RegistrationStatus.REGISTERED)
                    .registeredAt(LocalDateTime.now())
                    .build();
        }

        CourseRegistration saved = registrationRepository.save(registration);
        classService.incrementEnrollment(classId);

        log.info("✅ Registration successful: {} enrolled in {}", 
                student.getStudentCode(), classEntity.getClassCode());
        
        return mapToResponse(saved);
    }

    /**
     * ✅ VALIDATE REGISTRATION - CHECK SEMESTER OF CLASS
     */
    private void validateRegistration(Student student, ClassEntity classEntity,
                                     Semester semester, Subject subject) {
        
        log.info("🔍 Validating registration...");
        
        // ✅ CHECK 1: Semester status must be UPCOMING
        if (semester.getStatus() != SemesterStatus.UPCOMING) {
            log.error("❌ Semester status is {}, not UPCOMING", semester.getStatus());
            throw new BadRequestException(
                    "Cannot register for class in " + semester.getStatus() + " semester. " +
                    "Only UPCOMING semesters allow registration."
            );
        }
        log.info("  ✓ Semester status: UPCOMING");

        // ✅ CHECK 2: Registration must be enabled
        if (!semester.getRegistrationEnabled()) {
            log.error("❌ Registration disabled for semester {}", semester.getSemesterCode());
            throw new BadRequestException(
                    "Registration is currently CLOSED for semester " + semester.getSemesterCode()
            );
        }
        log.info("  ✓ Registration enabled");

        // ✅ CHECK 3: Registration period (if set)
        LocalDate now = LocalDate.now();
        if (semester.getRegistrationStartDate() != null && now.isBefore(semester.getRegistrationStartDate())) {
            log.error("❌ Registration starts on {}", semester.getRegistrationStartDate());
            throw new BadRequestException(
                    "Registration has not started yet. Starts on: " + semester.getRegistrationStartDate()
            );
        }

        if (semester.getRegistrationEndDate() != null && now.isAfter(semester.getRegistrationEndDate())) {
            log.error("❌ Registration ended on {}", semester.getRegistrationEndDate());
            throw new BadRequestException(
                    "Registration period has ended. Ended on: " + semester.getRegistrationEndDate()
            );
        }
        log.info("  ✓ Within registration period");

        // ✅ CHECK 4: Class not full
        if (classEntity.isFull()) {
            log.error("❌ Class is full ({}/{})", 
                    classEntity.getEnrolledCount(), classEntity.getMaxStudents());
            throw new BadRequestException(
                    "Class is FULL (" + classEntity.getEnrolledCount() + "/" + 
                    classEntity.getMaxStudents() + ")"
            );
        }
        log.info("  ✓ Class has space ({}/{})", 
                classEntity.getEnrolledCount(), classEntity.getMaxStudents());

        // ✅ CHECK 5: Not already registered (exclude DROPPED)
        if (registrationRepository.existsByStudentAndClass(student.getStudentId(), classEntity.getClassId())) {
            log.error("❌ Already registered for this class");
            throw new BadRequestException("You are already registered for this class");
        }
        log.info("  ✓ Not already registered");

        // ✅ CHECK 6: No schedule conflict
        if (hasScheduleConflict(student, classEntity, semester)) {
            log.error("❌ Schedule conflict at {} {}", 
                    classEntity.getDayOfWeek(), classEntity.getTimeSlot());
            throw new ConflictException(
                    "Schedule conflict: You already have a class at " + 
                    getDayOfWeekDisplay(classEntity.getDayOfWeek()) + " " + 
                    classEntity.getTimeSlot().getDisplayName()
            );
        }
        log.info("  ✓ No schedule conflict");
        
        log.info("✅ All validations passed");
    }

    /**
     * Check schedule conflict
     */
    private boolean hasScheduleConflict(Student student, ClassEntity newClass, Semester semester) {
        // Get student's REGISTERED classes in SAME semester
        List<CourseRegistration> registrations = registrationRepository
                .findByStudentAndSemester(student.getStudentId(), semester.getSemesterId());

        DayOfWeek newDay = newClass.getDayOfWeek();
        TimeSlot newSlot = newClass.getTimeSlot();

        for (CourseRegistration reg : registrations) {
            // ✅ Only check REGISTERED classes (ignore DROPPED)
            if (reg.getStatus() != RegistrationStatus.REGISTERED) {
                continue;
            }
            
            ClassEntity existingClass = reg.getClassEntity();
            if (existingClass.getDayOfWeek() == newDay && existingClass.getTimeSlot() == newSlot) {
                log.warn("⚠️ Conflict with class: {} ({} {})", 
                        existingClass.getClassCode(), newDay, newSlot);
                return true;
            }
        }
        return false;
    }

    /**
     * Drop registration
     */
    @Override
    public void dropClass(Long registrationId) {
        log.info("📤 Dropping registration ID: {}", registrationId);
        
        CourseRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("Registration not found"));

        Student currentStudent = getCurrentStudent();
        if (!registration.getStudent().getStudentId().equals(currentStudent.getStudentId())) {
            throw new ForbiddenException("You can only drop your own registrations");
        }

        if (!registration.canDrop()) {
            throw new BadRequestException("Cannot drop this registration");
        }

        if (registration.getSemester().getStatus() != SemesterStatus.UPCOMING) {
            throw new BadRequestException(
                    "Cannot drop registration for " + registration.getSemester().getStatus() + " semester"
            );
        }

        registration.drop();
        registrationRepository.save(registration);
        classService.decrementEnrollment(registration.getClassEntity().getClassId());
        
        log.info("✅ Dropped registration: {}", registrationId);
    }

    /**
     * Get my registrations
     */
    @Override
    @Transactional(readOnly = true)
    public List<RegistrationResponse> getMyRegistrations(Long semesterId) {
        Student student = getCurrentStudent();

        List<CourseRegistration> registrations;
        if (semesterId != null) {
            registrations = registrationRepository.findByStudentAndSemester(
                    student.getStudentId(), semesterId);
        } else {
            registrations = registrationRepository.findByStudentAndStatus(
                    student.getStudentId(), RegistrationStatus.REGISTERED);
        }

        return registrations.stream().map(this::mapToResponse).toList();
    }

    /**
     * Get registration by ID
     */
    @Override
    @Transactional(readOnly = true)
    public RegistrationResponse getRegistrationById(Long registrationId) {
        CourseRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("Registration not found"));

        Student currentStudent = getCurrentStudent();
        if (!registration.getStudent().getStudentId().equals(currentStudent.getStudentId())) {
            throw new ForbiddenException("You can only view your own registrations");
        }

        return mapToResponse(registration);
    }

    /**
     * Get current student from security context
     */
    private Student getCurrentStudent() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return studentRepository.findByStudentCode(username)
                .orElseThrow(() -> new NotFoundException("Student not found"));
    }

    /**
     * Map entity to response DTO
     */
    private RegistrationResponse mapToResponse(CourseRegistration entity) {
        Student student = entity.getStudent();
        ClassEntity classEntity = entity.getClassEntity();
        Subject subject = classEntity.getSubject();
        Teacher teacher = classEntity.getTeacher();
        Semester semester = entity.getSemester();

        // Get room info safely
        String roomInfo = "TBA";
        try {
            if (classEntity.getFixedRoom() != null) {
                roomInfo = classEntity.getFixedRoom().getRoomCode();
            }
        } catch (Exception e) {
            log.warn("Could not get room info: {}", e.getMessage());
            roomInfo = "TBA";
        }

        return RegistrationResponse.builder()
                .registrationId(entity.getRegistrationId())
                .status(entity.getStatus().toString())
                .registeredAt(entity.getRegisteredAt())
                .droppedAt(entity.getDroppedAt())
                // Student info
                .studentId(student.getStudentId())
                .studentCode(student.getStudentCode())
                .studentName(student.getFullName())
                // Class info
                .classId(classEntity.getClassId())
                .classCode(classEntity.getClassCode())
                // Subject info
                .subjectId(subject.getSubjectId())
                .subjectCode(subject.getSubjectCode())
                .subjectName(subject.getSubjectName())
                .credits(subject.getCredits())
                // Teacher info
                .teacherId(teacher.getTeacherId())
                .teacherName(teacher.getFullName())
                // Semester info
                .semesterId(semester.getSemesterId())
                .semesterCode(semester.getSemesterCode())
                .semesterName(semester.getSemesterName())
                // Schedule info
                .dayOfWeek(classEntity.getDayOfWeek().toString())
                .dayOfWeekDisplay(getDayOfWeekDisplay(classEntity.getDayOfWeek()))
                .timeSlot(classEntity.getTimeSlot().toString())
                .timeSlotDisplay(classEntity.getTimeSlot().getFullDisplay())
                .room(roomInfo)
                .build();
    }

    /**
     * Get Vietnamese day of week display
     */
    private String getDayOfWeekDisplay(DayOfWeek day) {
        return switch (day) {
            case MONDAY -> "Thứ 2";
            case TUESDAY -> "Thứ 3";
            case WEDNESDAY -> "Thứ 4";
            case THURSDAY -> "Thứ 5";
            case FRIDAY -> "Thứ 6";
            case SATURDAY -> "Thứ 7";
            case SUNDAY -> "Chủ nhật";
        };
    }
}