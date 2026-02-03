package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.enums.SemesterStatus;

/**
 * DTO for creating a new semester
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SemesterCreateRequest {

    @NotBlank(message = "Semester code is required")
    @Pattern(regexp = "^\\d{4}-[123]$",
            message = "Semester code must be YYYY-S format (e.g., 2024-1)")
    private String semesterCode;

    @NotBlank(message = "Semester name is required")
    @Size(max = 100, message = "Semester name must not exceed 100 characters")
    private String semesterName;

    @NotNull(message = "Start date is required")
    private String startDate;  // Format: YYYY-MM-DD

    @NotNull(message = "End date is required")
    private String endDate;    // Format: YYYY-MM-DD

    @NotNull(message = "Status is required")
    private SemesterStatus status;

    private String registrationStartDate;  
    private String registrationEndDate;    

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}