package vn.edu.uth.ecms.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.uth.ecms.dto.request.StudentCreateRequest;
import vn.edu.uth.ecms.dto.request.StudentUpdateRequest;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.ImportResult;
import vn.edu.uth.ecms.dto.response.StudentResponse;
import vn.edu.uth.ecms.service.StudentService;

import java.io.ByteArrayOutputStream;
import java.util.List;

/**
 * REST Controller for Student management
 * Admin only endpoints
 */
@RestController
@RequestMapping("/api/admin/students")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class StudentController {

    private final StudentService studentService;

    /**
     * Create a new student
     * POST /api/admin/students
     */
    @PostMapping
    public ResponseEntity<ApiResponse<StudentResponse>> createStudent(
            @Valid @RequestBody StudentCreateRequest request) {
        log.info("REST request to create student: {}", request.getStudentCode());

        StudentResponse response = studentService.createStudent(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Update an existing student
     * PUT /api/admin/students/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentResponse>> updateStudent(
            @PathVariable Long id,
            @Valid @RequestBody StudentUpdateRequest request) {
        log.info("REST request to update student ID: {}", id);

        StudentResponse response = studentService.updateStudent(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Soft delete a student
     * DELETE /api/admin/students/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable Long id) {
        log.info("REST request to delete student ID: {}", id);

        studentService.deleteStudent(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Get student by ID
     * GET /api/admin/students/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentResponse>> getStudentById(@PathVariable Long id) {
        log.info("REST request to get student ID: {}", id);

        StudentResponse response = studentService.getStudentById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get all students with pagination
     * GET /api/admin/students?page=0&size=10&sortBy=fullName&sortDir=asc
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<StudentResponse>>> getAllStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fullName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        log.info("REST request to get all students - page: {}, size: {}, sortBy: {}, sortDir: {}",
                page, size, sortBy, sortDir);

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<StudentResponse> response = studentService.getAllStudents(pageable);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get active students only
     * GET /api/admin/students/active?page=0&size=10
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<Page<StudentResponse>>> getActiveStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("REST request to get active students - page: {}, size: {}", page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("fullName").ascending());
        Page<StudentResponse> response = studentService.getActiveStudents(pageable);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get students by major (no pagination)
     * GET /api/admin/students/by-major/{majorId}
     */
    @GetMapping("/by-major/{majorId}")
    public ResponseEntity<ApiResponse<List<StudentResponse>>> getStudentsByMajor(
            @PathVariable Long majorId) {
        log.info("REST request to get students by major ID: {}", majorId);

        List<StudentResponse> response = studentService.getStudentsByMajor(majorId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get students by major with pagination
     * GET /api/admin/students/by-major/{majorId}/page?page=0&size=10
     */
    @GetMapping("/by-major/{majorId}/page")
    public ResponseEntity<ApiResponse<Page<StudentResponse>>> getStudentsByMajorPaginated(
            @PathVariable Long majorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("REST request to get students by major ID: {} - page: {}, size: {}",
                majorId, page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("fullName").ascending());
        Page<StudentResponse> response = studentService.getStudentsByMajor(majorId, pageable);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get students by department (through major)
     * GET /api/admin/students/by-department/{departmentId}
     */
    @GetMapping("/by-department/{departmentId}")
    public ResponseEntity<ApiResponse<List<StudentResponse>>> getStudentsByDepartment(
            @PathVariable Long departmentId) {
        log.info("REST request to get students by department ID: {}", departmentId);

        List<StudentResponse> response = studentService.getStudentsByDepartment(departmentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get students by academic year
     * GET /api/admin/students/by-year/{academicYear}?page=0&size=10
     */
    @GetMapping("/by-year/{academicYear}")
    public ResponseEntity<ApiResponse<Page<StudentResponse>>> getStudentsByAcademicYear(
            @PathVariable Integer academicYear,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("REST request to get students by academic year: {} - page: {}, size: {}",
                academicYear, page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("fullName").ascending());
        Page<StudentResponse> response = studentService.getStudentsByAcademicYear(academicYear, pageable);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Search students by keyword
     * GET /api/admin/students/search?keyword=nguyen&page=0&size=10
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<StudentResponse>>> searchStudents(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("REST request to search students with keyword: '{}' - page: {}, size: {}",
                keyword, page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("fullName").ascending());
        Page<StudentResponse> response = studentService.searchStudents(keyword, pageable);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Import students from Excel file
     * POST /api/admin/students/import
     */
    @PostMapping("/import")
    public ResponseEntity<ApiResponse<ImportResult>> importStudents(
            @RequestParam("file") MultipartFile file) {
        log.info("REST request to import students from Excel file: {}", file.getOriginalFilename());

        try {
            ImportResult result = studentService.importFromExcel(file);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Error importing students: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi import: " + e.getMessage()));
        }
    }

    /**
     * Download Excel template for student import
     * GET /api/admin/students/import/template
     */
    @GetMapping("/import/template")
    public ResponseEntity<Resource> downloadStudentTemplate() {
        log.info("REST request to download student import template");

        try {
            ByteArrayOutputStream outputStream = studentService.generateImportTemplate();
            ByteArrayResource resource = new ByteArrayResource(outputStream.toByteArray());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=student_import_template.xlsx")
                    .contentType(MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
        } catch (Exception e) {
            log.error("Error generating template: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}