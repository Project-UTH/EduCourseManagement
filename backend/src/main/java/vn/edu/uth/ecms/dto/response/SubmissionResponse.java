package vn.edu.uth.ecms.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.HomeworkSubmission;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * SubmissionResponse DTO
 * 
 * Response body for homework submission data
 * 
 * @author 
 * @since 
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
     * @deprecated Use submissionFiles instead
     * Submission file URL (legacy single-file)
     */
    @Deprecated
    private String submissionFileUrl;
    
    /**
     * @deprecated Use submissionFiles instead
     * Original filename (legacy single-file)
     */
    @Deprecated
    private String submissionFileName;
    
   
    private List<SubmissionFileResponse> submissionFiles;
    
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
     * Submission status (enum value: SUBMITTED, GRADED, LATE)
     */
    private String status;
    
  
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
            //  FIX: Map multiple files
            .submissionFiles(submission.getSubmissionFiles() != null ?
                           submission.getSubmissionFiles().stream()
                               .map(SubmissionFileResponse::fromEntity)
                               .collect(java.util.stream.Collectors.toList()) : null)
            // Legacy fields (deprecated but keep for backward compatibility)
            .submissionFileUrl(submission.getSubmissionFileUrl())
            .submissionFileName(submission.getSubmissionFileName())
            .submissionText(submission.getSubmissionText())
            .submissionDate(submission.getSubmissionDate())
            .score(submission.getScore())
            .teacherFeedback(submission.getTeacherFeedback())
            .gradedDate(submission.getGradedDate())
            .status(submission.getStatus() != null ?
                   submission.getStatus().name() : null)
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