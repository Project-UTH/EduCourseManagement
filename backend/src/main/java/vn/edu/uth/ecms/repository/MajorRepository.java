package vn.edu.uth.ecms.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.Major;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Major entity
 * Phase 3 Sprint 3.1
 */
@Repository
public interface MajorRepository extends JpaRepository<Major, Long> {

    /**
     * Find major by major code
     * @param majorCode Major code
     * @return Optional of Major
     */
    Optional<Major> findByMajorCode(String majorCode);

    /**
     * Check if major exists by code
     * @param majorCode Major code
     * @return true if exists, false otherwise
     */
    boolean existsByMajorCode(String majorCode);

    /**
     * Find all majors by department ID
     * @param departmentId Department ID
     * @return List of majors in the department
     */
    List<Major> findByDepartmentDepartmentId(Long departmentId);

    /**
     * Search majors by code or name (case-insensitive)
     * @param code Major code keyword
     * @param name Major name keyword
     * @param pageable Pagination parameters
     * @return Page of majors
     */
    Page<Major> findByMajorCodeContainingOrMajorNameContaining(
            String code,
            String name,
            Pageable pageable
    );

    @Query("SELECT m FROM Major m JOIN FETCH m.department WHERE m.majorId = :id")
    Optional<Major> findByIdWithDepartment(@Param("id") Long id);
}