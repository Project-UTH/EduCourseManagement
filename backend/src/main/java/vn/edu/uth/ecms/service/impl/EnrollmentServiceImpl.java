package vn.edu.uth.ecms.service.impl;

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

/**
 * ✅ FULLY FIXED EnrollmentServiceImpl - VERSION 2.0
 *
 * FIXES:
 * 1. Duplicate enrollment → Re-activate dropped registrations
 * 2. Include E_LEARNING sessions in student schedules
 * 3. Simplified conflict detection
 */
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
        log.info("🔧 Admin enrolling student {} to class {}", request.getStudentId(), classId);

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new NotFoundException("Student not found"));

        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found"));

        Admin admin = adminRepository.findById(1L)
                .orElseThrow(() -> new UnauthorizedException("Admin not found"));

        // ✅ CHECK EXISTING REGISTRATION (ANY STATUS)
        Optional<CourseRegistration> existingReg = registrationRepository
                .findByStudentStudentIdAndClassEntityClassId(
                        student.getStudentId(),
                        classId
                );

        CourseRegistration registration;

        if (existingReg.isPresent()) {
            CourseRegistration existing = existingReg.get();

            // Case 1: Already REGISTERED
            if (existing.getStatus() == RegistrationStatus.REGISTERED) {
                throw new DuplicateException(
                        "Student already registered for this class. " +
                                "Registration ID: " + existing.getRegistrationId()
                );
            }

            // Case 2: Was DROPPED → RE-ACTIVATE
            log.info("⚠️ Student was previously DROPPED. Re-activating registration...");

            existing.setStatus(RegistrationStatus.REGISTERED);
            existing.setRegisteredAt(LocalDateTime.now());
            existing.setDroppedAt(null);
            existing.setEnrollmentType(EnrollmentType.MANUAL);
            existing.setManualReason(request.getReason());
            existing.setManualNote(request.getNote());
            existing.setEnrolledByAdmin(admin);

            registration = registrationRepository.save(existing);

            log.info("✅ Re-activated existing registration ID: {}", registration.getRegistrationId());

        } else {
            // Case 3: NEW REGISTRATION
            log.info("✅ Creating new registration");

            // Validations (chỉ cho new registration)
            if (classEntity.isFull()) {
                log.warn("⚠️ Class full, admin forcing enrollment");
            }

            if (hasActualScheduleConflict(student, classEntity)) {
                throw new ConflictException("Schedule conflict detected");
            }

            Semester semester = classEntity.getSemester();
            if (semester.getStatus() == SemesterStatus.COMPLETED) {
                throw new BadRequestException("Cannot enroll to COMPLETED semester");
            }

            // Create new registration
            registration = CourseRegistration.builder()
                    .student(student)
                    .classEntity(classEntity)
                    .semester(classEntity.getSemester())
                    .registeredAt(LocalDateTime.now())
                    .enrollmentType(EnrollmentType.MANUAL)
                    .manualReason(request.getReason())
                    .manualNote(request.getNote())
                    .enrolledByAdmin(admin)
                    .status(RegistrationStatus.REGISTERED)
                    .build();

            registration = registrationRepository.save(registration);

            log.info("✅ Created new registration ID: {}", registration.getRegistrationId());
        }

        // Increment enrolled count
        classEntity.incrementEnrolled();
        classRepository.save(classEntity);

        // Create student schedule
        createStudentSchedule(student, classEntity, classEntity.getSemester());

        log.info("✅ Student enrolled successfully");
        return mapToResponse(registration);
    }

    @Override
    public void dropStudent(Long classId, Long studentId, String reason) {
        log.info("🔧 Dropping student {} from class {}", studentId, classId);

        CourseRegistration registration = registrationRepository
                .findByStudentStudentIdAndClassEntityClassId(studentId, classId)
                .orElseThrow(() -> new NotFoundException("Registration not found"));

        if (registration.isDropped()) {
            throw new BadRequestException("Already dropped");
        }

        registration.setStatus(RegistrationStatus.DROPPED);
        registration.setDroppedAt(LocalDateTime.now());
        registrationRepository.save(registration);

        ClassEntity classEntity = registration.getClassEntity();
        classEntity.decrementEnrolled();
        classRepository.save(classEntity);

        deleteStudentSchedule(studentId, classId);

        log.info("✅ Student dropped");
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
                .findAllManualEnrollments()
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
        log.info("🗑️ Deleting schedule for student {} in class {}", studentId, classId);

        long count = scheduleRepository.countByStudentAndClass(studentId, classId);
        scheduleRepository.deleteByStudentAndClass(studentId, classId);

        log.info("✅ Deleted {} records", count);
    }

    /**
     * ✅ FIXED VERSION 2: Include E_LEARNING sessions
     *
     * BEFORE: Only IN_PERSON sessions → 10 schedules (4 TC class)
     * AFTER: IN_PERSON + E_LEARNING → 15 schedules (10 + 5)
     *
     * Note: Extra sessions (isPending=true) are NOT included here.
     * They will be added later when semester is activated.
     */
    @Override
    @Transactional
    public void createStudentSchedule(Student student, ClassEntity classEntity, Semester semester) {
        log.info("📅 Creating schedule for student {} in class {}",
                student.getStudentCode(),
                classEntity.getClassCode());

        // ✅ FIX: Get ALL session types (IN_PERSON + E_LEARNING), exclude PENDING
        List<ClassSession> sessions = sessionRepository
                .findByClass(classEntity.getClassId())  // ← ALL TYPES (not findByClassAndType)
                .stream()
                .filter(session -> !session.getIsPending())  // ← Exclude pending extra sessions
                .toList();

        log.info("📋 Found {} non-pending sessions (IN_PERSON + E_LEARNING)", sessions.size());

        List<StudentSchedule> schedules = new ArrayList<>();

        for (ClassSession session : sessions) {
            StudentSchedule schedule = StudentSchedule.builder()
                    .student(student)
                    .classSession(session)
                    .classEntity(session.getClassEntity())
                    // ✅ For E_LEARNING: these fields will be NULL
                    .sessionDate(session.getEffectiveDate())
                    .dayOfWeek(session.getEffectiveDayOfWeek())
                    .timeSlot(session.getEffectiveTimeSlot())
                    .room(session.getEffectiveRoom())
                    .attendanceStatus(AttendanceStatus.ABSENT)
                    .build();

            schedules.add(schedule);
        }

        scheduleRepository.saveAll(schedules);

        log.info("✅ Created {} schedule entries (IN_PERSON: {}, E_LEARNING: {})",
                schedules.size(),
                schedules.stream().filter(s -> s.getSessionDate() != null).count(),
                schedules.stream().filter(s -> s.getSessionDate() == null).count());
    }

    /**
     * Simple conflict check
     */
    private boolean hasActualScheduleConflict(Student student, ClassEntity newClass) {
        Semester semester = newClass.getSemester();

        List<ClassSession> newSessions = sessionRepository
                .findByClassAndType(newClass.getClassId(), SessionType.IN_PERSON)
                .stream()
                .filter(session -> !session.getIsPending())
                .toList();

        List<CourseRegistration> currentRegs = registrationRepository
                .findByStudentAndSemester(student.getStudentId(), semester.getSemesterId())
                .stream()
                .filter(reg -> reg.getStatus() == RegistrationStatus.REGISTERED)
                .toList();

        for (ClassSession newSession : newSessions) {
            LocalDate newDate = newSession.getEffectiveDate();
            DayOfWeek newDay = newSession.getEffectiveDayOfWeek();
            TimeSlot newSlot = newSession.getEffectiveTimeSlot();

            for (CourseRegistration reg : currentRegs) {
                List<ClassSession> existingSessions = sessionRepository
                        .findByClassAndType(reg.getClassEntity().getClassId(), SessionType.IN_PERSON)
                        .stream()
                        .filter(session -> !session.getIsPending())
                        .toList();

                for (ClassSession existing : existingSessions) {
                    if (existing.getEffectiveDate() != null &&
                            existing.getEffectiveDate().equals(newDate) &&
                            existing.getEffectiveDayOfWeek() == newDay &&
                            existing.getEffectiveTimeSlot() == newSlot) {

                        log.warn("⚠️ Conflict at {} {} {}", newDate, newDay, newSlot);
                        return true;
                    }
                }
            }
        }

        return false;
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
                .enrollmentType(registration.getEnrollmentType().toString())
                .manualReason(registration.getManualReason())
                .manualNote(registration.getManualNote())
                .enrolledByAdmin(registration.getEnrolledByAdmin() != null
                        ? registration.getEnrolledByAdmin().getUsername() : null)
                .status(registration.getStatus().toString())
                .createdAt(registration.getCreatedAt())
                .build();
    }
}