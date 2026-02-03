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

    /**
     * @param sessionId Session ID
     * @param request Reschedule request (new date, time, room, reason)
     * @return Rescheduled session
     */
    @PutMapping("/{sessionId}/reschedule")
    public ResponseEntity<ApiResponse<ClassSessionResponse>> rescheduleSession(
            @PathVariable Long sessionId,
            @Valid @RequestBody RescheduleSessionRequest request) {

        log.info(" Rescheduling session {}", sessionId);

        ClassSessionResponse response = sessionService.rescheduleSession(sessionId, request);

        return ResponseEntity.ok(
                ApiResponse.success("Session rescheduled successfully", response)
        );
    }

    /**
     * @param request Batch reschedule request
     * @return List of rescheduled sessions
     */
    @PutMapping("/batch-reschedule")
    public ResponseEntity<ApiResponse<List<ClassSessionResponse>>> batchReschedule(
            @Valid @RequestBody BatchRescheduleRequest request) {

        log.info(" Batch rescheduling {} sessions", request.getSessionIds().size());

        List<ClassSessionResponse> responses = sessionService.rescheduleSessions(request);

        return ResponseEntity.ok(
                ApiResponse.success(
                        responses.size() + " session(s) rescheduled",
                        responses
                )
        );
    }

    /**
     * @param sessionId Session ID
     * @return Reset session
     */
    @PutMapping("/{sessionId}/reset")
    public ResponseEntity<ApiResponse<ClassSessionResponse>> resetToOriginal(
            @PathVariable Long sessionId) {

        log.info(" Resetting session {} to original", sessionId);

        ClassSessionResponse response = sessionService.resetToOriginal(sessionId);

        return ResponseEntity.ok(
                ApiResponse.success("Session reset to original schedule", response)
        );
    }

    /**
     * @param sessionId Session ID
     * @return Updated session
     */
    @PutMapping("/{sessionId}/complete")
    public ResponseEntity<ApiResponse<ClassSessionResponse>> markAsCompleted(
            @PathVariable Long sessionId) {

        log.info(" Marking session {} as completed", sessionId);

        ClassSessionResponse response = sessionService.markAsCompleted(sessionId);

        return ResponseEntity.ok(
                ApiResponse.success("Session marked as completed", response)
        );
    }

    /**
     * @param sessionId Session ID
     * @param reason Cancellation reason (optional)
     * @return Updated session
     */
    @PutMapping("/{sessionId}/cancel")
    public ResponseEntity<ApiResponse<ClassSessionResponse>> markAsCancelled(
            @PathVariable Long sessionId,
            @RequestParam(required = false) String reason) {

        log.info(" Cancelling session {}: {}", sessionId, reason);

        ClassSessionResponse response = sessionService.markAsCancelled(sessionId, reason);

        return ResponseEntity.ok(
                ApiResponse.success("Session cancelled", response)
        );
    }


    /**
     * @param sessionId Session ID
     * @return Session details
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<ClassSessionResponse>> getSessionById(
            @PathVariable Long sessionId) {

        log.debug("Getting session {}", sessionId);

        ClassSessionResponse session = sessionService.getSessionById(sessionId);

        return ResponseEntity.ok(ApiResponse.success(session));
    }

    /**
     * @param classId Class ID
     * @return List of all sessions
     */
    @GetMapping("/class/{classId}")
    public ResponseEntity<ApiResponse<List<ClassSessionResponse>>> getSessionsByClass(
            @PathVariable Long classId) {

        log.debug("Getting all sessions for class {}", classId);

        List<ClassSessionResponse> sessions = sessionService.getSessionsByClass(classId);

        return ResponseEntity.ok(
                ApiResponse.success(sessions.size() + " session(s) found", sessions)
        );
    }

    /**
     * @param classId Class ID
     * @return List of in-person sessions
     */
    @GetMapping("/class/{classId}/in-person")
    public ResponseEntity<ApiResponse<List<ClassSessionResponse>>> getInPersonSessions(
            @PathVariable Long classId) {

        log.debug("Getting in-person sessions for class {}", classId);

        List<ClassSessionResponse> sessions = sessionService.getInPersonSessions(classId);

        return ResponseEntity.ok(
                ApiResponse.success(sessions.size() + " in-person session(s)", sessions)
        );
    }

    /**
     * @param classId Class ID
     * @return List of e-learning sessions
     */
    @GetMapping("/class/{classId}/e-learning")
    public ResponseEntity<ApiResponse<List<ClassSessionResponse>>> getELearningSessions(
            @PathVariable Long classId) {

        log.debug("Getting e-learning sessions for class {}", classId);

        List<ClassSessionResponse> sessions = sessionService.getELearningSessions(classId);

        return ResponseEntity.ok(
                ApiResponse.success(sessions.size() + " e-learning session(s)", sessions)
        );
    }

    /**
     * @param classId Class ID
     * @return List of rescheduled sessions
     */
    @GetMapping("/class/{classId}/rescheduled")
    public ResponseEntity<ApiResponse<List<ClassSessionResponse>>> getRescheduledSessions(
            @PathVariable Long classId) {

        log.debug("Getting rescheduled sessions for class {}", classId);

        List<ClassSessionResponse> sessions = sessionService.getRescheduledSessions(classId);

        return ResponseEntity.ok(
                ApiResponse.success(sessions.size() + " rescheduled session(s)", sessions)
        );
    }
}