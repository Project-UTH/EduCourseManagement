package vn.edu.uth.ecms.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.Homework;
import vn.edu.uth.ecms.entity.HomeworkSubmission;
import vn.edu.uth.ecms.entity.Student;
import vn.edu.uth.ecms.entity.enums.SubmissionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * HomeworkSubmissionRepository - MULTI-FILE SUPPORT
 * @author 
 * @since 
 */
@Repository
public interface HomeworkSubmissionRepository extends JpaRepository<HomeworkSubmission, Long> {
    
    
    
    /**
     * Find all submissions for a homework
     * 
     * @param homework The homework entity
     * @return List of submissions
     */
    List<HomeworkSubmission> findByHomework(Homework homework);
    
    /**
     * Find all submissions for a homework (by ID)
     * 
     * @param homeworkId Homework ID
     * @return List of submissions
     */
    List<HomeworkSubmission> findByHomework_HomeworkId(Long homeworkId);
    
    /**
     * Find submissions for homework with pagination
     * 
     * @param homeworkId Homework ID
     * @param pageable Pagination info
     * @return Page of submissions
     */
    Page<HomeworkSubmission> findByHomework_HomeworkId(Long homeworkId, Pageable pageable);
    
  
    /**
     * Find all submissions by a student
     * 
     * @param student The student entity
     * @return List of submissions
     */
    List<HomeworkSubmission> findByStudent(Student student);
    
    /**
     * Find all submissions by student (by ID)
     * 
     * @param studentId Student ID
     * @return List of submissions
     */
    List<HomeworkSubmission> findByStudent_StudentId(Long studentId);
    
    /**
     * Find submissions by student with pagination
     * 
     * @param studentId Student ID
     * @param pageable Pagination info
     * @return Page of submissions
     */
    Page<HomeworkSubmission> findByStudent_StudentId(Long studentId, Pageable pageable);
    
    /**
     * Find submissions by student for a specific class
     * 
     * @param studentId Student ID
     * @param classId Class ID
     * @return List of submissions
     */
    @Query("SELECT s FROM HomeworkSubmission s " +
           "WHERE s.student.studentId = :studentId " +
           "AND s.homework.classEntity.classId = :classId " +
           "ORDER BY s.submissionDate DESC")
    List<HomeworkSubmission> findByStudentAndClass(@Param("studentId") Long studentId,
                                                    @Param("classId") Long classId);
    
 
    /**
     * Find submission by homework and student
     * Should be unique due to constraint
     * 
     * @param homeworkId Homework ID
     * @param studentId Student ID
     * @return Optional submission
     */
    Optional<HomeworkSubmission> findByHomework_HomeworkIdAndStudent_StudentId(
        Long homeworkId, Long studentId);
    
    /**
     * @param homeworkId Homework ID
     * @param studentCode Student code
     * @return Optional submission with files loaded
     */
    @EntityGraph(attributePaths = {"submissionFiles"})
    Optional<HomeworkSubmission> findByHomework_HomeworkIdAndStudent_StudentCode(
        Long homeworkId, String studentCode);
    
    /**
     * Check if student has submitted for homework
     * 
     * @param homeworkId Homework ID
     * @param studentId Student ID
     * @return true if submission exists
     */
    boolean existsByHomework_HomeworkIdAndStudent_StudentId(Long homeworkId, Long studentId);
    
    /**
     * @param homeworkId Homework ID
     * @param studentCode Student code
     * @return true if submission exists
     */
    boolean existsByHomework_HomeworkIdAndStudent_StudentCode(Long homeworkId, String studentCode);
    

    
    /**
     * Find submissions by status
     * 
     * @param homeworkId Homework ID
     * @param status Submission status
     * @return List of submissions
     */
    List<HomeworkSubmission> findByHomework_HomeworkIdAndStatus(Long homeworkId, 
                                                                 SubmissionStatus status);
    
    /**
     * Find all graded submissions for homework
     * 
     * @param homeworkId Homework ID
     * @return List of graded submissions
     */
    @Query("SELECT s FROM HomeworkSubmission s WHERE s.homework.homeworkId = :homeworkId " +
           "AND s.status = 'GRADED' ORDER BY s.score DESC")
    List<HomeworkSubmission> findGradedSubmissions(@Param("homeworkId") Long homeworkId);
    
    /**
     * Find submissions needing grading (SUBMITTED or LATE)
     * 
     * @param homeworkId Homework ID
     * @return List of ungraded submissions
     */
    @Query("SELECT s FROM HomeworkSubmission s WHERE s.homework.homeworkId = :homeworkId " +
           "AND s.status != 'GRADED' ORDER BY s.submissionDate ASC")
    List<HomeworkSubmission> findNeedingGrading(@Param("homeworkId") Long homeworkId);
    
