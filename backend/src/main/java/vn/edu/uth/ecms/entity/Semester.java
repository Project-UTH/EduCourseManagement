package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.SemesterStatus;

import java.time.LocalDate;

/**
 * Semester Entity - Học kỳ
 * FIXED VERSION - Matching your field names
 */
@Entity
@Table(name = "semester")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Semester extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "semester_id")
    private Long semesterId;

    @Column(name = "semester_code", nullable = false, unique = true, length = 20)
    private String semesterCode;

    @Column(name = "semester_name", nullable = false, length = 100)
    private String semesterName;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SemesterStatus status;

    // FIXED: Đổi tên field từ registrationEnabled → isRegistrationEnabled
    @Column(name = "registration_enabled", nullable = false)
    private Boolean isRegistrationEnabled = false;

    @Column(name = "registration_start_date")
    private LocalDate registrationStartDate;

    @Column(name = "registration_end_date")
    private LocalDate registrationEndDate;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}