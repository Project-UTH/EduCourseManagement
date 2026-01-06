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
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
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
    
    /**
     * Student ID (usually from auth context)
     * Optional in request, will be set by controller
     */
    private Long studentId;
    
    /**
     * URL to submitted file (optional)
     * Student uploads file separately, gets URL
     */
    @Size(max = 500, message = "Submission file URL must not exceed 500 characters")
    private String submissionFileUrl;
    
    /**
     * Text submission (optional)
     * Alternative to file upload
     */
    @Size(max = 10000, message = "Submission text must not exceed 10000 characters")
    private String submissionText;
    
    // ========================================
    // VALIDATION METHODS
    // ========================================
    
    /**
     * Validate that submission has content
     * Either file URL or text must be provided
     * 
     * @return true if has content
     */
    public boolean hasContent() {
        boolean hasFile = submissionFileUrl != null && !submissionFileUrl.trim().isEmpty();
        boolean hasText = submissionText != null && !submissionText.trim().isEmpty();
        return hasFile || hasText;
    }
    
    /**
     * Check if submission has file
     */
    public boolean hasFile() {
        return submissionFileUrl != null && !submissionFileUrl.trim().isEmpty();
    }
    
    /**
     * Check if submission has text
     */
    public boolean hasText() {
        return submissionText != null && !submissionText.trim().isEmpty();
    }
    
    /**
     * Sanitize input data
     * Trim strings, normalize whitespace
     */
    public void sanitize() {
        if (submissionFileUrl != null) {
            submissionFileUrl = submissionFileUrl.trim();
        }
        if (submissionText != null) {
            submissionText = submissionText.trim();
        }
    }
    
    /**
     * Validate submission content requirement
     * Must have either file or text
     * 
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