    /**
     * Find late submissions
     * 
     * @param homeworkId Homework ID
     * @return List of late submissions
     */
    @Query("SELECT s FROM HomeworkSubmission s WHERE s.homework.homeworkId = :homeworkId " +
           "AND s.status = 'LATE' ORDER BY s.submissionDate ASC")
    List<HomeworkSubmission> findLateSubmissions(@Param("homeworkId") Long homeworkId);
    
 
    
    /**
     * Find all submissions needing grading for teacher's classes
     * 
     * @param teacherId Teacher ID
     * @return List of submissions to grade
     */
    @Query("SELECT s FROM HomeworkSubmission s " +
           "WHERE s.homework.classEntity.teacher.teacherId = :teacherId " +
           "AND s.status != 'GRADED' " +
           "ORDER BY s.submissionDate ASC")
    List<HomeworkSubmission> findNeedingGradingByTeacherId(@Param("teacherId") Long teacherId);
    
    /**
     * Find submissions for teacher with pagination
     * 
     * @param teacherId Teacher ID
     * @param pageable Pagination
     * @return Page of submissions
     */
    @Query("SELECT s FROM HomeworkSubmission s " +
           "WHERE s.homework.classEntity.teacher.teacherId = :teacherId " +
           "ORDER BY s.submissionDate DESC")
    Page<HomeworkSubmission> findByTeacherId(@Param("teacherId") Long teacherId, 
                                             Pageable pageable);
    
    /**
     * Find recent submissions for teacher (last 7 days)
     * 
     * @param teacherId Teacher ID
     * @param since Date to search from
     * @return List of recent submissions
     */
    @Query("SELECT s FROM HomeworkSubmission s " +
           "WHERE s.homework.classEntity.teacher.teacherId = :teacherId " +
           "AND s.submissionDate >= :since " +
           "ORDER BY s.submissionDate DESC")
    List<HomeworkSubmission> findRecentByTeacherId(@Param("teacherId") Long teacherId,
                                                    @Param("since") LocalDateTime since);
    

    
    /**
     * Calculate average score for homework
     * 
     * @param homeworkId Homework ID
     * @return Average score or null if no graded submissions
     */
    @Query("SELECT AVG(s.score) FROM HomeworkSubmission s " +
           "WHERE s.homework.homeworkId = :homeworkId AND s.status = 'GRADED'")
    BigDecimal calculateAverageScore(@Param("homeworkId") Long homeworkId);
    
    /**
     * Get highest score for homework
     * 
     * @param homeworkId Homework ID
     * @return Highest score or null
     */
    @Query("SELECT MAX(s.score) FROM HomeworkSubmission s " +
           "WHERE s.homework.homeworkId = :homeworkId AND s.status = 'GRADED'")
    BigDecimal findHighestScore(@Param("homeworkId") Long homeworkId);
    
    /**
     * Get lowest score for homework
     * 
     * @param homeworkId Homework ID
     * @return Lowest score or null
     */
    @Query("SELECT MIN(s.score) FROM HomeworkSubmission s " +
           "WHERE s.homework.homeworkId = :homeworkId AND s.status = 'GRADED'")
    BigDecimal findLowestScore(@Param("homeworkId") Long homeworkId);
    
    /**
     * Get submission statistics for homework
     * Returns: [total_submissions, graded_count, avg_score]
     * 
     * @param homeworkId Homework ID
     * @return Array of statistics
     */
    @Query("SELECT COUNT(s), " +
           "SUM(CASE WHEN s.status = 'GRADED' THEN 1 ELSE 0 END), " +
           "AVG(CASE WHEN s.status = 'GRADED' THEN s.score ELSE NULL END) " +
           "FROM HomeworkSubmission s WHERE s.homework.homeworkId = :homeworkId")
    Object[] getSubmissionStats(@Param("homeworkId") Long homeworkId);
    
    /**
     * Count submissions by score range
     * 
     * @param homeworkId Homework ID
     * @param minScore Minimum score
     * @param maxScore Maximum score
     * @return Count of submissions in range
     */
    @Query("SELECT COUNT(s) FROM HomeworkSubmission s " +
           "WHERE s.homework.homeworkId = :homeworkId " +
           "AND s.status = 'GRADED' " +
           "AND s.score BETWEEN :minScore AND :maxScore")
    long countByScoreRange(@Param("homeworkId") Long homeworkId,
                          @Param("minScore") BigDecimal minScore,
                          @Param("maxScore") BigDecimal maxScore);
    
 
    
    /**
     * Count total submissions for homework
     * 
     * @param homeworkId Homework ID
     * @return Total count
     */
    long countByHomework_HomeworkId(Long homeworkId);
    
    /**
     * Count submissions by status
     * 
     * @param homeworkId Homework ID
     * @param status Submission status
     * @return Count
     */
    long countByHomework_HomeworkIdAndStatus(Long homeworkId, SubmissionStatus status);
    
