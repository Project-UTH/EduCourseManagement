package vn.edu.uth.ecms.service;

import org.springframework.web.multipart.MultipartFile;
import vn.edu.uth.ecms.dto.response.MaterialResponse;

import java.util.List;

/**
 * MaterialService
 * 
 * Service interface for managing class materials
 * 
 * @author ECMS Team
 * @since 2026-01-16
 */
public interface MaterialService {
    
    /**
     * Upload material for a class
     * 
     * @param classId Class ID
     * @param title Material title
     * @param description Material description (optional)
     * @param file File to upload
     * @param teacherId Teacher ID (uploader)
     * @return Material response
     */
    MaterialResponse uploadMaterial(
            Long classId, 
            String title, 
            String description,
            MultipartFile file, 
            Long teacherId);
    
    /**
     * Get all materials for a class
     * 
     * @param classId Class ID
     * @return List of materials
     */
    List<MaterialResponse> getMaterialsByClass(Long classId);
    
    /**
     * Get material by ID
     * 
     * @param materialId Material ID
     * @return Material response
     */
    MaterialResponse getMaterialById(Long materialId);
    
    /**
     * Delete material
     * 
     * @param materialId Material ID
     * @param teacherId Teacher ID (for permission check)
     */
    void deleteMaterial(Long materialId, Long teacherId);
}