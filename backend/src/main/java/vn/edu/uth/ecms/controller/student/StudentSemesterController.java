package vn.edu.uth.ecms.controller.student;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.SemesterResponse;
import vn.edu.uth.ecms.service.SemesterService;

import java.util.List;

/**
 * Student Semester Controller
 * Get semesters for registration
 */
@RestController
@RequestMapping("/api/student/semesters")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('STUDENT')")
public class StudentSemesterController {

    private final SemesterService semesterService;

    /**
     * Get active semesters (ACTIVE or UPCOMING with registration enabled)
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<SemesterResponse>>> getActiveSemesters() {
        log.info("Student fetching active semesters");
        
        List<SemesterResponse> semesters = semesterService.getActiveSemesters();
        
        log.info("Found {} active semesters", semesters.size());
        
        return ResponseEntity.ok(
                ApiResponse.success("Found " + semesters.size() + " semesters", semesters)
        );
    }

    /**
     * Get all semesters
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SemesterResponse>>> getAllSemesters() {
        log.info("Student fetching all semesters");
        
        List<SemesterResponse> semesters = semesterService.getAllSemesters();
        
        return ResponseEntity.ok(
                ApiResponse.success("Found " + semesters.size() + " semesters", semesters)
        );
    }

    /**
     * Get semester by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SemesterResponse>> getSemesterById(@PathVariable Long id) {
        log.info("Student fetching semester ID: {}", id);
        
        SemesterResponse semester = semesterService.getSemesterById(id);
        
        return ResponseEntity.ok(
                ApiResponse.success("Semester found", semester)
        );
    }
}