package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.Gender;

import java.time.LocalDate;

/**
 * DTO for creating a new Teacher
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherCreateRequest {

    @NotBlank(message = "Citizen ID is required")
    @Size(min = 12, max = 12, message = "Citizen ID must be exactly 12 digits")
    @Pattern(regexp = "^[0-9]{12}$", message = "Citizen ID must contain only digits")
    private String citizenId;

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @Size(max = 15, message = "Phone must not exceed 15 characters")
    @Pattern(regexp = "^[0-9+\\-\\s()]*$", message = "Phone must contain only digits and valid characters")
    private String phone;

    @NotNull(message = "Department is required")
    private Long departmentId;

    // Optional - nullable if teacher teaches multiple majors
    private Long majorId;

    @Size(max = 50, message = "Degree must not exceed 50 characters")
    private String degree;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;
}