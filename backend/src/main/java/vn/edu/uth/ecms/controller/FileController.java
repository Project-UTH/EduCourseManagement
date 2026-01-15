package vn.edu.uth.ecms.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import vn.edu.uth.ecms.service.FileStorageService;

import java.nio.file.Path;

/**
 * FileController
 * 
 * Controller for file download operations
 * 
 * @author Phase 5 - Student Features
 * @since 2026-01-11
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {
    
    private final FileStorageService fileStorageService;
    
    /**
     * Download submission file
     * GET /api/files/submissions/{homeworkId}/{studentCode}/{filename}
     */
    @GetMapping("/submissions/{homeworkId}/{studentCode}/{filename:.+}")
    public ResponseEntity<Resource> downloadSubmissionFile(
            @PathVariable Long homeworkId,
            @PathVariable String studentCode,
            @PathVariable String filename
    ) {
        log.info("📥 Downloading file: {} for homework: {} by student: {}", filename, homeworkId, studentCode);
        
        try {
            // Build directory path
            String directory = "submissions/homework-" + homeworkId + "/" + studentCode;
            
            // Load file
            Path filePath = fileStorageService.loadFile(filename, directory);
            
            if (filePath == null) {
                log.warn("⚠️ File not found: {}", filename);
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new UrlResource(filePath.toUri());
            
            if (!resource.exists() || !resource.isReadable()) {
                log.warn("⚠️ File not readable: {}", filename);
                return ResponseEntity.notFound().build();
            }
            
            // Determine content type
            String contentType = "application/octet-stream";
            
            log.info("✅ File downloaded: {}", filename);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("❌ Error downloading file: {}", filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Download homework attachment
     * GET /api/files/attachments/{homeworkId}/{filename}
     */
    @GetMapping("/attachments/{homeworkId}/{filename:.+}")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long homeworkId,
            @PathVariable String filename
    ) {
        log.info("📥 Downloading attachment: {} for homework: {}", filename, homeworkId);
        
        try {
            String directory = "attachments/homework-" + homeworkId;
            
            Path filePath = fileStorageService.loadFile(filename, directory);
            
            if (filePath == null) {
                return ResponseEntity.notFound().build();
            }
            
            Resource resource = new UrlResource(filePath.toUri());
            
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            
            String contentType = "application/octet-stream";
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("❌ Error downloading attachment: {}", filename, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}