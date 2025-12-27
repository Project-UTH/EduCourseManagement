package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * CourseRegistration - Đăng ký học phần
 *
 * Represents a student's enrollment in a class
 */
@Entity
@Table(name = "course_registration",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"student_id", "class_id"})
        },
        indexes = {
                @Index(name = "idx_registration_student", columnList = "student_id"),
                @Index(name = "idx_registration_class", columnList = "class_id"),
                @Index(name = "idx_registration_semester", columnList = "semester_id"),
                @Index(name = "idx_registration_status", columnList = "status")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseRegistration extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registration_id")
    private Long registrationId;

    // Student
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    // Class
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;

    // Semester (denormalized for faster queries)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    // Registration metadata
    @Column(name = "registered_at", nullable = false)
    private LocalDateTime registeredAt;

    @Column(name = "dropped_at")
    private LocalDateTime droppedAt;

    // Enrollment type
    @Enumerated(EnumType.STRING)
    @Column(name = "enrollment_type", nullable = false, length = 20)
    private EnrollmentType enrollmentType;  // NORMAL, MANUAL

    // Manual enrollment details (if MANUAL)
    @Column(name = "manual_reason", length = 500)
    private String manualReason;

    @Column(name = "manual_note", length = 1000)
    private String manualNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrolled_by_admin_id")
    private Admin enrolledByAdmin;  // Admin who manually enrolled

    // Status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RegistrationStatus status;

    // ==================== HELPER METHODS ====================

    public boolean isActive() {
        return status == RegistrationStatus.REGISTERED;
    }

    public boolean isDropped() {
        return status == RegistrationStatus.DROPPED;
    }

    public boolean isCompleted() {
        return status == RegistrationStatus.COMPLETED;
    }

    public boolean isManualEnrollment() {
        return enrollmentType == EnrollmentType.MANUAL;
    }
}