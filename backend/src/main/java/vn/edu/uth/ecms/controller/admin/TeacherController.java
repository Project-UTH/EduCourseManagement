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
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.uth.ecms.dto.request.TeacherCreateRequest;
import vn.edu.uth.ecms.dto.request.TeacherUpdateRequest;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.ImportResult;
import vn.edu.uth.ecms.dto.response.TeacherResponse;
import vn.edu.uth.ecms.service.TeacherService;

import java.io.ByteArrayOutputStream;
import java.util.List;

/**
 * REST Controller for Teacher management (Admin only)
 */
@RestController
@RequestMapping("/api/admin/teachers")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class TeacherController {

    private final TeacherService teacherService;

    /**
     * Create a new teacher
     * POST /api/admin/teachers
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TeacherResponse>> createTeacher(
            @Valid @RequestBody TeacherCreateRequest request) {

        log.info("Creating teacher with citizen ID: {}", request.getCitizenId());
        TeacherResponse teacher = teacherService.createTeacher(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(teacher));
    }

    /**
     * Get all teachers with pagination and sorting
     * GET /api/admin/teachers?page=0&size=10&sortBy=fullName&sortDir=asc
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<TeacherResponse>>> getAllTeachers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "fullName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        log.info("Getting all teachers: page={}, size={}, sortBy={}, sortDir={}",
                page, size, sortBy, sortDir);

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<TeacherResponse> teachers = teacherService.getAllTeachers(pageable);

        return ResponseEntity.ok(ApiResponse.success(teachers));
    }

    /**
     * Get teacher by ID
     * GET /api/admin/teachers/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TeacherResponse>> getTeacherById(
            @PathVariable Long id) {

        log.info("Getting teacher by ID: {}", id);
        TeacherResponse teacher = teacherService.getTeacherById(id);

        return ResponseEntity.ok(ApiResponse.success(teacher));
    }

    /**
     * Get teachers by department
     * GET /api/admin/teachers/by-department/{departmentId}
     */
    @GetMapping("/by-department/{departmentId}")
    public ResponseEntity<ApiResponse<List<TeacherResponse>>> getTeachersByDepartment(
            @PathVariable Long departmentId) {

        log.info("Getting teachers by department ID: {}", departmentId);
        List<TeacherResponse> teachers = teacherService.getTeachersByDepartment(departmentId);

        return ResponseEntity.ok(ApiResponse.success(teachers));
    }

    /**
     * Get teachers by major
     * GET /api/admin/teachers/by-major/{majorId}
     */
    @GetMapping("/by-major/{majorId}")
    public ResponseEntity<ApiResponse<List<TeacherResponse>>> getTeachersByMajor(
            @PathVariable Long majorId) {

        log.info("Getting teachers by major ID: {}", majorId);
        List<TeacherResponse> teachers = teacherService.getTeachersByMajor(majorId);

        return ResponseEntity.ok(ApiResponse.success(teachers));
    }

    /**
     * Search teachers by keyword
     * GET /api/admin/teachers/search?keyword=nguyen&page=0&size=10
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<TeacherResponse>>> searchTeachers(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("Searching teachers with keyword: {}", keyword);

        Pageable pageable = PageRequest.of(page, size);
        Page<TeacherResponse> teachers = teacherService.searchTeachers(keyword, pageable);

        return ResponseEntity.ok(ApiResponse.success(teachers));
    }

    /**
     * Get active teachers only
     * GET /api/admin/teachers/active
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<TeacherResponse>>> getActiveTeachers() {

        log.info("Getting all active teachers");
        List<TeacherResponse> teachers = teacherService.getActiveTeachers();

        return ResponseEntity.ok(ApiResponse.success(teachers));
    }

    /**
     * Update teacher
     * PUT /api/admin/teachers/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TeacherResponse>> updateTeacher(
            @PathVariable Long id,
            @Valid @RequestBody TeacherUpdateRequest request) {

        log.info("Updating teacher with ID: {}", id);
        TeacherResponse teacher = teacherService.updateTeacher(id, request);

        return ResponseEntity.ok(ApiResponse.success(teacher));
    }

    /**
     * Delete teacher (soft delete)
     * DELETE /api/admin/teachers/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTeacher(@PathVariable Long id) {

        log.info("Deleting teacher with ID: {}", id);
        teacherService.deleteTeacher(id);

        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Import teachers from Excel file
     * POST /api/admin/teachers/import
     */
    @PostMapping("/import")
    public ResponseEntity<ApiResponse<ImportResult>> importTeachers(
            @RequestParam("file") MultipartFile file) {
        log.info("REST request to import teachers from Excel file: {}", file.getOriginalFilename());

        try {
            ImportResult result = teacherService.importFromExcel(file);
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (Exception e) {
            log.error("Error importing teachers: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Lỗi import: " + e.getMessage()));
        }
    }

    /**
     * Download Excel template for teacher import
     * GET /api/admin/teachers/import/template
     */
    @GetMapping("/import/template")
    public ResponseEntity<Resource> downloadTeacherTemplate() {
        log.info("REST request to download teacher import template");

        try {
            ByteArrayOutputStream outputStream = teacherService.generateImportTemplate();
            ByteArrayResource resource = new ByteArrayResource(outputStream.toByteArray());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=teacher_import_template.xlsx")
                    .contentType(MediaType.parseMediaType(
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(resource);
        } catch (Exception e) {
            log.error("Error generating template: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}