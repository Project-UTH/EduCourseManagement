package vn.edu.uth.ecms.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import vn.edu.uth.ecms.dto.response.SubmissionFileResponse;
import java.util.List;


@Data
public class SubmissionDto {
    private Long submissionId;
    private String submissionText;
    
   
    private String submissionFileUrl;
    private String submissionFileName;
    
  
    private List<SubmissionFileResponse> submissionFiles;
    
    private LocalDateTime submissionDate;
    private BigDecimal score;
    private String teacherFeedback;
    private String status;
    private boolean isLate;
}