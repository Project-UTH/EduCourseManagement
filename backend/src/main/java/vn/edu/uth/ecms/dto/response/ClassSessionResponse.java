package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for ClassSession entity
 *
 * IMPORTANT FIELDS:
 * - original*: Auto-generated schedule
 * - actual*: Admin-rescheduled schedule
 * - effective*: What to display (actual if rescheduled, original otherwise)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassSessionResponse {

    // ==================== BASIC INFO ====================

    private Long sessionId;
    private Long classId;
    private String classCode;
    private Integer sessionNumber;  // 1-20
    private String sessionType;  // IN_PERSON, E_LEARNING

    // ==================== ORIGINAL SCHEDULE (Auto-generated) ====================

    private LocalDate originalDate;
    private String originalDayOfWeek;  // MONDAY
    private String originalDayOfWeekDisplay;  // "Thứ 2"
    private String originalTimeSlot;  // CA1
    private String originalTimeSlotDisplay;  // "Ca 1 (06:45 - 09:15)"
    private String originalRoom;  // A201

    // ==================== ACTUAL SCHEDULE (Admin rescheduled) ====================

    private LocalDate actualDate;
    private String actualDayOfWeek;
    private String actualDayOfWeekDisplay;
    private String actualTimeSlot;
    private String actualTimeSlotDisplay;
    private String actualRoom;

    // ==================== EFFECTIVE SCHEDULE (What to display) ====================

    private LocalDate effectiveDate;
    private String effectiveDayOfWeek;
    private String effectiveDayOfWeekDisplay;
    private String effectiveTimeSlot;
    private String effectiveTimeSlotDisplay;
    private String effectiveRoom;

    // ==================== RESCHEDULE INFO ====================

    private Boolean isRescheduled;
    private String rescheduleReason;

    // ==================== STATUS ====================

    private String status;  // SCHEDULED, COMPLETED, CANCELLED

    // ==================== METADATA ====================

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}