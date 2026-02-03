package vn.edu.uth.ecms.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.Homework;
import vn.edu.uth.ecms.entity.HomeworkSubmission;
import vn.edu.uth.ecms.entity.HomeworkType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * HomeworkWithSubmissionResponse
 * @author 
 * @since 
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HomeworkWithSubmissionResponse {
    
    
    private Long homeworkId;
    private String title;
    private String description;
    private HomeworkType homeworkType;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime deadline;
    
    private BigDecimal maxScore;
    private String attachmentUrl;
    
    
    /**
     * Has student submitted this homework?
     */
    private Boolean hasSubmitted;
    
    /**
     * Is homework overdue?
     */
    private Boolean isOverdue;
    
    /**
     * When student submitted (if submitted)
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime submittedAt;
    
    /**
     * Student's grade (if graded)
     */
    private BigDecimal grade;
    
    // ========================================
    // MAPPING METHODS
    // ========================================
    
    /**
     * Create response from homework and optional submission
     * 
     * @param homework The homework entity
     * @param submission Optional submission by student
     * @return Response DTO
     */
    public static HomeworkWithSubmissionResponse fromEntity(
            Homework homework, 
            Optional<HomeworkSubmission> submission) {
        
        if (homework == null) return null;
        
        LocalDateTime now = LocalDateTime.now();
        boolean isOverdue = now.isAfter(homework.getDeadline());
        
        HomeworkWithSubmissionResponseBuilder builder = HomeworkWithSubmissionResponse.builder()
                .homeworkId(homework.getHomeworkId())
                .title(homework.getTitle())
                .description(homework.getDescription())
                .homeworkType(homework.getHomeworkType())
                .deadline(homework.getDeadline())
                .maxScore(homework.getMaxScore())
                .attachmentUrl(homework.getAttachmentUrl())
                .hasSubmitted(submission.isPresent())
                .isOverdue(isOverdue);
        
        // Add submission details if present
        if (submission.isPresent()) {
            HomeworkSubmission sub = submission.get();
            builder.submittedAt(sub.getSubmissionDate())
                   .grade(sub.getScore());
        }
        
        return builder.build();
    }
}