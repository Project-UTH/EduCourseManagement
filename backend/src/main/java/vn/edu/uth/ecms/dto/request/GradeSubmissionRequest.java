package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * @author 
 * @since 
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeSubmissionRequest {
    
   
    private Long submissionId;
    
   
    @NotNull(message = "Score is required")
    @DecimalMin(value = "0.0", message = "Score must be at least 0")
    @DecimalMax(value = "10.0", message = "Score must not exceed 10")
    private BigDecimal score;
    
   
    @Size(max = 5000, message = "Teacher feedback must not exceed 5000 characters")
    private String teacherFeedback;
    
   
    
    /**

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