package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Class Update Request - UPDATED
 *
 * CHANGES:
 * REMOVED: Manual room fields (room, extraRoom)
 * REMOVED: Extra schedule fields (extraDayOfWeek, extraTimeSlot)
 * KEPT: Teacher, maxStudents
 * KEPT: Fixed day/time (for 10 sessions, system will re-find room)
 * KEPT: E-learning day/time (optional)
 *
 * NOTE:
 * - Cannot update subject or semester (immutable)
 * - Updating schedule will trigger room re-assignment
 * - Extra sessions remain pending (re-scheduled on next activation)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassUpdateRequest {

    @NotNull(message = "Teacher ID is required")
    @Positive(message = "Teacher ID must be positive")
    private Long teacherId;

    @NotNull(message = "Max students is required")
    @Min(value = 1, message = "Max students must be at least 1")
    @Max(value = 200, message = "Max students must not exceed 200")
    private Integer maxStudents;

    // ==================== FIXED SCHEDULE (OPTIONAL - for re-scheduling) ====================

    /**
     * Day of week for FIXED sessions
     * Optional - if provided, will trigger re-scheduling
     */
    @Pattern(regexp = "^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)?$",
            message = "Invalid day of week")
    private String dayOfWeek;

    /**
     * Time slot for FIXED sessions
     * Optional - if provided, will trigger re-scheduling
     */
    @Pattern(regexp = "^(CA1|CA2|CA3|CA4|CA5)?$",
            message = "Invalid time slot")
    private String timeSlot;

    // ==================== E-LEARNING SCHEDULE (OPTIONAL) ====================

    /**
     * E-learning day of week
     * Optional - if subject has e-learning
     */
    @Pattern(regexp = "^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)?$",
            message = "Invalid e-learning day of week")
    private String elearningDayOfWeek;

    /**
     * E-learning time slot
     * Optional - if subject has e-learning
     */
    @Pattern(regexp = "^(CA1|CA2|CA3|CA4|CA5)?$",
            message = "Invalid e-learning time slot")
    private String elearningTimeSlot;

    // ==================== VALIDATION HELPERS ====================

    /**
     * Check if schedule is being updated
     */
    public boolean isScheduleUpdate() {
        return dayOfWeek != null || timeSlot != null;
    }

    /**
     * Check if has complete fixed schedule
     */
    public boolean hasCompleteFixedSchedule() {
        boolean hasAny = dayOfWeek != null || timeSlot != null;
        boolean hasAll = dayOfWeek != null && timeSlot != null;

        if (!hasAny) return true;  // No update
        return hasAll;  // Must have both
    }

    /**
     * Check if has complete e-learning schedule
     */
    public boolean hasCompleteElearningSchedule() {
        boolean hasAny = elearningDayOfWeek != null || elearningTimeSlot != null;
        boolean hasAll = elearningDayOfWeek != null && elearningTimeSlot != null;

        if (!hasAny) return true;
        return hasAll;
    }
}