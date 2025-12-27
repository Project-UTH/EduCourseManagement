package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.ClassSession;
import vn.edu.uth.ecms.entity.SessionStatus;
import vn.edu.uth.ecms.entity.SessionType;
import vn.edu.uth.ecms.entity.TimeSlot;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

/**
 * Repository for ClassSession
 */
@Repository
public interface ClassSessionRepository extends JpaRepository<ClassSession, Long> {

    // ==================== BASIC QUERIES ====================

    /**
     * Find all sessions for a class
     */
    @Query("SELECT s FROM ClassSession s WHERE s.classEntity.classId = :classId ORDER BY s.sessionNumber ASC")
    List<ClassSession> findByClass(@Param("classId") Long classId);

    /**
     * Find all IN_PERSON sessions for a class
     */
    @Query("SELECT s FROM ClassSession s " +
            "WHERE s.classEntity.classId = :classId " +
            "AND s.sessionType = :sessionType " +
            "ORDER BY s.sessionNumber ASC")
    List<ClassSession> findByClassAndType(
            @Param("classId") Long classId,
            @Param("sessionType") SessionType sessionType
    );

    /**
     * Find all rescheduled sessions for a class
     */
    @Query("SELECT s FROM ClassSession s " +
            "WHERE s.classEntity.classId = :classId " +
            "AND s.isRescheduled = true " +
            "ORDER BY s.sessionNumber ASC")
    List<ClassSession> findRescheduledSessions(@Param("classId") Long classId);

    // ==================== CONFLICT DETECTION FOR RESCHEDULING ====================

    /**
     * Check if teacher has conflict at specific time
     *
     * Used when rescheduling a session
     * Checks BOTH:
     * 1. Other classes' fixed sessions
     * 2. Other sessions that have been rescheduled to this time
     */
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END " +
            "FROM ClassSession s " +
            "WHERE s.classEntity.semester.semesterId = :semesterId " +
            "AND s.classEntity.teacher.teacherId = :teacherId " +
            "AND s.sessionType = 'IN_PERSON' " +
            "AND (" +
            "  (s.isRescheduled = false AND s.originalDate = :date AND s.originalDayOfWeek = :dayOfWeek AND s.originalTimeSlot = :timeSlot) " +
            "  OR " +
            "  (s.isRescheduled = true AND s.actualDate = :date AND s.actualDayOfWeek = :dayOfWeek AND s.actualTimeSlot = :timeSlot)" +
            ") " +
            "AND (:excludeSessionId IS NULL OR s.sessionId != :excludeSessionId)")
    boolean existsTeacherConflict(
            @Param("semesterId") Long semesterId,
            @Param("teacherId") Long teacherId,
            @Param("date") LocalDate date,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("timeSlot") TimeSlot timeSlot,
            @Param("excludeSessionId") Long excludeSessionId
    );

    /**
     * Check if room has conflict at specific time
     *
     * Same logic as teacher conflict but for rooms
     */
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END " +
            "FROM ClassSession s " +
            "WHERE s.classEntity.semester.semesterId = :semesterId " +
            "AND s.sessionType = 'IN_PERSON' " +
            "AND (" +
            "  (s.isRescheduled = false AND s.originalDate = :date AND s.originalDayOfWeek = :dayOfWeek AND s.originalTimeSlot = :timeSlot AND s.originalRoom = :room) " +
            "  OR " +
            "  (s.isRescheduled = true AND s.actualDate = :date AND s.actualDayOfWeek = :dayOfWeek AND s.actualTimeSlot = :timeSlot AND s.actualRoom = :room)" +
            ") " +
            "AND (:excludeSessionId IS NULL OR s.sessionId != :excludeSessionId)")
    boolean existsRoomConflict(
            @Param("semesterId") Long semesterId,
            @Param("room") String room,
            @Param("date") LocalDate date,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("timeSlot") TimeSlot timeSlot,
            @Param("excludeSessionId") Long excludeSessionId
    );

    // ==================== STATISTICS ====================

    /**
     * Count total sessions for a class
     */
    @Query("SELECT COUNT(s) FROM ClassSession s WHERE s.classEntity.classId = :classId")
    long countByClass(@Param("classId") Long classId);

    /**
     * Count sessions by type
     */
    @Query("SELECT COUNT(s) FROM ClassSession s WHERE s.classEntity.classId = :classId AND s.sessionType = :type")
    long countByClassAndType(
            @Param("classId") Long classId,
            @Param("type") SessionType type
    );

    /**
     * Count rescheduled sessions
     */
    @Query("SELECT COUNT(s) FROM ClassSession s WHERE s.classEntity.classId = :classId AND s.isRescheduled = true")
    long countRescheduledSessions(@Param("classId") Long classId);

    /**
     * Count completed sessions
     */
    @Query("SELECT COUNT(s) FROM ClassSession s WHERE s.classEntity.classId = :classId AND s.status = :status")
    long countByStatus(
            @Param("classId") Long classId,
            @Param("status") SessionStatus status
    );

    // ==================== UTILITY ====================

    /**
     * Delete all sessions for a class
     * Used when deleting a class
     */
    @Query("DELETE FROM ClassSession s WHERE s.classEntity.classId = :classId")
    void deleteByClass(@Param("classId") Long classId);

    /**
     * Find sessions by date range
     * Used for calendar view
     */
    @Query("SELECT s FROM ClassSession s " +
            "WHERE s.classEntity.classId = :classId " +
            "AND s.sessionType = 'IN_PERSON' " +
            "AND (" +
            "  (s.isRescheduled = false AND s.originalDate BETWEEN :startDate AND :endDate) " +
            "  OR " +
            "  (s.isRescheduled = true AND s.actualDate BETWEEN :startDate AND :endDate)" +
            ") " +
            "ORDER BY COALESCE(s.actualDate, s.originalDate) ASC")
    List<ClassSession> findByDateRange(
            @Param("classId") Long classId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}