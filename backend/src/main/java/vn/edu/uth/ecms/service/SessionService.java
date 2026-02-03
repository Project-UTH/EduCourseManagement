package vn.edu.uth.ecms.service;

import vn.edu.uth.ecms.dto.request.BatchRescheduleRequest;
import vn.edu.uth.ecms.dto.request.RescheduleSessionRequest;
import vn.edu.uth.ecms.dto.response.ClassSessionResponse;
import vn.edu.uth.ecms.dto.response.SubjectResponse;
import vn.edu.uth.ecms.entity.TimeSlot;
import vn.edu.uth.ecms.exception.BadRequestException;
import vn.edu.uth.ecms.exception.ConflictException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;


public interface SessionService {


    /**
     
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
     * @param request List of session IDs and new schedule
     * @return List of successfully rescheduled sessions
     */
    List<ClassSessionResponse> rescheduleSessions(BatchRescheduleRequest request);

    /**
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
// Thêm dòng này nếu chưa có

    /**
     * Get session by ID
     */
    ClassSessionResponse getSessionById(Long sessionId);

   

    /**
     * Mark session as completed
     */
    ClassSessionResponse markAsCompleted(Long sessionId);

    /**
     * Mark session as cancelled
     */
    ClassSessionResponse markAsCancelled(Long sessionId, String reason);

   

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