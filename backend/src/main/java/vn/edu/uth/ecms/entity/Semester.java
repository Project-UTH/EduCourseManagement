package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import vn.edu.uth.ecms.entity.enums.SemesterStatus;

import java.time.LocalDate;

/**
 * Semester Entity 
 *
 * CRITICAL BUSINESS RULES:
 * 1. Only ONE semester can have status = ACTIVE at any time
 * 2. Registration period must be within semester dates
 * 3. Registration only allowed if: enabled + active + within period
 * 4. Semester duration: 10 weeks (70 days)
 */
@Entity
@Table(name = "semester")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Semester extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "semester_id")
    private Long semesterId;

    /**
     * Semester Code: Format YYYY-S (S = 1, 2, 3)
     */
    @NotBlank(message = "Semester code is required")
    @Pattern(regexp = "^\\d{4}-[123]$",
            message = "Semester code must be YYYY-S format (e.g., 2024-1)")
    @Column(name = "semester_code", unique = true, nullable = false, length = 10)
    private String semesterCode;

    /**
     * Semester Name
     */
    @NotBlank(message = "Semester name is required")
    @Size(max = 100, message = "Semester name must not exceed 100 characters")
    @Column(name = "semester_name", nullable = false, length = 100)
    private String semesterName;

    /**
     * Semester Start Date
     */
    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /**
     * Semester End Date
     * Must be 10 weeks (70 days) after start date
     */
    @NotNull(message = "End date is required")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /**
     * Semester Status
     * CRITICAL: Only ONE semester can be ACTIVE at any time
     */
    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SemesterStatus status;

    /**
     * Registration Enabled Flag
     * Admin can manually enable/disable registration
     */
    @Column(name = "registration_enabled", nullable = false)
    private Boolean registrationEnabled = false;

    /**
     * Registration Start Date
     * Must be before semester start date
     */
    @Column(name = "registration_start_date")
    private LocalDate registrationStartDate;

    /**
     * Registration End Date
     * Must be before or on semester start date
     */
    @Column(name = "registration_end_date")
    private LocalDate registrationEndDate;

    /**
     * Description
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    

    /**
     * Check if registration is currently open
     *
     * Registration is open if:
     * 1. registrationEnabled = TRUE (admin control)
     * 2. status = ACTIVE
     * 3. Current date is between registrationStartDate and registrationEndDate
     *
     * @return true if registration is open
     */
    public boolean isRegistrationOpen() {
        if (!this.registrationEnabled) {
            return false;
        }

        if (this.status != SemesterStatus.ACTIVE) {
            return false;
        }

        if (this.registrationStartDate == null || this.registrationEndDate == null) {
            return false;
        }

        LocalDate now = LocalDate.now();
        return !now.isBefore(this.registrationStartDate)
                && !now.isAfter(this.registrationEndDate);
    }

    /**
     * Check if semester is currently active
     */
    public boolean isActive() {
        return this.status == SemesterStatus.ACTIVE;
    }

    /**
     * Check if semester is completed
     */
    public boolean isCompleted() {
        return this.status == SemesterStatus.COMPLETED;
    }

    /**
     * Get duration in days
     */
    public long getDurationInDays() {
        if (this.startDate == null || this.endDate == null) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(this.startDate, this.endDate);
    }

    /**
     * Get duration in weeks
     */
    public long getDurationInWeeks() {
        return getDurationInDays() / 7;
    }

    /**
     * Check if registration period is valid
     */
    public boolean isRegistrationPeriodValid() {
        if (this.registrationStartDate == null || this.registrationEndDate == null) {
            return false;
        }

        // Registration start must be before registration end
        if (!this.registrationStartDate.isBefore(this.registrationEndDate)) {
            return false;
        }

        // Registration must end before or on semester start
        if (this.registrationEndDate.isAfter(this.startDate)) {
            return false;
        }

        return true;
    }
}