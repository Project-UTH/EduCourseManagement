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

@RestController
@RequestMapping("/api/admin/enrollments")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;


    /**
     * @param request
     * @return 
     */
    @PostMapping("/manual")
    public ResponseEntity<ApiResponse<CourseRegistrationResponse>> manualEnroll(
            @Valid @RequestBody ManualEnrollRequest request) {

        log.info(" Manual enrollment - Class: {}, Student: {}, Reason: {}",
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

        log.info(" Dropping student {} from class {} - Reason: {}",
                studentId, classId, reason != null ? reason : "Not specified");

        enrollmentService.dropStudent(classId, studentId, reason);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Student dropped from class")
                        .build()
        );
    }

    /**
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
     * @return 
     */
    @GetMapping("/manual")
    public ResponseEntity<ApiResponse<List<CourseRegistrationResponse>>> getManualEnrollments() {

        log.info(" Getting all manual enrollments (audit)");

        List<CourseRegistrationResponse> enrollments = enrollmentService.getManualEnrollments();

        return ResponseEntity.ok(
                ApiResponse.success(
                        enrollments.size() + " manual enrollment(s) found",
                        enrollments
                )
        );
    }
}