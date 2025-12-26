package vn.edu.uth.ecms.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.Student;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Student entity
 */
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    /**
     * Check if student code exists
     */
    boolean existsByStudentCode(String studentCode);

    /**
     * Find student by student code
     */
    Optional<Student> findByStudentCode(String studentCode);

    /**
     * Find students by major
     */
    List<Student> findByMajorMajorId(Long majorId);

    /**
     * Find students by major with pagination
     */
    Page<Student> findByMajorMajorId(Long majorId, Pageable pageable);

    /**
     * Find students by department (through major)
     */
    @Query("SELECT s FROM Student s WHERE s.major.department.departmentId = :departmentId")
    List<Student> findByDepartmentId(@Param("departmentId") Long departmentId);

    /**
     * Find active students
     */
    Page<Student> findByIsActiveTrue(Pageable pageable);

    /**
     * Find students by academic year
     */
    Page<Student> findByAcademicYear(Integer academicYear, Pageable pageable);

    /**
     * Search students by keyword (student code, name, email, phone)
     */
    @Query("SELECT s FROM Student s WHERE " +
            "LOWER(s.studentCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(s.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(s.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(s.phone) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Student> searchStudents(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Count students by major
     */
    @Query("SELECT COUNT(s) FROM Student s WHERE s.major.majorId = :majorId AND s.isActive = true")
    Long countByMajorId(@Param("majorId") Long majorId);

    /**
     * Count students by department
     */
    @Query("SELECT COUNT(s) FROM Student s WHERE s.major.department.departmentId = :departmentId AND s.isActive = true")
    Long countByDepartmentId(@Param("departmentId") Long departmentId);

    /**
     * Count students by academic year
     */
    Long countByAcademicYearAndIsActiveTrue(Integer academicYear);
}