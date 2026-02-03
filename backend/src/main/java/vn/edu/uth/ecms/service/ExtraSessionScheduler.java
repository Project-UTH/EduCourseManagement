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
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExtraSessionScheduler {

    private final ClassSessionRepository sessionRepository;
    private final CourseRegistrationRepository registrationRepository;
    private final RoomRepository roomRepository;

    public boolean scheduleExtraSession(ClassSession session, Semester semester) {
        log.info(" Scheduling extra session {} for class {}",
                session.getSessionNumber(), session.getClassEntity().getClassCode());

        ClassEntity classEntity = session.getClassEntity();
        Teacher teacher = classEntity.getTeacher();
        int minCapacity = classEntity.getMaxStudents();

        // Get enrolled student IDs
        List<Long> studentIds = registrationRepository
                .findActiveStudentsByClass(classEntity.getClassId())
                .stream()
                .map(Student::getStudentId)
                .toList();

        
        ScheduleSlot idealSlot = findIdealSlotWeekly(
                semester, classEntity, teacher, studentIds, minCapacity, session.getSessionNumber());
        if (idealSlot != null) {
            return applyAndReturn(session, idealSlot, "Strategy 1 (Ideal - Weekly)");
        }

        
        ScheduleSlot sundaySlot = findOnlineSlotByDays(
                semester, classEntity, teacher, studentIds,
                Collections.singletonList(DayOfWeek.SUNDAY));
        if (sundaySlot != null) {
            return applyAndReturn(session, sundaySlot, "Strategy 2 (Sunday Online)");
        }

    
        ScheduleSlot anyDayOnline = findOnlineSlotByDays(
                semester, classEntity, teacher, studentIds,
                Arrays.asList(DayOfWeek.values()));
        if (anyDayOnline != null) {
            return applyAndReturn(session, anyDayOnline, "Strategy 3 (Any Day Online)");
        }

  
        ScheduleSlot forcedSlot = forceOnlineSlot(semester, classEntity);
        if (forcedSlot != null) {
            return applyAndReturn(session, forcedSlot, "Strategy 4 (Forced Online)");
        }

        log.error(" Cannot schedule extra session {} after trying all strategies",
                session.getSessionNumber());
        return false;
    }

   
    /**
     * @param sessionNumber Current extra session number (11, 12, 13, ...)
     */
    private ScheduleSlot findIdealSlotWeekly(
            Semester semester,
            ClassEntity classEntity,
            Teacher teacher,
            List<Long> studentIds,
            int minCapacity,
            int sessionNumber) {

        // Fixed schedule info
        DayOfWeek fixedDay = classEntity.getDayOfWeek();
        TimeSlot fixedSlot = classEntity.getTimeSlot();

        log.debug("  Fixed schedule: {} {}", fixedDay, fixedSlot);

        // Working days (Mon-Sat), exclude fixed day
        List<DayOfWeek> workingDays = new ArrayList<>(Arrays.asList(
                DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY
        ));
        workingDays.remove(fixedDay);  

        log.debug("  Available days (excluding {}): {}", fixedDay, workingDays);

        // Time slots, prefer different from fixed
        List<TimeSlot> preferredSlots = new ArrayList<>(Arrays.asList(TimeSlot.values()));
        preferredSlots.remove(fixedSlot);  
        preferredSlots.add(fixedSlot);     

        // Calculate which week this extra session should go in
        int weekOffset = (sessionNumber - 10);  

        // Try each day
        for (DayOfWeek day : workingDays) {
            List<LocalDate> datesForDay = findDatesForDay(semester, day);

            // Skip first few weeks (already used by fixed sessions)
            // Start from week with offset
            for (int i = weekOffset; i < datesForDay.size(); i++) {
                LocalDate date = datesForDay.get(i);

                // Try each time slot (prioritize non-fixed slots)
                for (TimeSlot slot : preferredSlots) {

                    
                    if (conflictsWithFixedSchedule(classEntity, day, slot)) {
                        log.trace("    Skip {} {} - conflicts with fixed schedule", day, slot);
                        continue;
                    }

                  
                    if (hasTeacherConflict(semester, teacher, date, slot, classEntity.getClassId())) {
                        log.trace("    Skip {} {} {} - teacher conflict", date, day, slot);
                        continue;
                    }

                   
                    if (hasStudentsConflict(semester, studentIds, date, slot, classEntity.getClassId())) {
                        log.trace("    Skip {} {} {} - student conflict", date, day, slot);
                        continue;
                    }

                   
                    List<Room> availableRooms = roomRepository.findAvailableRoomsForSlot(
                            semester.getSemesterId(), date, slot, minCapacity);

                    if (!availableRooms.isEmpty()) {
                        // Choose smallest room that fits
                        Room bestRoom = availableRooms.stream()
                                .min(Comparator.comparing(Room::getCapacity))
                                .get();

                        log.info("   Found ideal slot: {} {} {} - Room {}",
                                date, day, slot, bestRoom.getRoomCode());

                        return new ScheduleSlot(date, day, slot, bestRoom);
                    } else {
                        log.trace("    Skip {} {} {} - no room available", date, day, slot);
                    }
                }
            }
        }

        log.debug("   No ideal slot found");
        return null;
    }

 
    private boolean conflictsWithFixedSchedule(ClassEntity classEntity, DayOfWeek day, TimeSlot slot) {
        return day == classEntity.getDayOfWeek() && slot == classEntity.getTimeSlot();
    }

   

    private ScheduleSlot findOnlineSlotByDays(
            Semester semester,
            ClassEntity classEntity,
            Teacher teacher,
            List<Long> studentIds,
            List<DayOfWeek> days) {

        Room onlineRoom = roomRepository.findOnlineRoom().orElse(null);
        if (onlineRoom == null) {
            log.warn("  No ONLINE room configured");
            return null;
        }

        // Exclude fixed day/slot
        DayOfWeek fixedDay = classEntity.getDayOfWeek();
        TimeSlot fixedSlot = classEntity.getTimeSlot();

        for (DayOfWeek day : days) {
            List<LocalDate> dates = findDatesForDay(semester, day);

            for (LocalDate date : dates) {
                for (TimeSlot slot : TimeSlot.values()) {

                    //  Skip if same as fixed schedule
                    if (day == fixedDay && slot == fixedSlot) {
                        continue;
                    }

                    // Check conflicts
                    if (!hasTeacherConflict(semester, teacher, date, slot, classEntity.getClassId()) &&
                            !hasStudentsConflict(semester, studentIds, date, slot, classEntity.getClassId())) {

                        log.info("   Found online slot: {} {} {} - ONLINE",
                                date, day, slot);

                        return new ScheduleSlot(date, day, slot, onlineRoom);
                    }
                }
            }
        }

        log.debug("   No online slot found");
        return null;
    }

  

    private ScheduleSlot forceOnlineSlot(Semester semester, ClassEntity classEntity) {
        Room onlineRoom = roomRepository.findOnlineRoom().orElse(null);
        if (onlineRoom == null) return null;

        // Pick random week in semester (preferably later weeks)
        Random random = new Random();

        // Avoid fixed day if possible
        List<DayOfWeek> days = new ArrayList<>(Arrays.asList(DayOfWeek.values()));
        days.remove(classEntity.getDayOfWeek());

        if (days.isEmpty()) {
            days = Arrays.asList(DayOfWeek.values());
        }

        DayOfWeek randomDay = days.get(random.nextInt(days.size()));
        List<LocalDate> datesForDay = findDatesForDay(semester, randomDay);

        if (datesForDay.isEmpty()) return null;

        // Pick a date in the middle/later part of semester
        int index = Math.min(random.nextInt(datesForDay.size()) + 3, datesForDay.size() - 1);
        LocalDate randomDate = datesForDay.get(index);

        // Avoid fixed slot if possible
        List<TimeSlot> slots = new ArrayList<>(Arrays.asList(TimeSlot.values()));
        slots.remove(classEntity.getTimeSlot());

        if (slots.isEmpty()) {
            slots = Arrays.asList(TimeSlot.values());
        }

        TimeSlot randomSlot = slots.get(random.nextInt(slots.size()));

        log.warn("   Forcing online slot: {} {} {} - ONLINE (may have conflicts)",
                randomDate, randomDay, randomSlot);

        return new ScheduleSlot(randomDate, randomDay, randomSlot, onlineRoom);
    }

 

    private boolean hasTeacherConflict(
            Semester semester,
            Teacher teacher,
            LocalDate date,
            TimeSlot slot,
            Long excludeClassId) {

        return sessionRepository.existsTeacherConflict(
                semester.getSemesterId(),
                teacher.getTeacherId(),
                date,
                date.getDayOfWeek(),
                slot,
                excludeClassId
        );
    }

    private boolean hasStudentsConflict(
            Semester semester,
            List<Long> studentIds,
            LocalDate date,
            TimeSlot slot,
            Long excludeClassId) {

        if (studentIds.isEmpty()) return false;

        return sessionRepository.existsAnyStudentConflict(
                semester.getSemesterId(),
                studentIds,
                date,
                date.getDayOfWeek(),
                slot,
                excludeClassId
        );
    }

    private List<LocalDate> findDatesForDay(Semester semester, DayOfWeek targetDay) {
        List<LocalDate> dates = new ArrayList<>();
        LocalDate current = semester.getStartDate();

        while (!current.isAfter(semester.getEndDate())) {
            if (current.getDayOfWeek() == targetDay) {
                dates.add(current);
            }
            current = current.plusDays(1);
        }

        return dates;
    }

    private boolean applyAndReturn(ClassSession session, ScheduleSlot slot, String strategyName) {
        session.setOriginalDate(slot.getDate());
        session.setOriginalDayOfWeek(slot.getDayOfWeek());
        session.setOriginalTimeSlot(slot.getTimeSlot());
        session.setOriginalRoom(slot.getRoom());
        session.setIsPending(false);
        session.setStatus(SessionStatus.SCHEDULED);

        log.info(" Scheduled via {}: {} {} {} - Room {}",
                strategyName,
                slot.getDate(),
                slot.getDayOfWeek(),
                slot.getTimeSlot(),
                slot.getRoom().getRoomCode());

        return true;
    }
}