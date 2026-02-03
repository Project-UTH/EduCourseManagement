package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SubmissionRequest DTO
 * 
 * Request body for student submitting homework
 * 
 * @author 
 * @since 
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionRequest {
    
    /**
     * Homework ID (required)
     */
    @NotNull(message = "Homework ID is required")
    @Positive(message = "Homework ID must be positive")
    private Long homeworkId;
    
    
    private Long studentId;
    
   
    @Size(max = 500, message = "Submission file URL must not exceed 500 characters")
    private String submissionFileUrl;
    
  
    @Size(max = 10000, message = "Submission text must not exceed 10000 characters")
    private String submissionText;
    
   
    
    /**
     * @return 
     */
    public boolean hasContent() {
        boolean hasFile = submissionFileUrl != null && !submissionFileUrl.trim().isEmpty();
        boolean hasText = submissionText != null && !submissionText.trim().isEmpty();
        return hasFile || hasText;
    }
    
    
    public boolean hasFile() {
        return submissionFileUrl != null && !submissionFileUrl.trim().isEmpty();
    }
    
  
    public boolean hasText() {
        return submissionText != null && !submissionText.trim().isEmpty();
    }
    
   
    public void sanitize() {
        if (submissionFileUrl != null) {
            submissionFileUrl = submissionFileUrl.trim();
        }
        if (submissionText != null) {
            submissionText = submissionText.trim();
        }
    }
    
    /**
     * @throws IllegalArgumentException if no content
     */
    public void validateContent() {
        if (!hasContent()) {
            throw new IllegalArgumentException(
                "Submission must have either file or text content"
            );
        }
    }
}