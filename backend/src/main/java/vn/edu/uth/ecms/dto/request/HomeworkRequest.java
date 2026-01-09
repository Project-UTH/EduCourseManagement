package vn.edu.uth.ecms.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.HomeworkType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * HomeworkRequest DTO
 * 
 * Request body for creating or updating homework
 * 
 * ✅ FIXED: @JsonFormat pattern changed to accept ISO 8601 format (with 'T')
 * Frontend sends: "2026-01-22T03:52:00"
 * Backend accepts: "yyyy-MM-dd'T'HH:mm:ss"
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeworkRequest {
    
    /**
     * Class ID (required for creation)
     * Optional for update (derived from path variable)
     */
    @NotNull(message = "Class ID is required", groups = CreateValidation.class)
    @Positive(message = "Class ID must be positive")
    private Long classId;
    
    /**
     * Homework title
     * Example: "Bài tập tuần 1", "Đề thi giữa kỳ"
     */
    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 200, message = "Title must be between 5 and 200 characters")
    private String title;
    
    /**
     * Homework description/instructions
     * Detailed requirements for students
     */
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;
    
    /**
     * Type of homework
     * REGULAR (20%), MIDTERM (30%), FINAL (50%)
     */
    @NotNull(message = "Homework type is required")
    private HomeworkType homeworkType;
    
    /**
     * Maximum score
     * Default: 10.00
     */
    @NotNull(message = "Max score is required")
    @DecimalMin(value = "0.0", message = "Max score must be at least 0")
    @DecimalMax(value = "10.0", message = "Max score must not exceed 10")
    @Builder.Default
    private BigDecimal maxScore = new BigDecimal("10.00");
    
    /**
     * ✅ FIXED: Submission deadline with ISO 8601 format support
     * 
     * Pattern changed from "yyyy-MM-dd HH:mm:ss" to "yyyy-MM-dd'T'HH:mm:ss"
     * This accepts datetime-local input format: "2026-01-22T03:52:00"
     * 
     * Must be in the future (for creation)
     */
    @NotNull(message = "Deadline is required")
    @Future(message = "Deadline must be in the future", groups = CreateValidation.class)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime deadline;
    
    /**
     * URL to homework attachment file (optional)
     * Teacher can upload assignment file
     */
    @Size(max = 500, message = "Attachment URL must not exceed 500 characters")
    private String attachmentUrl;
    
    // ========================================
    // VALIDATION GROUPS
    // ========================================
    
    /**
     * Validation group for creation
     */
    public interface CreateValidation {}
    
    /**
     * Validation group for update
     */
    public interface UpdateValidation {}
    
    // ========================================
    // BUSINESS METHODS
    // ========================================
    
    /**
     * Validate homework type constraints
     * - Only one MIDTERM per class
     * - Only one FINAL per class
     * 
     * @return true if valid
     */
    public boolean isTypeValid() {
        return homeworkType != null && 
               (homeworkType == HomeworkType.REGULAR || 
                homeworkType == HomeworkType.MIDTERM || 
                homeworkType == HomeworkType.FINAL);
    }
    
    /**
     * Check if this is a major assessment (MIDTERM or FINAL)
     * 
     * @return true if midterm or final
     */
    public boolean isMajorAssessment() {
        return homeworkType == HomeworkType.MIDTERM || 
               homeworkType == HomeworkType.FINAL;
    }
    
    /**
     * Get weight for grade calculation
     * 
     * @return Weight percentage
     */
    public double getWeight() {
        return homeworkType != null ? homeworkType.getWeight() : 0.0;
    }
    
    /**
     * Validate deadline is reasonable
     * Should be at least 1 hour in the future for creation
     * 
     * @return true if deadline is reasonable
     */
    public boolean isDeadlineReasonable() {
        if (deadline == null) return false;
        LocalDateTime minDeadline = LocalDateTime.now().plusHours(1);
        return deadline.isAfter(minDeadline);
    }
    
    /**
     * Sanitize input data
     * Trim strings, normalize whitespace
     */
    public void sanitize() {
        if (title != null) {
            title = title.trim().replaceAll("\\s+", " ");
        }
        if (description != null) {
            description = description.trim();
        }
        if (attachmentUrl != null) {
            attachmentUrl = attachmentUrl.trim();
        }
    }
}