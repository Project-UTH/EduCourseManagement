package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.response.ScheduleItemResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.repository.ClassSessionRepository;
import vn.edu.uth.ecms.repository.CourseRegistrationRepository;
import vn.edu.uth.ecms.service.ScheduleService;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ScheduleServiceImpl implements ScheduleService {

    private final CourseRegistrationRepository registrationRepository;
    private final ClassSessionRepository sessionRepository;

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
            
            // ✅ CRITICAL FIX: Get sessions for this class in the week
            List<ClassSession> sessions = sessionRepository.findByClassAndDateRange(
                    classEntity.getClassId(),
                    actualMonday,
                    weekEndDate
            );
            
            log.info("  → Found {} sessions in this week", sessions.size());
            
            // Convert each session to ScheduleItemResponse
            for (ClassSession session : sessions) {
                // ✅ CRITICAL: Use the ACTUAL date from session, don't recalculate!
                LocalDate sessionDate = session.getEffectiveDate();
                
                // Skip if date is null or outside the week range
                if (sessionDate == null || 
                    sessionDate.isBefore(actualMonday) || 
                    sessionDate.isAfter(weekEndDate)) {
                    log.warn("  ⚠️ Session {} has invalid date: {}", 
                            session.getSessionNumber(), sessionDate);
                    continue;
                }
                
                ScheduleItemResponse item = mapToScheduleItem(session, classEntity);
                scheduleItems.add(item);
                
                log.info("  ✅ Session {}: {} {} {} (Room: {})", 
                        session.getSessionNumber(),
                        item.getSessionDate(),
                        item.getDayOfWeek(),
                        item.getTimeSlot(),
                        item.getRoom());
            }
        }
        
        log.info("✅ Total schedule items: {}", scheduleItems.size());
        
        return scheduleItems;
    }
    
    /**
     * ✅ FIXED: Map session to response using ACTUAL stored dates
     * DO NOT recalculate dates from dayOfWeek!
     */
    private ScheduleItemResponse mapToScheduleItem(ClassSession session, ClassEntity classEntity) {
        Subject subject = classEntity.getSubject();
        Teacher teacher = classEntity.getTeacher();
        
        // ✅ CRITICAL: Use getEffectiveDate() from entity - this returns the STORED date
        LocalDate effectiveDate = session.getEffectiveDate();
        DayOfWeek effectiveDay = session.getEffectiveDayOfWeek();
        TimeSlot effectiveSlot = session.getEffectiveTimeSlot();
        
        // ✅ If stored date exists, derive dayOfWeek from it (for consistency)
        if (effectiveDate != null && effectiveDay == null) {
            effectiveDay = effectiveDate.getDayOfWeek();
            log.debug("  🔧 Derived dayOfWeek {} from date {}", effectiveDay, effectiveDate);
        }
        
        log.debug("  📍 Session {}: effectiveDate={}, effectiveDay={}, effectiveSlot={}", 
                session.getSessionNumber(), effectiveDate, effectiveDay, effectiveSlot);
        
        // Get effective room
        String effectiveRoom = "TBA";
        Room room = session.getEffectiveRoom();
        if (room != null) {
            effectiveRoom = room.getRoomCode();
        }
        
        // Determine campus
        String campus = session.getSessionType() == SessionType.E_LEARNING 
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
                .sessionDate(effectiveDate)  // ✅ Use STORED date, not recalculated!
                .dayOfWeek(effectiveDay != null ? effectiveDay.toString() : null)
                .dayOfWeekDisplay(effectiveDay != null ? getDayOfWeekDisplay(effectiveDay) : null)
                .timeSlot(effectiveSlot != null ? effectiveSlot.toString() : null)
                .timeSlotDisplay(effectiveSlot != null ? effectiveSlot.getFullDisplay() : null)
                .room(effectiveRoom)
                .sessionId(session.getSessionId())
                .sessionNumber(session.getSessionNumber())
                .sessionType(session.getSessionType().toString())
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