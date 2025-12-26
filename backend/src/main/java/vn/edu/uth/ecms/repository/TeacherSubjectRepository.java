package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.Subject;
import vn.edu.uth.ecms.entity.Teacher;
import vn.edu.uth.ecms.entity.TeacherSubject;

import java.util.List;
import java.util.Optional;

/**
 * Repository for TeacherSubject entity
 */
@Repository
public interface TeacherSubjectRepository extends JpaRepository<TeacherSubject, Long> {

    /**
     * Find all subjects taught by a teacher
     */
    List<TeacherSubject> findByTeacherTeacherId(Long teacherId);

    /**
     * Find all teachers who can teach a subject
     */
    List<TeacherSubject> findBySubjectSubjectId(Long subjectId);

    /**
     * Find specific teacher-subject relationship
     */
    Optional<TeacherSubject> findByTeacherTeacherIdAndSubjectSubjectId(Long teacherId, Long subjectId);

    /**
     * Check if teacher can teach this subject
     */
    boolean existsByTeacherTeacherIdAndSubjectSubjectId(Long teacherId, Long subjectId);

    /**
     * Delete teacher-subject relationship
     */
    void deleteByTeacherTeacherIdAndSubjectSubjectId(Long teacherId, Long subjectId);

    /**
     * Delete all subjects for a teacher
     */
    void deleteByTeacherTeacherId(Long teacherId);

    /**
     * Get teachers who can teach a subject (only active teachers)
     */
    @Query("SELECT ts FROM TeacherSubject ts " +
            "WHERE ts.subject.subjectId = :subjectId " +
            "AND ts.teacher.isActive = true " +
            "ORDER BY ts.isPrimary DESC, ts.yearsOfExperience DESC")
    List<TeacherSubject> findQualifiedTeachersForSubject(@Param("subjectId") Long subjectId);

    /**
     * Get teacher's primary subjects
     */
    @Query("SELECT ts FROM TeacherSubject ts " +
            "WHERE ts.teacher.teacherId = :teacherId " +
            "AND ts.isPrimary = true")
    List<TeacherSubject> findPrimarySubjectsByTeacher(@Param("teacherId") Long teacherId);

    /**
     * Count subjects taught by teacher
     */
    long countByTeacherTeacherId(Long teacherId);

    /**
     * Count teachers who can teach subject
     */
    long countBySubjectSubjectId(Long subjectId);
}