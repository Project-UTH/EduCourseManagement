package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for rescheduling a session - UPDATED
 *
 * CHANGES:
 * - Add newRoomId (Long) for Room entity lookup
 * - Keep newRoom (String) for backward compatibility
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleSessionRequest {

    @NotBlank(message = "New date is required")
    private String newDate;  // Format: "2024-09-15"

    @NotBlank(message = "New day of week is required")
    private String newDayOfWeek;  // "MONDAY", "TUESDAY", etc.

    @NotBlank(message = "New time slot is required")
    private String newTimeSlot;  // "CA1", "CA2", etc.

    /**
     * ✅ NEW: Room ID (preferred)
     * Frontend should send this if available
     */
    private Long newRoomId;

    /**
     * Room code (for backward compatibility)
     * If newRoomId is null, system will lookup by this code
     */
    private String newRoom;  // "A201", "B105", etc.

    /**
     * Reason for rescheduling (optional)
     */
    private String reason;
}