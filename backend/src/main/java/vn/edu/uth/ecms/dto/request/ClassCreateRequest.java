package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Class Create Request - UPDATED
 *
 * CHANGES:
 * REMOVED: room, extraDayOfWeek, extraTimeSlot, extraRoom
 * KEPT: dayOfWeek, timeSlot (for fixed 10 sessions)
 * KEPT: elearningDayOfWeek, elearningTimeSlot (optional)
 *
 * AUTO ASSIGNMENT:
 * - System will auto-assign fixedRoom
 * - Extra sessions will be scheduled on semester activation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassCreateRequest {

    @NotBlank(message = "Class code is required")
    @Size(max = 20, message = "Class code max 20 characters")
    @Pattern(regexp = "^[A-Z0-9-]+$", message = "Class code must be uppercase alphanumeric with dash")
    private String classCode;

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    @NotNull(message = "Teacher ID is required")
    private Long teacherId;

    @NotNull(message = "Semester ID is required")
    private Long semesterId;

    @NotNull(message = "Max students is required")
    @Min(value = 1, message = "Max students must be at least 1")
    @Max(value = 200, message = "Max students cannot exceed 200")
    private Integer maxStudents;

    // ==================== FIXED SCHEDULE (for 10 sessions) ====================

    /**
     * Day of week for FIXED sessions
     * Admin inputs: MONDAY, TUESDAY, etc.
     * System will find available room automatically
     */
    @NotBlank(message = "Day of week is required")
    @Pattern(regexp = "MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY",
            message = "Invalid day of week")
    private String dayOfWeek;

    /**
     * Time slot for FIXED sessions
     * Admin inputs: CA1, CA2, CA3, CA4, CA5
     * System will find available room automatically
     */
    @NotBlank(message = "Time slot is required")
    @Pattern(regexp = "CA1|CA2|CA3|CA4|CA5",
            message = "Invalid time slot")
    private String timeSlot;

    // ==================== E-LEARNING SCHEDULE (optional) ====================

    /**
     * Day of week for E-LEARNING sessions
     * Optional - NULL if subject has no e-learning
     */
    @Pattern(regexp = "MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY",
            message = "Invalid e-learning day of week")
    private String elearningDayOfWeek;

    /**
     * Time slot for E-LEARNING sessions
     * Optional - NULL if subject has no e-learning
     */
    @Pattern(regexp = "CA1|CA2|CA3|CA4|CA5",
            message = "Invalid e-learning time slot")
    private String elearningTimeSlot;

    // ==================== VALIDATION ====================

    /**
     * Custom validation: If subject has e-learning, both day and time must be provided
     * This is handled in service layer by checking subject.eLearningSessions > 0
     */
}