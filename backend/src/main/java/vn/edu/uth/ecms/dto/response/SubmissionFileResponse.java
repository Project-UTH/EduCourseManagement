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
 * @author Phase 5 - Student Features
 * @since 2026-01-13
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
    
    /**
     * Original filename (user uploaded)
     * Example: "Tieu_Luan_ECMS_UTH_Full22.docx"
     */
    private String originalFilename;
    
    /**
     * Stored filename (UUID)
     * Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890.docx"
     */
    private String storedFilename;
    
    /**
     * File download URL
     * Example: "/api/files/submissions/2/054205009974/a1b2c3d4...docx"
     */
    private String fileUrl;
    
    /**
     * File size in bytes
     */
    private Long fileSize;
    
    /**
     * Formatted file size (KB, MB)
     */
    private String formattedFileSize;
    
    /**
     * File MIME type
     */
    private String mimeType;
    
    /**
     * File extension
     */
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
    
    // ========================================
    // MAPPING METHODS
    // ========================================
    
    /**
     * Convert SubmissionFile entity to DTO
     * 
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