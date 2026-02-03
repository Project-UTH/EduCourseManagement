package vn.edu.uth.ecms.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.ClassEntity;
import vn.edu.uth.ecms.entity.Grade;
import vn.edu.uth.ecms.entity.enums.GradeStatus;
import vn.edu.uth.ecms.entity.Student;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * GradeRepository
 * @author 
 * @since 
 * @updated
 */
@Repository
public interface GradeRepository extends JpaRepository<Grade, Long> {
    
    
    /**
     * Find all grades for a student
     * 
     * @param student The student entity
     * @return List of grades
     */
    List<Grade> findByStudent(Student student);
    
    /**
     * Find all grades for a student (by ID)
     * 
     * @param studentId Student ID
     * @return List of grades
     */
    List<Grade> findByStudent_StudentId(Long studentId);
    
    /**
     * Find grades for student with pagination
     * 
     * @param studentId Student ID
     * @param pageable Pagination info
     * @return Page of grades
     */
    Page<Grade> findByStudent_StudentId(Long studentId, Pageable pageable);
    
   
    
    /**
     * Find all grades for a class
     * 
     * @param classEntity The class entity
     * @return List of grades
     */
    List<Grade> findByClassEntity(ClassEntity classEntity);
    
    /**
     * Find all grades for a class (by ID)
     * 
     * @param classId Class ID
     * @return List of grades
     */
    List<Grade> findByClassEntity_ClassId(Long classId);
    
    /**
     * Find grades for class with pagination
     * 
     * @param classId Class ID
     * @param pageable Pagination info
     * @return Page of grades
     */
    Page<Grade> findByClassEntity_ClassId(Long classId, Pageable pageable);
    
    /**
     * Find grades for class ordered by total score
     * 
     * @param classId Class ID
     * @return List of grades (highest to lowest)
     */
    @Query("SELECT g FROM Grade g WHERE g.classEntity.classId = :classId " +
           "AND g.totalScore IS NOT NULL ORDER BY g.totalScore DESC")
    List<Grade> findByClassIdOrderByScore(@Param("classId") Long classId);
    
 
    /**
     * Find grade for student in class
     * Should be unique due to constraint
     * 
     * @param studentId Student ID
     * @param classId Class ID
     * @return Optional grade
     */
    Optional<Grade> findByStudent_StudentIdAndClassEntity_ClassId(Long studentId, Long classId);
    
    /**
     * Check if grade exists for student in class
     * 
     * @param studentId Student ID
     * @param classId Class ID
     * @return true if grade exists
     */
    boolean existsByStudent_StudentIdAndClassEntity_ClassId(Long studentId, Long classId);
    

    /**
     * Find grades by status
     * 
     * @param classId Class ID
     * @param status Grade status
     * @return List of grades
     */
    List<Grade> findByClassEntity_ClassIdAndStatus(Long classId, GradeStatus status);
    
    /**
     * Find passed grades for class
     * 
     * @param classId Class ID
     * @return List of passed grades
     */
    @Query("SELECT g FROM Grade g WHERE g.classEntity.classId = :classId " +
           "AND g.status = 'PASSED' ORDER BY g.totalScore DESC")
    List<Grade> findPassedGrades(@Param("classId") Long classId);
    
    /**
     * Find failed grades for class
     * 
     * @param classId Class ID
     * @return List of failed grades
     */
    @Query("SELECT g FROM Grade g WHERE g.classEntity.classId = :classId " +
           "AND g.status = 'FAILED' ORDER BY g.totalScore ASC")
    List<Grade> findFailedGrades(@Param("classId") Long classId);
    
    /**
     * Find incomplete grades (in progress)
     * 
     * @param classId Class ID
     * @return List of incomplete grades
     */
    @Query("SELECT g FROM Grade g WHERE g.classEntity.classId = :classId " +
           "AND g.status = 'IN_PROGRESS'")
    List<Grade> findIncompleteGrades(@Param("classId") Long classId);
    
   
    /**
     * Find grades by letter grade
     * 
     * @param classId Class ID
     * @param letterGrade Letter grade (A, B+, etc.)
     * @return List of grades
     */
    List<Grade> findByClassEntity_ClassIdAndLetterGrade(Long classId, String letterGrade);
    
    /**
     * Count students with each letter grade
     * Returns: [letter_grade, count]
     * 
     * @param classId Class ID
     * @return List of [letter_grade, count] pairs
     */
    @Query("SELECT g.letterGrade, COUNT(g) FROM Grade g " +
           "WHERE g.classEntity.classId = :classId " +
           "AND g.letterGrade IS NOT NULL " +
           "GROUP BY g.letterGrade ORDER BY g.letterGrade")
    List<Object[]> countByLetterGrade(@Param("classId") Long classId);
    
   
    
    /**
     * Find all grades for teacher's classes
     * 
     * @param teacherId Teacher ID
     * @return List of grades
     */
    @Query("SELECT g FROM Grade g WHERE g.classEntity.teacher.teacherId = :teacherId " +
           "ORDER BY g.classEntity.classId, g.totalScore DESC")
    List<Grade> findByTeacherId(@Param("teacherId") Long teacherId);
    
