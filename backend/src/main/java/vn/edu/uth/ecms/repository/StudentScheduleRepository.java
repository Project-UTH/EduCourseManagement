package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.entity.StudentSchedule;
import vn.edu.uth.ecms.entity.TimeSlot;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

/**
 * Repository for StudentSchedule
 *
 * ✅ ULTRA MINIMAL VERSION
 * - Removed ALL problematic queries
 * - Only keep essential DELETE and COUNT
 * - All status/semester queries removed
 */
@Repository
public interface StudentScheduleRepository extends JpaRepository<StudentSchedule, Long> {

    // ==================== ESSENTIAL QUERIES ONLY ====================

    /**
     * Get all schedules for a student's class session
     */
    @Query("SELECT ss FROM StudentSchedule ss " +
            "WHERE ss.classSession.sessionId = :sessionId " +
            "ORDER BY ss.student.studentCode ASC")
    List<StudentSchedule> findByClassSession(@Param("sessionId") Long sessionId);

    // ==================== DELETE OPERATIONS ====================

    /**
     * ✅ DELETE: When student drops class
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.classSession.classEntity.classId = :classId")
    void deleteByStudentAndClass(
            @Param("studentId") Long studentId,
            @Param("classId") Long classId
    );

    /**
     * Delete all schedules for a session
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM StudentSchedule ss " +
            "WHERE ss.classSession.sessionId = :sessionId")
    void deleteBySession(@Param("sessionId") Long sessionId);

    // ==================== COUNT OPERATIONS ====================

    /**
     * Count schedules for student in class
     */
    @Query("SELECT COUNT(ss) FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.classSession.classEntity.classId = :classId")
    long countByStudentAndClass(
            @Param("studentId") Long studentId,
            @Param("classId") Long classId
    );

    @Query("SELECT COUNT(ss) FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.classSession.sessionId = :sessionId")
    long countByStudentAndSession(
            @Param("studentId") Long studentId,
            @Param("sessionId") Long sessionId
    );

    /**
     * Check if schedule exists
     */
    boolean existsByStudentStudentIdAndClassSessionSessionId(
            Long studentId,
            Long sessionId
    );

    /**
     * NEW: Check if student has schedule at specific date/time
     * CRITICAL for extra session conflict detection
     */
    @Query("SELECT CASE WHEN COUNT(ss) > 0 THEN true ELSE false END " +
            "FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.sessionDate = :date " +
            "AND ss.timeSlot = :timeSlot")
    boolean existsByStudentAndDateAndTimeSlot(
            @Param("studentId") Long studentId,
            @Param("date") LocalDate date,
            @Param("timeSlot") TimeSlot timeSlot
    );

    /**
     * NEW: Find schedules at specific date/time
     * Used to identify which class conflicts
     */
    @Query("SELECT ss FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.sessionDate = :date " +
            "AND ss.timeSlot = :timeSlot")
    List<StudentSchedule> findByStudentAndDateAndTimeSlot(
            @Param("studentId") Long studentId,
            @Param("date") LocalDate date,
            @Param("timeSlot") TimeSlot timeSlot
    );


}