package vn.edu.uth.ecms.service.impl;

import ch.qos.logback.core.status.Status;
import jakarta.persistence.criteria.CriteriaBuilder;
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
import vn.edu.uth.ecms.service.RoomService;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * ClassServiceImpl - UPDATED with Auto Room Assignment
 *
 * KEY CHANGES:
 * 1. createClass() - Auto find and assign room
 * 2. generateInitialSessions() - Create FIXED + PENDING EXTRA + ELEARNING
 * 3. No more manual room input from admin
 *
 * PART 1 of 2 - This file contains createClass() and session generation
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
    private final CourseRegistrationRepository courseRegistrationRepository;
    private final RoomService roomService;
    private final StudentRepository studentRepository;

    // ==================== CREATE CLASS (UPDATED) ====================

    @Override
    public ClassResponse createClass(ClassCreateRequest request) {
        log.info("🎓 Creating class: {}", request.getClassCode());

        // 1. Validate class code unique
        if (classRepository.existsByClassCode(request.getClassCode())) {
            throw new DuplicateException("Class code already exists: " + request.getClassCode());
        }

        // 2. Find entities
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new NotFoundException("Subject not found"));

        Teacher teacher = teacherRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new NotFoundException("Teacher not found"));

        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new NotFoundException("Semester not found"));

        // 3. Validate semester status (MUST be UPCOMING)
        if (semester.getStatus() != SemesterStatus.UPCOMING) {
            throw new BadRequestException(
                    "❌ Can only create classes for UPCOMING semester. " +
                            "Semester " + semester.getSemesterCode() + " is " + semester.getStatus() +
                            ". Classes must be created BEFORE semester starts."
            );
        }

        // 4. Validate semester dates
        if (semester.getStartDate() == null || semester.getEndDate() == null) {
            throw new BadRequestException(
                    "❌ Semester " + semester.getSemesterCode() + " must have start and end dates"
            );
        }

        LocalDate today = LocalDate.now();
        if (semester.getStartDate().isBefore(today)) {
            throw new BadRequestException(
                    "❌ Cannot create class for semester that has already started. " +
                            "Semester start date: " + semester.getStartDate() + ", Today: " + today
            );
        }

        // 5. Parse schedule
        DayOfWeek dayOfWeek = DayOfWeek.valueOf(request.getDayOfWeek());
        TimeSlot timeSlot = TimeSlot.valueOf(request.getTimeSlot());

        // 6. Validate that dayOfWeek occurs within semester period
        LocalDate firstOccurrence = findFirstDayOfWeek(semester.getStartDate(), dayOfWeek);
        if (firstOccurrence.isAfter(semester.getEndDate())) {
            throw new BadRequestException(
                    "❌ Day " + dayOfWeek + " does not occur within semester period"
            );
        }

        // 7. ✅ AUTO FIND ROOM for FIXED schedule (10 sessions)
        log.info("🔍 Auto-finding room for fixed schedule: {} {}", dayOfWeek, timeSlot);

        int fixedSessionCount = Math.min(10, subject.getInpersonSessions());
        List<LocalDate> fixedDates = generateFixedDates(
                semester.getStartDate(),
                semester.getEndDate(),
                dayOfWeek,
                fixedSessionCount
        );

        Room fixedRoom = roomService.findRoomForFixedSchedule(
                semester.getSemesterId(),
                fixedDates,
                dayOfWeek,
                timeSlot,
                request.getMaxStudents()
        );

        if (fixedRoom == null) {
            throw new NoAvailableRoomException(
                    "❌ No available room found for schedule: " + dayOfWeek + " " + timeSlot + ". " +
                            "All rooms are occupied. Please choose different day/time or increase room capacity."
            );
        }

        log.info("✅ Auto-assigned room: {} (capacity: {}) for {} sessions",
                fixedRoom.getRoomCode(), fixedRoom.getCapacity(), fixedDates.size());

        // 8. Parse e-learning schedule (optional)
        DayOfWeek elearningDay = null;
        TimeSlot elearningSlot = null;

        if (subject.getElearningSessions() > 0) {
            if (request.getElearningDayOfWeek() == null || request.getElearningTimeSlot() == null) {
                throw new BadRequestException(
                        "❌ Subject has " + subject.getElearningSessions() + " e-learning sessions. " +
                                "Please provide elearningDayOfWeek and elearningTimeSlot."
                );
            }
            elearningDay = DayOfWeek.valueOf(request.getElearningDayOfWeek());
            elearningSlot = TimeSlot.valueOf(request.getElearningTimeSlot());
        }

        // 9. Create class entity
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
                .fixedRoom(fixedRoom)  // ← AUTO ASSIGNED!
                .elearningDayOfWeek(elearningDay)
                .elearningTimeSlot(elearningSlot)
                .startDate(semester.getStartDate())
                .endDate(semester.getEndDate())
                .build();

        ClassEntity saved = classRepository.save(classEntity);

        // 10. ✅ AUTO-GENERATE SESSIONS
        generateInitialSessions(saved, fixedDates);

        log.info("✅ Class created successfully: {} with room {} and {} sessions",
                saved.getClassCode(),
                fixedRoom.getRoomCode(),
                subject.getTotalSessions());

        return mapToResponse(saved);
    }

    // ==================== GENERATE INITIAL SESSIONS (UPDATED) ====================

    /**
     * ✅ UPDATED: Generate sessions with categories
     *
     * CREATES:
     * 1. FIXED sessions (up to 10) - Scheduled immediately with room
     * 2. EXTRA sessions (if inPerson > 10) - Pending, no room yet
     * 3. ELEARNING sessions - Scheduled immediately with ONLINE room
     */
    private void generateInitialSessions(ClassEntity classEntity, List<LocalDate> fixedDates) {
        log.info("📅 Generating initial sessions for class: {}", classEntity.getClassCode());

        Subject subject = classEntity.getSubject();
        Semester semester = classEntity.getSemester();

        int inPersonSessions = subject.getInpersonSessions();
        int eLearningSessions = subject.getElearningSessions();

        List<ClassSession> sessions = new ArrayList<>();
        int sessionNumber = 1;

        // ===== 1. FIXED SESSIONS (up to 10) =====

        for (LocalDate date : fixedDates) {
            ClassSession session = ClassSession.builder()
                    .classEntity(classEntity)
                    .sessionNumber(sessionNumber++)
                    .sessionType(SessionType.IN_PERSON)
                    .category(SessionCategory.FIXED)
                    .originalDate(date)
                    .originalDayOfWeek(classEntity.getDayOfWeek())
                    .originalTimeSlot(classEntity.getTimeSlot())
                    .originalRoom(classEntity.getFixedRoom())  // ← Room assigned!
                    .isPending(false)  // ← Already scheduled
                    .isRescheduled(false)
                    .status(SessionStatus.SCHEDULED)
                    .build();

            sessions.add(session);
        }

        log.info("✅ Created {} FIXED sessions with room {}",
                fixedDates.size(), classEntity.getFixedRoom().getRoomCode());

        // ===== 2. EXTRA SESSIONS (pending, will be scheduled on activation) =====

        int extraCount = inPersonSessions - fixedDates.size();

        for (int i = 1; i <= extraCount; i++) {
            ClassSession session = ClassSession.builder()
                    .classEntity(classEntity)
                    .sessionNumber(sessionNumber++)
                    .sessionType(SessionType.IN_PERSON)
                    .category(SessionCategory.EXTRA)
                    .originalDate(null)         // ← No date yet
                    .originalDayOfWeek(null)    // ← No day yet
                    .originalTimeSlot(null)     // ← No time yet
                    .originalRoom(null)         // ← No room yet
                    .isPending(true)            // ← PENDING!
                    .isRescheduled(false)
                    .status(SessionStatus.SCHEDULED)
                    .build();

            sessions.add(session);
        }

        if (extraCount > 0) {
            log.info("✅ Created {} EXTRA sessions (PENDING - will be scheduled on activation)",
                    extraCount);
        }

        // ===== 3. E-LEARNING SESSIONS =====

        if (eLearningSessions > 0 && classEntity.hasElearningSchedule()) {
            Room onlineRoom = roomService.getOnlineRoom();

            LocalDate elDate = findFirstDayOfWeek(
                    semester.getStartDate(),
                    classEntity.getElearningDayOfWeek()
            );

            int elCreated = 0;
            while (elCreated < eLearningSessions && !elDate.isAfter(semester.getEndDate())) {
                ClassSession session = ClassSession.builder()
                        .classEntity(classEntity)
                        .sessionNumber(sessionNumber++)
                        .sessionType(SessionType.E_LEARNING)
                        .category(SessionCategory.ELEARNING)
                        .originalDate(elDate)
                        .originalDayOfWeek(classEntity.getElearningDayOfWeek())
                        .originalTimeSlot(classEntity.getElearningTimeSlot())
                        .originalRoom(onlineRoom)  // ← ONLINE room
                        .isPending(false)
                        .isRescheduled(false)
                        .status(SessionStatus.SCHEDULED)
                        .build();

                sessions.add(session);
                elDate = elDate.plusWeeks(1);
                elCreated++;
            }

            log.info("✅ Created {} E-LEARNING sessions with ONLINE room", elCreated);
        }

        // Save all sessions
        sessionRepository.saveAll(sessions);

        log.info("✅ Total sessions created: {} (Fixed: {}, Extra pending: {}, E-learning: {})",
                sessions.size(),
                fixedDates.size(),
                extraCount,
                eLearningSessions);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Generate list of fixed dates (up to 10 weekly occurrences)
     */
    private List<LocalDate> generateFixedDates(
            LocalDate semesterStart,
            LocalDate semesterEnd,
            DayOfWeek targetDay,
            int maxSessions) {

        List<LocalDate> dates = new ArrayList<>();
        LocalDate current = findFirstDayOfWeek(semesterStart, targetDay);

        for (int i = 0; i < maxSessions && !current.isAfter(semesterEnd); i++) {
            dates.add(current);
            current = current.plusWeeks(1);
        }

        return dates;
    }

    /**
     * Find first occurrence of targetDay on or after startDate
     */
    private LocalDate findFirstDayOfWeek(LocalDate startDate, DayOfWeek targetDay) {
        LocalDate current = startDate;

        while (current.getDayOfWeek() != targetDay) {
            current = current.plusDays(1);
        }

        return current;
    }

    /**
     * ClassServiceImpl - PART 2 of 2
     *
     * Contains:
     * - updateClass() - NOT CHANGED (still updates teacher, max students, schedule)
     * - deleteClass() - UPDATED (auto cleanup dropped registrations)
     * - Query methods - NOT CHANGED
     * - mapToResponse() - UPDATED (include fixedRoom info)
     *
     * NOTE: Copy these methods to the same ClassServiceImpl.java from PART 1
     */

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

        // 4. Update basic fields
        classEntity.setTeacher(newTeacher);
        classEntity.setMaxStudents(request.getMaxStudents());

        ClassEntity updated = classRepository.save(classEntity);

        log.info("✅ Class updated: {}", updated.getClassCode());

        return mapToResponse(updated);
    }