    /**
     * Find incomplete grades for teacher (needing completion)
     * 
     * @param teacherId Teacher ID
     * @return List of incomplete grades
     */
    @Query("SELECT g FROM Grade g WHERE g.classEntity.teacher.teacherId = :teacherId " +
           "AND g.status = 'IN_PROGRESS'")
    List<Grade> findIncompleteByTeacherId(@Param("teacherId") Long teacherId);
    

    
    /**
     * Calculate class average
     * 
     * @param classId Class ID
     * @return Average total score or null
     */
    @Query("SELECT AVG(g.totalScore) FROM Grade g " +
           "WHERE g.classEntity.classId = :classId AND g.totalScore IS NOT NULL")
    BigDecimal calculateClassAverage(@Param("classId") Long classId);
    
    /**
     * Get highest score in class
     * 
     * @param classId Class ID
     * @return Highest score or null
     */
    @Query("SELECT MAX(g.totalScore) FROM Grade g " +
           "WHERE g.classEntity.classId = :classId")
    BigDecimal findHighestScore(@Param("classId") Long classId);
    
    /**
     * Get lowest score in class
     * 
     * @param classId Class ID
     * @return Lowest score or null
     */
    @Query("SELECT MIN(g.totalScore) FROM Grade g " +
           "WHERE g.classEntity.classId = :classId AND g.totalScore IS NOT NULL")
    BigDecimal findLowestScore(@Param("classId") Long classId);
    
    /**
     * Get class statistics
     * Returns: [avg_score, max_score, min_score, pass_rate]
     * 
     * @param classId Class ID
     * @return Array of statistics
     */
    @Query("SELECT AVG(g.totalScore), MAX(g.totalScore), MIN(g.totalScore), " +
           "(SUM(CASE WHEN g.status = 'PASSED' THEN 1.0 ELSE 0.0 END) / COUNT(g)) * 100 " +
           "FROM Grade g WHERE g.classEntity.classId = :classId AND g.totalScore IS NOT NULL")
    Object[] getClassStatistics(@Param("classId") Long classId);
    
    /**
     * Calculate pass rate
     * 
     * @param classId Class ID
     * @return Pass rate as percentage (0-100)
     */
    @Query("SELECT (SUM(CASE WHEN g.status = 'PASSED' THEN 1.0 ELSE 0.0 END) / COUNT(g)) * 100 " +
           "FROM Grade g WHERE g.classEntity.classId = :classId AND g.totalScore IS NOT NULL")
    BigDecimal calculatePassRate(@Param("classId") Long classId);
    
 
    
    /**
     * Calculate student's GPA
     * GPA = sum(grade_point * credits) / sum(credits)
     * 
     * @param studentId Student ID
     * @return GPA or null
     */
    @Query("SELECT SUM(CASE g.letterGrade " +
           "WHEN 'A' THEN 4.0 * g.classEntity.subject.credits " +
           "WHEN 'B+' THEN 3.5 * g.classEntity.subject.credits " +
           "WHEN 'B' THEN 3.0 * g.classEntity.subject.credits " +
           "WHEN 'C+' THEN 2.5 * g.classEntity.subject.credits " +
           "WHEN 'C' THEN 2.0 * g.classEntity.subject.credits " +
           "WHEN 'D+' THEN 1.5 * g.classEntity.subject.credits " +
           "WHEN 'D' THEN 1.0 * g.classEntity.subject.credits " +
           "WHEN 'F' THEN 0.0 * g.classEntity.subject.credits " +
           "ELSE 0.0 END) / SUM(g.classEntity.subject.credits) " +
           "FROM Grade g WHERE g.student.studentId = :studentId " +
           "AND g.status != 'IN_PROGRESS'")
    BigDecimal calculateGPA(@Param("studentId") Long studentId);
    
    /**
     * Get student's average score across all classes
     * 
     * @param studentId Student ID
     * @return Average score or null
     */
    @Query("SELECT AVG(g.totalScore) FROM Grade g " +
           "WHERE g.student.studentId = :studentId AND g.totalScore IS NOT NULL")
    BigDecimal calculateStudentAverage(@Param("studentId") Long studentId);
    
    /**
     * Count completed courses for student
     * 
     * @param studentId Student ID
     * @return Count of completed courses
     */
    @Query("SELECT COUNT(g) FROM Grade g WHERE g.student.studentId = :studentId " +
           "AND g.status != 'IN_PROGRESS'")
    long countCompletedCourses(@Param("studentId") Long studentId);
    
    /**
     * Count passed courses for student
     * 
     * @param studentId Student ID
     * @return Count of passed courses
     */
    @Query("SELECT COUNT(g) FROM Grade g WHERE g.student.studentId = :studentId " +
           "AND g.status = 'PASSED'")
    long countPassedCourses(@Param("studentId") Long studentId);
    
