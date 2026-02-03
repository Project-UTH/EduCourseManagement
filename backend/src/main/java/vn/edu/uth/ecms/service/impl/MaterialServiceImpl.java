package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.uth.ecms.dto.response.MaterialResponse;
import vn.edu.uth.ecms.entity.ClassEntity;
import vn.edu.uth.ecms.entity.ClassMaterial;
import vn.edu.uth.ecms.entity.Teacher;
import vn.edu.uth.ecms.exception.BadRequestException;
import vn.edu.uth.ecms.exception.ForbiddenException;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.ClassMaterialRepository;
import vn.edu.uth.ecms.repository.ClassRepository;
import vn.edu.uth.ecms.repository.TeacherRepository;
import vn.edu.uth.ecms.service.MaterialService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.stream.Collectors;

/**
 * MaterialServiceImpl
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MaterialServiceImpl implements MaterialService {
    
    private final ClassMaterialRepository materialRepository;
    private final ClassRepository classRepository;
    private final TeacherRepository teacherRepository;
    
    private static final String UPLOAD_DIR = "uploads/materials/";
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    
    @Override
    @Transactional
    public MaterialResponse uploadMaterial(
            Long classId, 
            String title,
            String description,
            MultipartFile file, 
            Long teacherId) {
        
        log.info("📤 Teacher {} uploading material for class {}", teacherId, classId);
        
        // Validate class exists
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found"));
        
        // Validate teacher owns this class
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new NotFoundException("Teacher not found"));
        
        if (!classEntity.getTeacher().getTeacherId().equals(teacherId)) {
            throw new ForbiddenException("You don't have permission to upload to this class");
        }
        
        // Validate file
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds 10MB limit");
        }
        
        // Save file to disk
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new BadRequestException("Invalid file name");
        }
        
        String fileNameWithoutExt = "";
        String extension = "";
        
        if (originalFilename.contains(".")) {
            int lastDot = originalFilename.lastIndexOf(".");
            fileNameWithoutExt = originalFilename.substring(0, lastDot);
            extension = originalFilename.substring(lastDot);
        } else {
            fileNameWithoutExt = originalFilename;
        }
        
        // Generate unique filename
        long timestamp = System.currentTimeMillis();
        String uniqueFilename = fileNameWithoutExt + "_" + timestamp + extension;
        
        try {
            // Create directory if not exists
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Save file
            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            log.info(" File saved: {}", uniqueFilename);
            
        } catch (IOException e) {
            log.error(" Failed to save file: {}", e.getMessage());
            throw new RuntimeException("Failed to save file: " + e.getMessage());
        }
        
        // Create material entity
        String fileUrl = "http://localhost:8080/uploads/materials/" + uniqueFilename;
        String fileType = extension.replace(".", "").toLowerCase();
        
        ClassMaterial material = ClassMaterial.builder()
                .classEntity(classEntity)
                .title(title)
                .description(description)
                .fileName(uniqueFilename)
                .fileUrl(fileUrl)
                .fileType(fileType)
                .fileSize(file.getSize())
                .uploadedBy(teacher)
                .build();
        
        material = materialRepository.save(material);
        
        log.info(" Material created: ID={}, title={}", material.getMaterialId(), title);
        
        return mapToResponse(material);
    }
    
    @Override
    public List<MaterialResponse> getMaterialsByClass(Long classId) {
        log.info(" Getting materials for class {}", classId);
        
        // Validate class exists
        if (!classRepository.existsById(classId)) {
            throw new NotFoundException("Class not found");
        }
        
        List<ClassMaterial> materials = materialRepository
                .findByClassEntity_ClassIdOrderByUploadedAtDesc(classId);
        
        log.info(" Found {} materials", materials.size());
        
        return materials.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public MaterialResponse getMaterialById(Long materialId) {
        ClassMaterial material = materialRepository.findById(materialId)
                .orElseThrow(() -> new NotFoundException("Material not found"));
        
        return mapToResponse(material);
    }
    
    @Override
    @Transactional
    public void deleteMaterial(Long materialId, Long teacherId) {
        log.info("🗑️ Teacher {} deleting material {}", teacherId, materialId);
        
        ClassMaterial material = materialRepository.findById(materialId)
                .orElseThrow(() -> new NotFoundException("Material not found"));
        
        // Check permission
        if (!material.getUploadedBy().getTeacherId().equals(teacherId)) {
            throw new ForbiddenException("You don't have permission to delete this material");
        }
        
        // Delete file from disk
        try {
            Path filePath = Paths.get(UPLOAD_DIR + material.getFileName());
            Files.deleteIfExists(filePath);
            log.info(" File deleted: {}", material.getFileName());
        } catch (IOException e) {
            log.warn(" Failed to delete file: {}", e.getMessage());
        }
        
        // Delete from database
        materialRepository.delete(material);
        
        log.info(" Material deleted: {}", materialId);
    }
    
    /**
     * Map entity to response DTO
     */
    private MaterialResponse mapToResponse(ClassMaterial material) {
        return MaterialResponse.builder()
                .materialId(material.getMaterialId())
                .classId(material.getClassEntity().getClassId())
                .classCode(material.getClassEntity().getClassCode())
                .title(material.getTitle())
                .description(material.getDescription())
                .fileName(material.getFileName())
                .fileUrl(material.getFileUrl())
                .fileType(material.getFileType())
                .fileSize(material.getFileSize())
                .fileSizeDisplay(formatFileSize(material.getFileSize()))
                .uploadedById(material.getUploadedBy().getTeacherId())
                .uploadedByName(material.getUploadedBy().getFullName())
                .uploadedAt(material.getUploadedAt())
                .updatedAt(material.getUpdatedAt())
                .build();
    }
    
    /**
     * Format file size to human-readable string
     */
    private String formatFileSize(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        } else if (bytes < 1024 * 1024) {
            return String.format("%.1f KB", bytes / 1024.0);
        } else {
            return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
        }
    }
}