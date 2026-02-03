package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {

   

    private Long roomId;
    private String roomCode;
    private String roomName;
    private String building;
    private Integer floor;
    private String roomType;              
    private String roomTypeDisplay;       
    private Integer capacity;

    

    private Boolean isActive;                    // Admin enabled/disabled
    private String adminStatus;                  // "ACTIVE" / "INACTIVE"
    private String adminStatusDisplay;           // "Hoạt động" / "Ngừng hoạt động"

    

   
    private String currentStatus;                // "IN_USE" / "AVAILABLE" / "INACTIVE"
    private String currentStatusDisplay;         // "Đang sử dụng" / "Trống" / "Ngừng hoạt động"

   
    private CurrentSessionInfo currentSession;   

    

   
    private Long totalSessionsInSemester;

    /**
     * Completed sessions
     */
    private Long completedSessions;

    /**
     * Upcoming sessions
     */
    private Long upcomingSessions;

   
    private Double utilizationPercentage;

    

    private String fullLocation;                 // "Tòa A - Tầng 2 - A201"
    private String capacityInfo;                 // "50 chỗ ngồi" or "Không giới hạn"


    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

  
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurrentSessionInfo {
        private Long sessionId;
        private Long classId;
        private String classCode;
        private String subjectName;
        private String teacherName;
        private String timeSlot;               // "CA1", "CA2", etc.
        private String timeSlotDisplay;        // "Ca 1 (06:45-09:15)"
        private String startTime;              // "06:45"
        private String endTime;                // "09:15"
        private Integer minutesRemaining;      // Minutes until session ends
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomStatistics {
        private Long totalSessions;
        private Long completedSessions;
        private Long upcomingSessions;
        private Long cancelledSessions;
        private Double utilizationPercentage;
    }
}