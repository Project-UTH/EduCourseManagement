package vn.edu.uth.ecms.controller.teacher;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.request.HomeworkRequest;
import vn.edu.uth.ecms.dto.response.HomeworkDetailResponse;
import vn.edu.uth.ecms.dto.response.HomeworkResponse;
import vn.edu.uth.ecms.dto.response.HomeworkStatsResponse;
import vn.edu.uth.ecms.entity.HomeworkType;
import vn.edu.uth.ecms.security.UserPrincipal;
import vn.edu.uth.ecms.service.HomeworkService;

import java.time.LocalDateTime;
import java.util.List;

/**
 * TeacherHomeworkController
 * 
 * REST API endpoints for teacher homework management
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@RestController
@RequestMapping("/api/teacher/homework")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('TEACHER')")
public class TeacherHomeworkController {
    
    private final HomeworkService homeworkService;
    
    // ==================== CREATE HOMEWORK ====================
    
    /**
     * Create new homework
     * POST /api/teacher/homework
     */
    @PostMapping
    public ResponseEntity<HomeworkResponse> createHomework(
            @Valid @RequestBody HomeworkRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} creating homework for class {}", 
            principal.getId(), request.getClassId());
        
        HomeworkResponse response = homeworkService.createHomework(
            request, principal.getId());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    // ==================== UPDATE HOMEWORK ====================
    
    /**
     * Update homework
     * PUT /api/teacher/homework/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<HomeworkResponse> updateHomework(
            @PathVariable Long id,
            @Valid @RequestBody HomeworkRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} updating homework {}", principal.getId(), id);
        
        HomeworkResponse response = homeworkService.updateHomework(
            id, request, principal.getId());
        
        return ResponseEntity.ok(response);
    }
    
    // ==================== DELETE HOMEWORK ====================
    
    /**
     * Delete homework
     * DELETE /api/teacher/homework/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHomework(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} deleting homework {}", principal.getId(), id);
        
        homeworkService.deleteHomework(id, principal.getId());
        
        return ResponseEntity.noContent().build();
    }
    
    // ==================== GET HOMEWORK ====================
    
    /**
     * Get homework by ID
     * GET /api/teacher/homework/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<HomeworkResponse> getHomework(@PathVariable Long id) {
        log.info("Getting homework {}", id);
        
        HomeworkResponse response = homeworkService.getHomeworkById(id);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get homework detail with submissions
     * GET /api/teacher/homework/{id}/detail
     */
    @GetMapping("/{id}/detail")
    public ResponseEntity<HomeworkDetailResponse> getHomeworkDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} getting homework {} detail", principal.getId(), id);
        
        HomeworkDetailResponse response = homeworkService.getHomeworkDetail(
            id, principal.getId());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get all homework for a class
     * GET /api/teacher/homework/class/{classId}
     */
    @GetMapping("/class/{classId}")
    public ResponseEntity<List<HomeworkResponse>> getHomeworkByClass(
            @PathVariable Long classId) {
        
        log.info("Getting homework for class {}", classId);
        
        List<HomeworkResponse> responses = homeworkService.getHomeworkByClass(classId);
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Get homework by class with pagination
     * GET /api/teacher/homework/class/{classId}/page
     */
    @GetMapping("/class/{classId}/page")
    public ResponseEntity<Page<HomeworkResponse>> getHomeworkByClassPage(
            @PathVariable Long classId,
            Pageable pageable) {
        
        log.info("Getting homework for class {} with pagination", classId);
        
        Page<HomeworkResponse> responses = homeworkService.getHomeworkByClass(classId, pageable);
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Get all homework by teacher
     * GET /api/teacher/homework/my
     */
    @GetMapping("/my")
    public ResponseEntity<List<HomeworkResponse>> getMyHomework(
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} getting their homework", principal.getId());
        
        List<HomeworkResponse> responses = homeworkService.getHomeworkByTeacher(
            principal.getId());
        
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Get homework by teacher with pagination
     * GET /api/teacher/homework/my/page
     */
    @GetMapping("/my/page")
    public ResponseEntity<Page<HomeworkResponse>> getMyHomeworkPage(
            @AuthenticationPrincipal UserPrincipal principal,
            Pageable pageable) {
        
        log.info("Teacher {} getting their homework with pagination", 
            principal.getId());
        
        Page<HomeworkResponse> responses = homeworkService.getHomeworkByTeacher(
            principal.getId(), pageable);
        
        return ResponseEntity.ok(responses);
    }
    
    // ==================== FILTER HOMEWORK ====================
    
    /**
     * Filter homework by criteria
     * GET /api/teacher/homework/class/{classId}/filter
     * Query params: type, startDate, endDate, page, size, sort
     */
    @GetMapping("/class/{classId}/filter")
    public ResponseEntity<Page<HomeworkResponse>> filterHomework(
            @PathVariable Long classId,
            @RequestParam(required = false) HomeworkType type,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            Pageable pageable) {
        
        log.info("Filtering homework for class {}: type={}, startDate={}, endDate={}", 
            classId, type, startDate, endDate);
        
        Page<HomeworkResponse> responses = homeworkService.filterHomework(
            classId, type, startDate, endDate, pageable);
        
        return ResponseEntity.ok(responses);
    }
    
    // ==================== STATISTICS ====================
    
    /**
     * Get homework statistics
     * GET /api/teacher/homework/{id}/stats
     */
    @GetMapping("/{id}/stats")
    public ResponseEntity<HomeworkStatsResponse> getHomeworkStats(@PathVariable Long id) {
        log.info("Getting statistics for homework {}", id);
        
        HomeworkStatsResponse stats = homeworkService.getHomeworkStats(id);
        return ResponseEntity.ok(stats);
    }
}