package vn.edu.uth.ecms.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.request.ManualEnrollRequest;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.CourseRegistrationResponse;
import vn.edu.uth.ecms.service.EnrollmentService;

import java.util.List;

/**
 * Controller for enrollment management
 * Separate from ClassController for cleaner API structure
 * Handles: GET /api/admin/enrollments/class/{classId}
 *          POST /api/admin/enrollments/manual
 *          DELETE /api/admin/enrollments/class/{classId}/student/{studentId}
 */
@RestController
@RequestMapping("/api/admin/enrollments")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    /**
     * ✅ Get list of students enrolled in a class
     *
     * @param classId Class ID
     * @return List of registrations
     */
    @GetMapping("/class/{classId}")
    public ResponseEntity<ApiResponse<List<CourseRegistrationResponse>>> getStudentsInClass(
            @PathVariable Long classId) {

        log.info("📚 GET /api/admin/enrollments/class/{}", classId);

        try {
            List<CourseRegistrationResponse> students = enrollmentService.getStudentsInClass(classId);

            return ResponseEntity.ok(
                    ApiResponse.<List<CourseRegistrationResponse>>builder()
                            .success(true)
                            .message(students.size() + " students found in class")
                            .data(students)
                            .build()
            );
        } catch (Exception e) {
            log.error("❌ Error getting students in class {}: {}", classId, e.getMessage(), e);
            return ResponseEntity.status(500).body(
                    ApiResponse.<List<CourseRegistrationResponse>>builder()
                            .success(false)
                            .message("Error: " + e.getMessage())
                            .build()
            );
        }
    }

    /**
     * ✅ Manually enroll a student
     *
     * @param request Manual enrollment request
     * @return Registration response
     */
    @PostMapping("/manual")
    public ResponseEntity<ApiResponse<CourseRegistrationResponse>> manualEnroll(
            @Valid @RequestBody ManualEnrollRequest request) {

        log.info("📝 POST /api/admin/enrollments/manual - Class: {}, Student: {}",
                request.getClassId(), request.getStudentId());

        try {
            CourseRegistrationResponse result = enrollmentService.manuallyEnrollStudent(
                    request.getClassId(),
                    request
            );

            return ResponseEntity.ok(
                    ApiResponse.<CourseRegistrationResponse>builder()
                            .success(true)
                            .message("Student enrolled successfully")
                            .data(result)
                            .build()
            );
        } catch (Exception e) {
            log.error("❌ Error enrolling student: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                    ApiResponse.<CourseRegistrationResponse>builder()
                            .success(false)
                            .message("Error: " + e.getMessage())
                            .build()
            );
        }
    }

    /**
     * ✅ Remove student from class
     *
     * @param classId Class ID
     * @param studentId Student ID
     * @param reason Drop reason (optional)
     * @return Success response
     */
    @DeleteMapping("/class/{classId}/student/{studentId}")
    public ResponseEntity<ApiResponse<Void>> removeStudent(
            @PathVariable Long classId,
            @PathVariable Long studentId,
            @RequestParam(required = false) String reason) {

        log.info("🗑️ DELETE /api/admin/enrollments/class/{}/student/{}", classId, studentId);

        try {
            enrollmentService.dropStudent(classId, studentId, reason);

            return ResponseEntity.ok(
                    ApiResponse.<Void>builder()
                            .success(true)
                            .message("Student removed from class successfully")
                            .build()
            );
        } catch (Exception e) {
            log.error("❌ Error removing student: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                    ApiResponse.<Void>builder()
                            .success(false)
                            .message("Error: " + e.getMessage())
                            .build()
            );
        }
    }

    /**
     * ✅ Get all manual enrollments (for audit)
     *
     * @return List of manual enrollments
     */
    @GetMapping("/manual")
    public ResponseEntity<ApiResponse<List<CourseRegistrationResponse>>> getManualEnrollments() {

        log.info("📋 GET /api/admin/enrollments/manual");

        try {
            List<CourseRegistrationResponse> enrollments = enrollmentService.getManualEnrollments();

            return ResponseEntity.ok(
                    ApiResponse.<List<CourseRegistrationResponse>>builder()
                            .success(true)
                            .message(enrollments.size() + " manual enrollments found")
                            .data(enrollments)
                            .build()
            );
        } catch (Exception e) {
            log.error("❌ Error getting manual enrollments: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(
                    ApiResponse.<List<CourseRegistrationResponse>>builder()
                            .success(false)
                            .message("Error: " + e.getMessage())
                            .build()
            );
        }
    }
}