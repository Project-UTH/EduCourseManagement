package vn.edu.uth.ecms.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;

/**
 * FileStorageService
 * 
 * Service for storing and retrieving uploaded files
 * 
 * @author Phase 5 - Student Features
 * @since 2026-01-11
 */
public interface FileStorageService {
    
    /**
     * Store uploaded file
     * 
     * @param file MultipartFile to store
     * @param directory Target directory (e.g., "submissions/homework-1")
     * @return Stored filename
     * @throws IOException if storage fails
     */
    String storeFile(MultipartFile file, String directory) throws IOException;
    
    /**
     * Load file as resource
     * 
     * @param filename Filename to load
     * @param directory Directory where file is stored
     * @return Path to file
     */
    Path loadFile(String filename, String directory);
    
    /**
     * Delete file
     * 
     * @param filename Filename to delete
     * @param directory Directory where file is stored
     * @return true if deleted successfully
     */
    boolean deleteFile(String filename, String directory);
    
    /**
     * Initialize storage directories
     */
    void init();
}