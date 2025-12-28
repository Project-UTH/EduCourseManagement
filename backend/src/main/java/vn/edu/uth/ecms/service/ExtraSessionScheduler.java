package vn.edu.uth.ecms.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import vn.edu.uth.ecms.dto.internal.ScheduleSlot;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.repository.ClassSessionRepository;
import vn.edu.uth.ecms.repository.CourseRegistrationRepository;
import vn.edu.uth.ecms.repository.RoomRepository;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;  // ✅ FIX: Import ChronoUnit
import java.util.*;
import java.util.stream.Collectors;

/**
 * Extra Session Scheduler - CORRECTED
 *
 * ✅ FIXES:
 * - Fixed toDays() method error → use ChronoUnit.DAYS.between()
 * - Improved random date calculation
 * - Added null-safety checks
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ExtraSessionScheduler {

    private final ClassSessionRepository sessionRepository;
    private final CourseRegistrationRepository registrationRepository;
    private final RoomRepository roomRepository;

    /**
     * Schedule a single extra session using 4-tier fallback strategy
     */
    public boolean scheduleExtraSession(ClassSession session, Semester semester) {
        log.info("🔄 Scheduling extra session {} for class {}",
                session.getSessionNumber(),
                session.getClassEntity().getClassCode());

        ClassEntity classEntity = session.getClassEntity();
        Teacher teacher = classEntity.getTeacher();
        int minCapacity = classEntity.getMaxStudents();

        // Get enrolled students for conflict checking
        List<Student> students = registrationRepository.findActiveStudentsByClass(
                classEntity.getClassId()
        );

        // Strategy 1: IDEAL (Mon-Sat, physical room, no conflicts)
        ScheduleSlot idealSlot = findIdealSlot(
                semester, teacher, students, minCapacity,
                classEntity.getClassId()
        );

        if (idealSlot != null) {
            applySchedule(session, idealSlot);
            log.info("✅ Strategy 1 SUCCESS: {} {} {} {}",
                    idealSlot.getDate(),
                    idealSlot.getDayOfWeek(),
                    idealSlot.getTimeSlot(),
                    idealSlot.getRoom().getRoomCode());
            return true;
        }

        log.warn("⚠️ Strategy 1 FAILED - No ideal slot found");

        // Strategy 2: SUNDAY ONLINE (no student conflict)
        ScheduleSlot sundaySlot = findSundayOnlineSlot(
                semester, teacher, students, classEntity.getClassId()
        );

        if (sundaySlot != null) {
            applySchedule(session, sundaySlot);
            log.info("✅ Strategy 2 SUCCESS (Sunday ONLINE): {} {} {}",
                    sundaySlot.getDate(),
                    sundaySlot.getDayOfWeek(),
                    sundaySlot.getTimeSlot());
            return true;
        }

        log.warn("⚠️ Strategy 2 FAILED - No Sunday slot found");

        // Strategy 3: ANY DAY ONLINE (no student conflict)
        ScheduleSlot anydaySlot = findAnyDayOnlineSlot(
                semester, teacher, students, classEntity.getClassId()
        );

        if (anydaySlot != null) {
            applySchedule(session, anydaySlot);
            log.info("✅ Strategy 3 SUCCESS (Any day ONLINE): {} {} {}",
                    anydaySlot.getDate(),
                    anydaySlot.getDayOfWeek(),
                    anydaySlot.getTimeSlot());
            return true;
        }

        log.warn("⚠️ Strategy 3 FAILED - No online slot found");

        // Strategy 4: FORCE ONLINE (ignore conflicts)
        ScheduleSlot forceSlot = forceOnlineSlot(semester, teacher);

        if (forceSlot != null) {
            applySchedule(session, forceSlot);
            log.warn("⚠️ Strategy 4 FORCED (ONLINE, may have conflicts): {} {} {}",
                    forceSlot.getDate(),
                    forceSlot.getDayOfWeek(),
                    forceSlot.getTimeSlot());
            return true;
        }

        log.error("❌ ALL STRATEGIES FAILED for session {}", session.getSessionNumber());
        return false;
    }

    // ==================== STRATEGY 1: IDEAL SLOT ====================

    private ScheduleSlot findIdealSlot(
            Semester semester, Teacher teacher, List<Student> students,
            int minCapacity, Long excludeClassId) {

        DayOfWeek[] validDays = {
                DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY
        };

        TimeSlot[] allSlots = TimeSlot.values();

        // Try all combinations
        for (DayOfWeek day : validDays) {
            for (TimeSlot slot : allSlots) {
                // Find dates in semester for this day
                List<LocalDate> dates = findDatesForDay(semester, day);

                for (LocalDate date : dates) {
                    // Check teacher conflict
                    if (hasTeacherConflict(semester, teacher, date, day, slot, excludeClassId)) {
                        continue;
                    }

                    // Check student conflicts
                    if (hasAnyStudentConflict(semester, students, date, day, slot, excludeClassId)) {
                        continue;
                    }

                    // Find available room
                    Room room = findAvailablePhysicalRoom(semester, date, day, slot, minCapacity);
                    if (room != null) {
                        return new ScheduleSlot(date, day, slot, room);
                    }
                }
            }
        }

        return null;
    }

    // ==================== STRATEGY 2: SUNDAY ONLINE ====================

    private ScheduleSlot findSundayOnlineSlot(
            Semester semester, Teacher teacher, List<Student> students, Long excludeClassId) {

        List<LocalDate> sundays = findDatesForDay(semester, DayOfWeek.SUNDAY);
        TimeSlot[] allSlots = TimeSlot.values();
        Room onlineRoom = roomRepository.findByRoomCode("ONLINE").orElse(null);

        if (onlineRoom == null) {
            log.error("❌ ONLINE room not found in database!");
            return null;
        }

        for (LocalDate sunday : sundays) {
            for (TimeSlot slot : allSlots) {
                if (hasTeacherConflict(semester, teacher, sunday, DayOfWeek.SUNDAY, slot, excludeClassId)) {
                    continue;
                }

                if (hasAnyStudentConflict(semester, students, sunday, DayOfWeek.SUNDAY, slot, excludeClassId)) {
                    continue;
                }

                return new ScheduleSlot(sunday, DayOfWeek.SUNDAY, slot, onlineRoom);
            }
        }

        return null;
    }

    // ==================== STRATEGY 3: ANY DAY ONLINE ====================

    private ScheduleSlot findAnyDayOnlineSlot(
            Semester semester, Teacher teacher, List<Student> students, Long excludeClassId) {

        DayOfWeek[] allDays = DayOfWeek.values();
        TimeSlot[] allSlots = TimeSlot.values();
        Room onlineRoom = roomRepository.findByRoomCode("ONLINE").orElse(null);

        if (onlineRoom == null) {
            return null;
        }

        for (DayOfWeek day : allDays) {
            for (TimeSlot slot : allSlots) {
                List<LocalDate> dates = findDatesForDay(semester, day);

                for (LocalDate date : dates) {
                    if (hasTeacherConflict(semester, teacher, date, day, slot, excludeClassId)) {
                        continue;
                    }

                    if (hasAnyStudentConflict(semester, students, date, day, slot, excludeClassId)) {
                        continue;
                    }

                    return new ScheduleSlot(date, day, slot, onlineRoom);
                }
            }
        }

        return null;
    }

    // ==================== STRATEGY 4: FORCE ONLINE ====================

    /**
     * ✅ FIX: Use ChronoUnit.DAYS.between() instead of toDays()
     */
    private ScheduleSlot forceOnlineSlot(Semester semester, Teacher teacher) {
        Room onlineRoom = roomRepository.findByRoomCode("ONLINE").orElse(null);
        if (onlineRoom == null) {
            return null;
        }

        // ✅ FIX: Calculate total days correctly
        long totalDays = ChronoUnit.DAYS.between(
                semester.getStartDate(),
                semester.getEndDate()
        );

        if (totalDays <= 0) {
            log.error("❌ Invalid semester duration");
            return null;
        }

        // Pick random week
        int totalWeeks = (int) (totalDays / 7);
        if (totalWeeks <= 0) {
            totalWeeks = 1;
        }

        Random random = new Random();
        int randomWeek = random.nextInt(totalWeeks);

        // Pick random day
        DayOfWeek[] allDays = DayOfWeek.values();
        DayOfWeek randomDay = allDays[random.nextInt(allDays.length)];

        // Pick random slot
        TimeSlot[] allSlots = TimeSlot.values();
        TimeSlot randomSlot = allSlots[random.nextInt(allSlots.length)];

        // Calculate date
        LocalDate randomDate = semester.getStartDate()
                .plusWeeks(randomWeek)
                .with(randomDay);

        // Ensure within semester
        if (randomDate.isAfter(semester.getEndDate())) {
            randomDate = semester.getEndDate();
        }

        return new ScheduleSlot(randomDate, randomDay, randomSlot, onlineRoom);
    }

    // ==================== HELPER METHODS ====================

    private List<LocalDate> findDatesForDay(Semester semester, DayOfWeek targetDay) {
        List<LocalDate> dates = new ArrayList<>();
        LocalDate current = semester.getStartDate();

        // Find first occurrence of target day
        while (current.getDayOfWeek() != targetDay && current.isBefore(semester.getEndDate())) {
            current = current.plusDays(1);
        }

        // Collect all occurrences
        while (current.isBefore(semester.getEndDate()) || current.isEqual(semester.getEndDate())) {
            dates.add(current);
            current = current.plusWeeks(1);
        }

        return dates;
    }

    private boolean hasTeacherConflict(
            Semester semester, Teacher teacher,
            LocalDate date, DayOfWeek day, TimeSlot slot,
            Long excludeClassId) {

        return sessionRepository.existsTeacherConflict(
                semester.getSemesterId(),
                teacher.getTeacherId(),
                date, day, slot.name(),
                excludeClassId
        );
    }

    private boolean hasAnyStudentConflict(
            Semester semester, List<Student> students,
            LocalDate date, DayOfWeek day, TimeSlot slot,
            Long excludeClassId) {

        for (Student student : students) {
            if (sessionRepository.existsStudentConflict(
                    semester.getSemesterId(),
                    student.getStudentId(),
                    date, day, slot.name(),
                    excludeClassId)) {
                return true;
            }
        }

        return false;
    }

    private Room findAvailablePhysicalRoom(
            Semester semester, LocalDate date, DayOfWeek day,
            TimeSlot slot, int minCapacity) {

        List<Room> availableRooms = roomRepository.findAvailableRoomsForSlot(
                semester.getSemesterId(),
                date, day, slot.name(),
                minCapacity
        );

        if (availableRooms.isEmpty()) {
            return null;
        }

        // Return smallest suitable room
        return availableRooms.stream()
                .min(Comparator.comparing(Room::getCapacity))
                .orElse(null);
    }

    private void applySchedule(ClassSession session, ScheduleSlot slot) {
        session.setOriginalDate(slot.getDate());
        session.setOriginalDayOfWeek(slot.getDayOfWeek());
        session.setOriginalTimeSlot(slot.getTimeSlot());
        session.setOriginalRoom(slot.getRoom());
        session.setIsPending(false);
        session.setStatus(SessionStatus.SCHEDULED);
    }
}