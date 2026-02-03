package vn.edu.uth.ecms.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for rescheduling multiple sessions at once
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchRescheduleRequest {

    @NotEmpty(message = "Session IDs list cannot be empty")
    @Size(min = 1, max = 50, message = "Can reschedule 1-50 sessions at once")
    private List<@NotNull @Positive Long> sessionIds;

    @NotNull(message = "Reschedule details are required")
    @Valid
    private RescheduleSessionRequest rescheduleDetails;
}