package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

/**
 * ClassSession Repository - CORRECTED
 *
 * ✅ FIXED: existsRoomConflict() - Use original/actual fields, not effective getters
 */
@Repository
public interface ClassSessionRepository extends JpaRepository<ClassSession, Long> {

    // ==================== BASIC QUERIES ====================

    @Query("SELECT cs FROM ClassSession cs " +
            "WHERE cs.classEntity.classId = :classId " +
            "ORDER BY cs.sessionNumber")
    List<ClassSession> findByClass(@Param("classId") Long classId);

    @Query("SELECT cs FROM ClassSession cs " +
            "WHERE cs.classEntity.classId = :classId " +
            "AND cs.sessionType = :sessionType " +
            "ORDER BY cs.sessionNumber")
    List<ClassSession> findByClassAndType(
            @Param("classId") Long classId,
            @Param("sessionType") SessionType sessionType
    );

    @Query("SELECT cs FROM ClassSession cs " +
            "WHERE cs.classEntity.classId = :classId " +
            "AND cs.category = :category " +
            "ORDER BY cs.sessionNumber")
    List<ClassSession> findByClassAndCategory(
            @Param("classId") Long classId,
            @Param("category") SessionCategory category
    );

    @Query("SELECT cs FROM ClassSession cs " +
            "WHERE cs.classEntity.classId = :classId " +
            "AND cs.isRescheduled = true " +
            "ORDER BY cs.sessionNumber")
    List<ClassSession> findRescheduledSessions(@Param("classId") Long classId);


    // ==================== PENDING SESSION (NEW) ====================

    /**
     * Find sessions by class and pending status
     */
    @Query("SELECT s FROM ClassSession s WHERE s.classEntity.classId = :classId " +
            "AND s.isPending = :isPending " +
            "ORDER BY s.sessionNumber")
    List<ClassSession> findByClassAndPending(
            @Param("classId") Long classId,
            @Param("isPending") Boolean isPending);


    /**
     * Find all pending extra sessions for a class
     */
    @Query("SELECT cs FROM ClassSession cs " +
            "WHERE cs.classEntity.classId = :classId " +
            "AND cs.isPending = true " +
            "AND cs.category = 'EXTRA' " +
            "ORDER BY cs.sessionNumber")
    List<ClassSession> findPendingSessionsByClass(@Param("classId") Long classId);

    /**
     * Find all pending extra sessions in a semester
     */
    @Query("SELECT cs FROM ClassSession cs " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "AND cs.isPending = true " +
            "AND cs.category = 'EXTRA' " +
            "ORDER BY cs.classEntity.classId, cs.sessionNumber")
    List<ClassSession> findPendingSessionsBySemester(@Param("semesterId") Long semesterId);

    /**
     * Count pending sessions for a class
     */
    @Query("SELECT COUNT(cs) FROM ClassSession cs " +
            "WHERE cs.classEntity.classId = :classId " +
            "AND cs.isPending = true")
    long countPendingByClass(@Param("classId") Long classId);


    // ==================== CONFLICT DETECTION ====================

    @Query("SELECT CASE WHEN COUNT(cs) > 0 THEN true ELSE false END " +
            "FROM ClassSession cs " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "AND cs.classEntity.teacher.teacherId = :teacherId " +
            "AND cs.sessionType != 'E_LEARNING' " +
            "AND cs.isPending = false " +
            "AND cs.status != 'CANCELLED' " +
            "AND (" +
            "  (cs.isRescheduled = false AND cs.originalDate = :date AND cs.originalTimeSlot = :timeSlot) " +
            "  OR " +
            "  (cs.isRescheduled = true AND cs.actualDate = :date AND cs.actualTimeSlot = :timeSlot)" +
            ") " +
            "AND (:excludeClassId IS NULL OR cs.classEntity.classId != :excludeClassId)")
    boolean existsTeacherConflict(
            @Param("semesterId") Long semesterId,
            @Param("teacherId") Long teacherId,
            @Param("date") LocalDate date,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("timeSlot") TimeSlot timeSlot,
            @Param("excludeClassId") Long excludeClassId
    );

