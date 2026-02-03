package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.enums.EducationLevel;
import vn.edu.uth.ecms.entity.enums.Gender;
import vn.edu.uth.ecms.entity.enums.TrainingType;

/**
 * DTO for updating an existing student
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentUpdateRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotNull(message = "Date of birth is required")
    private String dateOfBirth; // Format: YYYY-MM-DD

    @NotNull(message = "Academic year is required")
    @Min(value = 2000, message = "Academic year must be after 2000")
    @Max(value = 2100, message = "Academic year must be before 2100")
    private Integer academicYear;

    @NotNull(message = "Education level is required")
    private EducationLevel educationLevel;

    @NotNull(message = "Training type is required")
    private TrainingType trainingType;

    @NotNull(message = "Major is required")
    private Long majorId;

    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    @Pattern(regexp = "^[0-9+\\-\\s()]*$", message = "Invalid phone format")
    private String phone;

    @Size(max = 200, message = "Place of birth must not exceed 200 characters")
    private String placeOfBirth;
}