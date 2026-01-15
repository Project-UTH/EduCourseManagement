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
 * HomeworkDetailResponse DTO - UPDATED VERSION
 * 
 * Detailed homework response with submissions list
 * Used for both teacher and student views
 * 
 * @author Phase 4 - Teacher Features + Phase 5 Student Features
 * @since 2026-01-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HomeworkDetailResponse {
    
    // ==================== BASIC INFO ====================
    
    private Long homeworkId;
    private String title;
    private String description;
    private HomeworkType homeworkType;
    private String homeworkTypeDisplay;
    private BigDecimal maxScore;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime deadline;
    
    private String attachmentUrl;
    private String attachmentName;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // ==================== NEW FIELDS FOR STUDENT VIEW ====================
    
    /**
     * Class ID (for student view)
     */
    private Long classId;
    
    /**
     * Class name display (for student view)
     */
    private String className;
    
    /**
     * Subject name (for student view)
     */
    private String subjectName;
    
    /**
     * Teacher information (for student view)
     */
    private vn.edu.uth.ecms.dto.TeacherDto teacher;
    
    /**
     * Student's submission (for student view)
     */
    private vn.edu.uth.ecms.dto.SubmissionDto submission;
    
    /**
     * Is homework overdue
     */
    private boolean isOverdue;
    
    /**
     * Can student submit
     */
    private boolean canSubmit;
    
    // ==================== EXISTING FIELDS FOR TEACHER VIEW ====================
    
    private ClassInfo classInfo;
    private Boolean IsOverdue;  // Keep for backward compatibility
    private Boolean CanSubmit;  // Keep for backward compatibility
    private String timeRemaining;
    private HomeworkStats statistics;
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
        private Double submissionRate;
        private Double completionRate;
    }
    
    // ========================================
    // MAPPING METHODS
    // ========================================
    
    /**
     * Convert Homework entity to detailed response (for teacher)
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
            .IsOverdue(homework.isOverdue())
            .CanSubmit(homework.canSubmit())
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
            .totalStudents(null)
            .build();
    }
    
    /**
     * Build statistics
     */
    private static HomeworkStats buildStatistics(Homework homework) {
        int totalSubmissions = homework.getSubmissionCount();
        int gradedCount = homework.getGradedCount();
        int ungradedCount = homework.getUngradedCount();
        
        int totalStudents = totalSubmissions > 0 ? totalSubmissions : 0;
        double submissionRate = 100.0;
        double completionRate = totalSubmissions > 0 ?
                               (gradedCount * 100.0 / totalSubmissions) : 0.0;
        
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