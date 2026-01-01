package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.Room;
import vn.edu.uth.ecms.entity.RoomAdminStatus;

import java.time.LocalDateTime;

/**
 * ✨ ENHANCED RoomResponse with Real-time Status
 *
 * Shows:
 * 1. Basic room info
 * 2. Admin status (ACTIVE/INACTIVE)
 * 3. Current real-time status (IN_USE/AVAILABLE)
 * 4. Current session info (if in use)
 * 5. Usage statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {

    // ==================== BASIC INFO ====================

    private Long roomId;
    private String roomCode;
    private String roomName;
    private String building;
    private Integer floor;
    private String roomType;              // "LECTURE_HALL", "LAB", etc.
    private String roomTypeDisplay;       // "Giảng đường", "Phòng thực hành"
    private Integer capacity;

    // ==================== ADMIN STATUS ====================

    private Boolean isActive;                    // Admin enabled/disabled
    private String adminStatus;                  // "ACTIVE" / "INACTIVE"
    private String adminStatusDisplay;           // "Hoạt động" / "Ngừng hoạt động"

    // ==================== ✨ REAL-TIME STATUS (NEW!) ====================

    /**
     * Real-time status based on current sessions
     * - IN_USE: Room has session happening RIGHT NOW
     * - AVAILABLE: Room is free RIGHT NOW
     * - INACTIVE: Room is disabled by admin
     */
    private String currentStatus;                // "IN_USE" / "AVAILABLE" / "INACTIVE"
    private String currentStatusDisplay;         // "Đang sử dụng" / "Trống" / "Ngừng hoạt động"

    /**
     * If room is currently IN_USE, show which session
     */
    private CurrentSessionInfo currentSession;   // null if AVAILABLE

    // ==================== USAGE STATISTICS ====================

    /**
     * Total sessions using this room in current semester
     */
    private Long totalSessionsInSemester;

    /**
     * Completed sessions
     */
    private Long completedSessions;

    /**
     * Upcoming sessions
     */
    private Long upcomingSessions;

    /**
     * Utilization percentage (0-100)
     * Formula: (sessions using this room / total possible slots) × 100
     */
    private Double utilizationPercentage;

    // ==================== LOCATION INFO ====================

    private String fullLocation;                 // "Tòa A - Tầng 2 - A201"
    private String capacityInfo;                 // "50 chỗ ngồi" or "Không giới hạn"

    // ==================== METADATA ====================

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ==================== ✨ NESTED CLASS: Current Session Info ====================

    /**
     * Information about current session using the room
     * Only populated if currentStatus = IN_USE
     */
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