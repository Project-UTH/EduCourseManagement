package vn.edu.uth.ecms.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.request.BatchRescheduleRequest;
import vn.edu.uth.ecms.dto.request.RescheduleSessionRequest;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.ClassSessionResponse;
import vn.edu.uth.ecms.service.SessionService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/sessions")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class SessionController {

    private final SessionService sessionService;

    @PutMapping("/{sessionId}/reschedule")
    public ResponseEntity<ApiResponse<ClassSessionResponse>> rescheduleSession(
            @PathVariable Long sessionId,
            @Valid @RequestBody RescheduleSessionRequest request) {

        log.info("REST request to reschedule session ID: {}", sessionId);

        ClassSessionResponse response = sessionService.rescheduleSession(sessionId, request);

        return ResponseEntity.ok(ApiResponse.success("Session rescheduled successfully", response));
    }

    @PutMapping("/batch-reschedule")
    public ResponseEntity<ApiResponse<List<ClassSessionResponse>>> rescheduleSessions(
            @Valid @RequestBody BatchRescheduleRequest request) {

        log.info("REST request to batch reschedule {} sessions", request.getSessionIds().size());

        List<ClassSessionResponse> responses = sessionService.rescheduleSessions(request);

        return ResponseEntity.ok(ApiResponse.success(
                responses.size() + " sessions rescheduled successfully",
                responses
        ));
    }

    @PutMapping("/{sessionId}/reset")
    public ResponseEntity<ApiResponse<ClassSessionResponse>> resetToOriginal(
            @PathVariable Long sessionId) {

        log.info("REST request to reset session {} to original", sessionId);

        ClassSessionResponse response = sessionService.resetToOriginal(sessionId);

        return ResponseEntity.ok(ApiResponse.success("Session reset to original", response));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<ApiResponse<List<ClassSessionResponse>>> getSessionsByClass(
            @PathVariable Long classId) {

        log.info("REST request to get sessions for class ID: {}", classId);

        List<ClassSessionResponse> sessions = sessionService.getSessionsByClass(classId);

        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/class/{classId}/in-person")
    public ResponseEntity<ApiResponse<List<ClassSessionResponse>>> getInPersonSessions(
            @PathVariable Long classId) {

        log.info("REST request to get in-person sessions for class ID: {}", classId);

        List<ClassSessionResponse> sessions = sessionService.getInPersonSessions(classId);

        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/class/{classId}/e-learning")
    public ResponseEntity<ApiResponse<List<ClassSessionResponse>>> getELearningSessions(
            @PathVariable Long classId) {

        log.info("REST request to get e-learning sessions for class ID: {}", classId);

        List<ClassSessionResponse> sessions = sessionService.getELearningSessions(classId);

        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/class/{classId}/rescheduled")
    public ResponseEntity<ApiResponse<List<ClassSessionResponse>>> getRescheduledSessions(
            @PathVariable Long classId) {

        log.info("REST request to get rescheduled sessions for class ID: {}", classId);

        List<ClassSessionResponse> sessions = sessionService.getRescheduledSessions(classId);

        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<ClassSessionResponse>> getSessionById(
            @PathVariable Long sessionId) {

        log.info("REST request to get session ID: {}", sessionId);

        ClassSessionResponse session = sessionService.getSessionById(sessionId);

        return ResponseEntity.ok(ApiResponse.success(session));
    }

    @PutMapping("/{sessionId}/complete")
    public ResponseEntity<ApiResponse<ClassSessionResponse>> markAsCompleted(
            @PathVariable Long sessionId) {

        log.info("REST request to mark session {} as completed", sessionId);

        ClassSessionResponse response = sessionService.markAsCompleted(sessionId);

        return ResponseEntity.ok(ApiResponse.success("Session marked as completed", response));
    }

    @PutMapping("/{sessionId}/cancel")
    public ResponseEntity<ApiResponse<ClassSessionResponse>> markAsCancelled(
            @PathVariable Long sessionId,
            @RequestParam(required = false) String reason) {

        log.info("REST request to mark session {} as cancelled", sessionId);

        ClassSessionResponse response = sessionService.markAsCancelled(sessionId, reason);

        return ResponseEntity.ok(ApiResponse.success("Session marked as cancelled", response));
    }
}