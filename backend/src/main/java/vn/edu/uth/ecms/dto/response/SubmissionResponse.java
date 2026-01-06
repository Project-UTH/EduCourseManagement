package vn.edu.uth.ecms.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.HomeworkSubmission;
import vn.edu.uth.ecms.entity.SubmissionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * SubmissionResponse DTO
 * 
 * Response body for homework submission data
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubmissionResponse {
    
    /**
     * Submission ID
     */
    private Long submissionId;
    
    /**
     * Homework ID
     */
    private Long homeworkId;
    
    /**
     * Homework title (for display)
     */
    private String homeworkTitle;
    
    /**
     * Student information
     */
    private StudentInfo studentInfo;
    
    /**
     * Submission file URL
     */
    private String submissionFileUrl;
    
    /**
     * Submission text content
     */
    private String submissionText;
    
    /**
     * When submitted
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime submissionDate;
    
    /**
     * Score assigned by teacher
     */
    private BigDecimal score;
    
    /**
     * Teacher's feedback
     */
    private String teacherFeedback;
    
    /**
     * When graded
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime gradedDate;
    
    /**
     * Submission status
     */
    private SubmissionStatus status;
    
    /**
     * Status display name
     */
    private String statusDisplay;
    
    /**
     * Is submission late?
     */
    private Boolean isLate;
    
    /**
     * Is submission graded?
     */
    private Boolean isGraded;
    
    /**
     * Submission timing (early/late by how much)
     */
    private String submissionTiming;
    
    /**
     * Score percentage
     */
    private BigDecimal scorePercentage;
    
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
    
    // ========================================
    // NESTED CLASSES
    // ========================================
    
    /**
     * Student information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentInfo {
        private Long studentId;
        private String studentCode;
        private String fullName;
        private String email;
    }
    
    // ========================================
    // MAPPING METHODS
    // ========================================
    
    /**
     * Convert HomeworkSubmission entity to DTO
     * 
     * @param submission HomeworkSubmission entity
     * @return SubmissionResponse DTO
     */
    public static SubmissionResponse fromEntity(HomeworkSubmission submission) {
        if (submission == null) return null;
        
        return SubmissionResponse.builder()
            .submissionId(submission.getSubmissionId())
            .homeworkId(submission.getHomework() != null ?
                       submission.getHomework().getHomeworkId() : null)
            .homeworkTitle(submission.getHomework() != null ?
                          submission.getHomework().getTitle() : null)
            .studentInfo(buildStudentInfo(submission))
            .submissionFileUrl(submission.getSubmissionFileUrl())
            .submissionText(submission.getSubmissionText())
            .submissionDate(submission.getSubmissionDate())
            .score(submission.getScore())
            .teacherFeedback(submission.getTeacherFeedback())
            .gradedDate(submission.getGradedDate())
            .status(submission.getStatus())
            .statusDisplay(submission.getStatus() != null ?
                          submission.getStatus().getDisplayName() : null)
            .isLate(submission.isLate())
            .isGraded(submission.isGraded())
            .submissionTiming(submission.getSubmissionTiming())
            .scorePercentage(submission.getScorePercentage())
            .createdAt(submission.getCreatedAt())
            .updatedAt(submission.getUpdatedAt())
            .build();
    }
    
    /**
     * Build student information
     */
    private static StudentInfo buildStudentInfo(HomeworkSubmission submission) {
        if (submission.getStudent() == null) return null;
        
        return StudentInfo.builder()
            .studentId(submission.getStudent().getStudentId())
            .studentCode(submission.getStudent().getStudentCode())
            .fullName(submission.getStudent().getFullName())
            .email(submission.getStudent().getEmail())
            .build();
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
}