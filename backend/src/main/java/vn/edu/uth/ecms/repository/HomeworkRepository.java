package vn.edu.uth.ecms.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.ClassEntity;
import vn.edu.uth.ecms.entity.Homework;
import vn.edu.uth.ecms.entity.HomeworkType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * HomeworkRepository
 * 
 * JPA Repository for Homework entity
 * Provides CRUD operations and custom queries
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@Repository
public interface HomeworkRepository extends JpaRepository<Homework, Long> {
    
    // ========================================
    // BASIC QUERIES - BY CLASS
    // ========================================
    
    /**
     * Find all homework for a specific class
     * 
     * @param classEntity The class entity
     * @return List of homework
     */
    List<Homework> findByClassEntity(ClassEntity classEntity);
    
    /**
     * Find all homework for a specific class (by ID)
     * 
     * @param classId Class ID
     * @return List of homework
     */
    List<Homework> findByClassEntity_ClassId(Long classId);
    
    /**
     * Find all homework for a specific class with pagination
     * 
     * @param classId Class ID
     * @param pageable Pagination info
     * @return Page of homework
     */
    Page<Homework> findByClassEntity_ClassId(Long classId, Pageable pageable);
    
    // ========================================
    // QUERIES - BY TYPE
    // ========================================
    
    /**
     * Find homework by class and type
     * 
     * @param classId Class ID
     * @param type Homework type
     * @return List of homework
     */
    List<Homework> findByClassEntity_ClassIdAndHomeworkType(Long classId, HomeworkType type);
    
    /**
     * Find all REGULAR homework for a class
     * 
     * @param classId Class ID
     * @return List of regular homework
     */
    @Query("SELECT h FROM Homework h WHERE h.classEntity.classId = :classId " +
           "AND h.homeworkType = 'REGULAR' ORDER BY h.deadline ASC")
    List<Homework> findRegularHomeworkByClassId(@Param("classId") Long classId);
    
    /**
     * Find MIDTERM homework for a class
     * Usually only one midterm per class
     * 
     * @param classId Class ID
     * @return Optional midterm homework
     */
    @Query("SELECT h FROM Homework h WHERE h.classEntity.classId = :classId " +
           "AND h.homeworkType = 'MIDTERM'")
    Optional<Homework> findMidtermByClassId(@Param("classId") Long classId);
    
    /**
     * Find FINAL homework for a class
     * Usually only one final per class
     * 
     * @param classId Class ID
     * @return Optional final homework
     */
    @Query("SELECT h FROM Homework h WHERE h.classEntity.classId = :classId " +
           "AND h.homeworkType = 'FINAL'")
    Optional<Homework> findFinalByClassId(@Param("classId") Long classId);
    
    // ========================================
    // QUERIES - BY DEADLINE STATUS
    // ========================================
    
    /**
     * Find upcoming homework (deadline in future)
     * 
     * @param classId Class ID
     * @param now Current time
     * @return List of upcoming homework
     */
    @Query("SELECT h FROM Homework h WHERE h.classEntity.classId = :classId " +
           "AND h.deadline > :now ORDER BY h.deadline ASC")
    List<Homework> findUpcomingHomework(@Param("classId") Long classId, 
                                        @Param("now") LocalDateTime now);
    
    /**
     * Find overdue homework (deadline passed)
     * 
     * @param classId Class ID
     * @param now Current time
     * @return List of overdue homework
     */
    @Query("SELECT h FROM Homework h WHERE h.classEntity.classId = :classId " +
           "AND h.deadline < :now ORDER BY h.deadline DESC")
    List<Homework> findOverdueHomework(@Param("classId") Long classId,
                                       @Param("now") LocalDateTime now);
    
    /**
     * Find homework with deadline in date range
     * 
     * @param classId Class ID
     * @param startDate Start date
     * @param endDate End date
     * @return List of homework
     */
    @Query("SELECT h FROM Homework h WHERE h.classEntity.classId = :classId " +
           "AND h.deadline BETWEEN :startDate AND :endDate ORDER BY h.deadline ASC")
    List<Homework> findByDeadlineRange(@Param("classId") Long classId,
                                       @Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate);
    
    // ========================================
    // QUERIES - BY TEACHER
    // ========================================
    
    /**
     * Find all homework created by a teacher
     * Teacher is determined through class
     * 
     * @param teacherId Teacher ID
     * @return List of homework
     */
    @Query("SELECT h FROM Homework h WHERE h.classEntity.teacher.teacherId = :teacherId " +
           "ORDER BY h.createdAt DESC")
    List<Homework> findByTeacherId(@Param("teacherId") Long teacherId);
    
    /**
     * Find homework by teacher with pagination
     * 
     * @param teacherId Teacher ID
     * @param pageable Pagination info
     * @return Page of homework
     */
    @Query("SELECT h FROM Homework h WHERE h.classEntity.teacher.teacherId = :teacherId " +
           "ORDER BY h.createdAt DESC")
    Page<Homework> findByTeacherId(@Param("teacherId") Long teacherId, Pageable pageable);
    
    /**
     * Find upcoming homework for teacher
     * 
     * @param teacherId Teacher ID
     * @param now Current time
     * @return List of upcoming homework
     */
    @Query("SELECT h FROM Homework h WHERE h.classEntity.teacher.teacherId = :teacherId " +
           "AND h.deadline > :now ORDER BY h.deadline ASC")
    List<Homework> findUpcomingByTeacherId(@Param("teacherId") Long teacherId,
                                           @Param("now") LocalDateTime now);
    
