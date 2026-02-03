package vn.edu.uth.ecms.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.Homework;
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
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HomeworkResponse {
    
    /**
     * Homework ID
     */
    private Long homeworkId;
    
    /**
     * Class ID
     */
    private Long classId;
    
    /**
     * Class code (for display)
     */
    private String classCode;
    
    /**
     * Subject name (for display)
     */
    private String subjectName;
    
    /**
     * Homework title
     */
    private String title;
    
    /**
     * Homework description
     */
    private String description;
    
    /**
     * Homework type
     */
    private HomeworkType homeworkType;
    
    /**
     * Homework type display name (Vietnamese)
     */
    private String homeworkTypeDisplay;
    
    /**
     * Maximum score
     */
    private BigDecimal maxScore;
    
    /**
     * Submission deadline
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime deadline;
    
    /**
     * URL to homework attachment
     */
    private String attachmentUrl;
    
    /**
     * When homework was created
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    /**
     * When homework was last updated
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    /**
     * Is homework overdue?
     */
    private Boolean isOverdue;
    
    /**
     * Can students still submit?
     */
    private Boolean canSubmit;
    
    /**
     * Time remaining until deadline (human-readable)
     */
    private String timeRemaining;
    
    /**
     * Total number of submissions (optional)
     */
    private Integer submissionCount;
    
    /**
     * Number of graded submissions (optional)
     */
    private Integer gradedCount;
    
    /**
     * Number of submissions needing grading (optional)
     */
    private Integer ungradedCount;
    
    /**
     * Average score of graded submissions (optional)
     */
    private BigDecimal averageScore;
    
   
    
    /**
     * @param homework Homework entity
     * @return HomeworkResponse DTO
     */
    public static HomeworkResponse fromEntity(Homework homework) {
        if (homework == null) return null;
        
        return HomeworkResponse.builder()
            .homeworkId(homework.getHomeworkId())
            .classId(homework.getClassEntity() != null ? 
                    homework.getClassEntity().getClassId() : null)
            .classCode(homework.getClassEntity() != null ? 
                      homework.getClassEntity().getClassCode() : null)
            .subjectName(homework.getClassEntity() != null && 
                        homework.getClassEntity().getSubject() != null ?
                        homework.getClassEntity().getSubject().getSubjectName() : null)
            .title(homework.getTitle())
            .description(homework.getDescription())
            .homeworkType(homework.getHomeworkType())
            .homeworkTypeDisplay(homework.getHomeworkType() != null ?
                                homework.getHomeworkType().getDisplayName() : null)
            .maxScore(homework.getMaxScore())
            .deadline(homework.getDeadline())
            .attachmentUrl(homework.getAttachmentUrl())
            .createdAt(homework.getCreatedAt())
            .updatedAt(homework.getUpdatedAt())
            .isOverdue(homework.isOverdue())
            .canSubmit(homework.canSubmit())
            .timeRemaining(homework.getTimeRemaining())
            .build();
    }
    
    /**
    
     * @param homework Homework entity
     * @return HomeworkResponse DTO with stats
     */
    public static HomeworkResponse fromEntityWithStats(Homework homework) {
        if (homework == null) return null;
        
        HomeworkResponse response = fromEntity(homework);
        
        
        response.setSubmissionCount(homework.getSubmissionCount());
        response.setGradedCount(homework.getGradedCount());
        response.setUngradedCount(homework.getUngradedCount());
        response.setAverageScore(homework.getAverageScore());
        
        return response;
    }
    
    /**
     * @return Completion percentage (0-100)
     */
    public Double getCompletionPercentage() {
        if (submissionCount == null || submissionCount == 0) {
            return 0.0;
        }
        if (gradedCount == null) {
            return 0.0;
        }
        return (gradedCount.doubleValue() / submissionCount.doubleValue()) * 100.0;
    }
    
    /**
     * @return Formatted deadline string
     */
    public String getFormattedDeadline() {
        if (deadline == null) return null;
        return deadline.format(java.time.format.DateTimeFormatter
            .ofPattern("dd/MM/yyyy HH:mm"));
    }
    
    /**
     * @return true if attachment URL is present
     */
    public boolean hasAttachment() {
        return attachmentUrl != null && !attachmentUrl.trim().isEmpty();
    }
}