package vn.edu.uth.ecms.controller.student;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.StudentGradeResponse;
import vn.edu.uth.ecms.dto.response.StudentTranscriptResponse;
import vn.edu.uth.ecms.security.UserPrincipal;
import vn.edu.uth.ecms.service.StudentGradeService;

import java.util.List;

/**
 * Student Grade Controller
 * REST API for students to view their grades and transcript
 * 
 * @author 
 * @since 
 */
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('STUDENT')")
public class StudentGradeController {
    
    private final StudentGradeService studentGradeService;
    
    /**
     * @param userPrincipal Authenticated student
     * @return List of grades
     */
    @GetMapping("/grades")
    public ResponseEntity<ApiResponse<List<StudentGradeResponse>>> getMyGrades(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        log.info("[StudentGradeController] Student {} fetching all grades", 
                 userPrincipal.getUsername());
        
        Long studentId = userPrincipal.getId();
        List<StudentGradeResponse> grades = studentGradeService.getStudentGrades(studentId);
        
        log.info("[StudentGradeController] Found {} grades for student {}", 
                 grades.size(), studentId);
        
        return ResponseEntity.ok(ApiResponse.success(
            "Grades retrieved successfully",
            grades
        ));
    }
    
    /**
     * Get complete transcript for the authenticated student
     * 
     * GET /api/student/transcript
     * @param userPrincipal Authenticated student
     * @return Complete transcript
     */
    @GetMapping("/transcript")
    public ResponseEntity<ApiResponse<StudentTranscriptResponse>> getMyTranscript(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        log.info("[StudentGradeController] Student {} fetching transcript", 
                 userPrincipal.getUsername());
        
        Long studentId = userPrincipal.getId();
        StudentTranscriptResponse transcript = studentGradeService.getStudentTranscript(studentId);
        
        log.info("[StudentGradeController] Transcript loaded: GPA={}, Credits={}", 
                 transcript.getGpa(), transcript.getTotalCredits());
        
        return ResponseEntity.ok(ApiResponse.success(
            "Transcript retrieved successfully",
            transcript
        ));
    }
    
    /**
     * Get grade for specific class
     * 
     * GET /api/student/grades/class/{classId}
     * 
     * @param classId Class ID
     * @param userPrincipal Authenticated student
     * @return Grade for the class
     */
    @GetMapping("/grades/class/{classId}")
    public ResponseEntity<ApiResponse<StudentGradeResponse>> getGradeForClass(
            @PathVariable Long classId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        log.info("[StudentGradeController] Student {} fetching grade for class {}", 
                 userPrincipal.getUsername(), classId);
        
        Long studentId = userPrincipal.getId();
        StudentGradeResponse grade = studentGradeService.getStudentGradeForClass(studentId, classId);
        
        return ResponseEntity.ok(ApiResponse.success(
            "Grade retrieved successfully",
            grade
        ));
    }
}