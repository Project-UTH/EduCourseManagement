package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating an existing class
 *
 * NOTE: Cannot update subject or semester (only teacher, capacity, schedule)
 * WARNING: Updating schedule will regenerate all sessions!
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

    @NotBlank(message = "Day of week is required")
    @Pattern(regexp = "^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)$",
            message = "Invalid day of week")
    private String dayOfWeek;

    @NotBlank(message = "Time slot is required")
    @Pattern(regexp = "^(CA1|CA2|CA3|CA4|CA5)$",
            message = "Invalid time slot")
    private String timeSlot;

    @NotBlank(message = "Room is required")
    @Size(max = 50, message = "Room must not exceed 50 characters")
    private String room;
}