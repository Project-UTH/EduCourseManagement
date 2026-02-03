package vn.edu.uth.ecms.service.impl;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.ManualEnrollRequest;
import vn.edu.uth.ecms.dto.response.CourseRegistrationResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.exception.*;
import vn.edu.uth.ecms.repository.*;
import vn.edu.uth.ecms.service.EnrollmentService;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EnrollmentServiceImpl implements EnrollmentService {

    private final CourseRegistrationRepository registrationRepository;
    private final StudentRepository studentRepository;
    private final ClassRepository classRepository;
    private final AdminRepository adminRepository;
    private final ClassSessionRepository sessionRepository;
    private final StudentScheduleRepository scheduleRepository;

    @Override
    public CourseRegistrationResponse manuallyEnrollStudent(Long classId, ManualEnrollRequest request) {
        log.info(" Admin enrolling student {} to class {}", request.getStudentId(), classId);

        // 1. Validate entities exist
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new NotFoundException("Student not found with ID: " + request.getStudentId()));

        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found with ID: " + classId));

        Admin admin = adminRepository.findById(1L)
                .orElseThrow(() -> new UnauthorizedException("Admin not found"));

        Semester semester = classEntity.getSemester();

        // 2. Check existing registration
        Optional<CourseRegistration> existingReg = registrationRepository
                .findByStudentStudentIdAndClassEntityClassId(student.getStudentId(), classId);

        CourseRegistration registration;

        if (existingReg.isPresent()) {
            CourseRegistration existing = existingReg.get();

            // Case 1: Already REGISTERED
            if (existing.getStatus() == RegistrationStatus.REGISTERED) {
                throw new DuplicateException(
                        " Sinh viên đã đăng ký lớp này. Registration ID: " + existing.getRegistrationId()
                );
            }

            // Case 2: Was DROPPED → RE-ACTIVATE
            log.info(" Student was previously DROPPED. Re-activating registration...");

          
            performEnrollmentValidation(student, classEntity, semester, "re-activation");

            existing.setStatus(RegistrationStatus.REGISTERED);
            existing.setRegisteredAt(LocalDateTime.now());
            existing.setDroppedAt(null);
            existing.setEnrollmentType(EnrollmentType.MANUAL);
            existing.setManualReason(request.getReason());
            existing.setManualNote(request.getNote());
            existing.setEnrolledByAdmin(admin);

            registration = registrationRepository.save(existing);

            log.info(" Re-activated existing registration ID: {}", registration.getRegistrationId());

        } else {
            // Case 3: NEW REGISTRATION
            log.info(" Creating new registration");

            
            performEnrollmentValidation(student, classEntity, semester, "new enrollment");

            registration = CourseRegistration.builder()
                    .student(student)
                    .classEntity(classEntity)
                    .semester(semester)
                    .registeredAt(LocalDateTime.now())
                    .enrollmentType(EnrollmentType.MANUAL)
                    .manualReason(request.getReason())
                    .manualNote(request.getNote())
                    .enrolledByAdmin(admin)
                    .status(RegistrationStatus.REGISTERED)
                    .build();

            registration = registrationRepository.save(registration);

            log.info(" Created new registration ID: {}", registration.getRegistrationId());
        }

        // 3. Increment enrolled count
        classEntity.incrementEnrolled();
        classRepository.save(classEntity);

        // 4. Create student schedule
        createStudentSchedule(student, classEntity, semester);

        log.info(" Student enrolled successfully");
        return mapToResponse(registration);
    }

    /**
     * @throws BadRequestException if semester is COMPLETED
     * @throws ConflictException if schedule conflict detected
     */
    private void performEnrollmentValidation(
            Student student,
            ClassEntity classEntity,
            Semester semester,
            String operationType) {

        log.info(" Validating {} for student {} in class {}",
                operationType, student.getStudentCode(), classEntity.getClassCode());

        // 1. Check semester status
        if (semester.getStatus() == SemesterStatus.COMPLETED) {
            throw new BadRequestException(
                    " Cannot enroll to COMPLETED semester: " + semester.getSemesterCode()
            );
        }

        // 2. Check class capacity (warn but allow admin override)
        if (classEntity.isFull()) {
            log.warn(" Class {} is FULL ({}/{}), admin forcing enrollment",
                    classEntity.getClassCode(),
                    classEntity.getEnrolledCount(),
                    classEntity.getMaxStudents());
        }

    
        ScheduleConflictResult conflictResult = checkScheduleConflict(student, classEntity, semester);

        if (conflictResult.hasConflict()) {
            log.error(" Schedule conflict detected for {} - {}", operationType, conflictResult.getMessage());
            throw new ConflictException(conflictResult.getMessage());
        }

        log.info(" Validation passed: No conflicts detected");
    }

    /**
     * @return ScheduleConflictResult with conflict details
     */
    private ScheduleConflictResult checkScheduleConflict(
            Student student,
            ClassEntity newClass,
            Semester semester) {

        log.debug(" Checking schedule conflict for student {} in class {}",
                student.getStudentCode(), newClass.getClassCode());

        // Step 1: Quick check - Fixed schedule conflict
        ScheduleConflictResult fixedConflict = checkFixedScheduleConflict(student, newClass, semester);
        if (fixedConflict.hasConflict()) {
            return fixedConflict;
        }

        // Step 2: Detailed check - Extra sessions conflict (only if semester ACTIVE)
        if (semester.getStatus() == SemesterStatus.ACTIVE) {
            ScheduleConflictResult extraConflict = checkExtraSessionConflict(student, newClass, semester);
            if (extraConflict.hasConflict()) {
                return extraConflict;
            }
        }

        return ScheduleConflictResult.noConflict();
    }

   
    private ScheduleConflictResult checkFixedScheduleConflict(
            Student student,
            ClassEntity newClass,
            Semester semester) {

        // Get student's current classes in same semester
        List<ClassEntity> currentClasses = registrationRepository
                .findByStudentAndSemester(student.getStudentId(), semester.getSemesterId())
                .stream()
                .filter(reg -> reg.getStatus() == RegistrationStatus.REGISTERED)
                .map(CourseRegistration::getClassEntity)
                .toList();

        // Check each current class
        for (ClassEntity existing : currentClasses) {
            // Skip if same class (for re-activation case)
            if (existing.getClassId().equals(newClass.getClassId())) {
                continue;
            }

            // Check if same day and time
            if (existing.getDayOfWeek().equals(newClass.getDayOfWeek()) &&
                    existing.getTimeSlot().equals(newClass.getTimeSlot())) {

                String message = String.format(
                        " Trùng lịch cố định!\n\n" +
                                "Sinh viên: %s (%s)\n" +
                                "Lớp hiện tại: %s - %s\n" +
                                "Lớp muốn thêm: %s - %s\n" +
                                "Xung đột: Cùng %s, %s\n\n" +
                                "Không thể thêm sinh viên vào lớp này.",
                        student.getFullName(),
                        student.getStudentCode(),
                        existing.getClassCode(),
                        existing.getSubject().getSubjectName(),
                        newClass.getClassCode(),
                        newClass.getSubject().getSubjectName(),
                        getDayDisplay(newClass.getDayOfWeek()),
                        newClass.getTimeSlot().getDisplayName()
                );

                log.warn(" Fixed schedule conflict: {} ({} {}) vs {} ({} {})",
                        existing.getClassCode(),
                        existing.getDayOfWeek(),
                        existing.getTimeSlot(),
                        newClass.getClassCode(),
                        newClass.getDayOfWeek(),
                        newClass.getTimeSlot());

                return ScheduleConflictResult.conflict(message);
            }
        }

        return ScheduleConflictResult.noConflict();
    }

    private ScheduleConflictResult checkExtraSessionConflict(
            Student student,
            ClassEntity newClass,
            Semester semester) {

        log.debug(" Checking extra session conflicts...");

        // Get new class IN_PERSON sessions (not pending)
        List<ClassSession> newSessions = sessionRepository
                .findByClass(newClass.getClassId())
                .stream()
                .filter(s -> !s.getIsPending() && s.getSessionType() == SessionType.IN_PERSON)
                .toList();

        // Check each new session against student's existing schedule
        for (ClassSession newSession : newSessions) {
            LocalDate date = newSession.getEffectiveDate();
            TimeSlot slot = newSession.getEffectiveTimeSlot();

            if (date == null || slot == null) {
                continue;  // Skip if no date/time (shouldn't happen for IN_PERSON)
            }

            // Query: Does student have any class at this date/time?
            boolean hasConflict = scheduleRepository.existsByStudentAndDateAndTimeSlot(
                    student.getStudentId(),
                    date,
                    slot
            );

            if (hasConflict) {
                // Find which class conflicts
                List<StudentSchedule> conflictingSchedules = scheduleRepository
                        .findByStudentAndDateAndTimeSlot(student.getStudentId(), date, slot);

                String conflictingClass = conflictingSchedules.isEmpty() ? "Unknown" :
                        conflictingSchedules.getFirst().getClassEntity().getClassCode();

                String message = String.format(
                        " Trùng lịch buổi học!\n\n" +
                                "Sinh viên: %s (%s)\n" +
                                "Lớp đang học: %s\n" +
                                "Lớp muốn thêm: %s - %s\n" +
                                "Xung đột: Ngày %s, %s, %s\n\n" +
                                "Không thể thêm sinh viên vào lớp này.",
                        student.getFullName(),
                        student.getStudentCode(),
                        conflictingClass,
                        newClass.getClassCode(),
                        newClass.getSubject().getSubjectName(),
                        date,
                        getDayDisplay(date.getDayOfWeek()),
                        slot.getDisplayName()
                );

                log.warn(" Extra session conflict at {} {} {}", date, date.getDayOfWeek(), slot);

                return ScheduleConflictResult.conflict(message);
            }
        }

        return ScheduleConflictResult.noConflict();
    }

    @Override
    public void dropStudent(Long classId, Long studentId, String reason) {
        log.info(" Dropping student {} from class {}", studentId, classId);

        CourseRegistration registration = registrationRepository
                .findByStudentStudentIdAndClassEntityClassId(studentId, classId)
                .orElseThrow(() -> new NotFoundException("Registration not found"));

        if (registration.isDropped()) {
            throw new BadRequestException("Student already dropped from this class");
        }

        registration.setStatus(RegistrationStatus.DROPPED);
        registration.setDroppedAt(LocalDateTime.now());
        registrationRepository.save(registration);

        ClassEntity classEntity = registration.getClassEntity();
        classEntity.decrementEnrolled();
        classRepository.save(classEntity);

        deleteStudentSchedule(studentId, classId);

        log.info(" Student dropped successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseRegistrationResponse> getStudentsInClass(Long classId) {
        return registrationRepository
                .findByClassEntityClassIdAndStatus(classId, RegistrationStatus.REGISTERED)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseRegistrationResponse> getManualEnrollments() {
        return registrationRepository
                .findByEnrollmentTypeOrderByRegisteredAtDesc(EnrollmentType.MANUAL)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long countStudentsInClass(Long classId) {
        return registrationRepository.countActiveStudents(classId);
    }

    private void deleteStudentSchedule(Long studentId, Long classId) {
        log.info(" Deleting schedule for student {} in class {}", studentId, classId);

        long count = scheduleRepository.countByStudentAndClass(studentId, classId);
        scheduleRepository.deleteByStudentAndClass(studentId, classId);

        log.info(" Deleted {} schedule records", count);
    }

   
    @Override
    @Transactional
    public void createStudentSchedule(Student student, ClassEntity classEntity, Semester semester) {
        log.info(" Creating schedule for student {} in class {}",
                student.getStudentCode(),
                classEntity.getClassCode());

        // Get ALL non-pending sessions (IN_PERSON + E_LEARNING + scheduled EXTRA)
        List<ClassSession> sessions = sessionRepository
                .findByClass(classEntity.getClassId())
                .stream()
                .filter(session -> !session.getIsPending())
                .toList();

        log.info(" Found {} non-pending sessions", sessions.size());

        List<StudentSchedule> schedules = new ArrayList<>();

        for (ClassSession session : sessions) {
           
            LocalDate sessionDate = session.getEffectiveDate();
            DayOfWeek dayOfWeek = session.getEffectiveDayOfWeek();
            TimeSlot timeSlot = session.getEffectiveTimeSlot();
            Room room = session.getEffectiveRoom();

            if (session.getSessionType() == SessionType.E_LEARNING) {
                if (sessionDate == null || dayOfWeek == null || timeSlot == null) {
                    log.error("❌ E-learning session {} missing schedule!", session.getSessionNumber());
                    throw new IllegalStateException("E-learning session missing date/time!");
                }

              
                log.info(" E-learning session {}: {} {} {} ONLINE",
                        session.getSessionNumber(), sessionDate, dayOfWeek, timeSlot);
            }

            StudentSchedule schedule = StudentSchedule.builder()
                    .student(student)
                    .classSession(session)
                    .classEntity(session.getClassEntity())
                    .sessionDate(sessionDate)           
                    .dayOfWeek(dayOfWeek)               
                    .timeSlot(timeSlot)                
                    .room(room)                         
                    .attendanceStatus(AttendanceStatus.ABSENT)
                    .build();

            schedules.add(schedule);
        }

        scheduleRepository.saveAll(schedules);

        long inPersonCount = schedules.stream().filter(s -> s.getSessionDate() != null).count();
        long eLearningCount = schedules.stream().filter(s -> s.getSessionDate() == null).count();

        log.info(" Created {} schedule entries (IN_PERSON: {}, E_LEARNING: {})",
                schedules.size(), inPersonCount, eLearningCount);
    }

    private CourseRegistrationResponse mapToResponse(CourseRegistration registration) {
        Student student = registration.getStudent();
        ClassEntity classEntity = registration.getClassEntity();
        Semester semester = registration.getSemester();

        return CourseRegistrationResponse.builder()
                .registrationId(registration.getRegistrationId())
                .studentId(student.getStudentId())
                .studentCode(student.getStudentCode())
                .studentName(student.getFullName())
                .studentEmail(student.getEmail())
                .majorName(student.getMajor() != null ? student.getMajor().getMajorName() : null)
                .departmentName(student.getMajor() != null && student.getMajor().getDepartment() != null
                        ? student.getMajor().getDepartment().getDepartmentName() : null)
                .classId(classEntity.getClassId())
                .classCode(classEntity.getClassCode())
                .subjectCode(classEntity.getSubject().getSubjectCode())
                .subjectName(classEntity.getSubject().getSubjectName())
                .semesterId(semester.getSemesterId())
                .semesterCode(semester.getSemesterCode())
                .registeredAt(registration.getRegisteredAt())
                .droppedAt(registration.getDroppedAt())
                .enrollmentType(registration.getEnrollmentType() != null
                        ? registration.getEnrollmentType().toString()
                        : "UNKNOWN")
                .manualReason(registration.getManualReason())
                .manualNote(registration.getManualNote())
                .enrolledByAdmin(registration.getEnrolledByAdmin() != null
                        ? registration.getEnrolledByAdmin().getUsername() : null)
                .status(registration.getStatus().toString())
                .createdAt(registration.getCreatedAt())
                .build();
    }

    private String getDayDisplay(java.time.DayOfWeek day) {
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

   
    private static class ScheduleConflictResult {
        private final boolean hasConflict;
        @Getter
        private final String message;

        private ScheduleConflictResult(boolean hasConflict, String message) {
            this.hasConflict = hasConflict;
            this.message = message;
        }

        public static ScheduleConflictResult conflict(String message) {
            return new ScheduleConflictResult(true, message);
        }

        public static ScheduleConflictResult noConflict() {
            return new ScheduleConflictResult(false, null);
        }

        public boolean hasConflict() {
            return hasConflict;
        }

    }
}