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
import vn.edu.uth.ecms.dto.request.ManualEnrollRequest;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.ClassResponse;
import vn.edu.uth.ecms.dto.response.CourseRegistrationResponse;
import vn.edu.uth.ecms.service.ClassService;
import vn.edu.uth.ecms.service.EnrollmentService;

import java.util.List;

/**
 * Admin controller for class management
 * Includes CRUD operations and student enrollment
 */
@RestController
@RequestMapping("/api/admin/classes")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class ClassController {

    private final ClassService classService;
    private final EnrollmentService enrollmentService;

    // ==================== CLASS CRUD ====================

    @PostMapping
    public ResponseEntity<ApiResponse<ClassResponse>> createClass(
            @Valid @RequestBody ClassCreateRequest request) {

        log.info("REST request to create class: {}", request.getClassCode());

        ClassResponse response = classService.createClass(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Class created successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassResponse>> updateClass(
            @PathVariable Long id,
            @Valid @RequestBody ClassUpdateRequest request) {

        log.info("REST request to update class ID: {}", id);

        ClassResponse response = classService.updateClass(id, request);

        return ResponseEntity.ok(ApiResponse.success("Class updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteClass(@PathVariable Long id) {
        log.info("REST request to delete class ID: {}", id);

        classService.deleteClass(id);

        return ResponseEntity.ok(ApiResponse.success("Class deleted successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassResponse>> getClassById(@PathVariable Long id) {
        log.info("REST request to get class ID: {}", id);

        ClassResponse response = classService.getClassById(id);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ClassResponse>>> getAllClasses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "classCode") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        log.info("REST request to get all classes - page: {}, size: {}", page, size);

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ClassResponse> classes = classService.getAllClasses(pageable);

        return ResponseEntity.ok(ApiResponse.success(classes));
    }

    @GetMapping("/semester/{semesterId}")
    public ResponseEntity<ApiResponse<List<ClassResponse>>> getClassesBySemester(
            @PathVariable Long semesterId) {

        log.info("REST request to get classes by semester: {}", semesterId);

        List<ClassResponse> classes = classService.getClassesBySemester(semesterId);

        return ResponseEntity.ok(ApiResponse.success(classes));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<ApiResponse<List<ClassResponse>>> getClassesByTeacher(
            @PathVariable Long teacherId) {

        log.info("REST request to get classes by teacher: {}", teacherId);

        List<ClassResponse> classes = classService.getClassesByTeacher(teacherId);

        return ResponseEntity.ok(ApiResponse.success(classes));
    }

    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<ApiResponse<List<ClassResponse>>> getClassesBySubject(
            @PathVariable Long subjectId) {

        log.info("REST request to get classes by subject: {}", subjectId);

        List<ClassResponse> classes = classService.getClassesBySubject(subjectId);

        return ResponseEntity.ok(ApiResponse.success(classes));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ClassResponse>>> searchClasses(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("REST request to search classes with keyword: '{}'", keyword);

        Pageable pageable = PageRequest.of(page, size);
        Page<ClassResponse> classes = classService.searchClasses(keyword, pageable);

        return ResponseEntity.ok(ApiResponse.success(classes));
    }

    // ==================== STUDENT ENROLLMENT MANAGEMENT ====================

    /**
     * Manually enroll a student to a class (Admin only)
     * For special cases: late enrollment, transfer, makeup class
     */
    @PostMapping("/{classId}/students/enroll")
    public ResponseEntity<ApiResponse<CourseRegistrationResponse>> manuallyEnrollStudent(
            @PathVariable Long classId,
            @Valid @RequestBody ManualEnrollRequest request) {

        log.info("REST request to manually enroll student {} to class {}",
                request.getStudentId(), classId);

        CourseRegistrationResponse response = enrollmentService.manuallyEnrollStudent(classId, request);

        return ResponseEntity.ok(ApiResponse.success(
                "Student enrolled successfully",
                response
        ));
    }

    /**
     * Drop a student from a class (Admin only)
     */
    @DeleteMapping("/{classId}/students/{studentId}")
    public ResponseEntity<ApiResponse<String>> dropStudent(
            @PathVariable Long classId,
            @PathVariable Long studentId,
            @RequestParam(required = false) String reason) {

        log.info("REST request to drop student {} from class {}", studentId, classId);

        enrollmentService.dropStudent(classId, studentId, reason);

        return ResponseEntity.ok(ApiResponse.success("Student dropped from class successfully"));
    }

    /**
     * Get all students in a class
     */
    @GetMapping("/{classId}/students")
    public ResponseEntity<ApiResponse<List<CourseRegistrationResponse>>> getStudentsInClass(
            @PathVariable Long classId) {

        log.info("REST request to get students in class {}", classId);

        List<CourseRegistrationResponse> students = enrollmentService.getStudentsInClass(classId);

        return ResponseEntity.ok(ApiResponse.success(students));
    }

    /**
     * Get all manual enrollments (for audit)
     */
    @GetMapping("/manual-enrollments")
    public ResponseEntity<ApiResponse<List<CourseRegistrationResponse>>> getManualEnrollments() {
        log.info("REST request to get all manual enrollments");

        List<CourseRegistrationResponse> enrollments = enrollmentService.getManualEnrollments();

        return ResponseEntity.ok(ApiResponse.success(enrollments));
    }
}