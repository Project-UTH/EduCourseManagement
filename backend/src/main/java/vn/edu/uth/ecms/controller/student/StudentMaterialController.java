package vn.edu.uth.ecms.controller.student;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.MaterialResponse;
import vn.edu.uth.ecms.service.MaterialService;

import java.util.List;

/**
 * StudentMaterialController
 * 
 * REST API for student to view/download class materials
 * 
 * @author ECMS Team
 * @since 2026-01-16
 */
@RestController
@RequestMapping("/api/student/materials")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('STUDENT')")
public class StudentMaterialController {
    
    private final MaterialService materialService;
    
    /**
     * Get materials for a class
     * GET /api/student/materials/class/{classId}
     */
    @GetMapping("/class/{classId}")
    public ResponseEntity<ApiResponse<List<MaterialResponse>>> getMaterialsByClass(
            @PathVariable Long classId) {
        
        log.info("📚 Student getting materials for class {}", classId);
        
        List<MaterialResponse> materials = materialService.getMaterialsByClass(classId);
        
        return ResponseEntity.ok(
                ApiResponse.success("Materials retrieved", materials));
    }
    
    /**
     * Get material detail
     * GET /api/student/materials/{materialId}
     */
    @GetMapping("/{materialId}")
    public ResponseEntity<ApiResponse<MaterialResponse>> getMaterialById(
            @PathVariable Long materialId) {
        
        log.info("📄 Student getting material {}", materialId);
        
        MaterialResponse material = materialService.getMaterialById(materialId);
        
        return ResponseEntity.ok(
                ApiResponse.success("Material retrieved", material));
    }
}