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


@Repository
public interface ClassRepository extends JpaRepository<ClassEntity, Long> {

    List<ClassEntity> findBySemester_SemesterId(Long semesterId);
     List<ClassEntity> findByTeacher_TeacherId(Long teacherId);


  

    /**
     * Find class by code
     */
    Optional<ClassEntity> findByClassCode(String classCode);

    /**
     * Check if class code exists
     */
    boolean existsByClassCode(String classCode);

    

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

    

    /**
     * Search classes by keyword (class code, subject name, teacher name)
     */
    @Query("SELECT c FROM ClassEntity c " +
            "WHERE LOWER(c.classCode) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(c.subject.subjectName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(c.teacher.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<ClassEntity> searchClasses(@Param("keyword") String keyword, Pageable pageable);

 
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

   
    @Query("SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END " +
            "FROM ClassEntity c " +
            "WHERE c.semester.semesterId = :semesterId " +
            "AND c.fixedRoom.roomId = :roomId " +  
            "AND c.dayOfWeek = :dayOfWeek " +
            "AND c.timeSlot = :timeSlot " +
            "AND (:excludeClassId IS NULL OR c.classId != :excludeClassId)")
    boolean existsRoomConflict(
            @Param("semesterId") Long semesterId,
            @Param("roomId") Long roomId,  
            @Param("dayOfWeek") java.time.DayOfWeek dayOfWeek,
            @Param("timeSlot") vn.edu.uth.ecms.entity.TimeSlot timeSlot,
            @Param("excludeClassId") Long excludeClassId
    );


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

 
    Page<ClassEntity> findAllByOrderByClassCodeAsc(Pageable pageable);

    /**
     * Find classes by semester with pagination
     */
    @Query("SELECT c FROM ClassEntity c " +
            "WHERE c.semester.semesterId = :semesterId " +
            "ORDER BY c.classCode ASC")
    Page<ClassEntity> findBySemester(@Param("semesterId") Long semesterId, Pageable pageable);


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
