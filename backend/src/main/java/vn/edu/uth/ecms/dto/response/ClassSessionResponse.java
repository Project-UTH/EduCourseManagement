package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ClassSessionResponse - UPDATED
 *
 * CHANGES:
 * - Add category (FIXED/EXTRA/ELEARNING)
 * - Add isPending (for extra sessions)
 * - Add room display names (originalRoomName, actualRoomName, effectiveRoomName)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassSessionResponse {

    private Long sessionId;
    private Long classId;
    private String classCode;
    private Integer sessionNumber;
    private String sessionType;  // IN_PERSON, E_LEARNING

    // ==================== NEW FIELDS ====================

    /**
     * ✅ NEW: Session category
     * FIXED: First 10 in-person sessions
     * EXTRA: Additional in-person sessions (11+)
     * ELEARNING: E-learning sessions
     */
    private String category;

    /**
     * ✅ NEW: Is this session pending?
     * true: Extra session not yet scheduled (waiting for activation)
     * false: Session has been scheduled
     */
    private Boolean isPending;

    // ==================== ORIGINAL SCHEDULE ====================

    private LocalDate originalDate;
    private String originalDayOfWeek;
    private String originalDayOfWeekDisplay;
    private String originalTimeSlot;
    private String originalTimeSlotDisplay;
    private String originalRoom;  // Room code: "A201"

    /**
     * ✅ NEW: Original room display name
     * Example: "A201 - Giảng đường lớn"
     */
    private String originalRoomName;

    // ==================== ACTUAL SCHEDULE (if rescheduled) ====================

    private LocalDate actualDate;
    private String actualDayOfWeek;
    private String actualDayOfWeekDisplay;
    private String actualTimeSlot;
    private String actualTimeSlotDisplay;
    private String actualRoom;  // Room code: "B105"

    /**
     * ✅ NEW: Actual room display name
     * Example: "B105 - Phòng học nhỏ"
     */
    private String actualRoomName;

    // ==================== EFFECTIVE SCHEDULE (final computed) ====================

    private LocalDate effectiveDate;
    private String effectiveDayOfWeek;
    private String effectiveDayOfWeekDisplay;
    private String effectiveTimeSlot;
    private String effectiveTimeSlotDisplay;
    private String effectiveRoom;  // Room code

    /**
     * ✅ NEW: Effective room display name
     * This is what students see in their timetable
     */
    private String effectiveRoomName;

    // ==================== RESCHEDULE INFO ====================

    private Boolean isRescheduled;
    private String rescheduleReason;

    // ==================== STATUS ====================

    private String status;  // SCHEDULED, COMPLETED, CANCELLED

    // ==================== METADATA ====================

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}