// ==================== DELETE CLASS (UPDATED) ====================

    @Override
    public void deleteClass(Long id) {
        log.info("Deleting class ID: {}", id);

        ClassEntity classEntity = classRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Class not found"));

        // Check ONLY active enrollments
        long activeEnrollments = courseRegistrationRepository
                .countActiveEnrollmentsByClassId(id);

        if (activeEnrollments > 0) {
            throw new BadRequestException(
                    "❌ Cannot delete class with active enrollments. " +
                            "Current active students: " + activeEnrollments
            );
        }

        log.info("✅ No active enrollments (field shows: {})",
                classEntity.getEnrolledCount());

        // ✅ Auto cleanup DROPPED registrations
        int droppedCount = courseRegistrationRepository.deleteDroppedByClassId(id);

        if (droppedCount > 0) {
            log.info("🧹 Cleaned up {} dropped registration(s)", droppedCount);
        }

        // Delete sessions
        sessionRepository.deleteByClass(id);
        log.info("🗑️ Deleted all sessions");

        // Delete class
        classRepository.delete(classEntity);

        log.info("✅ Class deleted successfully: {}", classEntity.getClassCode());
    }

// ==================== QUERY METHODS (NOT CHANGED) ====================

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

// ==================== ENROLLMENT MANAGEMENT (NOT CHANGED) ====================

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

    @Override
    public long countAll() {
        return  classRepository.count();
    }

