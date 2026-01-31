package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.response.ScheduleItemResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.repository.ClassRepository;
import vn.edu.uth.ecms.repository.ClassSessionRepository;
import vn.edu.uth.ecms.repository.CourseRegistrationRepository;
import vn.edu.uth.ecms.service.ScheduleService;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * ✅ FIXED ScheduleServiceImpl - VERSION 2.0
 *
 * CRITICAL FIX:
 * - Properly handle E-learning sessions with dates
 * - Don't skip sessions with null dates if they're E-learning
 * - Better logging for debugging
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ScheduleServiceImpl implements ScheduleService {

    private final CourseRegistrationRepository registrationRepository;
    private final ClassSessionRepository sessionRepository;
    private final ClassRepository classRepository;

    @Override
    public List<ScheduleItemResponse> getStudentWeeklySchedule(
            Long studentId, LocalDate weekStartDate) {

        log.info("📅 Building weekly schedule for student {} from {}", studentId, weekStartDate);

        // ✅ Ensure weekStartDate is Monday
        LocalDate actualMonday = weekStartDate;
        if (weekStartDate.getDayOfWeek() != DayOfWeek.MONDAY) {
            actualMonday = weekStartDate.with(DayOfWeek.MONDAY);
            log.warn("⚠️ Received non-Monday date {}. Adjusted to Monday: {}",
                    weekStartDate, actualMonday);
        }

        LocalDate weekEndDate = actualMonday.plusDays(6);

        log.info("📆 Week range: {} (MONDAY) to {} (SUNDAY)", actualMonday, weekEndDate);

        // Get all REGISTERED classes for student
        List<CourseRegistration> allRegistrations = registrationRepository
                .findByStudent_StudentIdAndStatus(studentId, RegistrationStatus.REGISTERED);

        log.info("📚 Student has {} registered classes", allRegistrations.size());

        // Filter: Only UPCOMING and ACTIVE semesters
        List<CourseRegistration> registrations = allRegistrations.stream()
                .filter(reg -> {
                    ClassEntity cls = reg.getClassEntity();
                    if (cls == null || cls.getSemester() == null) {
                        return false;
                    }

                    SemesterStatus status = cls.getSemester().getStatus();
                    boolean isValid = status == SemesterStatus.UPCOMING || status == SemesterStatus.ACTIVE;

                    log.debug("  Class {} - Semester {} - Status {} - Include: {}",
                            cls.getClassCode(),
                            cls.getSemester().getSemesterCode(),
                            status,
                            isValid);

                    return isValid;
                })
                .toList();

        log.info("✅ After filtering (UPCOMING/ACTIVE): {} classes", registrations.size());

        List<ScheduleItemResponse> scheduleItems = new ArrayList<>();

        // For each registered class
        for (CourseRegistration registration : registrations) {
            ClassEntity classEntity = registration.getClassEntity();

            log.info("🔍 Processing class: {} ({})",
                    classEntity.getClassCode(),
                    classEntity.getClassId());

            // ✅ Get sessions for this class in the week
            List<ClassSession> sessions = sessionRepository.findByClassAndDateRange(
                    classEntity.getClassId(),
                    actualMonday,
                    weekEndDate
            );

            log.info("  → Found {} sessions in this week", sessions.size());

            // Convert each session to ScheduleItemResponse
            for (ClassSession session : sessions) {
                // ✅ FIX: Special handling for E-learning
                LocalDate sessionDate = session.getEffectiveDate();
                SessionType sessionType = session.getSessionType();

                // ✅ CRITICAL: For E-learning, try originalDate if effectiveDate is null
                if (sessionType == SessionType.E_LEARNING && sessionDate == null) {
                    sessionDate = session.getOriginalDate();
                    log.warn("  ⚠️ E-learning session {} has null effectiveDate, using originalDate: {}",
                            session.getSessionNumber(), sessionDate);
                }

                // Skip if date is still null or outside the week range
                if (sessionDate == null) {
                    log.error("  ❌ Session {} (type: {}) has NULL date! Skipping...",
                            session.getSessionNumber(), sessionType);
                    continue;
                }

                if (sessionDate.isBefore(actualMonday) || sessionDate.isAfter(weekEndDate)) {
                    log.debug("  ⏭️ Session {} date {} outside week range",
                            session.getSessionNumber(), sessionDate);
                    continue;
                }

                // ✅ Map to response
                ScheduleItemResponse item = mapToScheduleItem(session, classEntity);
                scheduleItems.add(item);

                // ✅ HIGHLIGHT E-learning in logs
                String typeIcon = sessionType == SessionType.E_LEARNING ? "💻" : "🏫";
                log.info("  ✅ {} Session {}: {} {} {} (Room: {})",
                        typeIcon,
                        session.getSessionNumber(),
                        item.getSessionDate(),
                        item.getDayOfWeek(),
                        item.getTimeSlot(),
                        item.getRoom());
            }
        }

        // ✅ LOG SUMMARY by type
        long inPersonCount = scheduleItems.stream()
                .filter(item -> "IN_PERSON".equals(item.getSessionType()))
                .count();
        long eLearningCount = scheduleItems.stream()
                .filter(item -> "E_LEARNING".equals(item.getSessionType()))
                .count();

        log.info("✅ Total schedule items: {} (IN_PERSON: {}, E_LEARNING: {})",
                scheduleItems.size(), inPersonCount, eLearningCount);

        return scheduleItems;
    }

    @Override
    public List<ScheduleItemResponse> getTeacherWeeklySchedule(
            Long teacherId, LocalDate weekStartDate) {

        log.info("📅 Building weekly schedule for teacher {} from {}", teacherId, weekStartDate);

        // ✅ Ensure weekStartDate is Monday
        LocalDate actualMonday = weekStartDate;
        if (weekStartDate.getDayOfWeek() != DayOfWeek.MONDAY) {
            actualMonday = weekStartDate.with(DayOfWeek.MONDAY);
            log.warn("⚠️ Received non-Monday date {}. Adjusted to Monday: {}",
                    weekStartDate, actualMonday);
        }

        LocalDate weekEndDate = actualMonday.plusDays(6);

        log.info("📆 Week range: {} (MONDAY) to {} (SUNDAY)", actualMonday, weekEndDate);

        // ✅ Get all classes taught by this teacher
        List<ClassEntity> allClasses = classRepository.findByTeacher_TeacherId(teacherId);

        log.info("📚 Teacher has {} classes total", allClasses.size());

        // Filter: Only ACTIVE/UPCOMING semesters
        List<ClassEntity> classes = allClasses.stream()
                .filter(cls -> cls.getSemester() != null)
                .filter(cls -> {
                    SemesterStatus status = cls.getSemester().getStatus();
                    boolean isValid = status == SemesterStatus.UPCOMING || status == SemesterStatus.ACTIVE;

                    log.debug("  Class {} - Semester {} - Status {} - Include: {}",
                            cls.getClassCode(),
                            cls.getSemester().getSemesterCode(),
                            status,
                            isValid);

                    return isValid;
                })
                .toList();

        log.info("✅ After filtering (UPCOMING/ACTIVE): {} classes", classes.size());

        List<ScheduleItemResponse> scheduleItems = new ArrayList<>();

        // For each class
        for (ClassEntity classEntity : classes) {
            log.info("🔍 Processing class: {} ({})",
                    classEntity.getClassCode(),
                    classEntity.getClassId());

            // ✅ Get sessions for this class in the week
            List<ClassSession> sessions = sessionRepository.findByClassAndDateRange(
                    classEntity.getClassId(),
                    actualMonday,
                    weekEndDate
            );

            log.info("  → Found {} sessions in this week", sessions.size());

            // Convert each session to ScheduleItemResponse
            for (ClassSession session : sessions) {
                // ✅ FIX: Special handling for E-learning
                LocalDate sessionDate = session.getEffectiveDate();
                SessionType sessionType = session.getSessionType();

                // ✅ CRITICAL: For E-learning, try originalDate if effectiveDate is null
                if (sessionType == SessionType.E_LEARNING && sessionDate == null) {
                    sessionDate = session.getOriginalDate();
                    log.warn("  ⚠️ E-learning session {} has null effectiveDate, using originalDate: {}",
                            session.getSessionNumber(), sessionDate);
                }

                // Skip if date is still null or outside the week range
                if (sessionDate == null) {
                    log.error("  ❌ Session {} (type: {}) has NULL date! Skipping...",
                            session.getSessionNumber(), sessionType);
                    continue;
                }

                if (sessionDate.isBefore(actualMonday) || sessionDate.isAfter(weekEndDate)) {
                    log.debug("  ⏭️ Session {} date {} outside week range",
                            session.getSessionNumber(), sessionDate);
                    continue;
                }

                // ✅ Map to response
                ScheduleItemResponse item = mapToScheduleItem(session, classEntity);
                scheduleItems.add(item);

                // ✅ HIGHLIGHT E-learning in logs
                String typeIcon = sessionType == SessionType.E_LEARNING ? "💻" : "🏫";
                log.info("  ✅ {} Session {}: {} {} {} (Room: {})",
                        typeIcon,
                        session.getSessionNumber(),
                        item.getSessionDate(),
                        item.getDayOfWeek(),
                        item.getTimeSlot(),
                        item.getRoom());
            }
        }

        // ✅ LOG SUMMARY by type
        long inPersonCount = scheduleItems.stream()
                .filter(item -> "IN_PERSON".equals(item.getSessionType()))
                .count();
        long eLearningCount = scheduleItems.stream()
                .filter(item -> "E_LEARNING".equals(item.getSessionType()))
                .count();

        log.info("✅ Total schedule items: {} (IN_PERSON: {}, E_LEARNING: {})",
                scheduleItems.size(), inPersonCount, eLearningCount);

        return scheduleItems;
    }

    /**
     * ✅ FIXED: Map session to response with better E-learning handling
     */
    private ScheduleItemResponse mapToScheduleItem(ClassSession session, ClassEntity classEntity) {
        Subject subject = classEntity.getSubject();
        Teacher teacher = classEntity.getTeacher();
        SessionType sessionType = session.getSessionType();

        // ✅ Get effective values with fallback to original
        LocalDate effectiveDate = session.getEffectiveDate();
        DayOfWeek effectiveDay = session.getEffectiveDayOfWeek();
        TimeSlot effectiveSlot = session.getEffectiveTimeSlot();
        Room effectiveRoom = session.getEffectiveRoom();

        // ✅ FALLBACK: If effective values are null, use original (for E-learning)
        if (effectiveDate == null) {
            effectiveDate = session.getOriginalDate();
        }
        if (effectiveDay == null) {
            effectiveDay = session.getOriginalDayOfWeek();
        }
        if (effectiveSlot == null) {
            effectiveSlot = session.getOriginalTimeSlot();
        }
        if (effectiveRoom == null) {
            effectiveRoom = session.getOriginalRoom();
        }

        // ✅ If date exists but day is null, derive it
        if (effectiveDate != null && effectiveDay == null) {
            effectiveDay = effectiveDate.getDayOfWeek();
            log.debug("  🔧 Derived dayOfWeek {} from date {}", effectiveDay, effectiveDate);
        }

        // ✅ LOG for E-learning debugging
        if (sessionType == SessionType.E_LEARNING) {
            log.debug("  💻 E-learning session {}: date={}, day={}, slot={}, room={}",
                    session.getSessionNumber(),
                    effectiveDate,
                    effectiveDay,
                    effectiveSlot,
                    effectiveRoom != null ? effectiveRoom.getRoomCode() : "NULL");
        }

        // Get room code
        String roomCode = "TBA";
        if (effectiveRoom != null) {
            roomCode = effectiveRoom.getRoomCode();
        }

        // Determine campus
        String campus = sessionType == SessionType.E_LEARNING
                ? "LMS"
                : "P.Thanh Mỹ Tây, TP.HCM";

        return ScheduleItemResponse.builder()
                .classId(classEntity.getClassId())
                .classCode(classEntity.getClassCode())
                .subjectId(subject.getSubjectId())
                .subjectCode(subject.getSubjectCode())
                .subjectName(subject.getSubjectName())
                .teacherId(teacher.getTeacherId())
                .teacherName(teacher.getFullName())
                .sessionDate(effectiveDate)
                .dayOfWeek(effectiveDay != null ? effectiveDay.toString() : null)
                .dayOfWeekDisplay(effectiveDay != null ? getDayOfWeekDisplay(effectiveDay) : null)
                .timeSlot(effectiveSlot != null ? effectiveSlot.toString() : null)
                .timeSlotDisplay(effectiveSlot != null ? effectiveSlot.getFullDisplay() : null)
                .room(roomCode)
                .sessionId(session.getSessionId())
                .sessionNumber(session.getSessionNumber())
                .sessionType(sessionType.toString())
                .campus(campus)
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