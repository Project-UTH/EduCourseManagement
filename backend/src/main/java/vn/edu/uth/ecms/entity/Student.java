package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import vn.edu.uth.ecms.entity.enums.EducationLevel;
import vn.edu.uth.ecms.entity.enums.Gender;
import vn.edu.uth.ecms.entity.enums.TrainingType;

import java.time.LocalDate;

@Entity
@Table(name = "student")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "student_id")
    private Long studentId;

    @NotBlank(message = "Student code is required")
    @Size(min = 12, max = 12, message = "Student code must be exactly 12 digits")
    @Column(name = "student_code", unique = true, nullable = false, length = 12)
    private String studentCode;

    @NotBlank(message = "Password is required")
    @Column(name = "password", nullable = false)
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @NotNull(message = "Gender is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Gender gender;

    @NotNull(message = "Date of birth is required")
    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    // Academic info
    @NotNull(message = "Academic year is required")
    @Column(name = "academic_year", nullable = false)
    private Integer academicYear;

    @NotNull(message = "Education level is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "education_level", nullable = false, length = 20)
    private EducationLevel educationLevel;

    @NotNull(message = "Training type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "training_type", nullable = false, length = 20)
    private TrainingType trainingType;

    // Contact info
    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    @Column(length = 100)
    private String email;

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    @Column(length = 20)
    private String phone;

    @Size(max = 200, message = "Place of birth must not exceed 200 characters")
    @Column(name = "place_of_birth", length = 200)
    private String placeOfBirth;

    // Relationships
    @NotNull(message = "Major is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "major_id", nullable = false)
    private Major major;

    @Column(name = "is_first_login", nullable = false)
    private Boolean isFirstLogin = true;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

}