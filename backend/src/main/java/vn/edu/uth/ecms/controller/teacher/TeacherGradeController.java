package vn.edu.uth.ecms.controller.teacher;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.request.GradeRequest;
import vn.edu.uth.ecms.dto.response.GradeResponse;
import vn.edu.uth.ecms.dto.response.GradeStatsResponse;
import vn.edu.uth.ecms.dto.response.TranscriptResponse;
import vn.edu.uth.ecms.security.UserPrincipal;
import vn.edu.uth.ecms.service.GradeService;

import java.math.BigDecimal;
import java.util.List;

/**
 * TeacherGradeController
 * 
 * REST API endpoints for teacher grade management
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@RestController
@RequestMapping("/api/teacher/grades")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('TEACHER')")
public class TeacherGradeController {
    
    private final GradeService gradeService;
    
    // ==================== CREATE/UPDATE GRADE ====================
    
    /**
     * Create or update grade
     * POST /api/teacher/grades
     */
    @PostMapping
    public ResponseEntity<GradeResponse> createOrUpdateGrade(
            @Valid @RequestBody GradeRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} creating/updating grade for student {} in class {}", 
            principal.getId(), request.getStudentId(), request.getClassId());
        
        GradeResponse response = gradeService.createOrUpdateGrade(
            request, principal.getId());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * Bulk update grades
     * POST /api/teacher/grades/bulk
     */
    @PostMapping("/bulk")
    public ResponseEntity<List<GradeResponse>> bulkUpdateGrades(
            @Valid @RequestBody List<GradeRequest> requests,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} bulk updating {} grades", 
            principal.getId(), requests.size());
        
        List<GradeResponse> responses = gradeService.bulkUpdateGrades(
            requests, principal.getId());
        
        return ResponseEntity.ok(responses);
    }
    
    // ==================== GET GRADES ====================
    
    /**
     * Get grade for a student in a class
     * GET /api/teacher/grades/student/{studentId}/class/{classId}
     */
    @GetMapping("/student/{studentId}/class/{classId}")
    public ResponseEntity<GradeResponse> getGrade(
            @PathVariable Long studentId,
            @PathVariable Long classId) {
        
        log.info("Getting grade for student {} in class {}", studentId, classId);
        
        GradeResponse response = gradeService.getGrade(studentId, classId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get all grades for a class
     * GET /api/teacher/grades/class/{classId}
     */
    @GetMapping("/class/{classId}")
    public ResponseEntity<List<GradeResponse>> getGradesByClass(
            @PathVariable Long classId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} getting grades for class {}", 
            principal.getId(), classId);
        
        List<GradeResponse> responses = gradeService.getGradesByClass(
            classId, principal.getId());
        
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Get student's transcript (all grades)
     * GET /api/teacher/grades/student/{studentId}/transcript
     */
    @GetMapping("/student/{studentId}/transcript")
    public ResponseEntity<TranscriptResponse> getTranscript(
            @PathVariable Long studentId) {
        
        log.info("Getting transcript for student {}", studentId);
        
        TranscriptResponse response = gradeService.getTranscript(studentId);
        return ResponseEntity.ok(response);
    }
    
    // ==================== CALCULATE OPERATIONS ====================
    
    /**
     * Manually recalculate regular score for a student
     * POST /api/teacher/grades/calculate/regular
     */
    @PostMapping("/calculate/regular")
    public ResponseEntity<Void> calculateRegularScore(
            @RequestParam Long studentId,
            @RequestParam Long classId) {
        
        log.info("Manually calculating regular score for student {} in class {}", 
            studentId, classId);
        
        gradeService.calculateRegularScore(studentId, classId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Calculate GPA for a student
     * GET /api/teacher/grades/student/{studentId}/gpa
     */
    @GetMapping("/student/{studentId}/gpa")
    public ResponseEntity<BigDecimal> calculateGPA(@PathVariable Long studentId) {
        log.info("Calculating GPA for student {}", studentId);
        
        BigDecimal gpa = gradeService.calculateGPA(studentId);
        return ResponseEntity.ok(gpa);
    }
    
    // ==================== STATISTICS ====================
    
    /**
     * Get class grade statistics
     * GET /api/teacher/grades/class/{classId}/stats
     */
    @GetMapping("/class/{classId}/stats")
    public ResponseEntity<GradeStatsResponse> getClassStats(@PathVariable Long classId) {
        log.info("Getting grade statistics for class {}", classId);
        
        GradeStatsResponse stats = gradeService.getClassStats(classId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get student's rank in class
     * GET /api/teacher/grades/student/{studentId}/class/{classId}/rank
     */
    @GetMapping("/student/{studentId}/class/{classId}/rank")
    public ResponseEntity<Long> getStudentRank(
            @PathVariable Long studentId,
            @PathVariable Long classId) {
        
        log.info("Getting rank for student {} in class {}", studentId, classId);
        
        Long rank = gradeService.getStudentRank(studentId, classId);
        return ResponseEntity.ok(rank);
    }
    
    // ==================== UTILITY ====================
    
    /**
     * Initialize grades for all students in class
     * POST /api/teacher/grades/class/{classId}/initialize
     */
    @PostMapping("/class/{classId}/initialize")
    public ResponseEntity<Void> initializeGrades(@PathVariable Long classId) {
        log.info("Initializing grades for class {}", classId);
        
        gradeService.initializeGradesForClass(classId);
        return ResponseEntity.ok().build();
    }
}