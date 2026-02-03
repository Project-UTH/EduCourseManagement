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
import vn.edu.uth.ecms.dto.request.DepartmentCreateRequest;
import vn.edu.uth.ecms.dto.request.DepartmentUpdateRequest;
import vn.edu.uth.ecms.dto.response.DepartmentResponse;
import vn.edu.uth.ecms.service.DepartmentService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Department management (Admin only)
 * Phase 3 Sprint 3.1
 */
@RestController
@RequestMapping("/api/admin/departments")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createDepartment(
            @Valid @RequestBody DepartmentCreateRequest request) {

        log.info("REST request to create department: {}", request.getDepartmentCode());

        DepartmentResponse response = departmentService.createDepartment(request);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Department created successfully");
        result.put("data", response);

        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

   
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentUpdateRequest request) {

        log.info("REST request to update department ID: {}", id);

        DepartmentResponse response = departmentService.updateDepartment(id, request);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Department updated successfully");
        result.put("data", response);

        return ResponseEntity.ok(result);
    }

    /**
     * Delete a department
     * DELETE /api/admin/departments/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteDepartment(@PathVariable Long id) {
        log.info("REST request to delete department ID: {}", id);

        departmentService.deleteDepartment(id);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Department deleted successfully");

        return ResponseEntity.ok(result);
    }

    /**
     * Get department by ID
     * GET /api/admin/departments/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDepartmentById(@PathVariable Long id) {
        log.info("REST request to get department ID: {}", id);

        DepartmentResponse response = departmentService.getDepartmentById(id);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", response);

        return ResponseEntity.ok(result);
    }

    /**
     * Get all departments with pagination
     * GET /api/admin/departments?page=0&size=10&sort=departmentName,asc
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllDepartments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "departmentName") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        log.info("REST request to get all departments - page: {}, size: {}", page, size);

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<DepartmentResponse> departments = departmentService.getAllDepartments(pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", departments.getContent());
        result.put("currentPage", departments.getNumber());
        result.put("totalPages", departments.getTotalPages());
        result.put("totalItems", departments.getTotalElements());

        return ResponseEntity.ok(result);
    }

    /**
     * Get all departments without pagination (for dropdown)
     * GET /api/admin/departments/all
     */
    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllDepartmentsNoPaging() {
        log.info("REST request to get all departments without pagination");

        List<DepartmentResponse> departments = departmentService.getAllDepartments();

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", departments);

        return ResponseEntity.ok(result);
    }

    /**
     * Search departments by keyword
     * GET /api/admin/departments/search?keyword=IT&page=0&size=10
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchDepartments(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("REST request to search departments with keyword: {}", keyword);

        Pageable pageable = PageRequest.of(page, size);
        Page<DepartmentResponse> departments = departmentService.searchDepartments(keyword, pageable);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", departments.getContent());
        result.put("currentPage", departments.getNumber());
        result.put("totalPages", departments.getTotalPages());
        result.put("totalItems", departments.getTotalElements());

        return ResponseEntity.ok(result);
    }

    /**
     * Check if department code exists
     * GET /api/admin/departments/check-code?code=IT
     */
    @GetMapping("/check-code")
    public ResponseEntity<Map<String, Object>> checkDepartmentCode(
            @RequestParam String code) {

        boolean exists = departmentService.existsByDepartmentCode(code);

        Map<String, Object> result = new HashMap<>();
        result.put("exists", exists);

        return ResponseEntity.ok(result);
    }
}