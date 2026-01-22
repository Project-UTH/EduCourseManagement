package vn.edu.uth.ecms.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.Teacher;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Teacher entity
 */
@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {

    /**
     * Find teacher by citizen ID (used for login)
     */
    Optional<Teacher> findByCitizenId(String citizenId);

    /**
     * Check if citizen ID exists (for duplicate validation)
     */
    boolean existsByCitizenId(String citizenId);

    /**
     * Find teachers by department
     */
    List<Teacher> findByDepartmentDepartmentId(Long departmentId);

    /**
     * Find teachers by major
     */
    List<Teacher> findByMajorMajorId(Long majorId);

    /**
     * Find active teachers only
     */
    List<Teacher> findByIsActiveTrue();

    /**
     * Find teachers by department and active status
     */
    List<Teacher> findByDepartmentDepartmentIdAndIsActiveTrue(Long departmentId);

    /**
     * Search teachers by keyword (name, email, phone)
     */
    @Query("SELECT t FROM Teacher t WHERE " +
            "LOWER(t.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(t.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "t.phone LIKE CONCAT('%', :keyword, '%') OR " +
            "t.citizenId LIKE CONCAT('%', :keyword, '%')")
    Page<Teacher> searchTeachers(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Count teachers by department
     */
    long countByDepartmentDepartmentId(Long departmentId);

    /**
     * Count active teachers
     */

    long countByIsActive(Boolean isActive);
}