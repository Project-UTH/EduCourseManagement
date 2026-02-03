package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Class Response DTO - COMPLETE VERSION WITH PREREQUISITES
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassResponse {

    

    private Long classId;
    private String classCode;
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    private Integer totalSessions;
    private Integer inPersonSessions;
    private Integer eLearningSessions;
    
   
    private String subjectDescription;

    

    private Long teacherId;
    private String teacherName;
    private String teacherEmail;
    private String teacherDegree;

    

    private Long semesterId;
    private String semesterCode;
    private String semesterName;
    private String semesterStatus;

   

    private Integer maxStudents;
    private Integer enrolledCount;
    private Integer availableSeats;

    

    private String status;           // OPEN, FULL, CLOSED
    private Boolean canRegister;
    private Boolean isFull;

    

    private String dayOfWeek;        // MONDAY, TUESDAY, etc.
    private String dayOfWeekDisplay; // "Thứ 2", "Thứ 3", etc.
    private String timeSlot;         // CA1, CA2, etc.
    private String timeSlotDisplay;  // "Ca 1 (06:45-09:15)"

   
    private String fixedRoom;        // Room code: "A201", "B105"

   
    private String fixedRoomName;    // "A201 - Giảng đường lớn"

    
    private Integer fixedRoomCapacity;

    

    private String elearningDayOfWeek;
    private String elearningTimeSlot;

    

    private LocalDate startDate;
    private LocalDate endDate;

    
    private Long totalSessionsGenerated;

  
    private Long pendingSessionsCount;

    private Long completedSessions;

    
    private Long rescheduledSessionsCount;

    

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

  
    private List<PrerequisiteInfo> prerequisites;

   
    private Boolean isRegistered;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrerequisiteInfo {
        
        /**
         * ID môn học tiên quyết
         */
        private Long subjectId;
        
        /**
         * Mã môn học (vd: CS101)
         */
        private String subjectCode;
        
        /**
         * Tên môn học (vd: "Lập trình căn bản")
         */
        private String subjectName;
        
        /**
         * Số tín chỉ
         */
        private Integer credits;
        
      
        private Boolean isCompleted;
        
       
        private Double totalScore;
    }
}