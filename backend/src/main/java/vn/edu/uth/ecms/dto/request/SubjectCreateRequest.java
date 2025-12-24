package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubjectCreateRequest {

    @NotBlank(message = "Subject code is required")
    @Size(max = 10, message = "Subject code cannot exceed 10 characters")
    private String subjectCode;

    @NotBlank(message = "Subject name is required")
    @Size(max = 100, message = "Subject name cannot exceed 100 characters")
    private String subjectName;

    @NotNull(message = "Credits is required")
    @Min(value = 1, message = "Credits must be at least 1")
    @Max(value = 10, message = "Credits cannot exceed 10")
    private Integer credits;

    @NotNull(message = "Total sessions is required")
    @Min(value = 1, message = "Total sessions must be at least 1")
    private Integer totalSessions;

    @NotNull(message = "E-learning sessions is required")
    @Min(value = 0, message = "E-learning sessions cannot be negative")
    private Integer elearningSessions;

    @NotNull(message = "In-person sessions is required")
    @Min(value = 0, message = "In-person sessions cannot be negative")
    private Integer inpersonSessions;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    private Long majorId;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
}