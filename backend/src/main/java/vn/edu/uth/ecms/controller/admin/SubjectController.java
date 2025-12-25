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
import vn.edu.uth.ecms.dto.request.SubjectCreateRequest;
import vn.edu.uth.ecms.dto.request.SubjectUpdateRequest;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.SubjectResponse;
import vn.edu.uth.ecms.service.SubjectService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Subject management (Admin only)
 * Phase 3 Sprint 3.2
 *
 * FLAT RESPONSE STRUCTURE - consistent with Department & Major
 */
@RestController
@RequestMapping("/api/admin/subjects")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class SubjectController {

    private final SubjectService subjectService;

    /**
     * Create a new subject
     * POST /api/admin/subjects
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createSubject(
            @Valid @RequestBody SubjectCreateRequest request) {

        log.info("REST request to create subject: {}", request.getSubjectCode());

        SubjectResponse response = subjectService.createSubject(request);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Subject created successfully");
        result.put("data", response);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * Update an existing subject
     * PUT /api/admin/subjects/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateSubject(
            @PathVariable Long id,
            @Valid @RequestBody SubjectUpdateRequest request) {

        log.info("REST request to update subject ID: {}", id);

        SubjectResponse response = subjectService.updateSubject(id, request);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Subject updated successfully");
        result.put("data", response);

        return ResponseEntity.ok(result);
    }

    /**
     * Delete a subject
     * DELETE /api/admin/subjects/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteSubject(@PathVariable Long id) {
        log.info("REST request to delete subject ID: {}", id);

        subjectService.deleteSubject(id);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Subject deleted successfully");

        return ResponseEntity.ok(result);
    }

    /**
     * Get subject by ID
     * GET /api/admin/subjects/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getSubjectById(@PathVariable Long id) {
        log.info("REST request to get subject ID: {}", id);

        SubjectResponse response = subjectService.getSubjectById(id);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", response);

        return ResponseEntity.ok(result);
    }

    /**
     * Get all subjects with pagination
     * GET /api/admin/subjects?page=0&size=10&sortBy=subjectName&sortDir=asc
     *
     * FLAT RESPONSE STRUCTURE
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllSubjects(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "subjectName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        log.info("REST request to get all subjects - page: {}, size: {}", page, size);

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<SubjectResponse> subjects = subjectService.getAllSubjects(pageable);

        // FLAT RESPONSE - NOT NESTED
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", subjects.getContent());  // Array directly
        result.put("currentPage", subjects.getNumber());
        result.put("totalPages", subjects.getTotalPages());
        result.put("totalItems", subjects.getTotalElements());

        return ResponseEntity.ok(result);
    }

    /**
     * Get all subjects without pagination (for dropdown)
     * GET /api/admin/subjects/all
     */
    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllSubjectsNoPaging() {
        log.info("REST request to get all subjects without pagination");

        List<SubjectResponse> subjects = subjectService.getAllSubjects();

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", subjects);

        return ResponseEntity.ok(result);
    }

    /**
     * Get subjects by department ID
     * GET /api/admin/subjects/by-department/{departmentId}
     */
    @GetMapping("/by-department/{departmentId}")
    public ResponseEntity<Map<String, Object>> getSubjectsByDepartment(
            @PathVariable Long departmentId) {

        log.info("REST request to get subjects for department ID: {}", departmentId);

        List<SubjectResponse> subjects = subjectService.getSubjectsByDepartmentId(departmentId);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", subjects);
        result.put("totalItems", subjects.size());

        return ResponseEntity.ok(result);
    }

    /**
     * Search subjects by keyword
     * GET /api/admin/subjects/search?keyword=Web&page=0&size=10
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchSubjects(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("REST request to search subjects with keyword: {}", keyword);

        Pageable pageable = PageRequest.of(page, size);
        Page<SubjectResponse> subjects = subjectService.searchSubjects(keyword, pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", subjects.getContent());
        result.put("currentPage", subjects.getNumber());
        result.put("totalPages", subjects.getTotalPages());
        result.put("totalItems", subjects.getTotalElements());

        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/prerequisites")
    public ResponseEntity<ApiResponse<Void>> addPrerequisite(
            @PathVariable Long id,
            @RequestParam Long prerequisiteId) {
        log.info("[SubjectController] POST /api/admin/subjects/{}/prerequisites - prerequisiteId: {}",
                id, prerequisiteId);

        subjectService.addPrerequisite(id, prerequisiteId);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Prerequisite added successfully")
                .build());
    }

    @DeleteMapping("/{id}/prerequisites/{prerequisiteId}")
    public ResponseEntity<ApiResponse<Void>> removePrerequisite(
            @PathVariable Long id,
            @PathVariable Long prerequisiteId) {
        log.info("[SubjectController] DELETE /api/admin/subjects/{}/prerequisites/{}",
                id, prerequisiteId);

        subjectService.removePrerequisite(id, prerequisiteId);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true)
                .message("Prerequisite removed successfully")
                .build());
    }

    @GetMapping("/{id}/prerequisites")
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> getPrerequisites(
            @PathVariable Long id) {
        log.info("[SubjectController] GET /api/admin/subjects/{}/prerequisites", id);

        List<SubjectResponse> prerequisites = subjectService.getPrerequisites(id);

        return ResponseEntity.ok(ApiResponse.<List<SubjectResponse>>builder()
                .success(true)
                .message("Prerequisites retrieved successfully")
                .data(prerequisites)
                .build());
    }

    /**
     * Check if subject code exists
     * GET /api/admin/subjects/check-code?code=IT101
     */
    @GetMapping("/check-code")
    public ResponseEntity<Map<String, Object>> checkSubjectCode(
            @RequestParam String code) {

        boolean exists = subjectService.existsBySubjectCode(code);

        Map<String, Object> result = new HashMap<>();
        result.put("exists", exists);

        return ResponseEntity.ok(result);
    }
}