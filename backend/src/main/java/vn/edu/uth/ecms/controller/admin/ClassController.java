package vn.edu.uth.ecms.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.request.ClassCreateRequest;
import vn.edu.uth.ecms.dto.request.ClassUpdateRequest;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.ClassResponse;
import vn.edu.uth.ecms.service.ClassService;

import java.util.List;

/**
 * ClassController - Admin class management
 *
 * ENDPOINTS:
 * - POST   /api/admin/classes                       - Create class
 * - PUT    /api/admin/classes/{id}                  - Update class
 * - DELETE /api/admin/classes/{id}                  - Delete class
 * - GET    /api/admin/classes/{id}                  - Get class by ID
 * - GET    /api/admin/classes                       - Get all classes (paginated)
 * - GET    /api/admin/classes/search                - Search classes
 * - GET    /api/admin/classes/semester/{semesterId} - Get classes by semester
 * - GET    /api/admin/classes/teacher/{teacherId}   - Get classes by teacher
 * - GET    /api/admin/classes/subject/{subjectId}   - Get classes by subject
 *
 * FEATURES:
 * - Auto room assignment for fixed schedule
 * - Auto session generation (10 fixed + extra + e-learning)
 * - Conflict detection (teacher, room)
 * - Semester validation (UPCOMING only)
 *
 * NOTES:
 * - Enrollment management moved to EnrollmentController
 * - Session management moved to SessionController
 */
