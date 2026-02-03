package vn.edu.uth.ecms.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.Subject;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Subject entity
 */
@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {

    /**
     * Check if subject code exists
     */
    boolean existsBySubjectCode(String subjectCode);

    /**
     * Find subject by code
     */
    Optional<Subject> findBySubjectCode(String subjectCode);

    /**
     * Find subjects by department ID
     */
    List<Subject> findByDepartmentDepartmentId(Long departmentId);

    /**
     * Search subjects by code or name (with pagination)
     */
    Page<Subject> findBySubjectCodeContainingOrSubjectNameContaining(
            String code,
            String name,
            Pageable pageable
    );

    /**
     * Find subjects by credits
     */
    List<Subject> findByCredits(Integer credits);

    /**
     * Count subjects by department
     */
    Long countByDepartmentDepartmentId(Long departmentId);
}