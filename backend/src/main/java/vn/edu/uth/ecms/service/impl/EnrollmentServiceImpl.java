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
import java.util.stream.Collectors;

/**
 * Service for managing student enrollments
 *
 * KEY FEATURES:
 * ✅ AUTO CREATE student_schedule when enrolled
 * ✅ AUTO DELETE student_schedule when dropped (via CASCADE or explicit delete)
 * ✅ Accurate conflict detection via student_schedule table
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

    // ==================== MANUAL ENROLLMENT (ADMIN ONLY) ====================

    @Override
    public CourseRegistrationResponse manuallyEnrollStudent(Long classId, ManualEnrollRequest request) {
        log.info("🔧 Admin manually enrolling student {} to class {}",
                request.getStudentId(), classId);

        // 1. Find student
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new NotFoundException("Student not found"));

        // 2. Find class
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found"));

        // 3. Get current admin (simplified - assume we have SecurityContext)
        // TODO: Get from SecurityContext in real implementation
        Admin admin = adminRepository.findById(1L)
                .orElseThrow(() -> new UnauthorizedException("Admin not found"));

        // ==================== VALIDATIONS ====================

        // 4. Check if already registered
        if (registrationRepository.existsByStudentStudentIdAndClassEntityClassId(
                student.getStudentId(), classId)) {
            throw new DuplicateException(
                    "❌ Student " + student.getFullName() +
                            " is already registered for class " + classEntity.getClassCode()
            );
        }

        // 5. Check class capacity (warn but allow admin override)
        if (classEntity.isFull()) {
            log.warn("⚠️ Class {} is full ({}/ {}), but admin is forcing enrollment",
                    classEntity.getClassCode(),
                    classEntity.getEnrolledCount(),
                    classEntity.getMaxStudents());
            // Continue anyway - admin can override
        }

        // 6. ✅ CHECK ACTUAL SCHEDULE CONFLICT (via student_schedule)
        if (hasActualScheduleConflict(student, classEntity)) {
            throw new ConflictException(
                    "❌ Student " + student.getFullName() + " has schedule conflict! " +
                            "They already have another class at the same time. " +
                            "Please check their timetable."
            );
        }

        // 7. Check if class semester allows enrollment
        Semester semester = classEntity.getSemester();
        if (semester.getStatus() == SemesterStatus.COMPLETED) {
            throw new BadRequestException(
                    "❌ Cannot enroll student to COMPLETED semester: " + semester.getSemesterCode()
            );
        }

        // ==================== CREATE REGISTRATION ====================

        CourseRegistration registration = CourseRegistration.builder()
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

        CourseRegistration saved = registrationRepository.save(registration);

        // ==================== UPDATE CLASS ENROLLMENT COUNT ====================

        classEntity.incrementEnrolled();
        classRepository.save(classEntity);

        // ==================== ✅ AUTO CREATE STUDENT SCHEDULE ====================

        createStudentSchedule(student, classEntity);

        log.info("✅ Student {} manually enrolled to class {} by admin {}. Reason: {}",
                student.getFullName(),
                classEntity.getClassCode(),
                admin.getUsername(),
                request.getReason());

        return mapToResponse(saved);
    }

    // ==================== DROP STUDENT FROM CLASS ====================

    @Override
    public void dropStudent(Long classId, Long studentId, String reason) {
        log.info("🔧 Admin dropping student {} from class {}", studentId, classId);

        // 1. Find registration
        CourseRegistration registration = registrationRepository
                .findByStudentStudentIdAndClassEntityClassId(studentId, classId)
                .orElseThrow(() -> new NotFoundException("Registration not found"));

        // 2. Check if already dropped
        if (registration.isDropped()) {
            throw new BadRequestException("Student already dropped this class");
        }

        // 3. Update status
        registration.setStatus(RegistrationStatus.DROPPED);
        registration.setDroppedAt(LocalDateTime.now());
        if (reason != null) {
            registration.setManualNote(
                    (registration.getManualNote() != null ? registration.getManualNote() + "\n" : "") +
                            "Dropped reason: " + reason
            );
        }

        registrationRepository.save(registration);

        // 4. Decrement class enrollment
        ClassEntity classEntity = registration.getClassEntity();
        classEntity.decrementEnrolled();
        classRepository.save(classEntity);

        // 5. ✅ AUTO DELETE STUDENT SCHEDULE
        deleteStudentSchedule(studentId, classId);

        log.info("✅ Student {} dropped from class {}", studentId, classId);
    }

    // ==================== QUERY METHODS ====================

    @Override
    @Transactional(readOnly = true)
    public List<CourseRegistrationResponse> getStudentsInClass(Long classId) {
        List<CourseRegistration> registrations = registrationRepository
                .findByClassEntityClassIdAndStatus(classId, RegistrationStatus.REGISTERED);

        return registrations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseRegistrationResponse> getManualEnrollments() {
        List<CourseRegistration> registrations = registrationRepository
                .findAllManualEnrollments();

        return registrations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long countStudentsInClass(Long classId) {
        return registrationRepository.countActiveStudents(classId);
    }

    // ==================== SCHEDULE MANAGEMENT ====================

    /**
     * ✅ AUTO DELETE student_schedule records
     * Called when student drops a class or admin removes student
     *
     * Note: Can also rely on ON DELETE CASCADE from database,
     * but explicit delete is clearer and allows logging
     */
    private void deleteStudentSchedule(Long studentId, Long classId) {
        log.info("🗑️ Deleting schedule for student {} in class {}", studentId, classId);

        long deletedCount = scheduleRepository.countByStudentAndClass(studentId, classId);
        scheduleRepository.deleteByStudentAndClass(studentId, classId);

        log.info("✅ Deleted {} schedule records for student {} in class {}",
                deletedCount, studentId, classId);
    }

    @Override
    @Transactional
    public void createStudentSchedule(Student student, ClassEntity classEntity) {
        log.info("📅 Creating student_schedule for student {} in class {}",
                student.getStudentCode(),
                classEntity.getClassCode());

        // 1. Get all IN_PERSON sessions (skip E_LEARNING and PENDING)
        List<ClassSession> sessions = sessionRepository.findByClassAndType(
                        classEntity.getClassId(),
                        SessionType.IN_PERSON
                ).stream()
                .filter(session -> !session.getIsPending())  // ✅ Skip pending sessions
                .toList();

        // 2. Build student schedule entries
        List<StudentSchedule> schedules = new ArrayList<>();

        for (ClassSession session : sessions) {
            StudentSchedule schedule = StudentSchedule.builder()
                    .student(student)
                    .classSession(session)
                    .sessionDate(session.getEffectiveDate())
                    .dayOfWeek(session.getEffectiveDayOfWeek())
                    .timeSlot(session.getEffectiveTimeSlot())
                    .room(session.getEffectiveRoom())
                    .attendanceStatus(AttendanceStatus.ABSENT)
                    .build();

            schedules.add(schedule);
        }

        // 3. Batch save for performance
        scheduleRepository.saveAll(schedules);

        log.info("✅ Created {} schedule entries for student {}",
                schedules.size(),
                student.getStudentCode());
    }

    /**
     * ✅ CORRECTED: Check actual schedule conflict
     * @param student The Student entity (NOT Long!)
     * @param newClass The class to check for conflicts
     */
    private boolean hasActualScheduleConflict(Student student, ClassEntity newClass) {

        Semester semester = newClass.getSemester();

        // Get all scheduled IN_PERSON sessions (not pending)
        List<ClassSession> newSessions = sessionRepository
                .findByClassAndType(newClass.getClassId(), SessionType.IN_PERSON)
                .stream()
                .filter(session -> !session.getIsPending())  // ✅ Skip pending
                .toList();

        // Get student's current registrations in this semester
        List<CourseRegistration> currentRegistrations = registrationRepository
                .findByStudentAndSemester(student.getStudentId(), semester.getSemesterId())
                .stream()
                .filter(reg -> reg.getStatus() == RegistrationStatus.REGISTERED)
                .toList();

        // Check each new session against existing schedule
        for (ClassSession newSession : newSessions) {
            LocalDate newDate = newSession.getEffectiveDate();
            DayOfWeek newDay = newSession.getEffectiveDayOfWeek();
            TimeSlot newSlot = newSession.getEffectiveTimeSlot();
            Room newRoom = newSession.getEffectiveRoom();  // ✅ Room entity

            // Check conflicts with existing classes
            for (CourseRegistration reg : currentRegistrations) {
                List<ClassSession> existingSessions = sessionRepository
                        .findByClassAndType(
                                reg.getClassEntity().getClassId(),
                                SessionType.IN_PERSON
                        )
                        .stream()
                        .filter(session -> !session.getIsPending())
                        .toList();

                for (ClassSession existing : existingSessions) {
                    // Compare dates and times
                    if (existing.getEffectiveDate() != null &&
                            existing.getEffectiveDate().equals(newDate) &&
                            existing.getEffectiveDayOfWeek() == newDay &&
                            existing.getEffectiveTimeSlot() == newSlot) {

                        log.warn("⚠️ Schedule conflict detected: " +
                                        "Student {} has {} at {} {} {}",
                                student.getStudentCode(),  // ✅ Now works - student is Student entity
                                reg.getClassEntity().getClassCode(),
                                newDate, newDay, newSlot);

                        return true;  // Conflict found
                    }
                }
            }
        }

        return false;  // No conflict
    }

    // ==================== MAPPER ====================

    private CourseRegistrationResponse mapToResponse(CourseRegistration registration) {
        Student student = registration.getStudent();
        ClassEntity classEntity = registration.getClassEntity();
        Semester semester = registration.getSemester();

        return CourseRegistrationResponse.builder()
                .registrationId(registration.getRegistrationId())
                // Student info
                .studentId(student.getStudentId())
                .studentCode(student.getStudentCode())
                .studentName(student.getFullName())
                .studentEmail(student.getEmail())
                .majorName(student.getMajor() != null ? student.getMajor().getMajorName() : null)
                .departmentName(student.getMajor() != null && student.getMajor().getDepartment() != null
                        ? student.getMajor().getDepartment().getDepartmentName() : null)
                // Class info
                .classId(classEntity.getClassId())
                .classCode(classEntity.getClassCode())
                .subjectCode(classEntity.getSubject().getSubjectCode())
                .subjectName(classEntity.getSubject().getSubjectName())
                // Semester
                .semesterId(semester.getSemesterId())
                .semesterCode(semester.getSemesterCode())
                // Registration metadata
                .registeredAt(registration.getRegisteredAt())
                .droppedAt(registration.getDroppedAt())
                .enrollmentType(registration.getEnrollmentType().toString())
                .manualReason(registration.getManualReason())
                .manualNote(registration.getManualNote())
                .enrolledByAdmin(registration.getEnrolledByAdmin() != null
                        ? registration.getEnrolledByAdmin().getUsername() : null)
                .status(registration.getStatus().toString())
                // Timestamps
                .createdAt(registration.getCreatedAt())
                .build();
    }
}