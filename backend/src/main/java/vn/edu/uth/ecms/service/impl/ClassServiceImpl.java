package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.ClassCreateRequest;
import vn.edu.uth.ecms.dto.request.ClassUpdateRequest;
import vn.edu.uth.ecms.dto.response.ClassResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.exception.*;
import vn.edu.uth.ecms.repository.*;
import vn.edu.uth.ecms.service.ClassService;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Implementation of ClassService
 *
 * KEY LOGIC:
 * 1. Auto-generate sessions when creating class
 * 2. Regenerate sessions when updating schedule
 * 3. Conflict detection for teacher & room
 * 4. Enrollment management
 *
 * CRITICAL: Sessions are calculated based on semester dates!
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ClassServiceImpl implements ClassService {

    private final ClassRepository classRepository;
    private final ClassSessionRepository sessionRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherRepository teacherRepository;
    private final SemesterRepository semesterRepository;

    // ==================== CREATE CLASS ====================

    @Override
    public ClassResponse createClass(ClassCreateRequest request) {
        log.info("Creating class: {}", request.getClassCode());

        // 1. Validate class code unique
        if (classRepository.existsByClassCode(request.getClassCode())) {
            throw new DuplicateException("Class code already exists: " + request.getClassCode());
        }

        // 2. Find subject
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new NotFoundException("Subject not found"));

        // 3. Find teacher
        Teacher teacher = teacherRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found"));

        // 4. Find semester
        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new NotFoundException("Semester not found"));

        // ==================== CRITICAL: VALIDATE SEMESTER ====================

        // 4.1. ONLY allow UPCOMING semesters (chưa bắt đầu)
        // KHÔNG cho phép tạo class cho:
        // - ACTIVE: Đã bắt đầu, sinh viên đang học, muộn rồi!
        // - COMPLETED: Đã kết thúc
        if (semester.getStatus() != SemesterStatus.UPCOMING) {
            throw new BadRequestException(
                    "❌ Can only create classes for UPCOMING semester. " +
                            "Semester " + semester.getSemesterCode() + " is " + semester.getStatus() +
                            ". Classes must be created BEFORE semester starts."
            );
        }

        // 4.2. Semester MUST have start and end dates
        if (semester.getStartDate() == null || semester.getEndDate() == null) {
            throw new BadRequestException(
                    "❌ Semester " + semester.getSemesterCode() + " must have start and end dates"
            );
        }

        // 4.3. Validate class creation is not too late
        LocalDate today = LocalDate.now();
        if (semester.getStartDate().isBefore(today)) {
            throw new BadRequestException(
                    "❌ Cannot create class for semester that has already started. " +
                            "Semester start date: " + semester.getStartDate() + ", Today: " + today
            );
        }

        // 4.4. Validate semester duration (should be at least 10 weeks)
        long weeksBetween = java.time.temporal.ChronoUnit.WEEKS.between(
                semester.getStartDate(),
                semester.getEndDate()
        );
        if (weeksBetween < 10) {
            log.warn("⚠️ Semester {} only has {} weeks, may not fit all 10 sessions",
                    semester.getSemesterCode(), weeksBetween);
        }

        log.info("✅ Semester validation passed: {} (Status: UPCOMING, Starts: {}, {} weeks)",
                semester.getSemesterCode(),
                semester.getStartDate(),
                weeksBetween);

        // 5. Parse schedule
        DayOfWeek dayOfWeek = DayOfWeek.valueOf(request.getDayOfWeek());
        TimeSlot timeSlot = TimeSlot.valueOf(request.getTimeSlot());

        // 5.1. Validate that dayOfWeek occurs within semester period
        LocalDate firstOccurrence = findFirstDayOfWeek(semester.getStartDate(), dayOfWeek);
        if (firstOccurrence.isAfter(semester.getEndDate())) {
            throw new BadRequestException(
                    "❌ Day " + dayOfWeek + " does not occur within semester period"
            );
        }

        // 6. Check teacher conflict
        if (hasTeacherConflict(semester.getSemesterId(), teacher.getTeacherId(),
                dayOfWeek, timeSlot, null)) {
            throw new ConflictException(
                    "❌ Teacher " + teacher.getFullName() + " already has class on " +
                            dayOfWeek + " " + timeSlot.getDisplayName()
            );
        }

        // 7. Check room conflict
        if (hasRoomConflict(semester.getSemesterId(), request.getRoom(),
                dayOfWeek, timeSlot, null)) {
            throw new ConflictException(
                    "❌ Room " + request.getRoom() + " already occupied on " +
                            dayOfWeek + " " + timeSlot.getDisplayName()
            );
        }

        // 8. Create class entity
        ClassEntity classEntity = ClassEntity.builder()
                .classCode(request.getClassCode())
                .subject(subject)
                .teacher(teacher)
                .semester(semester)
                .maxStudents(request.getMaxStudents())
                .enrolledCount(0)
                .status(ClassStatus.OPEN)
                .dayOfWeek(dayOfWeek)
                .timeSlot(timeSlot)
                .room(request.getRoom())
                .startDate(semester.getStartDate())
                .endDate(semester.getEndDate())
                .build();

        ClassEntity saved = classRepository.save(classEntity);

        // 9. ✨ AUTO-GENERATE SESSIONS ✨
        generateSessionsForClass(saved);

        log.info("✅ Class created: {} with sessions generated for {} weeks",
                saved.getClassCode(),
                weeksBetween);

        return mapToResponse(saved);
    }

    // ==================== GENERATE SESSIONS LOGIC ====================

    /**
     * ✨ CORE LOGIC: Auto-generate sessions for a class
     *
     * ALGORITHM:
     * 1. Find first occurrence of class.dayOfWeek in semester
     * 2. Generate 10 FIXED in-person sessions (weekly, with ACTUAL DATES)
     * 3. Generate E-LEARNING sessions (no schedule)
     * 4. Validate all sessions fall within semester period
     *
     * CRITICAL:
     * - Each session has ACTUAL DATE calculated from semester.startDate
     * - Sessions stop if they exceed semester.endDate
     * - Week 10 is exam week (still has class session)
     */
    private void generateSessionsForClass(ClassEntity classEntity) {
        log.info("📅 Generating sessions for class: {}", classEntity.getClassCode());

        Subject subject = classEntity.getSubject();
        Semester semester = classEntity.getSemester();

        int inPersonSessions = subject.getInpersonSessions();
        int eLearningSessions = subject.getElearningSessions();

        List<ClassSession> sessions = new ArrayList<>();
        int sessionNumber = 1;

        // ==================== FIXED IN-PERSON SESSIONS ====================

        // Find first occurrence of dayOfWeek in semester
        LocalDate firstClassDate = findFirstDayOfWeek(
                semester.getStartDate(),
                classEntity.getDayOfWeek()
        );

        log.info("📍 First class date: {} ({})", firstClassDate, classEntity.getDayOfWeek());

        // Generate up to 10 fixed sessions (or until semester ends)
        int fixedSessions = Math.min(10, inPersonSessions);
        LocalDate currentDate = firstClassDate;

        for (int week = 1; week <= fixedSessions; week++) {
            // Validate session is within semester
            if (currentDate.isAfter(semester.getEndDate())) {
                log.warn("⚠️ Session {} falls outside semester, stopping at week {}",
                        week, week - 1);
                break;
            }

            ClassSession session = ClassSession.builder()
                    .classEntity(classEntity)
                    .sessionNumber(sessionNumber++)
                    .sessionType(SessionType.IN_PERSON)
                    .originalDate(currentDate)  // ✅ ACTUAL DATE
                    .originalDayOfWeek(classEntity.getDayOfWeek())
                    .originalTimeSlot(classEntity.getTimeSlot())
                    .originalRoom(classEntity.getRoom())
                    .isRescheduled(false)
                    .status(SessionStatus.SCHEDULED)
                    .build();

            sessions.add(session);

            log.debug("  Week {}: {} ({}) {} {}",
                    week, currentDate, classEntity.getDayOfWeek(),
                    classEntity.getTimeSlot(), classEntity.getRoom());

            // Next week, same day
            currentDate = currentDate.plusWeeks(1);
        }

        log.info("✅ Generated {} fixed in-person sessions", sessions.size());

        // ==================== E-LEARNING SESSIONS ====================

        for (int i = 1; i <= eLearningSessions; i++) {
            ClassSession session = ClassSession.builder()
                    .classEntity(classEntity)
                    .sessionNumber(sessionNumber++)
                    .sessionType(SessionType.E_LEARNING)
                    .originalDate(null)
                    .originalDayOfWeek(null)
                    .originalTimeSlot(null)
                    .originalRoom(null)
                    .isRescheduled(false)
                    .status(SessionStatus.SCHEDULED)
                    .build();

            sessions.add(session);
        }

        log.info("✅ Generated {} e-learning sessions", eLearningSessions);

        // Save all sessions
        sessionRepository.saveAll(sessions);

        log.info("✅ Total {} sessions generated for class {} (Period: {} to {})",
                sessions.size(),
                classEntity.getClassCode(),
                firstClassDate,
                currentDate.minusWeeks(1));
    }

    /**
     * Find first occurrence of targetDay on or after startDate
     */
    private LocalDate findFirstDayOfWeek(LocalDate startDate, DayOfWeek targetDay) {
        LocalDate current = startDate;

        // Find first occurrence of target day
        while (current.getDayOfWeek() != targetDay) {
            current = current.plusDays(1);
        }

        return current;
    }

    // ==================== UPDATE CLASS ====================

    @Override
    public ClassResponse updateClass(Long id, ClassUpdateRequest request) {
        log.info("Updating class ID: {}", id);

        // 1. Find class
        ClassEntity classEntity = classRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Class not found"));

        // 2. Warn if has enrolled students
        if (classEntity.getEnrolledCount() > 0) {
            log.warn("⚠️ Updating class {} with {} enrolled students",
                    classEntity.getClassCode(), classEntity.getEnrolledCount());
        }

        // 3. Find new teacher
        Teacher newTeacher = teacherRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found"));

        // 4. Parse new schedule
        DayOfWeek newDay = DayOfWeek.valueOf(request.getDayOfWeek());
        TimeSlot newSlot = TimeSlot.valueOf(request.getTimeSlot());

        // 5. Check if schedule changed
        boolean scheduleChanged =
                !classEntity.getDayOfWeek().equals(newDay) ||
                        !classEntity.getTimeSlot().equals(newSlot) ||
                        !classEntity.getRoom().equals(request.getRoom());

        // 6. Check conflicts (if changed)
        if (scheduleChanged || !classEntity.getTeacher().equals(newTeacher)) {
            if (hasTeacherConflict(classEntity.getSemester().getSemesterId(),
                    newTeacher.getTeacherId(), newDay, newSlot, id)) {
                throw new ConflictException("Teacher schedule conflict");
            }

            if (hasRoomConflict(classEntity.getSemester().getSemesterId(),
                    request.getRoom(), newDay, newSlot, id)) {
                throw new ConflictException("Room schedule conflict");
            }
        }

        // 7. Update class
        classEntity.setTeacher(newTeacher);
        classEntity.setMaxStudents(request.getMaxStudents());
        classEntity.setDayOfWeek(newDay);
        classEntity.setTimeSlot(newSlot);
        classEntity.setRoom(request.getRoom());

        ClassEntity updated = classRepository.save(classEntity);

        // 8. ⚠️ REGENERATE SESSIONS IF SCHEDULE CHANGED ⚠️
        if (scheduleChanged) {
            log.warn("⚠️ Schedule changed! Regenerating all sessions...");

            // Delete old sessions
            sessionRepository.deleteByClass(id);

            // Generate new sessions
            generateSessionsForClass(updated);

            log.info("✅ Sessions regenerated");
        }

        log.info("✅ Class updated: {}", updated.getClassCode());

        return mapToResponse(updated);
    }

    // ==================== DELETE CLASS ====================

    @Override
    public void deleteClass(Long id) {
        log.info("Deleting class ID: {}", id);

        ClassEntity classEntity = classRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Class not found"));

        // Cannot delete if has enrolled students
        if (classEntity.getEnrolledCount() > 0) {
            throw new BadRequestException(
                    "Cannot delete class with enrolled students. " +
                            "Current enrollment: " + classEntity.getEnrolledCount()
            );
        }

        // Delete sessions first
        sessionRepository.deleteByClass(id);

        // Delete class
        classRepository.delete(classEntity);

        log.info("✅ Class deleted: {}", classEntity.getClassCode());
    }

    // ==================== QUERY METHODS ====================

    @Override
    @Transactional(readOnly = true)
    public ClassResponse getClassById(Long id) {
        ClassEntity classEntity = classRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Class not found"));
        return mapToResponse(classEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClassResponse> getAllClasses(Pageable pageable) {
        return classRepository.findAllByOrderByClassCodeAsc(pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassResponse> getClassesBySemester(Long semesterId) {
        return classRepository.findBySemester(semesterId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassResponse> getClassesByTeacher(Long teacherId) {
        return classRepository.findByTeacher(teacherId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassResponse> getClassesBySubject(Long subjectId) {
        return classRepository.findBySubject(subjectId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClassResponse> searchClasses(String keyword, Pageable pageable) {
        return classRepository.searchClasses(keyword, pageable)
                .map(this::mapToResponse);
    }

    // ==================== CONFLICT DETECTION ====================

    @Override
    @Transactional(readOnly = true)
    public boolean hasTeacherConflict(
            Long semesterId, Long teacherId,
            DayOfWeek dayOfWeek, TimeSlot timeSlot,
            Long excludeClassId) {

        return classRepository.existsTeacherConflict(
                semesterId, teacherId, dayOfWeek, timeSlot, excludeClassId
        );
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasRoomConflict(
            Long semesterId, String room,
            DayOfWeek dayOfWeek, TimeSlot timeSlot,
            Long excludeClassId) {

        return classRepository.existsRoomConflict(
                semesterId, room, dayOfWeek, timeSlot, excludeClassId
        );
    }

    // ==================== ENROLLMENT MANAGEMENT ====================

    @Override
    public void incrementEnrollment(Long classId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found"));

        classEntity.incrementEnrolled();
        classRepository.save(classEntity);
    }

    @Override
    public void decrementEnrollment(Long classId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found"));

        classEntity.decrementEnrolled();
        classRepository.save(classEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canRegister(Long classId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found"));

        return classEntity.canRegister();
    }

    // ==================== MAPPER ====================

    private ClassResponse mapToResponse(ClassEntity entity) {
        Subject subject = entity.getSubject();
        Teacher teacher = entity.getTeacher();
        Semester semester = entity.getSemester();

        // Get session statistics
        long totalSessions = sessionRepository.countByClass(entity.getClassId());
        long inPerson = sessionRepository.countByClassAndType(
                entity.getClassId(), SessionType.IN_PERSON
        );
        long eLearning = sessionRepository.countByClassAndType(
                entity.getClassId(), SessionType.E_LEARNING
        );
        long rescheduled = sessionRepository.countRescheduledSessions(entity.getClassId());

        return ClassResponse.builder()
                .classId(entity.getClassId())
                .classCode(entity.getClassCode())
                // Subject
                .subjectId(subject.getSubjectId())
                .subjectCode(subject.getSubjectCode())
                .subjectName(subject.getSubjectName())
                .credits(subject.getCredits())
                .totalSessions(subject.getTotalSessions())
                .inPersonSessions(subject.getInpersonSessions())
                .eLearningSessions(subject.getElearningSessions())
                // Teacher
                .teacherId(teacher.getTeacherId())
                .teacherName(teacher.getFullName())
                .teacherEmail(teacher.getEmail())
                .teacherDegree(teacher.getDegree() != null ? teacher.getDegree().toString() : null)
                // Semester
                .semesterId(semester.getSemesterId())
                .semesterCode(semester.getSemesterCode())
                .semesterName(semester.getSemesterName())
                .semesterStatus(semester.getStatus().toString())
                // Capacity
                .maxStudents(entity.getMaxStudents())
                .enrolledCount(entity.getEnrolledCount())
                .availableSeats(entity.getAvailableSeats())
                // Status
                .status(entity.getStatus().toString())
                .canRegister(entity.canRegister())
                .isFull(entity.isFull())
                // Schedule
                .dayOfWeek(entity.getDayOfWeek().toString())
                .dayOfWeekDisplay(getDayOfWeekDisplay(entity.getDayOfWeek()))
                .timeSlot(entity.getTimeSlot().toString())
                .timeSlotDisplay(entity.getTimeSlot().getFullDisplay())
                .room(entity.getRoom())
                // Dates
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                // Statistics
                .totalSessionsGenerated(totalSessions)
                .completedSessions(sessionRepository.countByStatus(
                        entity.getClassId(), SessionStatus.COMPLETED
                ))
                .rescheduledSessionsCount(rescheduled)
                // Metadata
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

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