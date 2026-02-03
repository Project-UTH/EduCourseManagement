package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name = "subject")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subject extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "subject_id")
    private Long subjectId;

    @Column(name = "subject_code", unique = true, nullable = false, length = 10)
    private String subjectCode;

    @Column(name = "subject_name", nullable = false, length = 100)
    private String subjectName;

    @Column(name = "credits", nullable = false)
    private Integer credits;

    // SỐ BUỔI HỌC
    @Column(name = "total_sessions", nullable = false)
    private Integer totalSessions;

    @Column(name = "elearning_sessions", nullable = false)
    private Integer elearningSessions;

    @Column(name = "inperson_sessions", nullable = false)
    private Integer inpersonSessions;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "major_id")
    private Major major;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Override
    public String toString() {
        return "Subject{" +
                "subjectId=" + subjectId +
                ", subjectCode='" + subjectCode + '\'' +
                ", subjectName='" + subjectName + '\'' +
                ", credits=" + credits +
                ", totalSessions=" + totalSessions +
                '}';
    }
}