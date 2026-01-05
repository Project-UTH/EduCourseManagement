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
        
        // Calculate week end (Sunday)
        LocalDate weekEndDate = weekStartDate.plusDays(6);
        
        log.info("📆 Week range: {} to {}", weekStartDate, weekEndDate);
        
        // Get all registered classes for student
        List<CourseRegistration> registrations = registrationRepository
                .findByStudent_StudentIdAndStatus(studentId, RegistrationStatus.REGISTERED);
        
        log.info("📚 Student has {} registered classes", registrations.size());
        
        List<ScheduleItemResponse> scheduleItems = new ArrayList<>();
        
        // For each registered class
        for (CourseRegistration registration : registrations) {
            ClassEntity classEntity = registration.getClassEntity();
            
            log.info("🔍 Processing class: {}", classEntity.getClassCode());
            
            // Get sessions for this class in the week
            List<ClassSession> sessions = sessionRepository.findByClassAndDateRange(
                    classEntity.getClassId(),
                    weekStartDate,
                    weekEndDate
            );
            
            log.info("  → Found {} sessions in this week", sessions.size());
            
            // Convert each session to ScheduleItemResponse
            for (ClassSession session : sessions) {
                ScheduleItemResponse item = mapToScheduleItem(session, classEntity);
                scheduleItems.add(item);
            }
        }
        
        log.info("✅ Total schedule items: {}", scheduleItems.size());
        
        return scheduleItems;
    }
    
    private ScheduleItemResponse mapToScheduleItem(ClassSession session, ClassEntity classEntity) {
    Subject subject = classEntity.getSubject();
    Teacher teacher = classEntity.getTeacher();
    
    // Get effective schedule (might be rescheduled)
    LocalDate effectiveDate = session.getEffectiveDate();
    DayOfWeek effectiveDay = session.getEffectiveDayOfWeek();
    TimeSlot effectiveSlot = session.getEffectiveTimeSlot();
    
    // ✅ SỬA: Lấy room name (KHÔNG dùng getCampus vì Room không có)
    String effectiveRoom = null;
if (session.getEffectiveRoom() != null) {
    Room room = session.getEffectiveRoom();
    effectiveRoom = room.getRoomCode();
}
    
    // Determine campus (hard-code vì chưa có trong DB)
    String campus = session.getSessionType() == SessionType.E_LEARNING 
            ? "LMS" 
            : "(P.Thanh Mỹ Tây, TP.HCM)";
    
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