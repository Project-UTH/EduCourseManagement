package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Semester Update Request DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SemesterUpdateRequest {

    @NotBlank(message = "Semester name is required")
    @Size(max = 100, message = "Semester name must not exceed 100 characters")
    private String semesterName;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}