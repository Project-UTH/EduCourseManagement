package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.entity.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

/**
 * Repository for StudentSchedule
 *
 * FIXED: MySQL syntax for date calculations
 */
@Repository
public interface StudentScheduleRepository extends JpaRepository<StudentSchedule, Long> {

    // ==================== CONFLICT DETECTION (CRITICAL) ====================

    /**
     * ✅ CRITICAL: Check if student has schedule conflict at specific date/time
     */
    @Query("SELECT CASE WHEN COUNT(ss) > 0 THEN true ELSE false END " +
            "FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.sessionDate = :sessionDate " +
            "AND ss.dayOfWeek = :dayOfWeek " +
            "AND ss.timeSlot = :timeSlot " +
            "AND ss.status IN ('SCHEDULED', 'ATTENDED')")
    boolean existsConflict(
            @Param("studentId") Long studentId,
            @Param("sessionDate") LocalDate sessionDate,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("timeSlot") TimeSlot timeSlot
    );

    // ==================== STUDENT TIMETABLE QUERIES ====================

    /**
     * Get all schedules for a student in a semester
     */
    @Query("SELECT ss FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.semester.semesterId = :semesterId " +
            "ORDER BY ss.sessionDate ASC, ss.timeSlot ASC")
    List<StudentSchedule> findByStudentAndSemester(
            @Param("studentId") Long studentId,
            @Param("semesterId") Long semesterId
    );

    /**
     * Get student's schedule for a specific date range
     */
    @Query("SELECT ss FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.sessionDate BETWEEN :startDate AND :endDate " +
            "ORDER BY ss.sessionDate ASC, ss.timeSlot ASC")
    List<StudentSchedule> findByStudentAndDateRange(
            @Param("studentId") Long studentId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Get student's schedule for a specific class
     */
    @Query("SELECT ss FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.classEntity.classId = :classId " +
            "ORDER BY ss.sessionDate ASC")
    List<StudentSchedule> findByStudentAndClass(
            @Param("studentId") Long studentId,
            @Param("classId") Long classId
    );

    /**
     * ✅ FIXED: Get upcoming schedules (next 7 days)
     * Using JPQL function with proper parameters
     */
    @Query("SELECT ss FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.sessionDate >= CURRENT_DATE " +
            "AND ss.sessionDate <= FUNCTION('DATE_ADD', CURRENT_DATE, 7, 'DAY') " +
            "AND ss.status = 'SCHEDULED' " +
            "ORDER BY ss.sessionDate ASC, ss.timeSlot ASC")
    List<StudentSchedule> findUpcomingSchedules(@Param("studentId") Long studentId);

    // ==================== CLASS ATTENDANCE QUERIES ====================

    /**
     * Get all students' schedules for a specific class session
     */
    @Query("SELECT ss FROM StudentSchedule ss " +
            "JOIN FETCH ss.student " +
            "WHERE ss.classSession.sessionId = :sessionId " +
            "ORDER BY ss.student.studentCode ASC")
    List<StudentSchedule> findByClassSession(@Param("sessionId") Long sessionId);

    /**
     * Get all schedules for a class
     */
    @Query("SELECT ss FROM StudentSchedule ss " +
            "WHERE ss.classEntity.classId = :classId " +
            "ORDER BY ss.student.studentCode ASC, ss.sessionDate ASC")
    List<StudentSchedule> findByClass(@Param("classId") Long classId);

    /**
     * Count students who attended a specific session
     */
    @Query("SELECT COUNT(ss) FROM StudentSchedule ss " +
            "WHERE ss.classSession.sessionId = :sessionId " +
            "AND ss.status = 'ATTENDED'")
    long countAttendedBySession(@Param("sessionId") Long sessionId);

    /**
     * Count students who were absent
     */
    @Query("SELECT COUNT(ss) FROM StudentSchedule ss " +
            "WHERE ss.classSession.sessionId = :sessionId " +
            "AND ss.status = 'ABSENT'")
    long countAbsentBySession(@Param("sessionId") Long sessionId);

    // ==================== BULK OPERATIONS ====================

    /**
     * ✅ AUTO DELETE: Delete all schedules when student drops a class
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.classEntity.classId = :classId")
    void deleteByStudentAndClass(
            @Param("studentId") Long studentId,
            @Param("classId") Long classId
    );

    /**
     * Delete all schedules for a class
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM StudentSchedule ss WHERE ss.classEntity.classId = :classId")
    void deleteByClass(@Param("classId") Long classId);

    /**
     * Delete schedules for a specific session
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM StudentSchedule ss WHERE ss.classSession.sessionId = :sessionId")
    void deleteBySession(@Param("sessionId") Long sessionId);

    /**
     * Mark all schedules for a session as CANCELLED
     */
    @Modifying
    @Transactional
    @Query("UPDATE StudentSchedule ss SET ss.status = 'CANCELLED' " +
            "WHERE ss.classSession.sessionId = :sessionId")
    void cancelBySession(@Param("sessionId") Long sessionId);

    /**
     * Update status for attendance
     */
    @Modifying
    @Transactional
    @Query("UPDATE StudentSchedule ss SET ss.status = :status " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.classSession.sessionId = :sessionId")
    void updateStatus(
            @Param("studentId") Long studentId,
            @Param("sessionId") Long sessionId,
            @Param("status") ScheduleStatus status
    );

    // ==================== STATISTICS ====================

    /**
     * Count total schedules
     */
    @Query("SELECT COUNT(ss) FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.semester.semesterId = :semesterId")
    long countByStudentAndSemester(
            @Param("studentId") Long studentId,
            @Param("semesterId") Long semesterId
    );

    /**
     * Count attended sessions
     */
    @Query("SELECT COUNT(ss) FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.semester.semesterId = :semesterId " +
            "AND ss.status = 'ATTENDED'")
    long countAttendedByStudentAndSemester(
            @Param("studentId") Long studentId,
            @Param("semesterId") Long semesterId
    );

    /**
     * Calculate attendance rate
     */
    @Query("SELECT " +
            "CAST(SUM(CASE WHEN ss.status = 'ATTENDED' THEN 1 ELSE 0 END) AS double) / " +
            "CAST(COUNT(ss) AS double) * 100.0 " +
            "FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.classEntity.classId = :classId " +
            "AND ss.status IN ('ATTENDED', 'ABSENT')")
    Double calculateAttendanceRate(
            @Param("studentId") Long studentId,
            @Param("classId") Long classId
    );

    // ==================== VALIDATION ====================

    /**
     * Check if schedule already exists
     */
    boolean existsByStudentStudentIdAndClassSessionSessionId(Long studentId, Long sessionId);

    /**
     * Count schedules for student in class
     */
    @Query("SELECT COUNT(ss) FROM StudentSchedule ss " +
            "WHERE ss.student.studentId = :studentId " +
            "AND ss.classEntity.classId = :classId")
    long countByStudentAndClass(
            @Param("studentId") Long studentId,
            @Param("classId") Long classId
    );
}