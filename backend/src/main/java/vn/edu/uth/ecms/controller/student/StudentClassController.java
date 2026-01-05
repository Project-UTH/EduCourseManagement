package vn.edu.uth.ecms.controller.student;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.ClassResponse;
import vn.edu.uth.ecms.service.ClassService;

import java.util.List;

@RestController
@RequestMapping("/api/student/classes")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('STUDENT')")
public class StudentClassController {

    private final ClassService classService;

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
            @RequestParam(required = false) Long semesterId) {  // ← THÊM PARAMETER
        
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
}