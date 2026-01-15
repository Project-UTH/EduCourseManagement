package vn.edu.uth.ecms.controller.teacher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.MaterialResponse;
import vn.edu.uth.ecms.security.UserPrincipal;
import vn.edu.uth.ecms.service.MaterialService;

import java.util.List;

/**
 * TeacherMaterialController
 * 
 * REST API for teacher to manage class materials
 * 
 * @author ECMS Team
 * @since 2026-01-16
 */
@RestController
@RequestMapping("/api/teacher/materials")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('TEACHER')")
public class TeacherMaterialController {
    
    private final MaterialService materialService;
    
    /**
     * Upload material for a class
     * POST /api/teacher/materials
     */
    @PostMapping
    public ResponseEntity<ApiResponse<MaterialResponse>> uploadMaterial(
            @RequestParam("classId") Long classId,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("📤 Teacher {} uploading material for class {}", principal.getId(), classId);
        
        MaterialResponse response = materialService.uploadMaterial(
                classId, title, description, file, principal.getId());
        
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Material uploaded successfully", response));
    }
    
    /**
     * Get materials for a class
     * GET /api/teacher/materials/class/{classId}
     */
    @GetMapping("/class/{classId}")
    public ResponseEntity<ApiResponse<List<MaterialResponse>>> getMaterialsByClass(
            @PathVariable Long classId) {
        
        log.info("📚 Getting materials for class {}", classId);
        
        List<MaterialResponse> materials = materialService.getMaterialsByClass(classId);
        
        return ResponseEntity.ok(
                ApiResponse.success("Materials retrieved", materials));
    }
    
    /**
     * Delete material
     * DELETE /api/teacher/materials/{materialId}
     */
    @DeleteMapping("/{materialId}")
    public ResponseEntity<ApiResponse<Void>> deleteMaterial(
            @PathVariable Long materialId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("🗑️ Teacher {} deleting material {}", principal.getId(), materialId);
        
        materialService.deleteMaterial(materialId, principal.getId());
        
        return ResponseEntity.ok(
                ApiResponse.success("Material deleted successfully", null));
    }
}