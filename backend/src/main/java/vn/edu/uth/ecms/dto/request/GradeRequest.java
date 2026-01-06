package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * GradeRequest DTO
 * 
 * Request body for creating or updating student grades
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeRequest {
    
    /**
     * Student ID (required for creation)
     */
    @NotNull(message = "Student ID is required", groups = CreateValidation.class)
    @Positive(message = "Student ID must be positive")
    private Long studentId;
    
    /**
     * Class ID (required for creation)
     */
    @NotNull(message = "Class ID is required", groups = CreateValidation.class)
    @Positive(message = "Class ID must be positive")
    private Long classId;
    
    /**
     * Regular score (average of REGULAR homework)
     * Weight: 20% of total grade
     */
    @DecimalMin(value = "0.0", message = "Regular score must be at least 0")
    @DecimalMax(value = "10.0", message = "Regular score must not exceed 10")
    private BigDecimal regularScore;
    
    /**
     * Midterm score (from MIDTERM homework)
     * Weight: 30% of total grade
     */
    @DecimalMin(value = "0.0", message = "Midterm score must be at least 0")
    @DecimalMax(value = "10.0", message = "Midterm score must not exceed 10")
    private BigDecimal midtermScore;
    
    /**
     * Final score (from FINAL homework)
     * Weight: 50% of total grade
     */
    @DecimalMin(value = "0.0", message = "Final score must be at least 0")
    @DecimalMax(value = "10.0", message = "Final score must not exceed 10")
    private BigDecimal finalScore;
    
    /**
     * Attendance rate (optional)
     * Percentage 0-100
     */
    @DecimalMin(value = "0.0", message = "Attendance rate must be at least 0")
    @DecimalMax(value = "100.0", message = "Attendance rate must not exceed 100")
    private BigDecimal attendanceRate;
    
    /**
     * Teacher's overall comment (optional)
     */
    @Size(max = 5000, message = "Teacher comment must not exceed 5000 characters")
    private String teacherComment;
    
    // ========================================
    // VALIDATION GROUPS
    // ========================================
    
    public interface CreateValidation {}
    public interface UpdateValidation {}
    
    // ========================================
    // VALIDATION METHODS
    // ========================================
    
    /**
     * Check if all component scores are provided
     */
    public boolean isComplete() {
        return regularScore != null && midtermScore != null && finalScore != null;
    }
    
    /**
     * Check if at least one score is provided
     */
    public boolean hasAnyScore() {
        return regularScore != null || midtermScore != null || finalScore != null;
    }
    
    /**
     * Sanitize input data
     */
    public void sanitize() {
        if (teacherComment != null) {
            teacherComment = teacherComment.trim();
        }
        // Round scores to 2 decimal places
        if (regularScore != null) {
            regularScore = regularScore.setScale(2, java.math.RoundingMode.HALF_UP);
        }
        if (midtermScore != null) {
            midtermScore = midtermScore.setScale(2, java.math.RoundingMode.HALF_UP);
        }
        if (finalScore != null) {
            finalScore = finalScore.setScale(2, java.math.RoundingMode.HALF_UP);
        }
        if (attendanceRate != null) {
            attendanceRate = attendanceRate.setScale(2, java.math.RoundingMode.HALF_UP);
        }
    }
}