    // ========================================
    // QUERIES - WITH SUBMISSION STATS
    // ========================================
    
    /**
     * Find homework with submission count
     * 
     * @param homeworkId Homework ID
     * @return Homework with loaded submissions
     */
    @Query("SELECT h FROM Homework h LEFT JOIN FETCH h.submissions " +
           "WHERE h.homeworkId = :homeworkId")
    Optional<Homework> findWithSubmissions(@Param("homeworkId") Long homeworkId);
    
    /**
     * Find all homework for class with submission stats
     * 
     * @param classId Class ID
     * @return List of homework with submissions loaded
     */
    @Query("SELECT DISTINCT h FROM Homework h LEFT JOIN FETCH h.submissions " +
           "WHERE h.classEntity.classId = :classId ORDER BY h.deadline ASC")
    List<Homework> findByClassIdWithSubmissions(@Param("classId") Long classId);
    
    /**
     * Count homework needing grading (has ungraded submissions)
     * 
     * @param teacherId Teacher ID
     * @return Count of homework needing grading
     */
    @Query("SELECT COUNT(DISTINCT h) FROM Homework h " +
           "JOIN h.submissions s " +
           "WHERE h.classEntity.teacher.teacherId = :teacherId " +
           "AND s.status != 'GRADED'")
    long countNeedingGradingByTeacherId(@Param("teacherId") Long teacherId);
    
    // ========================================
    // QUERIES - SEARCH & FILTER
    // ========================================
    
    /**
     * Search homework by title
     * 
     * @param classId Class ID
     * @param keyword Search keyword
     * @return List of matching homework
     */
    @Query("SELECT h FROM Homework h WHERE h.classEntity.classId = :classId " +
           "AND LOWER(h.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY h.deadline ASC")
    List<Homework> searchByTitle(@Param("classId") Long classId, 
                                 @Param("keyword") String keyword);
    
    /**
     * Filter homework by multiple criteria
     * 
     * @param classId Class ID
     * @param type Homework type (optional)
     * @param startDate Start date (optional)
     * @param endDate End date (optional)
     * @param pageable Pagination
     * @return Page of filtered homework
     */
    @Query("SELECT h FROM Homework h WHERE h.classEntity.classId = :classId " +
           "AND (:type IS NULL OR h.homeworkType = :type) " +
           "AND (:startDate IS NULL OR h.deadline >= :startDate) " +
           "AND (:endDate IS NULL OR h.deadline <= :endDate) " +
           "ORDER BY h.deadline ASC")
    Page<Homework> filterHomework(@Param("classId") Long classId,
                                  @Param("type") HomeworkType type,
                                  @Param("startDate") LocalDateTime startDate,
                                  @Param("endDate") LocalDateTime endDate,
                                  Pageable pageable);
    
    // ========================================
    // EXISTENCE CHECKS
    // ========================================
    
    /**
     * Check if homework exists for class
     * 
     * @param classId Class ID
     * @param homeworkId Homework ID
     * @return true if exists
     */
    boolean existsByClassEntity_ClassIdAndHomeworkId(Long classId, Long homeworkId);
    
    /**
     * Check if class already has midterm
     * 
     * @param classId Class ID
     * @return true if midterm exists
     */
    @Query("SELECT COUNT(h) > 0 FROM Homework h " +
           "WHERE h.classEntity.classId = :classId AND h.homeworkType = 'MIDTERM'")
    boolean hasMidterm(@Param("classId") Long classId);
    
    /**
     * Check if class already has final
     * 
     * @param classId Class ID
     * @return true if final exists
     */
    @Query("SELECT COUNT(h) > 0 FROM Homework h " +
           "WHERE h.classEntity.classId = :classId AND h.homeworkType = 'FINAL'")
    boolean hasFinal(@Param("classId") Long classId);
    
    // ========================================
    // COUNT QUERIES
    // ========================================
    
    /**
     * Count total homework for a class
     * 
     * @param classId Class ID
     * @return Total count
     */
    long countByClassEntity_ClassId(Long classId);
    
    /**
     * Count homework by type
     * 
     * @param classId Class ID
     * @param type Homework type
     * @return Count
     */
    long countByClassEntity_ClassIdAndHomeworkType(Long classId, HomeworkType type);
    
    /**
     * Count upcoming homework
     * 
     * @param classId Class ID
     * @param now Current time
     * @return Count
     */
    @Query("SELECT COUNT(h) FROM Homework h WHERE h.classEntity.classId = :classId " +
           "AND h.deadline > :now")
    long countUpcoming(@Param("classId") Long classId, @Param("now") LocalDateTime now);
    
    /**
     * Count overdue homework
     * 
     * @param classId Class ID
     * @param now Current time
     * @return Count
     */
    @Query("SELECT COUNT(h) FROM Homework h WHERE h.classEntity.classId = :classId " +
           "AND h.deadline < :now")
    long countOverdue(@Param("classId") Long classId, @Param("now") LocalDateTime now);
    
    // ========================================
    // DELETE QUERIES
    // ========================================
    
    /**
     * Delete all homework for a class
     * WARNING: Use with caution
     * 
     * @param classId Class ID
     * @return Number of deleted records
     */
    long deleteByClassEntity_ClassId(Long classId);
    
    /**
     * Delete homework older than specific date
     * Useful for cleanup
     * 
     * @param date Cutoff date
     * @return Number of deleted records
     */
    @Query("DELETE FROM Homework h WHERE h.createdAt < :date")
    long deleteOlderThan(@Param("date") LocalDateTime date);
}