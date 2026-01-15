package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationResponse {

    private Long registrationId;
    private String status;
    private LocalDateTime registeredAt;
    private LocalDateTime droppedAt;
    
    private Long studentId;
    private String studentCode;
    private String studentName;
    
    private Long classId;
    private String classCode;
    
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    
    private Long teacherId;
    private String teacherName;
    
    private Long semesterId;
    private String semesterCode;
    private String semesterName;
    private String semesterStatus; // ✅ ADDED: UPCOMING, ACTIVE, COMPLETED
    
    private String dayOfWeek;
    private String dayOfWeekDisplay;
    private String timeSlot;
    private String timeSlotDisplay;
    private String room;
}