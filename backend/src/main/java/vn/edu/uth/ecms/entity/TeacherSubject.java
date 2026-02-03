package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "teacher_subject", uniqueConstraints = @UniqueConstraint(columnNames = { "teacher_id", "subject_id" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherSubject extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "teacher_subject_id")
    private Long teacherSubjectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    /**
     * Is this the teacher's primary/specialized subject?
     */
    @Column(name = "is_primary")
    private Boolean isPrimary = false;

    /**
     * Additional notes about this teacher-subject relationship
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}