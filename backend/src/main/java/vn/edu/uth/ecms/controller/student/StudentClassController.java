package vn.edu.uth.ecms.controller.student;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.ClassResponse;
import vn.edu.uth.ecms.dto.response.HomeworkWithSubmissionResponse;
import vn.edu.uth.ecms.service.ClassService;
import vn.edu.uth.ecms.service.HomeworkService;
import vn.edu.uth.ecms.service.StudentService;

import java.util.List;

/**
 * StudentClassController - COMPLETE VERSION
 * 
 * Endpoints:
 * - GET /api/student/classes/available - Lớp có thể đăng ký
 * - GET /api/student/classes/by-subject/{id} - Lớp theo môn học
 * - GET /api/student/classes - Lớp đã đăng ký
 * - GET /api/student/classes/{id} - Chi tiết lớp
 * - GET /api/student/classes/{id}/homeworks - Bài tập của lớp (với submission status)
 */
@RestController
@RequestMapping("/api/student/classes")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('STUDENT')")
public class StudentClassController {

    private final ClassService classService;
    private final StudentService studentService;
    private final HomeworkService homeworkService;

    // ==================== EXISTING METHODS ====================

    /**
     * Get available classes for student registration
     * Only returns OPEN classes in UPCOMING semesters with registration enabled
     */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<Page<ClassResponse>>> getAvailableClasses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "classCode") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        log.info("Student fetching available classes");

        Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<ClassResponse> classes = classService.getAllClasses(pageable);

        // Filter only OPEN and can register
        Page<ClassResponse> openClasses = classes
                .map(cls -> ("OPEN".equals(cls.getStatus()) && Boolean.TRUE.equals(cls.getCanRegister())) ? cls : null);

        return ResponseEntity.ok(
                ApiResponse.success("Found " + openClasses.getTotalElements() + " classes", openClasses)
        );
    }

    /**
     * Get available classes for a specific subject
     * Optional filter by semester
     * Only returns OPEN classes in UPCOMING semesters with registration enabled
     */
    @GetMapping("/by-subject/{subjectId}")
    public ResponseEntity<ApiResponse<List<ClassResponse>>> getClassesBySubject(
            @PathVariable Long subjectId,
            @RequestParam(required = false) Long semesterId) {
        
        log.info("📚 Student fetching classes for subject ID: {}", subjectId);
        if (semesterId != null) {
            log.info("📅 Filter by semester ID: {}", semesterId);
        }
        
        // Get all classes for subject
        List<ClassResponse> allClasses = classService.getClassesBySubject(subjectId);
        log.info("📖 Found {} total classes for subject", allClasses.size());
        
        // Filter by semester (if provided) and status
        List<ClassResponse> filteredClasses = allClasses.stream()
                .filter(cls -> {
                    // Filter 1: OPEN and can register
                    boolean isAvailable = "OPEN".equals(cls.getStatus()) && 
                                         Boolean.TRUE.equals(cls.getCanRegister());
                    
                    if (!isAvailable) {
                        log.debug("❌ Class {} skipped (status: {}, canRegister: {})", 
                                cls.getClassCode(), cls.getStatus(), cls.getCanRegister());
                        return false;
                    }
                    
                    // Filter 2: Semester (if provided)
                    if (semesterId != null) {
                        boolean matchSemester = cls.getSemesterId().equals(semesterId);
                        
                        if (!matchSemester) {
                            log.debug("❌ Class {} skipped (semester: {} != {})", 
                                    cls.getClassCode(), cls.getSemesterId(), semesterId);
                            return false;
                        }
                        
                        log.debug("✅ Class {} included (semester: {})", 
                                cls.getClassCode(), cls.getSemesterId());
                    }
                    
                    return true;
                })
                .toList();
        
        log.info("✅ After filters: {} classes available", filteredClasses.size());
        filteredClasses.forEach(c -> 
            log.info("  → {} (Semester: {}, Status: {})", 
                    c.getClassCode(), c.getSemesterId(), c.getStatus())
        );
        
        return ResponseEntity.ok(
                ApiResponse.success("Found " + filteredClasses.size() + " classes", filteredClasses)
        );
    }

    // ==================== NEW METHODS FOR PHASE 5 ====================

    /**
     * Get all classes that current student has registered
     * Returns only ACTIVE classes in current semester
     * 
     * GET /api/student/classes
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ClassResponse>>> getMyEnrolledClasses(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("📚 Student {} fetching enrolled classes", userDetails.getUsername());
        
        try {
            // Get student code from authenticated user
            String studentCode = userDetails.getUsername();
            
            // Get enrolled classes from service
            List<ClassResponse> enrolledClasses = studentService.getEnrolledClasses(studentCode);
            
            log.info("✅ Found {} enrolled classes", enrolledClasses.size());
            
            return ResponseEntity.ok(
                    ApiResponse.success(
                            "Lấy danh sách lớp đã đăng ký thành công", 
                            enrolledClasses
                    )
            );
            
        } catch (Exception e) {
            log.error("❌ Error getting enrolled classes", e);
            return ResponseEntity.status(500).body(
                    ApiResponse.error("Không thể lấy danh sách lớp: " + e.getMessage())
            );
        }
    }

    /**
     * Get detailed information about a registered class
     * 
     * GET /api/student/classes/{classId}
     */
    @GetMapping("/{classId}")
    public ResponseEntity<ApiResponse<ClassResponse>> getEnrolledClassDetail(
            @PathVariable Long classId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("📖 Student {} fetching class detail: {}", userDetails.getUsername(), classId);
        
        try {
            String studentCode = userDetails.getUsername();
            
            // Verify student is enrolled in this class
            ClassResponse classDetail = studentService.getEnrolledClassDetail(studentCode, classId);
            
            if (classDetail == null) {
                return ResponseEntity.status(404).body(
                        ApiResponse.error("Không tìm thấy lớp hoặc bạn chưa đăng ký lớp này")
                );
            }
            
            return ResponseEntity.ok(
                    ApiResponse.success("Lấy thông tin lớp thành công", classDetail)
            );
            
        } catch (Exception e) {
            log.error("❌ Error getting class detail", e);
            return ResponseEntity.status(500).body(
                    ApiResponse.error("Không thể lấy thông tin lớp: " + e.getMessage())
            );
        }
    }

    /**
     * ✅ Get all homeworks for a class with submission status
     * 
     * Returns homework list where each homework includes:
     * - Basic homework info (title, description, deadline, maxScore)
     * - hasSubmitted: true if student has submitted
     * - isOverdue: true if current time is past deadline
     * - submittedAt: when student submitted (if submitted)
     * - grade: student's score (if graded)
     * 
     * GET /api/student/classes/{classId}/homeworks
     */
    @GetMapping("/{classId}/homeworks")
    public ResponseEntity<ApiResponse<List<HomeworkWithSubmissionResponse>>> getClassHomeworks(
            @PathVariable Long classId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("📚 Student {} fetching homeworks for class: {}", userDetails.getUsername(), classId);
        
        try {
            String studentCode = userDetails.getUsername();
            
            // Get all homeworks with submission status
            List<HomeworkWithSubmissionResponse> homeworks = homeworkService
                    .getHomeworksByClassWithSubmissionStatus(classId, studentCode);
            
            log.info("✅ Found {} homeworks for class {}", homeworks.size(), classId);
            
            return ResponseEntity.ok(
                    ApiResponse.success("Lấy danh sách bài tập thành công", homeworks)
            );
            
        } catch (Exception e) {
            log.error("❌ Error getting class homeworks: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                    ApiResponse.error("Không thể lấy danh sách bài tập: " + e.getMessage())
            );
        }
    }
}