package vn.edu.uth.ecms.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
 * ⭐ FIXED: Added missing endpoints
 * - PUT /activate
 * - PUT /complete
 * - PUT /enable-registration
 * - PUT /disable-registration
 */
@RestController
@RequestMapping("/api/admin/semesters")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class SemesterController {

    private final SemesterService semesterService;

    // ==================== CRUD ====================

    @PostMapping
    public ResponseEntity<ApiResponse<SemesterResponse>> createSemester(
            @Valid @RequestBody SemesterCreateRequest request) {

        log.info("📝 POST /api/admin/semesters - Creating semester: {}", request.getSemesterCode());

        SemesterResponse response = semesterService.createSemester(request);

        return ResponseEntity.ok(ApiResponse.success(
                "Semester created successfully",
                response
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SemesterResponse>> updateSemester(
            @PathVariable Long id,
            @Valid @RequestBody SemesterUpdateRequest request) {

        log.info("✏️ PUT /api/admin/semesters/{} - Updating semester", id);

        SemesterResponse response = semesterService.updateSemester(id, request);

        return ResponseEntity.ok(ApiResponse.success(
                "Semester updated successfully",
                response
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSemester(@PathVariable Long id) {
        log.info("🗑️ DELETE /api/admin/semesters/{} - Deleting semester", id);

        semesterService.deleteSemester(id);

        return ResponseEntity.ok(ApiResponse.success(
                "Semester deleted successfully",
                null
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SemesterResponse>> getSemesterById(@PathVariable Long id) {
        log.info("📖 GET /api/admin/semesters/{}", id);

        SemesterResponse response = semesterService.getSemesterById(id);

        return ResponseEntity.ok(ApiResponse.success(
                "Semester retrieved successfully",
                response
        ));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<SemesterResponse>>> getAllSemesters(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("📚 GET /api/admin/semesters - page: {}, size: {}", page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<SemesterResponse> response = semesterService.getAllSemesters(pageable);

        return ResponseEntity.ok(ApiResponse.success(
                "Operation completed successfully",
                response
        ));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<SemesterResponse>>> searchSemesters(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("🔍 GET /api/admin/semesters/search?keyword={}", keyword);

        Pageable pageable = PageRequest.of(page, size);
        Page<SemesterResponse> response = semesterService.searchSemesters(keyword, pageable);

        return ResponseEntity.ok(ApiResponse.success(
                "Search completed",
                response
        ));
    }

    // ==================== STATUS MANAGEMENT (⭐ MISSING!) ====================

    /**
     * ⭐ ACTIVATE SEMESTER
     * - Auto-complete previous ACTIVE semester
     * - Activate new semester
     * - Auto-schedule ALL pending extra sessions
     */
    @PutMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<SemesterResponse>> activateSemester(@PathVariable Long id) {
        log.info("🚀 PUT /api/admin/semesters/{}/activate", id);

        SemesterResponse response = semesterService.activateSemester(id);

        return ResponseEntity.ok(ApiResponse.success(
                "Semester activated successfully. All pending extra sessions have been scheduled.",
                response
        ));
    }

    /**
     * ⭐ COMPLETE SEMESTER
     */
    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<SemesterResponse>> completeSemester(@PathVariable Long id) {
        log.info("✅ PUT /api/admin/semesters/{}/complete", id);

        SemesterResponse response = semesterService.completeSemester(id);

        return ResponseEntity.ok(ApiResponse.success(
                "Semester completed successfully",
                response
        ));
    }

    /**
     * ⭐ ENABLE REGISTRATION
     */
    @PutMapping("/{id}/enable-registration")
    public ResponseEntity<ApiResponse<SemesterResponse>> enableRegistration(@PathVariable Long id) {
        log.info("🔓 PUT /api/admin/semesters/{}/enable-registration", id);

        SemesterResponse response = semesterService.enableRegistration(id);

        return ResponseEntity.ok(ApiResponse.success(
                "Registration enabled successfully",
                response
        ));
    }

    /**
     * ⭐ DISABLE REGISTRATION
     */
    @PutMapping("/{id}/disable-registration")
    public ResponseEntity<ApiResponse<SemesterResponse>> disableRegistration(@PathVariable Long id) {
        log.info("🔒 PUT /api/admin/semesters/{}/disable-registration", id);

        SemesterResponse response = semesterService.disableRegistration(id);

        return ResponseEntity.ok(ApiResponse.success(
                "Registration disabled successfully",
                response
        ));
    }

    // ==================== QUERY ====================

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<SemesterResponse>> getCurrentSemester() {
        log.info("📅 GET /api/admin/semesters/current");

        SemesterResponse response = semesterService.getCurrentSemester();

        if (response == null) {
            return ResponseEntity.ok(ApiResponse.success(
                    "No active semester found",
                    null
            ));
        }

        return ResponseEntity.ok(ApiResponse.success(
                "Current semester retrieved",
                response
        ));
    }

    @GetMapping("/registration-open")
    public ResponseEntity<ApiResponse<SemesterResponse>> getRegistrationOpenSemester() {
        log.info("📝 GET /api/admin/semesters/registration-open");

        SemesterResponse response = semesterService.getRegistrationOpenSemester();

        if (response == null) {
            return ResponseEntity.ok(ApiResponse.success(
                    "No semester accepting registrations",
                    null
            ));
        }

        return ResponseEntity.ok(ApiResponse.success(
                "Registration-open semester retrieved",
                response
        ));
    }
}