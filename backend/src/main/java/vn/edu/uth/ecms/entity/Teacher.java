package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "teacher")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Teacher extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "teacher_id")
    private Long teacherId;

    @NotBlank(message = "Citizen ID is required")
    @Size(min = 12, max = 12, message = "Citizen ID must be exactly 12 digits")
    @Column(name = "citizen_id", unique = true, nullable = false, length = 12)
    private String citizenId;

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

    @Email(message = "Invalid email format")
    @Column(length = 100)
    private String email;

    @Size(max = 15, message = "Phone must not exceed 15 characters")
    @Column(length = 15)
    private String phone;

    @NotNull(message = "Department is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "major_id")
    private Major major;

    @Size(max = 50, message = "Degree must not exceed 50 characters")
    @Column(length = 50)
    private String degree;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "is_first_login", nullable = false)
    private Boolean isFirstLogin = true;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}