package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * MaterialResponse
 * 
 * Response DTO for class material
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialResponse {
    
    private Long materialId;
    private Long classId;
    private String classCode;
    private String title;
    private String description;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
    private String fileSizeDisplay; // "2.5 MB"
    
    // Uploader info
    private Long uploadedById;
    private String uploadedByName;
    
    // Timestamps
    private LocalDateTime uploadedAt;
    private LocalDateTime updatedAt;
}