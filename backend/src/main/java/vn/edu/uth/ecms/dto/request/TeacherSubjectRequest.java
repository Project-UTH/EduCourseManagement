package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for adding/updating teacher-subject relationship
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherSubjectRequest {

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    private Boolean isPrimary = false;

    private Integer yearsOfExperience;

    private String notes;
}