    /**
     * Count failed courses for student
     * 
     * @param studentId Student ID
     * @return Count of failed courses
     */
    @Query("SELECT COUNT(g) FROM Grade g WHERE g.student.studentId = :studentId " +
           "AND g.status = 'FAILED'")
    long countFailedCourses(@Param("studentId") Long studentId);
    
    
    
    /**
     * Count total grades for class
     * 
     * @param classId Class ID
     * @return Total count
     */
    long countByClassEntity_ClassId(Long classId);
    
    /**
     * Count grades by status
     * 
     * @param classId Class ID
     * @param status Grade status
     * @return Count
     */
    long countByClassEntity_ClassIdAndStatus(Long classId, GradeStatus status);
    
    /**
     * Count passed students
     * 
     * @param classId Class ID
     * @return Count
     */
    @Query("SELECT COUNT(g) FROM Grade g WHERE g.classEntity.classId = :classId " +
           "AND g.status = 'PASSED'")
    long countPassed(@Param("classId") Long classId);
    
    /**
     * Count failed students
     * 
     * @param classId Class ID
     * @return Count
     */
    @Query("SELECT COUNT(g) FROM Grade g WHERE g.classEntity.classId = :classId " +
           "AND g.status = 'FAILED'")
    long countFailed(@Param("classId") Long classId);
    
    /**
     * Count students with score in range
     * 
     * @param classId Class ID
     * @param minScore Minimum score
     * @param maxScore Maximum score
     * @return Count
     */
    @Query("SELECT COUNT(g) FROM Grade g WHERE g.classEntity.classId = :classId " +
           "AND g.totalScore BETWEEN :minScore AND :maxScore")
    long countByScoreRange(@Param("classId") Long classId,
                          @Param("minScore") BigDecimal minScore,
                          @Param("maxScore") BigDecimal maxScore);
    
    
    
    /**
     * Get top students in class by score
     * 
     * @param classId Class ID
     * @param limit Number of top students
     * @return List of top grades
     */
    @Query(value = "SELECT * FROM grade WHERE class_id = :classId " +
           "AND total_score IS NOT NULL ORDER BY total_score DESC LIMIT :limit",
           nativeQuery = true)
    List<Grade> findTopStudents(@Param("classId") Long classId, @Param("limit") int limit);
    
    /**
     * Get student's rank in class
     * 
     * @param classId Class ID
     * @param studentId Student ID
     * @return Rank (1-based) or null
     */
    @Query("SELECT COUNT(g2) + 1 FROM Grade g1, Grade g2 " +
           "WHERE g1.classEntity.classId = :classId " +
           "AND g2.classEntity.classId = :classId " +
           "AND g1.student.studentId = :studentId " +
           "AND g2.totalScore > g1.totalScore " +
           "AND g1.totalScore IS NOT NULL AND g2.totalScore IS NOT NULL")
    Long findStudentRank(@Param("classId") Long classId, @Param("studentId") Long studentId);
    
   
    
    /**
     * Search grades by student name
     * 
     * @param classId Class ID
     * @param keyword Search keyword
     * @return List of matching grades
     */
    @Query("SELECT g FROM Grade g WHERE g.classEntity.classId = :classId " +
           "AND (LOWER(g.student.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR g.student.studentCode LIKE CONCAT('%', :keyword, '%'))")
    List<Grade> searchByStudentName(@Param("classId") Long classId,
                                    @Param("keyword") String keyword);
    
    /**
     * Filter grades by multiple criteria
     * 
     * @param classId Class ID
     * @param status Status filter (optional)
     * @param letterGrade Letter grade filter (optional)
     * @param minScore Minimum score (optional)
     * @param maxScore Maximum score (optional)
     * @param pageable Pagination
     * @return Page of filtered grades
     */
    @Query("SELECT g FROM Grade g WHERE g.classEntity.classId = :classId " +
           "AND (:status IS NULL OR g.status = :status) " +
           "AND (:letterGrade IS NULL OR g.letterGrade = :letterGrade) " +
           "AND (:minScore IS NULL OR g.totalScore >= :minScore) " +
           "AND (:maxScore IS NULL OR g.totalScore <= :maxScore) " +
           "ORDER BY g.totalScore DESC")
    Page<Grade> filterGrades(
        @Param("classId") Long classId,
        @Param("status") GradeStatus status,
        @Param("letterGrade") String letterGrade,
        @Param("minScore") BigDecimal minScore,
        @Param("maxScore") BigDecimal maxScore,
        Pageable pageable);
    
    
    
    /**
     * Delete grade for student in class
     * 
     * @param studentId Student ID
     * @param classId Class ID
     * @return Number of deleted records (should be 0 or 1)
     */
    long deleteByStudent_StudentIdAndClassEntity_ClassId(Long studentId, Long classId);
    
    /**
     * Delete all grades for a class
     * WARNING: Use with caution
     * 
     * @param classId Class ID
     * @return Number of deleted records
     */
    long deleteByClassEntity_ClassId(Long classId);
}