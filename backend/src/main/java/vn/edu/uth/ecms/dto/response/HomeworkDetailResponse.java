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
import java.util.List;
import java.util.stream.Collectors;

/**
 * HomeworkDetailResponse DTO
 * 
 * Detailed homework response with submissions list
 * Used for teacher's homework detail view
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HomeworkDetailResponse {
    
    /**
     * Homework ID
     */
    private Long homeworkId;
    
    /**
     * Class information
     */
    private ClassInfo classInfo;
    
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
     * Homework type display name
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
     * Attachment URL
     */
    private String attachmentUrl;
    
    /**
     * Created timestamp
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    /**
     * Updated timestamp
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    /**
     * Status flags
     */
    private Boolean isOverdue;
    private Boolean canSubmit;
    private String timeRemaining;
    
    /**
     * Statistics
     */
    private HomeworkStats statistics;
    
    /**
     * List of submissions
     */
    private List<SubmissionResponse> submissions;
    
    // ========================================
    // NESTED CLASSES
    // ========================================
    
    /**
     * Class information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassInfo {
        private Long classId;
        private String classCode;
        private String subjectName;
        private String subjectCode;
        private Integer totalStudents;
    }
    
    /**
     * Homework statistics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HomeworkStats {
        private Integer totalSubmissions;
        private Integer gradedCount;
        private Integer ungradedCount;
        private Integer lateCount;
        private BigDecimal averageScore;
        private BigDecimal highestScore;
        private BigDecimal lowestScore;
        private Double submissionRate; // Percentage
        private Double completionRate; // Percentage of graded
    }
    
    // ========================================
    // MAPPING METHODS
    // ========================================
    
    /**
     * Convert Homework entity to detailed response
     * 
     * @param homework Homework entity with submissions
     * @return HomeworkDetailResponse
     */
    public static HomeworkDetailResponse fromEntity(Homework homework) {
        if (homework == null) return null;
        
        return HomeworkDetailResponse.builder()
            .homeworkId(homework.getHomeworkId())
            .classInfo(buildClassInfo(homework))
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
            .statistics(buildStatistics(homework))
            .submissions(homework.getSubmissions() != null ?
                        homework.getSubmissions().stream()
                            .map(SubmissionResponse::fromEntity)
                            .collect(Collectors.toList()) : null)
            .build();
    }
    
    /**
     * Build class information
     */
    private static ClassInfo buildClassInfo(Homework homework) {
        if (homework.getClassEntity() == null) return null;
        
        return ClassInfo.builder()
            .classId(homework.getClassEntity().getClassId())
            .classCode(homework.getClassEntity().getClassCode())
            .subjectName(homework.getClassEntity().getSubject() != null ?
                        homework.getClassEntity().getSubject().getSubjectName() : null)
            .subjectCode(homework.getClassEntity().getSubject() != null ?
                        homework.getClassEntity().getSubject().getSubjectCode() : null)
            .totalStudents(null) // Will be set by service from course_registration
            .build();
    }
    
    /**
     * Build statistics
     */
    private static HomeworkStats buildStatistics(Homework homework) {
        int totalSubmissions = homework.getSubmissionCount();
        int gradedCount = homework.getGradedCount();
        int ungradedCount = homework.getUngradedCount();
        
        // Calculate rates
        // Note: totalStudents should be passed from service layer
        // For now, use submission count as baseline
        int totalStudents = totalSubmissions > 0 ? totalSubmissions : 0;
        double submissionRate = 100.0; // Will be calculated by service
        double completionRate = totalSubmissions > 0 ?
                               (gradedCount * 100.0 / totalSubmissions) : 0.0;
        
        // Count late submissions
        long lateCount = homework.getSubmissions() != null ?
                        homework.getSubmissions().stream()
                            .filter(s -> s.getStatus() == vn.edu.uth.ecms.entity.SubmissionStatus.LATE)
                            .count() : 0;
        
        return HomeworkStats.builder()
            .totalSubmissions(totalSubmissions)
            .gradedCount(gradedCount)
            .ungradedCount(ungradedCount)
            .lateCount((int) lateCount)
            .averageScore(homework.getAverageScore())
            .highestScore(calculateHighestScore(homework))
            .lowestScore(calculateLowestScore(homework))
            .submissionRate(submissionRate)
            .completionRate(completionRate)
            .build();
    }
    
    /**
     * Calculate highest score from submissions
     */
    private static BigDecimal calculateHighestScore(Homework homework) {
        if (homework.getSubmissions() == null || homework.getSubmissions().isEmpty()) {
            return null;
        }
        
        return homework.getSubmissions().stream()
            .filter(s -> s.getScore() != null)
            .map(s -> s.getScore())
            .max(BigDecimal::compareTo)
            .orElse(null);
    }
    
    /**
     * Calculate lowest score from submissions
     */
    private static BigDecimal calculateLowestScore(Homework homework) {
        if (homework.getSubmissions() == null || homework.getSubmissions().isEmpty()) {
            return null;
        }
        
        return homework.getSubmissions().stream()
            .filter(s -> s.getScore() != null)
            .map(s -> s.getScore())
            .min(BigDecimal::compareTo)
            .orElse(null);
    }
}