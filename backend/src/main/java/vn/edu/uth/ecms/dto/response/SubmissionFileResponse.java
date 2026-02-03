package vn.edu.uth.ecms.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.SubmissionFile;

import java.time.LocalDateTime;

/**
 * SubmissionFileResponse DTO
 * 
 * Response body for submission file data
 * 
 * @author
 * @since 
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubmissionFileResponse {
    
    /**
     * File ID
     */
    private Long fileId;
    
    /**
     * Submission ID this file belongs to
     */
    private Long submissionId;
    
 
    private String originalFilename;
    
  
    private String storedFilename;
    
   
    private String fileUrl;
    
   
    private Long fileSize;
    
    
    private String formattedFileSize;
    
   
    private String mimeType;
    
    
    private String fileExtension;
    
    /**
     * Upload timestamp
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime uploadedAt;
    
    /**
     * Is this an image file?
     */
    private Boolean isImage;
    
    /**
     * Is this a document file?
     */
    private Boolean isDocument;
    
 
    
    /**
     * @param file SubmissionFile entity
     * @return SubmissionFileResponse DTO
     */
    public static SubmissionFileResponse fromEntity(SubmissionFile file) {
        if (file == null) return null;
        
        return SubmissionFileResponse.builder()
            .fileId(file.getFileId())
            .submissionId(file.getSubmission() != null ? 
                         file.getSubmission().getSubmissionId() : null)
            .originalFilename(file.getOriginalFilename())
            .storedFilename(file.getStoredFilename())
            .fileUrl(file.getFileUrl())
            .fileSize(file.getFileSize())
            .formattedFileSize(file.getFormattedFileSize())
            .mimeType(file.getMimeType())
            .fileExtension(file.getFileExtension())
            .uploadedAt(file.getUploadedAt())
            .isImage(file.isImage())
            .isDocument(file.isDocument())
            .build();
    }
}