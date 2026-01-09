package vn.edu.uth.ecms.controller.teacher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ClassResponse;
import vn.edu.uth.ecms.security.UserPrincipal;
import vn.edu.uth.ecms.service.ClassService;

import java.util.List;

/**
 * TeacherClassController
 * 
 * REST API endpoints for teacher to access their classes
 * Security handled by SecurityConfig - no need for @PreAuthorize here!
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-07
 */
@RestController
@RequestMapping("/api/teacher/classes")
@RequiredArgsConstructor
@Slf4j
public class TeacherClassController {
    
    private final ClassService classService;
    
    /**
     * Get current teacher's classes
     * GET /api/teacher/classes/my
     * 
     * @param principal Authenticated user (injected by Spring Security)
     * @return List of classes taught by current teacher
     */
    @GetMapping("/my")
    public ResponseEntity<List<ClassResponse>> getMyClasses(
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("====== GET MY CLASSES ======");
        log.info("Teacher ID: {}", principal.getId());
        log.info("Username: {}", principal.getUsername());
        
        try {
            List<ClassResponse> classes = classService.getClassesByTeacher(principal.getId());
            
            log.info("✅ Teacher {} has {} classes", principal.getId(), classes.size());
            return ResponseEntity.ok(classes);
            
        } catch (Exception e) {
            log.error("❌ Failed to fetch classes for teacher {}: {}", 
                     principal.getId(), e.getMessage());
            throw e;
        }
    }
    
    /**
     * Get class details by ID (if teacher owns this class)
     * GET /api/teacher/classes/{id}
     * 
     * @param id Class ID
     * @param principal Authenticated user
     * @return Class details
     */
    @GetMapping("/{id}")
    public ResponseEntity<ClassResponse> getClassById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} fetching class {}", principal.getId(), id);
        
        try {
            ClassResponse classResponse = classService.getClassById(id);
            
            // Verify teacher owns this class
            if (!classResponse.getTeacherId().equals(principal.getId())) {
                log.warn("❌ Teacher {} attempted to access class {} owned by teacher {}", 
                        principal.getId(), id, classResponse.getTeacherId());
                return ResponseEntity.status(403).build();
            }
            
            log.info("✅ Class {} fetched successfully", id);
            return ResponseEntity.ok(classResponse);
            
        } catch (Exception e) {
            log.error("❌ Failed to fetch class {}: {}", id, e.getMessage());
            throw e;
        }
    }
}