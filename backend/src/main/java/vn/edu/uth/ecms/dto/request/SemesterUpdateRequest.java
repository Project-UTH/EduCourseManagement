package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating an existing semester
 *
 * Notes:
 * - Semester code cannot be changed (immutable)
 * - Status should be changed via separate endpoints (activate, complete)
 * - COMPLETED semesters cannot be edited
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SemesterUpdateRequest {

    @NotBlank(message = "Semester name is required")
    @Size(max = 100, message = "Semester name must not exceed 100 characters")
    private String semesterName;

    @NotNull(message = "Start date is required")
    private String startDate;  // Format: YYYY-MM-DD

    @NotNull(message = "End date is required")
    private String endDate;    // Format: YYYY-MM-DD

    private String registrationStartDate;  // Format: YYYY-MM-DD (optional)
    private String registrationEndDate;    // Format: YYYY-MM-DD (optional)

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}