package vn.edu.uth.ecms.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.uth.ecms.service.FileStorageService;

import jakarta.annotation.PostConstruct;  
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * FileStorageServiceImpl
 */
@Service
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {
    
    @Value("${file.upload-dir:uploads}")
    private String uploadDir;
    
    private Path fileStorageLocation;
    
    @PostConstruct
    @Override
    public void init() {
        try {
            this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(this.fileStorageLocation);
            log.info(" File storage initialized at: {}", this.fileStorageLocation);
        } catch (Exception e) {
            log.error(" Failed to create upload directory", e);
            throw new RuntimeException("Could not create upload directory!", e);
        }
    }
    
    @Override
    public String storeFile(MultipartFile file, String directory) throws IOException {
        // Get original filename
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        
        try {
            // Check if filename contains invalid characters
            if (originalFilename.contains("..")) {
                throw new IOException("Invalid filename: " + originalFilename);
            }
            
            // Generate unique filename to avoid conflicts
            String fileExtension = "";
            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex > 0) {
                fileExtension = originalFilename.substring(dotIndex);
            }
            
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
            
            // Create directory if not exists
            Path targetLocation = this.fileStorageLocation.resolve(directory);
            Files.createDirectories(targetLocation);
            
            // Copy file to target location
            Path targetFile = targetLocation.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
            
            log.info(" File stored: {} -> {}", originalFilename, uniqueFilename);
            
            return uniqueFilename;
            
        } catch (IOException e) {
            log.error(" Failed to store file: {}", originalFilename, e);
            throw new IOException("Could not store file " + originalFilename, e);
        }
    }
    
    @Override
    public Path loadFile(String filename, String directory) {
        try {
            Path filePath = this.fileStorageLocation.resolve(directory).resolve(filename).normalize();
            
            if (Files.exists(filePath)) {
                return filePath;
            } else {
                log.warn(" File not found: {}", filePath);
                return null;
            }
        } catch (Exception e) {
            log.error(" Error loading file: {}", filename, e);
            return null;
        }
    }
    
    @Override
    public boolean deleteFile(String filename, String directory) {
        try {
            Path filePath = this.fileStorageLocation.resolve(directory).resolve(filename).normalize();
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info(" File deleted: {}", filename);
                return true;
            } else {
                log.warn(" File not found for deletion: {}", filename);
                return false;
            }
        } catch (Exception e) {
            log.error(" Error deleting file: {}", filename, e);
            return false;
        }
    }
}