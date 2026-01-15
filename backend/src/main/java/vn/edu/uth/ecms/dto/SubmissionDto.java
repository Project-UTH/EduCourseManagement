package vn.edu.uth.ecms.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import vn.edu.uth.ecms.dto.response.SubmissionFileResponse;
import java.util.List;

/**
 * SubmissionDto - Nested DTO for submission information
 * ✅ UPDATED: Added submissionFiles for multi-file support
 */
@Data
public class SubmissionDto {
    private Long submissionId;
    private String submissionText;
    
    // Legacy fields (deprecated)
    private String submissionFileUrl;
    private String submissionFileName;
    
    // ✅ NEW: Multiple files support
    private List<SubmissionFileResponse> submissionFiles;
    
    private LocalDateTime submissionDate;
    private BigDecimal score;
    private String teacherFeedback;
    private String status;
    private boolean isLate;
}