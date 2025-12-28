package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.CourseRegistration;
import vn.edu.uth.ecms.entity.RegistrationStatus;
import vn.edu.uth.ecms.entity.Student;

import java.util.List;
import java.util.Optional;

/**
 * Repository for CourseRegistration entity - CORRECTED
 *
 * ✅ FIXES:
 * - Added existsByStudentStudentIdAndClassEntityClassId()
 * - Added findByStudentStudentIdAndClassEntityClassId()
 * - Added findByClassEntityClassIdAndStatus()
 * - Added findAllManualEnrollments()
 * - Added countActiveStudents()
 * - Added findActiveStudentsByClass()
 */
@Repository
public interface CourseRegistrationRepository extends JpaRepository<CourseRegistration, Long> {

    // ==================== EXISTING METHODS (Keep these) ====================

    /**
     * Count active enrollments in a class
     */
    @Query("SELECT COUNT(cr) FROM CourseRegistration cr " +
            "WHERE cr.classEntity.classId = :classId " +
            "AND cr.status = 'REGISTERED'")
    long countActiveEnrollmentsByClassId(@Param("classId") Long classId);

    /**
     * Find registrations by student and semester
     */
    @Query("SELECT cr FROM CourseRegistration cr " +
            "WHERE cr.student.studentId = :studentId " +
            "AND cr.classEntity.semester.semesterId = :semesterId")
    List<CourseRegistration> findByStudentAndSemester(
            @Param("studentId") Long studentId,
            @Param("semesterId") Long semesterId
    );

    /**
     * Delete dropped registrations for a class
     *
     * @return
     */
    @Modifying
    @Query("DELETE FROM CourseRegistration cr " +
            "WHERE cr.classEntity.classId = :classId " +
            "AND cr.status = 'DROPPED'")
    int deleteDroppedByClassId(@Param("classId") Long classId);

    // ==================== ✅ NEW METHODS (Fix compilation errors) ====================

    /**
     * ✅ FIX 1: Check if student is already registered in a class
     * Used by: EligibleStudentServiceImpl, EnrollmentServiceImpl
     */
    @Query("SELECT CASE WHEN COUNT(cr) > 0 THEN true ELSE false END " +
            "FROM CourseRegistration cr " +
            "WHERE cr.student.studentId = :studentId " +
            "AND cr.classEntity.classId = :classId " +
            "AND cr.status = 'REGISTERED'")
    boolean existsByStudentStudentIdAndClassEntityClassId(
            @Param("studentId") Long studentId,
            @Param("classId") Long classId
    );

    /**
     * ✅ FIX 2: Find registration by student and class
     * Used by: EnrollmentServiceImpl (manualEnroll, dropout)
     */
    @Query("SELECT cr FROM CourseRegistration cr " +
            "WHERE cr.student.studentId = :studentId " +
            "AND cr.classEntity.classId = :classId")
    Optional<CourseRegistration> findByStudentStudentIdAndClassEntityClassId(
            @Param("studentId") Long studentId,
            @Param("classId") Long classId
    );

    /**
     * ✅ FIX 3: Find all registrations in a class with specific status
     * Used by: EligibleStudentServiceImpl, EnrollmentServiceImpl
     */
    @Query("SELECT cr FROM CourseRegistration cr " +
            "WHERE cr.classEntity.classId = :classId " +
            "AND cr.status = :status " +
            "ORDER BY cr.registeredAt DESC")
    List<CourseRegistration> findByClassEntityClassIdAndStatus(
            @Param("classId") Long classId,
            @Param("status") RegistrationStatus status
    );

    /**
     * ✅ FIX 4: Find all manual enrollments
     * Used by: EnrollmentServiceImpl (viewManualEnrollments)
     */
    @Query("SELECT cr FROM CourseRegistration cr " +
            "WHERE cr.enrollmentType = 'MANUAL' " +
            "ORDER BY cr.registeredAt DESC")
    List<CourseRegistration> findAllManualEnrollments();

    /**
     * ✅ FIX 5: Count active students in a class
     * Used by: EnrollmentServiceImpl
     * Note: This is same as countActiveEnrollmentsByClassId but with different name
     */
    @Query("SELECT COUNT(cr) FROM CourseRegistration cr " +
            "WHERE cr.classEntity.classId = :classId " +
            "AND cr.status = 'REGISTERED'")
    long countActiveStudents(@Param("classId") Long classId);

    /**
     * ✅ FIX 6: Find all active students in a class
     * Used by: EnrollmentServiceImpl (createStudentSchedule)
     * Returns Student entities for schedule conflict checking
     */
    @Query("SELECT cr.student FROM CourseRegistration cr " +
            "WHERE cr.classEntity.classId = :classId " +
            "AND cr.status = 'REGISTERED'")
    List<Student> findActiveStudentsByClass(@Param("classId") Long classId);

    // ==================== ADDITIONAL USEFUL METHODS ====================

    /**
     * Find all registrations for a class (any status)
     */
    @Query("SELECT cr FROM CourseRegistration cr " +
            "WHERE cr.classEntity.classId = :classId " +
            "ORDER BY cr.status, cr.registeredAt DESC")
    List<CourseRegistration> findByClassEntityClassId(@Param("classId") Long classId);

    /**
     * Check if student has schedule conflict
     */
    @Query("SELECT CASE WHEN COUNT(cr) > 0 THEN true ELSE false END " +
            "FROM CourseRegistration cr " +
            "JOIN cr.classEntity ce " +
            "WHERE cr.student.studentId = :studentId " +
            "AND cr.status = 'REGISTERED' " +
            "AND ce.semester.semesterId = :semesterId " +
            "AND ce.dayOfWeek = :dayOfWeek " +
            "AND ce.timeSlot = :timeSlot " +
            "AND ce.classId != :excludeClassId")
    boolean hasStudentScheduleConflict(
            @Param("studentId") Long studentId,
            @Param("semesterId") Long semesterId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("timeSlot") String timeSlot,
            @Param("excludeClassId") Long excludeClassId
    );

    /**
     * Count total registrations by student and semester
     */
    @Query("SELECT COUNT(cr) FROM CourseRegistration cr " +
            "WHERE cr.student.studentId = :studentId " +
            "AND cr.classEntity.semester.semesterId = :semesterId " +
            "AND cr.status = 'REGISTERED'")
    long countByStudentAndSemester(
            @Param("studentId") Long studentId,
            @Param("semesterId") Long semesterId
    );

    /**
     * Sum total credits registered by student in semester
     */
    @Query("SELECT COALESCE(SUM(cr.classEntity.subject.credits), 0) " +
            "FROM CourseRegistration cr " +
            "WHERE cr.student.studentId = :studentId " +
            "AND cr.classEntity.semester.semesterId = :semesterId " +
            "AND cr.status = 'REGISTERED'")
    int sumCreditsByStudentAndSemester(
            @Param("studentId") Long studentId,
            @Param("semesterId") Long semesterId
    );
}