@RestController
@RequestMapping("/api/admin/classes")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class ClassController {

    private final ClassService classService;

    // ==================== CLASS CRUD ====================

    /**
     * Create a new class
     *
     * PROCESS:
     * 1. Validate semester is UPCOMING
     * 2. Check teacher/room conflicts
     * 3. Auto-assign room (finds available room)
     * 4. Create class entity
     * 5. Auto-generate sessions:
     *    - 10 FIXED sessions (weekly, with dates)
     *    - Extra sessions (PENDING, to be scheduled)
     *    - E-learning sessions (no schedule)
     *
     * VALIDATIONS:
     * - Class code unique
     * - Semester UPCOMING (not ACTIVE/COMPLETED)
     * - Teacher no conflict at fixed schedule
     * - Room no conflict at fixed schedule
     * - Subject belongs to teacher's department (optional)
     *
     * @param request Class creation request
     * @return Created class with session count
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ClassResponse>> createClass(
            @Valid @RequestBody ClassCreateRequest request) {

        log.info("➕ Creating class: {}", request.getClassCode());

        ClassResponse response = classService.createClass(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Class created with sessions", response));
    }

    /**
     * Update class details
     *
     * ALLOWED UPDATES:
     * - Teacher (checks conflicts)
     * - Max students
     * - Schedule (day, time, room - regenerates sessions!)
     *
     * NOT ALLOWED:
     * - Class code (immutable)
     * - Subject (would break registrations)
     * - Semester (would break everything)
     *
     * ⚠️ WARNING: Changing schedule regenerates ALL sessions!
     *
     * @param id Class ID
     * @param request Update request
     * @return Updated class
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassResponse>> updateClass(
            @PathVariable Long id,
            @Valid @RequestBody ClassUpdateRequest request) {

        log.info("✏️ Updating class {}", id);

        ClassResponse response = classService.updateClass(id, request);

        return ResponseEntity.ok(
                ApiResponse.success("Class updated", response)
        );
    }

    /**
     * Delete class
     *
     * VALIDATIONS:
     * - Cannot delete if has enrolled students
     *
     * CASCADES:
     * - Deletes all sessions (class_session)
     * - Deletes student schedules (student_schedule)
     *
     * USE CASES:
     * - Admin created class by mistake
     * - Duplicate class
     * - Class cancelled before enrollment
     *
     * @param id Class ID
     * @return Success message
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteClass(@PathVariable Long id) {

        log.info("🗑️ Deleting class {}", id);

        classService.deleteClass(id);

        return ResponseEntity.ok(
                ApiResponse.success("Class deleted")
        );
    }

    // ==================== QUERY ENDPOINTS ====================

    /**
     * Get class by ID
     *
     * RETURNS:
     * - Class details
     * - Subject info
     * - Teacher info
     * - Semester info
     * - Room info
     * - Enrollment stats
     * - Session stats
     *
     * @param id Class ID
     * @return Class details
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassResponse>> getClassById(@PathVariable Long id) {

        log.debug("Getting class {}", id);

        ClassResponse response = classService.getClassById(id);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get all classes (paginated)
     *
     * PAGINATION:
     * - Default: page=0, size=10
     * - Sort by: classCode (default), subjectName, teacherName, etc.
     * - Sort direction: asc (default) or desc
     *
     * @param page Page number (0-indexed)
     * @param size Page size
     * @param sortBy Sort field
     * @param sortDir Sort direction (asc/desc)
     * @return Page of classes
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ClassResponse>>> getAllClasses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "classCode") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        log.debug("Getting classes - page: {}, size: {}, sort: {} {}",
                page, size, sortBy, sortDir);

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ClassResponse> classes = classService.getAllClasses(pageable);

        return ResponseEntity.ok(
                ApiResponse.success(
                        classes.getTotalElements() + " class(es) found",
                        classes
                )
        );
    }

    /**
     * Search classes by keyword
     *
     * SEARCHES IN:
     * - Class code
     * - Subject name
     * - Teacher name
     *
     * EXAMPLE:
     * - "IT101" → Finds classes with IT101 in code or subject
     * - "Nguyen" → Finds classes taught by teachers with "Nguyen" in name
     *
     * @param keyword Search keyword
     * @param page Page number
     * @param size Page size
     * @return Page of matching classes
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ClassResponse>>> searchClasses(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("🔍 Searching classes: '{}'", keyword);

        Pageable pageable = PageRequest.of(page, size);
        Page<ClassResponse> classes = classService.searchClasses(keyword, pageable);

        return ResponseEntity.ok(
                ApiResponse.success(
                        classes.getTotalElements() + " class(es) found",
                        classes
                )
        );
    }

    /**
     * Get classes by semester
     *
     * USE CASES:
     * - View all classes in current semester
     * - Compare semesters
     * - Generate semester report
     *
     * @param semesterId Semester ID
     * @return List of classes in semester
     */
    @GetMapping("/semester/{semesterId}")
    public ResponseEntity<ApiResponse<List<ClassResponse>>> getClassesBySemester(
            @PathVariable Long semesterId) {

        log.debug("Getting classes by semester {}", semesterId);

        List<ClassResponse> classes = classService.getClassesBySemester(semesterId);

        return ResponseEntity.ok(
                ApiResponse.success(classes.size() + " class(es)", classes)
        );
    }

    /**
     * Get classes by teacher
     *
     * USE CASES:
     * - View teacher's teaching load
     * - Check teacher schedule
     * - Assign additional classes
     *
     * @param teacherId Teacher ID
     * @return List of teacher's classes
     */
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<ApiResponse<List<ClassResponse>>> getClassesByTeacher(
            @PathVariable Long teacherId) {

        log.debug("Getting classes by teacher {}", teacherId);

        List<ClassResponse> classes = classService.getClassesByTeacher(teacherId);

        return ResponseEntity.ok(
                ApiResponse.success(classes.size() + " class(es)", classes)
        );
    }

    /**
     * Get classes by subject
     *
     * USE CASES:
     * - View all sections of a subject
     * - Balance class sizes
     * - Monitor popular subjects
     *
     * @param subjectId Subject ID
     * @return List of classes for subject
     */
    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<ApiResponse<List<ClassResponse>>> getClassesBySubject(
            @PathVariable Long subjectId) {

        log.debug("Getting classes by subject {}", subjectId);

        List<ClassResponse> classes = classService.getClassesBySubject(subjectId);

        return ResponseEntity.ok(
                ApiResponse.success(classes.size() + " class(es)", classes)
        );
    }
}