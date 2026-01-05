package vn.edu.uth.ecms.controller.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.service.SemesterActivationService;

@RestController
@RequestMapping("/api/admin/semesters")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminSemesterController {

    private final SemesterActivationService activationService;

    /**
     * Start semester - Generate schedules for PENDING sessions
     */
    @PostMapping("/{semesterId}/start")
    public ResponseEntity<ApiResponse<String>> startSemester(@PathVariable Long semesterId) {
        log.info("🚀 Admin starting semester ID: {}", semesterId);
        
        activationService.startSemester(semesterId);
        
        return ResponseEntity.ok(
                ApiResponse.success("Semester started successfully", null)
        );
    }
}