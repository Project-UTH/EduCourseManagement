package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for rescheduling a session
 *
 * VALIDATION:
 * - New date must be within semester range
 * - Cannot reschedule E_LEARNING sessions
 * - Must check teacher & room conflicts
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleSessionRequest {

    @NotBlank(message = "New date is required")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$",
            message = "Date must be in format YYYY-MM-DD")
    private String newDate;

    @NotBlank(message = "New day of week is required")
    @Pattern(regexp = "^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)$",
            message = "Invalid day of week")
    private String newDayOfWeek;

    @NotBlank(message = "New time slot is required")
    @Pattern(regexp = "^(CA1|CA2|CA3|CA4|CA5)$",
            message = "Invalid time slot")
    private String newTimeSlot;

    @NotBlank(message = "New room is required")
    @Size(max = 50, message = "Room must not exceed 50 characters")
    private String newRoom;

    @Size(max = 255, message = "Reason must not exceed 255 characters")
    private String reason;
}