package vn.edu.uth.ecms.controller.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.StudentResponse;
import vn.edu.uth.ecms.service.EligibleStudentService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/admin/classes")
@RequiredArgsConstructor
@Slf4j
public class EligibleStudentController {

    private final EligibleStudentService eligibleStudentService;

    /**
     * @param classId Class ID
     * @return List of eligible students
     */
    @GetMapping("/{classId}/eligible-students")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<StudentResponse>>> getEligibleStudents(
            @PathVariable Long classId) {

        log.info(" GET /api/admin/classes/{}/eligible-students", classId);

        try {
            List<StudentResponse> students = eligibleStudentService
                    .getEligibleStudentsForClass(classId);

            String message = students.isEmpty()
                    ? "No eligible students found"
                    : students.size() + " eligible students found";

            return ResponseEntity.ok(
                    ApiResponse.<List<StudentResponse>>builder()
                            .success(true)
                            .message(message)
                            .data(students)
                            .build()
            );
        } catch (Exception e) {
            log.error(" Error getting eligible students: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    ApiResponse.<List<StudentResponse>>builder()
                            .success(false)
                            .message("Failed to get eligible students: " + e.getMessage())
                            .build()
            );
        }
    }

    /**
     * @param classId Class ID
     * @param studentId Student ID
     * @return Eligibility status
     */
    @GetMapping("/{classId}/check-eligibility/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkEligibility(
            @PathVariable Long classId,
            @PathVariable Long studentId) {

        log.info(" GET /api/admin/classes/{}/check-eligibility/{}", classId, studentId);

        try {
            boolean isEligible = eligibleStudentService.isStudentEligible(studentId, classId);
            String info = eligibleStudentService.getEligibilityInfo(classId);

            Map<String, Object> result = new HashMap<>();
            result.put("eligible", isEligible);
            result.put("eligibilityInfo", info);

            return ResponseEntity.ok(
                    ApiResponse.<Map<String, Object>>builder()
                            .success(true)
                            .message(isEligible ? "Student is eligible" : "Student is not eligible")
                            .data(result)
                            .build()
            );
        } catch (Exception e) {
            log.error(" Error checking eligibility: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    ApiResponse.<Map<String, Object>>builder()
                            .success(false)
                            .message("Failed to check eligibility: " + e.getMessage())
                            .build()
            );
        }
    }

    /**
     * @param classId Class ID
     * @return Eligibility description
     */
    @GetMapping("/{classId}/eligibility-info")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> getEligibilityInfo(
            @PathVariable Long classId) {

        log.info(" GET /api/admin/classes/{}/eligibility-info", classId);

        try {
            String info = eligibleStudentService.getEligibilityInfo(classId);

            return ResponseEntity.ok(
                    ApiResponse.<String>builder()
                            .success(true)
                            .message("Eligibility info retrieved")
                            .data(info)
                            .build()
            );
        } catch (Exception e) {
            log.error(" Error getting eligibility info: {}", e.getMessage());
            return ResponseEntity.badRequest().body(
                    ApiResponse.<String>builder()
                            .success(false)
                            .message("Failed to get eligibility info: " + e.getMessage())
                            .build()
            );
        }
    }
}