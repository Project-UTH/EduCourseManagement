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
 * @author 
 * @since 
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
    
   
    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 200, message = "Title must be between 5 and 200 characters")
    private String title;
    
    
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;
    
   
    @NotNull(message = "Homework type is required")
    private HomeworkType homeworkType;
    
   
    @NotNull(message = "Max score is required")
    @DecimalMin(value = "0.0", message = "Max score must be at least 0")
    @DecimalMax(value = "10.0", message = "Max score must not exceed 10")
    @Builder.Default
    private BigDecimal maxScore = new BigDecimal("10.00");
    
   
    @NotNull(message = "Deadline is required")
    @Future(message = "Deadline must be in the future", groups = CreateValidation.class)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime deadline;
    
    
    @Size(max = 500, message = "Attachment URL must not exceed 500 characters")
    private String attachmentUrl;
    
    
    public interface CreateValidation {}
    
   
    public interface UpdateValidation {}
    
   
    /**
     * @return true if valid
     */
    public boolean isTypeValid() {
        return homeworkType != null && 
               (homeworkType == HomeworkType.REGULAR || 
                homeworkType == HomeworkType.MIDTERM || 
                homeworkType == HomeworkType.FINAL);
    }
    
    /**
     * @return true if midterm or final
     */
    public boolean isMajorAssessment() {
        return homeworkType == HomeworkType.MIDTERM || 
               homeworkType == HomeworkType.FINAL;
    }
    
    /**
     * @return Weight percentage
     */
    public double getWeight() {
        return homeworkType != null ? homeworkType.getWeight() : 0.0;
    }
    
    /**
     * @return true if deadline is reasonable
     */
    public boolean isDeadlineReasonable() {
        if (deadline == null) return false;
        LocalDateTime minDeadline = LocalDateTime.now().plusHours(1);
        return deadline.isAfter(minDeadline);
    }
    
 
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