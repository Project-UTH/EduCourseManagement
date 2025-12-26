package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.SemesterStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for Semester response
 * Includes computed fields for frontend display
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SemesterResponse {

    private Long semesterId;
    private String semesterCode;
    private String semesterName;

    // Dates
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate registrationStartDate;
    private LocalDate registrationEndDate;

    // Status
    private SemesterStatus status;
    private Boolean registrationEnabled;

    // Computed fields
    private Boolean isRegistrationOpen;      // Current registration status
    private Long durationInDays;
    private Long durationInWeeks;
    private Boolean isRegistrationPeriodValid;

    // Statistics (optional, computed later)
    private Integer totalClasses;            // Total classes in this semester
    private Integer totalStudentsEnrolled;   // Total students enrolled

    // Other
    private String description;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}