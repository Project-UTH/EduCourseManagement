package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * SubmissionFile Entity
 * @author
 * @since 
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
   
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private HomeworkSubmission submission;
    
   
    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;
    

    @Column(name = "stored_filename", nullable = false, length = 255)
    private String storedFilename;
    
    
    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;
    
    
    @Column(name = "file_size")
    private Long fileSize;
    
   
    @Column(name = "mime_type", length = 100)
    private String mimeType;
    
   
    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;
    
  
    public String getFileExtension() {
        if (originalFilename == null) return "";
        int lastDot = originalFilename.lastIndexOf('.');
        return lastDot > 0 ? originalFilename.substring(lastDot + 1).toLowerCase() : "";
    }
    
 
    public boolean isImage() {
        String ext = getFileExtension();
        return ext.equals("jpg") || ext.equals("jpeg") || ext.equals("png") || ext.equals("gif");
    }
    
  
    public boolean isDocument() {
        String ext = getFileExtension();
        return ext.equals("pdf") || ext.equals("doc") || ext.equals("docx") || 
               ext.equals("xls") || ext.equals("xlsx") || ext.equals("ppt") || ext.equals("pptx");
    }
    
   
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