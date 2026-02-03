package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.CourseRegistration;
import vn.edu.uth.ecms.entity.EnrollmentType;
import vn.edu.uth.ecms.entity.RegistrationStatus;
import vn.edu.uth.ecms.entity.Student;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRegistrationRepository extends JpaRepository<CourseRegistration, Long> {
    
    
    
    List<CourseRegistration> findByStudent_StudentIdAndStatus(Long studentId, RegistrationStatus status);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END " +
           "FROM CourseRegistration r " +
           "WHERE r.student.studentId = :studentId " +
           "AND r.classEntity.classId = :classId " +
           "AND r.status = 'REGISTERED'")
    boolean existsByStudentAndClass(
            @Param("studentId") Long studentId,
            @Param("classId") Long classId
    );

    @Query("SELECT r FROM CourseRegistration r " +
           "WHERE r.student.studentId = :studentId " +
           "AND r.status = :status " +
           "ORDER BY r.registeredAt DESC")
    List<CourseRegistration> findByStudentAndStatus(
            @Param("studentId") Long studentId,
            @Param("status") RegistrationStatus status
    );

    @Query("SELECT r FROM CourseRegistration r " +
           "WHERE r.student.studentId = :studentId " +
           "AND r.semester.semesterId = :semesterId " +
           "ORDER BY r.registeredAt DESC")
    List<CourseRegistration> findByStudentAndSemester(
            @Param("studentId") Long studentId,
            @Param("semesterId") Long semesterId
    );

    @Query("SELECT r FROM CourseRegistration r " +
           "WHERE r.classEntity.classId = :classId " +
           "AND r.status = 'REGISTERED'")
    List<CourseRegistration> findByClass(@Param("classId") Long classId);

    @Query("SELECT r FROM CourseRegistration r " +
           "WHERE r.student.studentId = :studentId " +
           "AND r.classEntity.classId = :classId")
    Optional<CourseRegistration> findByStudentAndClass(
            @Param("studentId") Long studentId,
            @Param("classId") Long classId
    );

    @Query("SELECT COUNT(r) FROM CourseRegistration r " +
           "WHERE r.classEntity.classId = :classId " +
           "AND r.status = 'REGISTERED'")
    Long countActiveEnrollmentsByClassId(@Param("classId") Long classId);

    @Modifying
    @Query("DELETE FROM CourseRegistration r " +
           "WHERE r.classEntity.classId = :classId " +
           "AND r.status = 'DROPPED'")
    int deleteDroppedByClassId(@Param("classId") Long classId);

    @Query("SELECT r.student FROM CourseRegistration r " +
           "WHERE r.classEntity.classId = :classId " +
           "AND r.status = 'REGISTERED'")
    List<Student> findActiveStudentsByClass(@Param("classId") Long classId);

    @Query("SELECT r FROM CourseRegistration r " +
           "WHERE r.classEntity.classId = :classId " +
           "AND r.status = :status")
    List<CourseRegistration> findByClassEntityClassIdAndStatus(
            @Param("classId") Long classId,
            @Param("status") RegistrationStatus status
    );

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END " +
           "FROM CourseRegistration r " +
           "WHERE r.student.studentId = :studentId " +
           "AND r.classEntity.classId = :classId")
    boolean existsByStudentStudentIdAndClassEntityClassId(
            @Param("studentId") Long studentId,
            @Param("classId") Long classId
    );

    @Query("SELECT r FROM CourseRegistration r " +
           "WHERE r.student.studentId = :studentId " +
           "AND r.classEntity.classId = :classId")
    Optional<CourseRegistration> findByStudentStudentIdAndClassEntityClassId(
            @Param("studentId") Long studentId,
            @Param("classId") Long classId
    );

    @Query("SELECT COUNT(r) FROM CourseRegistration r " +
           "WHERE r.classEntity.classId = :classId " +
           "AND r.status = 'REGISTERED'")
    Long countActiveStudents(@Param("classId") Long classId);

   
    List<CourseRegistration> findByClassEntity_ClassId(Long classId);
    
  
    List<CourseRegistration> findByClassEntity_ClassIdAndStatus(Long classId, RegistrationStatus status);
    
    
    List<CourseRegistration> findByEnrollmentTypeOrderByRegisteredAtDesc(EnrollmentType enrollmentType);

    
    
    /**
     * @param semesterId Semester ID
     * @param status Registration status (e.g., REGISTERED)
     * @return List of course registrations
     */
    @Query("SELECT cr FROM CourseRegistration cr " +
           "WHERE cr.semester.semesterId = :semesterId " +
           "AND cr.status = :status")
    List<CourseRegistration> findBySemesterAndStatus(
            @Param("semesterId") Long semesterId,
            @Param("status") RegistrationStatus status
    );
}