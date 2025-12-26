package vn.edu.uth.ecms.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.request.SemesterCreateRequest;
import vn.edu.uth.ecms.dto.request.SemesterUpdateRequest;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.SemesterResponse;
import vn.edu.uth.ecms.service.SemesterService;

import java.time.LocalDate;

/**
 * REST Controller for Semester management
 * Admin only endpoints
 *
 * CRITICAL ENDPOINTS:
 * - POST /activate/{id} - Activate semester (only ONE active)
 * - POST /enable-registration/{id} - Enable registration
 * - GET /registration-open - Get semester accepting registrations (for students)
 */
@RestController
@RequestMapping("/api/admin/semesters")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class SemesterController {

    private final SemesterService semesterService;

    // ==================== CRUD OPERATIONS ====================

    /**
     * Create a new semester
     * POST /api/admin/semesters
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SemesterResponse>> createSemester(
            @Valid @RequestBody SemesterCreateRequest request) {
        log.info("REST request to create semester: {}", request.getSemesterCode());

        SemesterResponse response = semesterService.createSemester(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Update an existing semester
     * PUT /api/admin/semesters/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SemesterResponse>> updateSemester(
            @PathVariable Long id,
            @Valid @RequestBody SemesterUpdateRequest request) {
        log.info("REST request to update semester ID: {}", id);

        SemesterResponse response = semesterService.updateSemester(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Delete a semester
     * DELETE /api/admin/semesters/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSemester(@PathVariable Long id) {
        log.info("REST request to delete semester ID: {}", id);

        semesterService.deleteSemester(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Get semester by ID
     * GET /api/admin/semesters/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SemesterResponse>> getSemesterById(@PathVariable Long id) {
        log.info("REST request to get semester ID: {}", id);

        SemesterResponse response = semesterService.getSemesterById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get all semesters with pagination
     * GET /api/admin/semesters?page=0&size=10&sortBy=startDate&sortDir=desc
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<SemesterResponse>>> getAllSemesters(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "startDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        log.info("REST request to get all semesters - page: {}, size: {}", page, size);

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<SemesterResponse> response = semesterService.getAllSemesters(pageable);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Search semesters by keyword
     * GET /api/admin/semesters/search?keyword=2024&page=0&size=10
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<SemesterResponse>>> searchSemesters(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("REST request to search semesters with keyword: '{}'", keyword);

        Pageable pageable = PageRequest.of(page, size, Sort.by("startDate").descending());
        Page<SemesterResponse> response = semesterService.searchSemesters(keyword, pageable);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ==================== STATUS MANAGEMENT ====================

    /**
     * Activate a semester
     * POST /api/admin/semesters/{id}/activate
     *
     * CRITICAL: Auto-completes current ACTIVE semester before activating this one
     */
    @PostMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<SemesterResponse>> activateSemester(@PathVariable Long id) {
        log.info("REST request to activate semester ID: {}", id);

        SemesterResponse response = semesterService.activateSemester(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Complete a semester
     * POST /api/admin/semesters/{id}/complete
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<SemesterResponse>> completeSemester(@PathVariable Long id) {
        log.info("REST request to complete semester ID: {}", id);

        SemesterResponse response = semesterService.completeSemester(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get current ACTIVE semester
     * GET /api/admin/semesters/current
     */
    @GetMapping("/current")
    public ResponseEntity<ApiResponse<SemesterResponse>> getCurrentSemester() {
        log.info("REST request to get current ACTIVE semester");

        SemesterResponse response = semesterService.getCurrentSemester();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get semester with OPEN registration (for students)
     * GET /api/admin/semesters/registration-open
     *
     * This endpoint can be called by STUDENTS to check if registration is available
     */
    @GetMapping("/registration-open")
    @PreAuthorize("permitAll()")  // Allow students to call this
    public ResponseEntity<ApiResponse<SemesterResponse>> getRegistrationOpenSemester() {
        log.info("REST request to get semester with OPEN registration");

        SemesterResponse response = semesterService.getRegistrationOpenSemester();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ==================== REGISTRATION CONTROL ====================

    /**
     * Enable registration for a semester
     * POST /api/admin/semesters/{id}/enable-registration
     *
     * Requirements:
     * - Semester must be ACTIVE
     * - Registration period must be set
     */
    @PostMapping("/{id}/enable-registration")
    public ResponseEntity<ApiResponse<SemesterResponse>> enableRegistration(@PathVariable Long id) {
        log.info("REST request to enable registration for semester ID: {}", id);

        SemesterResponse response = semesterService.enableRegistration(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Disable registration for a semester
     * POST /api/admin/semesters/{id}/disable-registration
     */
    @PostMapping("/{id}/disable-registration")
    public ResponseEntity<ApiResponse<SemesterResponse>> disableRegistration(@PathVariable Long id) {
        log.info("REST request to disable registration for semester ID: {}", id);

        SemesterResponse response = semesterService.disableRegistration(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Update registration period for a semester
     * PUT /api/admin/semesters/{id}/registration-period
     */
    @PutMapping("/{id}/registration-period")
    public ResponseEntity<ApiResponse<SemesterResponse>> updateRegistrationPeriod(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate registrationStartDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate registrationEndDate) {
        log.info("REST request to update registration period for semester ID: {}", id);

        SemesterResponse response = semesterService.updateRegistrationPeriod(
                id, registrationStartDate, registrationEndDate);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Check if registration is open for a semester
     * GET /api/admin/semesters/{id}/is-registration-open
     */
    @GetMapping("/{id}/is-registration-open")
    @PreAuthorize("permitAll()")  // Allow students to call this
    public ResponseEntity<ApiResponse<Boolean>> isRegistrationOpen(@PathVariable Long id) {
        log.info("REST request to check if registration is open for semester ID: {}", id);

        boolean isOpen = semesterService.isRegistrationOpen(id);
        return ResponseEntity.ok(ApiResponse.success(isOpen));
    }
}