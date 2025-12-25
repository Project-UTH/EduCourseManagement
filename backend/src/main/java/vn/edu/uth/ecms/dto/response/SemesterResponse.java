package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.SemesterStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Semester Response DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SemesterResponse {

    private Long semesterId;
    private String semesterCode;
    private String semesterName;
    private LocalDate startDate;
    private LocalDate endDate;
    private SemesterStatus status;
    private Boolean registrationEnabled;
    private LocalDate registrationStartDate;
    private LocalDate registrationEndDate;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}