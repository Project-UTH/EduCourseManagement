package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for rescheduling a session - UPDATED
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

  
    private Long newRoomId;


    private String newRoom;  

    
    private String reason;
}