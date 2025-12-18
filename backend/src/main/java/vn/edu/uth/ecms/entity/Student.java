package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
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
    @Column(nullable = false)
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name must not exceed 100 characters")
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @NotNull(message = "Gender is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @NotNull(message = "Date of birth is required")
    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    @Size(max = 10, message = "Academic year must not exceed 10 characters")
    @Column(name = "academic_year", length = 10)
    private String academicYear;

    @Size(max = 50, message = "Education level must not exceed 50 characters")
    @Column(name = "education_level", length = 50)
    private String educationLevel;

    @Size(max = 100, message = "Place of birth must not exceed 100 characters")
    @Column(name = "place_of_birth", length = 100)
    private String placeOfBirth;

    @Size(max = 50, message = "Training type must not exceed 50 characters")
    @Column(name = "training_type", length = 50)
    private String trainingType;

    @NotNull(message = "Major is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "major_id", nullable = false)
    private Major major;

    @DecimalMin(value = "0.00", message = "GPA must be at least 0.00")
    @DecimalMax(value = "4.00", message = "GPA must not exceed 4.00")
    @Column(precision = 3, scale = 2)
    private BigDecimal gpa = BigDecimal.ZERO;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "is_first_login", nullable = false)
    private Boolean isFirstLogin = true;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}