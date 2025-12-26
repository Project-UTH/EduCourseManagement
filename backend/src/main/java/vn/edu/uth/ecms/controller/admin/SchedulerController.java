package vn.edu.uth.ecms.controller.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.uth.ecms.config.SemesterScheduler;
import vn.edu.uth.ecms.dto.response.ApiResponse;

/**
 * Controller for manual scheduler triggers
 * For testing/debugging purposes
 */
//@RestController
//@RequestMapping("/api/admin/scheduler")
//@RequiredArgsConstructor
//@Slf4j
//@PreAuthorize("hasRole('ADMIN')")
//public class SchedulerController {
//
//    private final SemesterScheduler semesterScheduler;
//
//    /**
//     * Manually trigger semester status update
//     * POST /api/admin/scheduler/trigger-semester-update
//     *
//     * For testing without waiting for midnight
//     */
//    @PostMapping("/trigger-semester-update")
//    public ResponseEntity<ApiResponse<String>> triggerSemesterUpdate() {
//        log.info("REST request to manually trigger semester status update");
//
//        semesterScheduler.manualTrigger();
//
//        return ResponseEntity.ok(ApiResponse.success(
//                "Semester status update completed. Check logs for details."
//        ));
//    }
//}