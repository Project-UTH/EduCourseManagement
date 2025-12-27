package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.CourseRegistration;
import vn.edu.uth.ecms.entity.RegistrationStatus;

import java.util.List;
import java.util.Optional;

/**
 * Repository for CourseRegistration
 *
 * NOTE: Schedule conflict detection now uses StudentScheduleRepository
 * for more accurate results (checks actual sessions, not just fixed schedule)
 */
@Repository
public interface CourseRegistrationRepository extends JpaRepository<CourseRegistration, Long> {

    // ==================== BASIC QUERIES ====================

    /**
     * Check if student already registered for this class
     */
    boolean existsByStudentStudentIdAndClassEntityClassId(Long studentId, Long classId);

    /**
     * Find registration by student and class
     */
    Optional<CourseRegistration> findByStudentStudentIdAndClassEntityClassId(
            Long studentId, Long classId
    );

    /**
     * Find all registrations for a student
     */
    List<CourseRegistration> findByStudentStudentId(Long studentId);

    /**
     * Find all registrations for a class
     */
    List<CourseRegistration> findByClassEntityClassId(Long classId);

    /**
     * Find all ACTIVE registrations for a class
     */
    List<CourseRegistration> findByClassEntityClassIdAndStatus(
            Long classId, RegistrationStatus status
    );

    /**
     * Count ACTIVE students in a class
     */
    @Query("SELECT COUNT(cr) FROM CourseRegistration cr " +
            "WHERE cr.classEntity.classId = :classId " +
            "AND cr.status = 'REGISTERED'")
    long countActiveStudents(@Param("classId") Long classId);

    // ==================== STUDENT QUERIES ====================

    /**
     * Get all active registrations for a student in a semester
     */
    @Query("SELECT cr FROM CourseRegistration cr " +
            "WHERE cr.student.studentId = :studentId " +
            "AND cr.semester.semesterId = :semesterId " +
            "AND cr.status = 'REGISTERED'")
    List<CourseRegistration> findActiveRegistrations(
            @Param("studentId") Long studentId,
            @Param("semesterId") Long semesterId
    );

    /**
     * Count total credits registered by student in semester
     */
    @Query("SELECT SUM(cr.classEntity.subject.credits) " +
            "FROM CourseRegistration cr " +
            "WHERE cr.student.studentId = :studentId " +
            "AND cr.semester.semesterId = :semesterId " +
            "AND cr.status = 'REGISTERED'")
    Integer sumCreditsRegistered(
            @Param("studentId") Long studentId,
            @Param("semesterId") Long semesterId
    );

    // ==================== ADMIN QUERIES ====================

    /**
     * Get all manual enrollments
     */
    @Query("SELECT cr FROM CourseRegistration cr " +
            "WHERE cr.enrollmentType = 'MANUAL' " +
            "ORDER BY cr.registeredAt DESC")
    List<CourseRegistration> findAllManualEnrollments();

    /**
     * Get manual enrollments by admin
     */
    List<CourseRegistration> findByEnrolledByAdminAdminId(Long adminId);

    /**
     * Get registrations by semester
     */
    List<CourseRegistration> findBySemesterSemesterId(Long semesterId);

    // ==================== NOTES ====================
    // The old hasScheduleConflict() method has been REMOVED
    // Now using StudentScheduleRepository.existsConflict() for accurate detection
    // ==================== NOTES ====================
}