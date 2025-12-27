package vn.edu.uth.ecms.service;

import vn.edu.uth.ecms.dto.request.BatchRescheduleRequest;
import vn.edu.uth.ecms.dto.request.RescheduleSessionRequest;
import vn.edu.uth.ecms.dto.response.ClassSessionResponse;
import vn.edu.uth.ecms.entity.TimeSlot;
import vn.edu.uth.ecms.exception.BadRequestException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

/**
 * Service interface for Session management
 *
 * MAIN RESPONSIBILITIES:
 * 1. Reschedule single or multiple sessions
 * 2. Reset sessions to original schedule
 * 3. Conflict detection for rescheduling
 * 4. Get sessions for display
 */
public interface SessionService {

    // ==================== RESCHEDULE OPERATIONS ====================

    /**
     * Reschedule a single session
     *
     * LOGIC:
     * 1. Find session
     * 2. Validate: only IN_PERSON sessions can be rescheduled
     * 3. Parse new schedule
     * 4. Validate new date within semester
     * 5. Check teacher conflict
     * 6. Check room conflict
     * 7. Update session: set actual* fields, isRescheduled = true
     * 8. Return updated session
     *
     * @param sessionId Session to reschedule
     * @param request New schedule
     * @return Rescheduled session
     * @throws BadRequestException if E_LEARNING session
     * @throws ConflictException if schedule conflict
     */
    ClassSessionResponse rescheduleSession(
            Long sessionId,
            RescheduleSessionRequest request
    );

    /**
     * Reschedule multiple sessions at once
     *
     * USE CASES:
     * - Move entire week to different room
     * - Change all sessions to different time
     *
     * BEHAVIOR:
     * - Continues on error (doesn't rollback all if one fails)
     * - Returns list of successfully rescheduled sessions
     * - Logs errors for failed sessions
     *
     * @param request List of session IDs and new schedule
     * @return List of successfully rescheduled sessions
     */
    List<ClassSessionResponse> rescheduleSessions(BatchRescheduleRequest request);

    /**
     * Reset session to original schedule
     *
     * LOGIC:
     * 1. Find session
     * 2. Clear actual* fields
     * 3. Set isRescheduled = false
     * 4. Clear rescheduleReason
     * 5. Return session
     *
     * @param sessionId Session to reset
     * @return Reset session
     */
    ClassSessionResponse resetToOriginal(Long sessionId);

    /**
     * Reset multiple sessions to original
     *
     * @param sessionIds List of session IDs
     * @return List of reset sessions
     */
    List<ClassSessionResponse> resetMultipleToOriginal(List<Long> sessionIds);

    // ==================== QUERY OPERATIONS ====================

    /**
     * Get all sessions for a class
     * Ordered by session number
     */
    List<ClassSessionResponse> getSessionsByClass(Long classId);

    /**
     * Get only IN_PERSON sessions
     */
    List<ClassSessionResponse> getInPersonSessions(Long classId);

    /**
     * Get only E_LEARNING sessions
     */
    List<ClassSessionResponse> getELearningSessions(Long classId);

    /**
     * Get only rescheduled sessions
     */
    List<ClassSessionResponse> getRescheduledSessions(Long classId);

    /**
     * Get session by ID
     */
    ClassSessionResponse getSessionById(Long sessionId);

    // ==================== CONFLICT DETECTION ====================

    /**
     * Check if rescheduling would cause conflict
     *
     * Checks BOTH:
     * 1. Fixed schedules from ClassEntity
     * 2. Rescheduled sessions from other classes
     *
     * @param semesterId Semester
     * @param teacherId Teacher
     * @param date New date
     * @param dayOfWeek New day of week
     * @param timeSlot New time slot
     * @param room New room
     * @param excludeSessionId Exclude this session (for update)
     * @return true if conflict exists
     */
    boolean hasScheduleConflict(
            Long semesterId,
            Long teacherId,
            LocalDate date,
            DayOfWeek dayOfWeek,
            TimeSlot timeSlot,
            String room,
            Long excludeSessionId
    );

    // ==================== STATUS MANAGEMENT ====================

    /**
     * Mark session as completed
     */
    ClassSessionResponse markAsCompleted(Long sessionId);

    /**
     * Mark session as cancelled
     */
    ClassSessionResponse markAsCancelled(Long sessionId, String reason);

    // ==================== STATISTICS ====================

    /**
     * Count total sessions for a class
     */
    long countTotalSessions(Long classId);

    /**
     * Count rescheduled sessions
     */
    long countRescheduledSessions(Long classId);

    /**
     * Count completed sessions
     */
    long countCompletedSessions(Long classId);
}