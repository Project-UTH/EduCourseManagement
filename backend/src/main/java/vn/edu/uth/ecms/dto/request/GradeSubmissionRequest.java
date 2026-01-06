package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * GradeSubmissionRequest DTO
 * 
 * Request body for teacher grading a homework submission
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeSubmissionRequest {
    
    /**
     * Submission ID (from path variable)
     */
    private Long submissionId;
    
    /**
     * Score assigned by teacher
     * Must be between 0 and homework's maxScore
     */
    @NotNull(message = "Score is required")
    @DecimalMin(value = "0.0", message = "Score must be at least 0")
    @DecimalMax(value = "10.0", message = "Score must not exceed 10")
    private BigDecimal score;
    
    /**
     * Teacher's feedback/comments
     * Optional but recommended
     */
    @Size(max = 5000, message = "Teacher feedback must not exceed 5000 characters")
    private String teacherFeedback;
    
    // ========================================
    // VALIDATION METHODS
    // ========================================
    
    /**
     * Validate score is within homework's max score
     * 
     * @param maxScore Homework's maximum score
     * @return true if valid
     */
    public boolean isScoreValid(BigDecimal maxScore) {
        if (score == null || maxScore == null) return false;
        return score.compareTo(BigDecimal.ZERO) >= 0 &&
               score.compareTo(maxScore) <= 0;
    }
    
    /**
     * Check if feedback is provided
     */
    public boolean hasFeedback() {
        return teacherFeedback != null && !teacherFeedback.trim().isEmpty();
    }
    
    /**
     * Sanitize input data
     */
    public void sanitize() {
        if (teacherFeedback != null) {
            teacherFeedback = teacherFeedback.trim();
        }
        // Round score to 2 decimal places
        if (score != null) {
            score = score.setScale(2, java.math.RoundingMode.HALF_UP);
        }
    }
}