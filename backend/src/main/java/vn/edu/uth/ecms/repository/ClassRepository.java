package vn.edu.uth.ecms.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.ClassEntity;
import vn.edu.uth.ecms.entity.ClassStatus;

import java.util.List;
import java.util.Optional;

/**
 * Repository for ClassEntity - FINAL FIX
 *
 * ✅ CRITICAL FIXES:
 * 1. Removed c.room (String) → Use c.room.roomId (Room entity FK)
 * 2. Removed findClassesWithExtraSchedule() - field doesn't exist
 * 3. Removed findClassesWithElearning() with old field
 *
 * ⚠️ IMPORTANT: ClassEntity now has Room entity, not String room!
 */
@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, Long> {

    List<ClassEntity> findBySemester_SemesterId(Long semesterId);


    // ==================== BASIC QUERIES ====================

    /**
     * Find class by code
     */
    Optional<ClassEntity> findByClassCode(String classCode);

    /**
     * Check if class code exists
     */
    boolean existsByClassCode(String classCode);

    // ==================== FILTER QUERIES ====================

    /**
     * Find all classes by semester
     */
    @Query("SELECT c FROM ClassEntity c WHERE c.semester.semesterId = :semesterId")
    List<ClassEntity> findBySemester(@Param("semesterId") Long semesterId);

    /**
     * Find all classes by teacher
     */
    @Query("SELECT c FROM ClassEntity c WHERE c.teacher.teacherId = :teacherId")
    List<ClassEntity> findByTeacher(@Param("teacherId") Long teacherId);

    /**
     * Find all classes by subject
     */
    @Query("SELECT c FROM ClassEntity c WHERE c.subject.subjectId = :subjectId")
    List<ClassEntity> findBySubject(@Param("subjectId") Long subjectId);

    /**
     * Find all classes by status
     */
    List<ClassEntity> findByStatus(ClassStatus status);

    /**
     * Find all classes by semester and status
     */
    @Query("SELECT c FROM ClassEntity c " +
            "WHERE c.semester.semesterId = :semesterId " +
            "AND c.status = :status")
    List<ClassEntity> findBySemesterAndStatus(
            @Param("semesterId") Long semesterId,
            @Param("status") ClassStatus status
    );

    // ==================== SEARCH QUERIES ====================

    /**
     * Search classes by keyword (class code, subject name, teacher name)
     */
    @Query("SELECT c FROM ClassEntity c " +
            "WHERE LOWER(c.classCode) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(c.subject.subjectName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(c.teacher.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<ClassEntity> searchClasses(@Param("keyword") String keyword, Pageable pageable);

    // ==================== CONFLICT DETECTION (FIXED SCHEDULE ONLY) ====================

    /**
     * ✅ FIXED: Check teacher conflict - uses Room entity now
     *
     * NOTE: This only checks FIXED schedule (ClassEntity level)
     * For individual session conflicts, use ClassSessionRepository
     */
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
            "FROM ClassEntity c " +
            "WHERE c.semester.semesterId = :semesterId " +
            "AND c.teacher.teacherId = :teacherId " +
            "AND c.dayOfWeek = :dayOfWeek " +
            "AND c.timeSlot = :timeSlot " +
            "AND (:excludeClassId IS NULL OR c.classId != :excludeClassId)")
    boolean existsTeacherConflict(
            @Param("semesterId") Long semesterId,
            @Param("teacherId") Long teacherId,
            @Param("dayOfWeek") java.time.DayOfWeek dayOfWeek,
            @Param("timeSlot") vn.edu.uth.ecms.entity.TimeSlot timeSlot,
            @Param("excludeClassId") Long excludeClassId
    );

    /**
     * ✅ FIXED: Check room conflict - uses Room entity FK
     *
     * BEFORE (ERROR):
     * AND c.room = :room  // room was String
     *
     * AFTER (CORRECT):
     * AND c.room.roomId = :roomId  // room is Room entity
     */
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
            "FROM ClassEntity c " +
            "WHERE c.semester.semesterId = :semesterId " +
            "AND c.fixedRoom.roomId = :roomId " +  // ✅ FIXED: Room entity FK
            "AND c.dayOfWeek = :dayOfWeek " +
            "AND c.timeSlot = :timeSlot " +
            "AND (:excludeClassId IS NULL OR c.classId != :excludeClassId)")
    boolean existsRoomConflict(
            @Param("semesterId") Long semesterId,
            @Param("roomId") Long roomId,  // ✅ Changed from String room to Long roomId
            @Param("dayOfWeek") java.time.DayOfWeek dayOfWeek,
            @Param("timeSlot") vn.edu.uth.ecms.entity.TimeSlot timeSlot,
            @Param("excludeClassId") Long excludeClassId
    );

    // ==================== STATISTICS ====================

    /**
     * Count classes by semester
     */
    @Query("SELECT COUNT(c) FROM ClassEntity c WHERE c.semester.semesterId = :semesterId")
    long countBySemester(@Param("semesterId") Long semesterId);

    /**
     * Count classes by teacher
     */
    @Query("SELECT COUNT(c) FROM ClassEntity c WHERE c.teacher.teacherId = :teacherId")
    long countByTeacher(@Param("teacherId") Long teacherId);

    /**
     * Get total enrolled students in semester
     */
    @Query("SELECT COALESCE(SUM(c.enrolledCount), 0) FROM ClassEntity c " +
            "WHERE c.semester.semesterId = :semesterId")
    long getTotalEnrolledInSemester(@Param("semesterId") Long semesterId);

    // ==================== PAGINATION ====================

    /**
     * Find all classes with pagination, ordered by class code
     */
    Page<ClassEntity> findAllByOrderByClassCodeAsc(Pageable pageable);

    /**
     * Find classes by semester with pagination
     */
    @Query("SELECT c FROM ClassEntity c " +
            "WHERE c.semester.semesterId = :semesterId " +
            "ORDER BY c.classCode ASC")
    Page<ClassEntity> findBySemester(@Param("semesterId") Long semesterId, Pageable pageable);

    // ==================== ✅ NEW: CLASSES WITH SESSIONS ====================

    /**
     * Find classes with extra sessions (via ClassSession table)
     */
    @Query("SELECT DISTINCT cs.classEntity FROM ClassSession cs " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "AND cs.category = 'EXTRA' " +
            "ORDER BY cs.classEntity.classCode ASC")
    List<ClassEntity> findClassesWithExtraSessions(@Param("semesterId") Long semesterId);

    /**
     * Find classes with e-learning sessions
     */
    @Query("SELECT DISTINCT cs.classEntity FROM ClassSession cs " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "AND cs.sessionType = 'E_LEARNING' " +
            "ORDER BY cs.classEntity.classCode ASC")
    List<ClassEntity> findClassesWithElearning(@Param("semesterId") Long semesterId);

    /**
     * Find classes with pending extra sessions
     */
    @Query("SELECT DISTINCT cs.classEntity FROM ClassSession cs " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "AND cs.isPending = true " +
            "AND cs.category = 'EXTRA' " +
            "ORDER BY cs.classEntity.classCode ASC")
    List<ClassEntity> findClassesWithPendingSessions(@Param("semesterId") Long semesterId);
    @Query("SELECT COUNT(c) > 0 FROM ClassEntity c WHERE c.subject.subjectId = :subjectId AND c.semester.semesterId = :semesterId")
boolean existsBySubjectAndSemester(@Param("subjectId") Long subjectId, @Param("semesterId") Long semesterId);
    
    @Query("SELECT COUNT(c) > 0 FROM ClassEntity c " +
       "WHERE c.subject.subjectId = :subjectId " +
       "AND c.semester.semesterId = :semesterId")
boolean existsBySubjectIdAndSemesterId(
    @Param("subjectId") Long subjectId, 
    @Param("semesterId") Long semesterId
);
}