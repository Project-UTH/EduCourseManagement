package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import vn.edu.uth.ecms.entity.enums.Gender;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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

    /**
     * Major field - represents teacher's primary specialization (administrative
     * info)
     * This is different from the subjects they can actually teach
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "major_id")
    private Major major;

    @Size(max = 50, message = "Degree must not exceed 50 characters")
    @Column(length = 50)
    private String degree;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "is_first_login", nullable = false)
    private Boolean isFirstLogin = true;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "teacher", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TeacherSubject> teacherSubjects = new ArrayList<>();

    public void addSubject(Subject subject, Boolean isPrimary) {
        TeacherSubject teacherSubject = TeacherSubject.builder()
                .teacher(this)
                .subject(subject)
                .isPrimary(isPrimary != null ? isPrimary : false)
                .build();
        teacherSubjects.add(teacherSubject);
    }

    public void removeSubject(Subject subject) {
        teacherSubjects.removeIf(ts -> ts.getSubject().equals(subject));
    }

    public List<Subject> getSubjects() {
        return teacherSubjects.stream()
                .map(TeacherSubject::getSubject)
                .collect(Collectors.toList());
    }

    /**
     * Get primary subjects only
     */
    public List<Subject> getPrimarySubjects() {
        return teacherSubjects.stream()
                .filter(ts -> Boolean.TRUE.equals(ts.getIsPrimary()))
                .map(TeacherSubject::getSubject)
                .collect(Collectors.toList());
    }

    /**
     * Check if teacher can teach a specific subject
     */
    public boolean canTeach(Subject subject) {
        return teacherSubjects.stream()
                .anyMatch(ts -> ts.getSubject().equals(subject));
    }
}