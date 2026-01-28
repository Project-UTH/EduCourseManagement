package vn.edu.uth.ecms.controller.teacher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ClassResponse;
import vn.edu.uth.ecms.dto.response.StudentEnrollmentDto;
import vn.edu.uth.ecms.exception.ForbiddenException;
import vn.edu.uth.ecms.exception.ResourceNotFoundException;
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
 * @updated 2026-01-28 - Added getEnrolledStudents endpoint
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
    
    // ==================== ✅ NEW: GET ENROLLED STUDENTS ====================
    
    /**
     * Get list of students enrolled in a class
     * GET /api/teacher/classes/{classId}/students
     * 
     * Returns list of students with their information and current grades
     * Only accessible if teacher owns this class
     * 
     * @param classId Class ID
     * @param principal Authenticated teacher
     * @return List of enrolled students
     * 
     * @author ECMS Team
     * @since 2026-01-28
     */
    @GetMapping("/{classId}/students")
    public ResponseEntity<List<StudentEnrollmentDto>> getEnrolledStudents(
            @PathVariable Long classId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("====== GET ENROLLED STUDENTS ======");
        log.info("Class ID: {}", classId);
        log.info("Teacher ID: {}", principal.getId());
        
        try {
            List<StudentEnrollmentDto> students = classService.getEnrolledStudents(
                    classId, 
                    principal.getId()
            );
            
            log.info("✅ Found {} students in class {}", students.size(), classId);
            return ResponseEntity.ok(students);
            
        } catch (ForbiddenException e) {
            log.warn("❌ Teacher {} not authorized for class {}: {}", 
                    principal.getId(), classId, e.getMessage());
            return ResponseEntity.status(403).build();
            
        } catch (ResourceNotFoundException e) {
            log.error("❌ Class {} not found: {}", classId, e.getMessage());
            return ResponseEntity.status(404).build();
            
        } catch (Exception e) {
            log.error("❌ Failed to fetch students for class {}: {}", classId, e.getMessage());
            throw e;
        }
    }
}