package vn.edu.uth.ecms.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.request.SemesterCreateRequest;
import vn.edu.uth.ecms.dto.request.SemesterUpdateRequest;
import vn.edu.uth.ecms.dto.response.SemesterResponse;
import vn.edu.uth.ecms.service.SemesterService;

import java.time.LocalDate;
import java.util.List;

/**
 * Semester Controller - Admin endpoints
 */
@RestController
@RequestMapping("/api/admin/semesters")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class SemesterController {

    private final SemesterService semesterService;

    /**
     * Create new semester
     */
    @PostMapping
    public ResponseEntity<SemesterResponse> createSemester(
            @Valid @RequestBody SemesterCreateRequest request) {
        log.info("[SemesterController] POST /api/admin/semesters - Create semester: {}", request.getSemesterCode());
        SemesterResponse response = semesterService.createSemester(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update semester
     */
    @PutMapping("/{id}")
    public ResponseEntity<SemesterResponse> updateSemester(
            @PathVariable Long id,
            @Valid @RequestBody SemesterUpdateRequest request) {
        log.info("[SemesterController] PUT /api/admin/semesters/{} - Update semester", id);
        SemesterResponse response = semesterService.updateSemester(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete semester
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSemester(@PathVariable Long id) {
        log.info("[SemesterController] DELETE /api/admin/semesters/{} - Delete semester", id);
        semesterService.deleteSemester(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get semester by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<SemesterResponse> getSemesterById(@PathVariable Long id) {
        log.info("[SemesterController] GET /api/admin/semesters/{} - Get semester", id);
        SemesterResponse response = semesterService.getSemesterById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all semesters
     */
    @GetMapping
    public ResponseEntity<List<SemesterResponse>> getAllSemesters() {
        log.info("[SemesterController] GET /api/admin/semesters - Get all semesters");
        List<SemesterResponse> responses = semesterService.getAllSemesters();
        return ResponseEntity.ok(responses);
    }

    /**
     * Activate semester (only one active at a time)
     */
    @PutMapping("/{id}/activate")
    public ResponseEntity<SemesterResponse> activateSemester(@PathVariable Long id) {
        log.info("[SemesterController] PUT /api/admin/semesters/{}/activate - Activate semester", id);
        SemesterResponse response = semesterService.activateSemester(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Complete semester
     */
    @PutMapping("/{id}/complete")
    public ResponseEntity<SemesterResponse> completeSemester(@PathVariable Long id) {
        log.info("[SemesterController] PUT /api/admin/semesters/{}/complete - Complete semester", id);
        SemesterResponse response = semesterService.completeSemester(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Toggle registration
     */
    @PutMapping("/{id}/registration")
    public ResponseEntity<SemesterResponse> toggleRegistration(
            @PathVariable Long id,
            @RequestParam Boolean enabled,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        log.info("[SemesterController] PUT /api/admin/semesters/{}/registration - Toggle registration: {}", id, enabled);
        SemesterResponse response = semesterService.toggleRegistration(id, enabled, startDate, endDate);
        return ResponseEntity.ok(response);
    }

    /**
     * Get current active semester
     */
    @GetMapping("/current")
    public ResponseEntity<SemesterResponse> getCurrentSemester() {
        log.info("[SemesterController] GET /api/admin/semesters/current - Get current semester");
        SemesterResponse response = semesterService.getCurrentSemester();
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Check if registration is open
     */
    @GetMapping("/registration-status")
    public ResponseEntity<Boolean> isRegistrationOpen() {
        log.info("[SemesterController] GET /api/admin/semesters/registration-status");
        boolean isOpen = semesterService.isRegistrationOpen();
        return ResponseEntity.ok(isOpen);
    }
}