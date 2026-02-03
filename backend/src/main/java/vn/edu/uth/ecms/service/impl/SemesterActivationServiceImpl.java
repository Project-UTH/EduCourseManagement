package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.exception.BadRequestException;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.*;
import vn.edu.uth.ecms.service.SemesterActivationService;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SemesterActivationServiceImpl implements SemesterActivationService {

    private final SemesterRepository semesterRepository;
    private final ClassRepository classRepository;
    private final ClassSessionRepository sessionRepository;
    private final RoomRepository roomRepository;

    @Override
    public void startSemester(Long semesterId) {
        log.info(" Starting semester ID: {}", semesterId);
        
        // Get semester
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new NotFoundException("Semester not found"));
        
        // Validate status
        if (semester.getStatus() != SemesterStatus.UPCOMING) {
            throw new BadRequestException(
                    "Can only start UPCOMING semester. Current status: " + semester.getStatus()
            );
        }
        
        log.info(" Semester: {} ({} to {})", 
                semester.getSemesterCode(), 
                semester.getStartDate(), 
                semester.getEndDate());
        
        // Get all classes in this semester
        List<ClassEntity> classes = classRepository.findBySemester_SemesterId(semesterId);
        log.info(" Found {} classes in semester", classes.size());
        
        int totalGenerated = 0;
        
        // For each class, generate schedules for PENDING sessions
        for (ClassEntity classEntity : classes) {
            log.info("🔍 Processing class: {}", classEntity.getClassCode());
            
            int generated = generatePendingSessions(classEntity, semester);
            totalGenerated += generated;
            
            log.info("  ✓ Generated {} sessions", generated);
        }
        
      
        semester.setStatus(SemesterStatus.ACTIVE);
        semesterRepository.save(semester);
        
        log.info(" Semester started successfully. Generated {} schedules. Status: ACTIVE", 
                totalGenerated);
    }
    
   
    private int generatePendingSessions(ClassEntity classEntity, Semester semester) {
        
        
        List<ClassSession> pendingSessions = sessionRepository
                .findByClassAndPending(classEntity.getClassId(), true);
        
        if (pendingSessions.isEmpty()) {
            log.info(" No pending sessions for class {}", classEntity.getClassCode());
            return 0;
        }
        
        log.info(" Found {} pending sessions", pendingSessions.size());
        
        // Get occupied slots (from FIXED sessions)
        Set<String> occupiedSlots = getOccupiedSlots(classEntity.getClassId());
        
        // Available days (Mon-Fri, exclude class's fixed day)
        List<DayOfWeek> availableDays = Arrays.asList(
                DayOfWeek.MONDAY,
                DayOfWeek.TUESDAY,
                DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY,
                DayOfWeek.FRIDAY
        );
        availableDays = new ArrayList<>(availableDays);
        availableDays.remove(classEntity.getDayOfWeek());
        
        // Available time slots
        List<TimeSlot> availableSlots = Arrays.asList(
                TimeSlot.CA1, TimeSlot.CA2, TimeSlot.CA3, TimeSlot.CA4, TimeSlot.CA5
        );
        
        // Get available rooms
        List<Room> rooms = roomRepository.findAll();
        
        int generated = 0;
        LocalDate currentDate = semester.getStartDate();
        
        for (ClassSession session : pendingSessions) {
            // Find available slot
            boolean assigned = false;
            
            // Try to find a slot in weeks 1-9
            while (currentDate.isBefore(semester.getStartDate().plusWeeks(9)) && !assigned) {
                
                for (DayOfWeek day : availableDays) {
                    for (TimeSlot slot : availableSlots) {
                        
                        // Find date of this day in current week
                        LocalDate sessionDate = findDateOfWeek(currentDate, day);
                        
                        if (sessionDate.isAfter(semester.getEndDate())) {
                            continue;
                        }
                        
                        // Check if slot is occupied
                        String slotKey = sessionDate + "-" + slot;
                        if (occupiedSlots.contains(slotKey)) {
                            continue;
                        }
                        
                        // Find available room
                        Room availableRoom = findAvailableRoom(
        rooms, sessionDate, day, slot, semester.getSemesterId());

                        
                        if (availableRoom != null) {
                            // Assign schedule
                            session.setOriginalDate(sessionDate);
                            session.setOriginalDayOfWeek(day);
                            session.setOriginalTimeSlot(slot);
                            session.setOriginalRoom(availableRoom);
                            session.setIsPending(false);
                            session.setCategory(SessionCategory.EXTRA);
                            
                            sessionRepository.save(session);
                            
                            // Mark slot as occupied
                            occupiedSlots.add(slotKey);
                            
                            log.info("    ✓ Session {} assigned: {} {} {} {}", 
                                    session.getSessionNumber(),
                                    sessionDate, day, slot, availableRoom.getRoomCode());
                            
                            assigned = true;
                            generated++;
                            break;
                        }
                    }
                    if (assigned) break;
                }
                
                // Move to next week
                currentDate = currentDate.plusWeeks(1);
            }
            
            if (!assigned) {
                log.warn("   Could not assign schedule for session {}", 
                        session.getSessionNumber());
            }
        }
        
        return generated;
    }
    
    /**
     * Get occupied time slots from FIXED sessions
     */
    private Set<String> getOccupiedSlots(Long classId) {
        Set<String> occupied = new HashSet<>();
        
        List<ClassSession> fixedSessions = sessionRepository
                .findByClassAndPending(classId, false);
        
        for (ClassSession session : fixedSessions) {
            if (session.getOriginalDate() != null && session.getOriginalTimeSlot() != null) {
                String key = session.getOriginalDate() + "-" + session.getOriginalTimeSlot();
                occupied.add(key);
            }
        }
        
        return occupied;
    }
    
    /**
     * Find date of specific day of week in current week
     */
    private LocalDate findDateOfWeek(LocalDate weekStart, DayOfWeek targetDay) {
        LocalDate current = weekStart;
        while (current.getDayOfWeek() != DayOfWeek.MONDAY) {
            current = current.minusDays(1);
        }
        
        int daysToAdd = targetDay.getValue() - 1;
        return current.plusDays(daysToAdd);
    }
    
    /**
     * Find available room for given time slot
     */
    private Room findAvailableRoom(List<Room> rooms, LocalDate date, 
                                   DayOfWeek day, TimeSlot slot, Long semesterId) {
        
        for (Room room : rooms) {
            boolean isAvailable = !sessionRepository.existsRoomConflict(
                    semesterId, room.getRoomId(), date, day, slot, null
            );
            
            if (isAvailable) {
                return room;
            }
        }
        
        return null; // No room available
    }
}