    @Query("SELECT CASE WHEN COUNT(cs) > 0 THEN true ELSE false END " +
            "FROM ClassSession cs " +
            "JOIN CourseRegistration cr ON cr.classEntity.classId = cs.classEntity.classId " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "AND cr.student.studentId IN :studentIds " +
            "AND cs.sessionType != 'E_LEARNING' " +
            "AND cr.status = 'REGISTERED' " +
            "AND cs.isPending = false " +
            "AND cs.status != 'CANCELLED' " +
            "AND (" +
            "  (cs.isRescheduled = false AND cs.originalDate = :date AND cs.originalTimeSlot = :timeSlot) " +
            "  OR " +
            "  (cs.isRescheduled = true AND cs.actualDate = :date AND cs.actualTimeSlot = :timeSlot)" +
            ") " +
            "AND (:excludeClassId IS NULL OR cs.classEntity.classId != :excludeClassId)")
    boolean existsAnyStudentConflict(
            @Param("semesterId") Long semesterId,
            @Param("studentIds") List<Long> studentIds,
            @Param("date") LocalDate date,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("timeSlot") TimeSlot timeSlot,
            @Param("excludeClassId") Long excludeClassId
    );

    /**
     * ✅ FIXED: Room conflict including rescheduled sessions
     */
    @Query("SELECT CASE WHEN COUNT(cs) > 0 THEN true ELSE false END " +
            "FROM ClassSession cs " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "AND cs.sessionType != 'E_LEARNING' " +
            "AND cs.isPending = false " +
            "AND cs.status != 'CANCELLED' " +
            "AND (" +
            "  (cs.isRescheduled = false " +
            "   AND cs.originalRoom.roomId = :roomId " +
            "   AND cs.originalDate = :date " +
            "   AND cs.originalTimeSlot = :timeSlot) " +
            "  OR " +
            "  (cs.isRescheduled = true " +
            "   AND cs.actualRoom.roomId = :roomId " +
            "   AND cs.actualDate = :date " +
            "   AND cs.actualTimeSlot = :timeSlot)" +
            ") " +
            "AND (:excludeSessionId IS NULL OR cs.sessionId != :excludeSessionId)")
    boolean existsRoomConflict(
            @Param("semesterId") Long semesterId,
            @Param("roomId") Long roomId,
            @Param("date") LocalDate date,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("timeSlot") TimeSlot timeSlot,
            @Param("excludeSessionId") Long excludeSessionId
    );


    // ==================== DELETE ====================

    @Modifying
    @Query("DELETE FROM ClassSession cs WHERE cs.classEntity.classId = :classId")
    void deleteByClass(@Param("classId") Long classId);

    @Modifying
    @Query("DELETE FROM ClassSession cs " +
            "WHERE cs.classEntity.classId = :classId " +
            "AND cs.isPending = true")
    void deletePendingByClass(@Param("classId") Long classId);


    // ==================== STATISTICS ====================

    @Query("SELECT COUNT(cs) FROM ClassSession cs " +
            "WHERE cs.classEntity.classId = :classId")
    long countByClass(@Param("classId") Long classId);

    @Query("SELECT COUNT(cs) FROM ClassSession cs " +
            "WHERE cs.classEntity.classId = :classId " +
            "AND cs.sessionType = :sessionType")
    long countByClassAndType(
            @Param("classId") Long classId,
            @Param("sessionType") SessionType sessionType
    );

    @Query("SELECT COUNT(cs) FROM ClassSession cs " +
            "WHERE cs.classEntity.classId = :classId " +
            "AND cs.isRescheduled = true")
    long countRescheduledSessions(@Param("classId") Long classId);

    @Query("SELECT COUNT(cs) FROM ClassSession cs " +
            "WHERE cs.classEntity.classId = :classId " +
            "AND cs.status = :status")
    long countByStatus(
            @Param("classId") Long classId,
            @Param("status") SessionStatus status
    );


    // ==================== SEMESTER STATISTICS ====================

    @Query("SELECT cs.category, COUNT(cs) " +
            "FROM ClassSession cs " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "GROUP BY cs.category")
    List<Object[]> countByCategoryInSemester(@Param("semesterId") Long semesterId);

    @Query("SELECT COUNT(cs) FROM ClassSession cs " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "AND cs.isPending = true")
    long countPendingInSemester(@Param("semesterId") Long semesterId);

    @Query("SELECT COUNT(cs) FROM ClassSession cs " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "AND cs.isPending = false")
    long countScheduledInSemester(@Param("semesterId") Long semesterId);


    // ==================== DATE RANGE QUERY ====================

    @Query("SELECT s FROM ClassSession s WHERE s.classEntity.classId = :classId " +
            "AND s.sessionType = 'IN_PERSON' " +
            "AND s.isPending = false " +
            "AND COALESCE(s.actualDate, s.originalDate) >= :startDate " +
            "AND COALESCE(s.actualDate, s.originalDate) <= :endDate " +
            "ORDER BY COALESCE(s.actualDate, s.originalDate), " +
            "COALESCE(s.actualTimeSlot, s.originalTimeSlot)")
    List<ClassSession> findByClassAndDateRange(
            @Param("classId") Long classId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