// ==================== MAPPER (UPDATED) ====================

    private ClassResponse mapToResponse(ClassEntity entity) {
        Subject subject = entity.getSubject();
        Teacher teacher = entity.getTeacher();
        Semester semester = entity.getSemester();
        Room fixedRoom = entity.getFixedRoom();  // ← NEW

        // Get session statistics
        long totalSessions = sessionRepository.countByClass(entity.getClassId());
        long inPerson = sessionRepository.countByClassAndType(
                entity.getClassId(), SessionType.IN_PERSON
        );
        long eLearning = sessionRepository.countByClassAndType(
                entity.getClassId(), SessionType.E_LEARNING
        );
        long pending = sessionRepository.countPendingByClass(entity.getClassId());
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
                // Fixed Schedule
                .dayOfWeek(entity.getDayOfWeek().toString())
                .dayOfWeekDisplay(getDayOfWeekDisplay(entity.getDayOfWeek()))
                .timeSlot(entity.getTimeSlot().toString())
                .timeSlotDisplay(entity.getTimeSlot().getFullDisplay())
                .fixedRoom(fixedRoom != null ? fixedRoom.getRoomCode() : null)  // ← NEW
                .fixedRoomName(fixedRoom != null ? fixedRoom.getDisplayName() : null)  // ← NEW
                .fixedRoomCapacity(fixedRoom != null ? fixedRoom.getCapacity() : null)  // ← NEW
                // E-learning Schedule (optional)
                .elearningDayOfWeek(entity.getElearningDayOfWeek() != null ?
                        entity.getElearningDayOfWeek().toString() : null)
                .elearningTimeSlot(entity.getElearningTimeSlot() != null ?
                        entity.getElearningTimeSlot().toString() : null)
                // Dates
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                // Statistics
                .totalSessionsGenerated(totalSessions)
                .pendingSessionsCount(pending)  // ← NEW
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