package vn.edu.uth.ecms.controller.teacher;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.request.GradeSubmissionRequest;
import vn.edu.uth.ecms.dto.response.SubmissionResponse;
import vn.edu.uth.ecms.dto.response.SubmissionStatsResponse;
import vn.edu.uth.ecms.security.UserPrincipal;
import vn.edu.uth.ecms.service.SubmissionService;

import java.util.List;

/**
 * TeacherSubmissionController
 * 
 * REST API endpoints for teacher to manage homework submissions
 * 
 * @author 
 * @since 
 */
@RestController
@RequestMapping("/api/teacher/submissions")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('TEACHER')")
public class TeacherSubmissionController {
    
    private final SubmissionService submissionService;
    
    
    
    /**
     * Grade a submission
     * POST /api/teacher/submissions/{id}/grade
     */
    @PostMapping("/{id}/grade")
    public ResponseEntity<SubmissionResponse> gradeSubmission(
            @PathVariable Long id,
            @Valid @RequestBody GradeSubmissionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} grading submission {}", principal.getId(), id);
        
        SubmissionResponse response = submissionService.gradeSubmission(
            id, request, principal.getId());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Ungrade a submission
     * DELETE /api/teacher/submissions/{id}/grade
     */
    @DeleteMapping("/{id}/grade")
    public ResponseEntity<SubmissionResponse> ungradeSubmission(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} ungrading submission {}", principal.getId(), id);
        
        SubmissionResponse response = submissionService.ungradeSubmission(
            id, principal.getId());
        
        return ResponseEntity.ok(response);
    }
   
    @PostMapping("/bulk-grade")
    public ResponseEntity<List<SubmissionResponse>> bulkGrade(
            @Valid @RequestBody List<GradeSubmissionRequest> requests,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} bulk grading {} submissions", 
            principal.getId(), requests.size());
        
        List<SubmissionResponse> responses = submissionService.bulkGrade(
            requests, principal.getId());
        
        return ResponseEntity.ok(responses);
    }
    
    
    
    /**
     * Get submissions needing grading for a homework
     * GET /api/teacher/submissions/homework/{homeworkId}/needing-grading
     */
    @GetMapping("/homework/{homeworkId}/needing-grading")
    public ResponseEntity<List<SubmissionResponse>> getSubmissionsNeedingGrading(
            @PathVariable Long homeworkId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} getting submissions needing grading for homework {}", 
            principal.getId(), homeworkId);
        
        List<SubmissionResponse> responses = submissionService
            .getSubmissionsForGrading(homeworkId, principal.getId());
        
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Get all submissions for a homework
     * GET /api/teacher/submissions/homework/{homeworkId}
     */
    @GetMapping("/homework/{homeworkId}")
    public ResponseEntity<List<SubmissionResponse>> getSubmissionsByHomework(
            @PathVariable Long homeworkId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} getting all submissions for homework {}", 
            principal.getId(), homeworkId);
        
        List<SubmissionResponse> responses = submissionService
            .getSubmissionsByHomework(homeworkId, principal.getId());
        
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Get submissions for homework with pagination
     * GET /api/teacher/submissions/homework/{homeworkId}/page
     */
    @GetMapping("/homework/{homeworkId}/page")
    public ResponseEntity<Page<SubmissionResponse>> getSubmissionsByHomeworkPage(
            @PathVariable Long homeworkId,
            @AuthenticationPrincipal UserPrincipal principal,
            Pageable pageable) {
        
        log.info("Teacher {} getting submissions for homework {} with pagination", 
            principal.getId(), homeworkId);
        
        Page<SubmissionResponse> responses = submissionService
            .getSubmissionsByHomework(homeworkId, principal.getId(), pageable);
        
        return ResponseEntity.ok(responses);
    }
    
   
    
    /**
     * Get submission statistics for a homework
     * GET /api/teacher/submissions/homework/{homeworkId}/stats
     */
    @GetMapping("/homework/{homeworkId}/stats")
    public ResponseEntity<SubmissionStatsResponse> getSubmissionStats(
            @PathVariable Long homeworkId) {
        
        log.info("Getting submission statistics for homework {}", homeworkId);
        
        SubmissionStatsResponse stats = submissionService.getSubmissionStats(homeworkId);
        return ResponseEntity.ok(stats);
    }
}