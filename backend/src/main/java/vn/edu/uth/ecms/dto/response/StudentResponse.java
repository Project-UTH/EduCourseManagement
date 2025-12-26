package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.EducationLevel;
import vn.edu.uth.ecms.entity.Gender;
import vn.edu.uth.ecms.entity.TrainingType;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for Student response
 * Includes major and department information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentResponse {

    private Long studentId;
    private String studentCode;
    private String fullName;
    private Gender gender;
    private LocalDate dateOfBirth;

    // Academic info
    private Integer academicYear;
    private EducationLevel educationLevel;
    private TrainingType trainingType;

    // Contact info
    private String email;
    private String phone;
    private String placeOfBirth;

    // Major info (required)
    private Long majorId;
    private String majorCode;
    private String majorName;

    // Department info (from major)
    private Long departmentId;
    private String departmentCode;
    private String departmentName;

    // Status
    private String avatarUrl;
    private Boolean isFirstLogin;
    private Boolean isActive;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}