    /**
     * Count graded submissions
     * 
     * @param homeworkId Homework ID
     * @return Count of graded
     */
    @Query("SELECT COUNT(s) FROM HomeworkSubmission s " +
           "WHERE s.homework.homeworkId = :homeworkId AND s.status = 'GRADED'")
    long countGraded(@Param("homeworkId") Long homeworkId);
    
    /**
     * Count submissions needing grading
     * 
     * @param homeworkId Homework ID
     * @return Count of ungraded
     */
    @Query("SELECT COUNT(s) FROM HomeworkSubmission s " +
           "WHERE s.homework.homeworkId = :homeworkId AND s.status != 'GRADED'")
    long countNeedingGrading(@Param("homeworkId") Long homeworkId);
    
    /**
     * Count late submissions
     * 
     * @param homeworkId Homework ID
     * @return Count of late
     */
    @Query("SELECT COUNT(s) FROM HomeworkSubmission s " +
           "WHERE s.homework.homeworkId = :homeworkId AND s.status = 'LATE'")
    long countLate(@Param("homeworkId") Long homeworkId);
    
    /**
     * Count total submissions for teacher
     * 
     * @param teacherId Teacher ID
     * @return Total count
     */
    @Query("SELECT COUNT(s) FROM HomeworkSubmission s " +
           "WHERE s.homework.classEntity.teacher.teacherId = :teacherId")
    long countByTeacherId(@Param("teacherId") Long teacherId);
    
 
    
    /**
     * Search submissions by student name
     * 
     * @param homeworkId Homework ID
     * @param keyword Search keyword
     * @return List of matching submissions
     */
    @Query("SELECT s FROM HomeworkSubmission s " +
           "WHERE s.homework.homeworkId = :homeworkId " +
           "AND (LOWER(s.student.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR s.student.studentCode LIKE CONCAT('%', :keyword, '%'))")
    List<HomeworkSubmission> searchByStudentName(@Param("homeworkId") Long homeworkId,
                                                 @Param("keyword") String keyword);
    
    /**
     * Filter submissions by multiple criteria
     * 
     * @param homeworkId Homework ID
     * @param status Status filter (optional)
     * @param minScore Minimum score (optional)
     * @param maxScore Maximum score (optional)
     * @param pageable Pagination
     * @return Page of filtered submissions
     */
    @Query("SELECT s FROM HomeworkSubmission s " +
           "WHERE s.homework.homeworkId = :homeworkId " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND (:minScore IS NULL OR s.score >= :minScore) " +
           "AND (:maxScore IS NULL OR s.score <= :maxScore) " +
           "ORDER BY s.submissionDate DESC")
    Page<HomeworkSubmission> filterSubmissions(
        @Param("homeworkId") Long homeworkId,
        @Param("status") SubmissionStatus status,
        @Param("minScore") BigDecimal minScore,
        @Param("maxScore") BigDecimal maxScore,
        Pageable pageable);
    
  
    
    /**
     * Get top submissions by score
     * 
     * @param homeworkId Homework ID
     * @param limit Number of top submissions
     * @return List of top submissions
     */
    @Query(value = "SELECT * FROM homework_submission " +
           "WHERE homework_id = :homeworkId AND status = 'GRADED' " +
           "ORDER BY score DESC LIMIT :limit", nativeQuery = true)
    List<HomeworkSubmission> findTopSubmissions(@Param("homeworkId") Long homeworkId,
                                                @Param("limit") int limit);
    
    /**
     * Get student's rank in homework
     * 
     * @param homeworkId Homework ID
     * @param studentId Student ID
     * @return Rank (1-based) or null if not graded
     */
    @Query("SELECT COUNT(s2) + 1 FROM HomeworkSubmission s1, HomeworkSubmission s2 " +
           "WHERE s1.homework.homeworkId = :homeworkId " +
           "AND s2.homework.homeworkId = :homeworkId " +
           "AND s1.student.studentId = :studentId " +
           "AND s2.score > s1.score " +
           "AND s1.status = 'GRADED' AND s2.status = 'GRADED'")
    Long findStudentRank(@Param("homeworkId") Long homeworkId,
                        @Param("studentId") Long studentId);
    
 
    
    /**
     * Delete all submissions for a homework
     * WARNING: Use with caution
     * 
     * @param homeworkId Homework ID
     * @return Number of deleted records
     */
    long deleteByHomework_HomeworkId(Long homeworkId);
    
    /**
     * Delete submission by homework and student
     * 
     * @param homeworkId Homework ID
     * @param studentId Student ID
     * @return Number of deleted records (should be 0 or 1)
     */
    long deleteByHomework_HomeworkIdAndStudent_StudentId(Long homeworkId, Long studentId);
}