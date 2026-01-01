package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * RoomScheduleResponse DTO
 *
 * Shows which classes/sessions are using a room
 * Used for displaying room schedule in calendar view
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomScheduleResponse {

    // ==================== SESSION INFO ====================

    private Long sessionId;
    private Integer sessionNumber;           // Buổi thứ mấy (1, 2, 3...)
    private String sessionType;              // "IN_PERSON", "E_LEARNING"
    private String category;                 // "FIXED", "EXTRA" (nullable)

    // ==================== SCHEDULE INFO ====================

    private LocalDate sessionDate;
    private String dayOfWeek;                // "MONDAY", "TUESDAY", etc.
    private String dayOfWeekDisplay;         // "Thứ 2", "Thứ 3", etc.
    private String timeSlot;                 // "CA1", "CA2", etc.
    private String timeSlotDisplay;          // "Ca 1 (06:45-09:15)"
    private String startTime;                // "06:45"
    private String endTime;                  // "09:15"

    // ==================== CLASS INFO ====================

    private Long classId;
    private String classCode;                // "IT101-01"
    private String subjectName;              // "Lập trình Web"
    private Integer credits;                 // 3

    // ==================== TEACHER INFO ====================

    private Long teacherId;
    private String teacherName;              // "TS. Nguyễn Văn A"
    private String teacherEmail;

    // ==================== STATUS INFO ====================

    private String status;                   // "SCHEDULED", "COMPLETED", "CANCELLED"
    private String statusDisplay;            // "Đã lên lịch", "Hoàn thành", "Đã hủy"

    private Boolean isRescheduled;           // Session đã được đổi lịch?
    private String rescheduleReason;         // Lý do đổi lịch (nếu có)

    private Boolean isPending;               // Session đang chờ xếp lịch?

    // ==================== HELPER METHODS ====================

    /**
     * Get status display in Vietnamese
     */
    public String getStatusDisplay() {
        if (statusDisplay != null) {
            return statusDisplay;
        }

        return switch (status) {
            case "SCHEDULED" -> "Đã lên lịch";
            case "COMPLETED" -> "Hoàn thành";
            case "CANCELLED" -> "Đã hủy";
            default -> "Không xác định";
        };
    }

    /**
     * Get day of week display in Vietnamese
     */
    public String getDayOfWeekDisplay() {
        if (dayOfWeekDisplay != null) {
            return dayOfWeekDisplay;
        }

        if (dayOfWeek == null) {
            return null;
        }

        return switch (dayOfWeek) {
            case "MONDAY" -> "Thứ 2";
            case "TUESDAY" -> "Thứ 3";
            case "WEDNESDAY" -> "Thứ 4";
            case "THURSDAY" -> "Thứ 5";
            case "FRIDAY" -> "Thứ 6";
            case "SATURDAY" -> "Thứ 7";
            case "SUNDAY" -> "Chủ nhật";
            default -> dayOfWeek;
        };
    }

    /**
     * Get full schedule summary
     * Example: "Thứ 2, Ca 1 (06:45-09:15)"
     */
    public String getScheduleSummary() {
        StringBuilder summary = new StringBuilder();

        if (dayOfWeekDisplay != null || dayOfWeek != null) {
            summary.append(getDayOfWeekDisplay());
        }

        if (timeSlotDisplay != null) {
            if (summary.length() > 0) {
                summary.append(", ");
            }
            summary.append(timeSlotDisplay);
        } else if (timeSlot != null) {
            if (summary.length() > 0) {
                summary.append(", ");
            }
            summary.append(timeSlot);
        }

        return summary.toString();
    }

    /**
     * Get class info summary
     * Example: "IT101-01 - Lập trình Web (3 TC)"
     */
    public String getClassSummary() {
        StringBuilder summary = new StringBuilder();

        if (classCode != null) {
            summary.append(classCode);
        }

        if (subjectName != null) {
            if (summary.length() > 0) {
                summary.append(" - ");
            }
            summary.append(subjectName);
        }

        if (credits != null) {
            summary.append(" (").append(credits).append(" TC)");
        }

        return summary.toString();
    }

    /**
     * Check if session is in the past
     */
    public boolean isPast() {
        if (sessionDate == null) {
            return false;
        }
        return sessionDate.isBefore(LocalDate.now());
    }

    /**
     * Check if session is today
     */
    public boolean isToday() {
        if (sessionDate == null) {
            return false;
        }
        return sessionDate.isEqual(LocalDate.now());
    }

    /**
     * Check if session is upcoming
     */
    public boolean isUpcoming() {
        if (sessionDate == null) {
            return false;
        }
        return sessionDate.isAfter(LocalDate.now());
    }

    /**
     * Get badge color for UI based on status
     * - green: COMPLETED
     * - blue: SCHEDULED
     * - gray: CANCELLED
     */
    public String getStatusBadgeColor() {
        return switch (status) {
            case "COMPLETED" -> "green";
            case "SCHEDULED" -> "blue";
            case "CANCELLED" -> "gray";
            default -> "gray";
        };
    }

    /**
     * Get icon for session type
     * - 🏫 IN_PERSON
     * - 💻 E_LEARNING
     */
    public String getSessionTypeIcon() {
        return switch (sessionType) {
            case "IN_PERSON" -> "🏫";
            case "E_LEARNING" -> "💻";
            default -> "📚";
        };
    }
}