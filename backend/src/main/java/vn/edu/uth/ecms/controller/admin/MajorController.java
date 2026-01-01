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
import vn.edu.uth.ecms.dto.request.MajorCreateRequest;
import vn.edu.uth.ecms.dto.request.MajorUpdateRequest;
import vn.edu.uth.ecms.dto.response.MajorResponse;
import vn.edu.uth.ecms.service.MajorService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Major management (Admin only)
 * Phase 3 Sprint 3.1
 */
@RestController
@RequestMapping("/api/admin/majors")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class MajorController {

    private final MajorService majorService;

    /**
     * Create a new major
     * POST /api/admin/majors
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createMajor(
            @Valid @RequestBody MajorCreateRequest request) {

        log.info("REST request to create major: {}", request.getMajorCode());

        MajorResponse response = majorService.createMajor(request);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Major created successfully");
        result.put("data", response);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * Update an existing major
     * PUT /api/admin/majors/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateMajor(
            @PathVariable Long id,
            @Valid @RequestBody MajorUpdateRequest request) {

        log.info("REST request to update major ID: {}", id);

        MajorResponse response = majorService.updateMajor(id, request);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Major updated successfully");
        result.put("data", response);

        return ResponseEntity.ok(result);
    }

    /**
     * Delete a major
     * DELETE /api/admin/majors/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteMajor(@PathVariable Long id) {
        log.info("REST request to delete major ID: {}", id);

        majorService.deleteMajor(id);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Major deleted successfully");

        return ResponseEntity.ok(result);
    }

    /**
     * Get major by ID
     * GET /api/admin/majors/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getMajorById(@PathVariable Long id) {
        log.info("REST request to get major ID: {}", id);

        MajorResponse response = majorService.getMajorById(id);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", response);

        return ResponseEntity.ok(result);
    }

    /**
     * Get all majors with pagination
     * GET /api/admin/majors?page=0&size=10&sort=majorName,asc
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllMajors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "majorName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        log.info("REST request to get all majors - page: {}, size: {}", page, size);

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<MajorResponse> majors = majorService.getAllMajors(pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", majors.getContent());
        result.put("currentPage", majors.getNumber());
        result.put("totalPages", majors.getTotalPages());
        result.put("totalItems", majors.getTotalElements());

        return ResponseEntity.ok(result);
    }

    /**
     * Get all majors without pagination (for dropdown)
     * GET /api/admin/majors/all
     */
    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllMajorsNoPaging() {
        log.info("REST request to get all majors without pagination");

        List<MajorResponse> majors = majorService.getAllMajors();

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", majors);

        return ResponseEntity.ok(result);
    }

    /**
     * Get majors by department ID
     * GET /api/admin/majors/by-department/{departmentId}
     */
    @GetMapping("/by-department/{departmentId}")
    public ResponseEntity<Map<String, Object>> getMajorsByDepartment(
            @PathVariable Long departmentId) {

        log.info("REST request to get majors for department ID: {}", departmentId);

        List<MajorResponse> majors = majorService.getMajorsByDepartmentId(departmentId);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", majors);

        return ResponseEntity.ok(result);
    }

    /**
     * Search majors by keyword
     * GET /api/admin/majors/search?keyword=CS&page=0&size=10
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchMajors(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("REST request to search majors with keyword: {}", keyword);

        Pageable pageable = PageRequest.of(page, size);
        Page<MajorResponse> majors = majorService.searchMajors(keyword, pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", majors.getContent());
        result.put("currentPage", majors.getNumber());
        result.put("totalPages", majors.getTotalPages());
        result.put("totalItems", majors.getTotalElements());

        return ResponseEntity.ok(result);
    }

    /**
     * Check if major code exists
     * GET /api/admin/majors/check-code?code=CS01
     */
    @GetMapping("/check-code")
    public ResponseEntity<Map<String, Object>> checkMajorCode(
            @RequestParam String code) {

        boolean exists = majorService.existsByMajorCode(code);

        Map<String, Object> result = new HashMap<>();
        result.put("exists", exists);

        return ResponseEntity.ok(result);
    }
}