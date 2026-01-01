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
 * EnrollmentController - Admin enrollment management
 *
 * PURPOSE: Separate controller for enrollment operations
 * Cleaner API structure than mixing with ClassController
 *
 * ENDPOINTS:
 * - POST   /api/admin/enrollments/manual             - Manually enroll student
 * - DELETE /api/admin/enrollments/{registrationId}   - Drop student
 * - GET    /api/admin/enrollments/class/{classId}    - Get students in class
 * - GET    /api/admin/enrollments/manual             - Get all manual enrollments (audit)
 *
 * USE CASES:
 * - Manual enrollment: Late registration, transfer student, makeup class
 * - Drop student: Administrative withdrawal, disciplinary action
 * - Audit: Track all manual interventions for compliance
 */
@RestController
@RequestMapping("/api/admin/enrollments")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    // ==================== ENROLLMENT MANAGEMENT ====================

    /**
     * Manually enroll a student to a class
     *
     * USE CASES:
     * - Student missed registration period (late enrollment)
     * - Student transferring from another section
     * - Student taking makeup class
     * - Administrative override (prerequisite waiver)
     *
     * VALIDATIONS:
     * - Student not already enrolled
     * - Class not full (admin can override)
     * - No schedule conflict (strict check)
     * - Semester not COMPLETED
     *
     * @param request Manual enrollment request (classId, studentId, reason, note)
     * @return Registration details
     */
    @PostMapping("/manual")
    public ResponseEntity<ApiResponse<CourseRegistrationResponse>> manualEnroll(
            @Valid @RequestBody ManualEnrollRequest request) {

        log.info("📝 Manual enrollment - Class: {}, Student: {}, Reason: {}",
                request.getClassId(), request.getStudentId(), request.getReason());

        CourseRegistrationResponse result = enrollmentService.manuallyEnrollStudent(
                request.getClassId(),
                request
        );

        return ResponseEntity.ok(
                ApiResponse.success("Student manually enrolled", result)
        );
    }

    /**
     * Drop student from class
     *
     * USE CASES:
     * - Student request (within allowed period)
     * - Administrative withdrawal
     * - Disciplinary action
     * - Transfer to another section
     *
     * ACTIONS:
     * - Update registration status to DROPPED
     * - Decrement class enrollment count
     * - Delete student_schedule entries (cascade)
     * - Log reason for audit trail
     *
     * @param classId Class ID
     * @param studentId Student ID
     * @param reason Drop reason (optional, recommended for audit)
     * @return Success message
     */
    @DeleteMapping("/class/{classId}/student/{studentId}")
    public ResponseEntity<ApiResponse<Void>> dropStudent(
            @PathVariable Long classId,
            @PathVariable Long studentId,
            @RequestParam(required = false) String reason) {

        log.info("🗑️ Dropping student {} from class {} - Reason: {}",
                studentId, classId, reason != null ? reason : "Not specified");

        enrollmentService.dropStudent(classId, studentId, reason);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Student dropped from class")
                        .build()
        );
    }

    // ==================== QUERY ENDPOINTS ====================

    /**
     * Get list of students enrolled in a class
     *
     * RETURNS:
     * - Student info (ID, code, name, email)
     * - Major and department
     * - Enrollment metadata (registered date, type, status)
     * - Manual enrollment details (if applicable)
     *
     * @param classId Class ID
     * @return List of active registrations
     */
    @GetMapping("/class/{classId}")
    public ResponseEntity<ApiResponse<List<CourseRegistrationResponse>>> getStudentsInClass(
            @PathVariable Long classId) {

        log.debug("Getting students in class {}", classId);

        List<CourseRegistrationResponse> students = enrollmentService.getStudentsInClass(classId);

        return ResponseEntity.ok(
                ApiResponse.success(
                        students.size() + " student(s) enrolled",
                        students
                )
        );
    }

    /**
     * Get all manual enrollments across all classes
     *
     * PURPOSE: Audit trail and compliance reporting
     *
     * RETURNS:
     * - All enrollments with type = MANUAL
     * - Includes: student, class, reason, admin who enrolled
     * - Sorted by enrollment date (newest first)
     *
     * USE CASES:
     * - Monthly audit report
     * - Compliance review
     * - Identify enrollment patterns
     * - Verify admin actions
     *
     * @return List of all manual enrollments
     */
    @GetMapping("/manual")
    public ResponseEntity<ApiResponse<List<CourseRegistrationResponse>>> getManualEnrollments() {

        log.info("📋 Getting all manual enrollments (audit)");

        List<CourseRegistrationResponse> enrollments = enrollmentService.getManualEnrollments();

        return ResponseEntity.ok(
                ApiResponse.success(
                        enrollments.size() + " manual enrollment(s) found",
                        enrollments
                )
        );
    }
}