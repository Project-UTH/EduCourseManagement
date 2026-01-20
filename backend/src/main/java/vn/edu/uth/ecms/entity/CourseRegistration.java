package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

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
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseRegistration extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registration_id")
    private Long registrationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RegistrationStatus status;

    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    @Column(name = "dropped_at")
    private LocalDateTime droppedAt;

    // ✅ NEW: Điểm tổng kết (được tính khi hoàn thành học kỳ)
    @Column(name = "final_grade", columnDefinition = "DECIMAL(3,2)")
    private BigDecimal finalGrade;

    // Manual enrollment fields
    @Enumerated(EnumType.STRING)
    @Column(name = "enrollment_type", length = 20)
    private EnrollmentType enrollmentType = EnrollmentType.NORMAL;

    @Column(name = "manual_reason", length = 500)
    private String manualReason;

    @Column(name = "manual_note", length = 1000)
    private String manualNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enrolled_by_admin_id")
    private Admin enrolledByAdmin;

    // ==================== HELPER METHODS ====================

    public boolean isActive() {
        return status == RegistrationStatus.REGISTERED;
    }

    public boolean canDrop() {
        return status == RegistrationStatus.REGISTERED;
    }

    public boolean isDropped() {
        return status == RegistrationStatus.DROPPED;
    }

    public void drop() {
        this.status = RegistrationStatus.DROPPED;
        this.droppedAt = LocalDateTime.now();
    }
}