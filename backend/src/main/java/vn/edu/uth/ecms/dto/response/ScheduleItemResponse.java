package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleItemResponse {
    
    // Class info
    private Long classId;
    private String classCode;
    
    // Subject info
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    
    // Teacher info
    private Long teacherId;
    private String teacherName;
    
    // Schedule info
    private LocalDate sessionDate;        // Ngày cụ thể
    private String dayOfWeek;             // "MONDAY"
    private String dayOfWeekDisplay;      // "Thứ 2"
    private String timeSlot;              // "CA1"
    private String timeSlotDisplay;       // "Ca 1 (06:45 - 09:15)"
    private String room;                  // "C209 - CS1"
    
    // Session info
    private Long sessionId;
    private Integer sessionNumber;        // Buổi thứ mấy (1-15)
    private String sessionType;           // "IN_PERSON" hoặc "E_LEARNING"
    
    // Additional
    private String campus;                // "P.Thanh Mỹ Tây, TP.HCM" hoặc "LMS"
}