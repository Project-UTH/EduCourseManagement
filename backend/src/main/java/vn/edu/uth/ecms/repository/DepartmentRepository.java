package vn.edu.uth.ecms.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.Department;
import java.util.Optional;


@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {

    /**
     * Find department by department code
     * @param departmentCode Department code
     * @return Optional of Department
     */
    Optional<Department> findByDepartmentCode(String departmentCode);

    /**
     * Check if department exists by code
     * @param departmentCode Department code
     * @return true if exists, false otherwise
     */
    boolean existsByDepartmentCode(String departmentCode);

    /**
     * Search departments by code or name (case-insensitive)
     * @param code Department code keyword
     * @param name Department name keyword
     * @param pageable Pagination parameters
     * @return Page of departments
     */
    Page<Department> findByDepartmentCodeContainingOrDepartmentNameContaining(
            String code,
            String name,
            Pageable pageable
    );
}