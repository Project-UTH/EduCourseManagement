package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * SubmissionFile Entity
 * 
 * Stores multiple file attachments for a homework submission
 * Relationship: Many-to-One with HomeworkSubmission
 * 
 * @author Phase 5 - Student Features
 * @since 2026-01-13
 */
@Entity
@Table(name = "submission_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionFile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "file_id")
    private Long fileId;
    
    /**
     * Relationship: Many submissions files belong to one homework submission
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private HomeworkSubmission submission;
    
    /**
     * Original filename (user uploaded)
     * Example: "Tieu_Luan_ECMS_UTH_Full22.docx"
     */
    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;
    
    /**
     * Stored filename (UUID + extension)
     * Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890.docx"
     */
    @Column(name = "stored_filename", nullable = false, length = 255)
    private String storedFilename;
    
    /**
     * File URL (download path)
     * Example: "/api/files/submissions/2/054205009974/a1b2c3d4...docx"
     */
    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;
    
    /**
     * File size in bytes
     */
    @Column(name = "file_size")
    private Long fileSize;
    
    /**
     * File MIME type
     * Example: "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
     */
    @Column(name = "mime_type", length = 100)
    private String mimeType;
    
    /**
     * Upload timestamp
     */
    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;
    
    // ========================================
    // HELPER METHODS
    // ========================================
    
    /**
     * Get file extension
     */
    public String getFileExtension() {
        if (originalFilename == null) return "";
        int lastDot = originalFilename.lastIndexOf('.');
        return lastDot > 0 ? originalFilename.substring(lastDot + 1).toLowerCase() : "";
    }
    
    /**
     * Check if file is image
     */
    public boolean isImage() {
        String ext = getFileExtension();
        return ext.equals("jpg") || ext.equals("jpeg") || ext.equals("png") || ext.equals("gif");
    }
    
    /**
     * Check if file is document
     */
    public boolean isDocument() {
        String ext = getFileExtension();
        return ext.equals("pdf") || ext.equals("doc") || ext.equals("docx") || 
               ext.equals("xls") || ext.equals("xlsx") || ext.equals("ppt") || ext.equals("pptx");
    }
    
    /**
     * Format file size for display
     */
    public String getFormattedFileSize() {
        if (fileSize == null) return "Unknown";
        
        if (fileSize < 1024) {
            return fileSize + " B";
        } else if (fileSize < 1024 * 1024) {
            return String.format("%.2f KB", fileSize / 1024.0);
        } else {
            return String.format("%.2f MB", fileSize / (1024.0 * 1024.0));
        }
    }
}