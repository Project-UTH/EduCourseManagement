package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.Semester;
import vn.edu.uth.ecms.entity.SemesterStatus;

import java.util.List;
import java.util.Optional;

/**
 * Semester Repository
 */
@Repository
public interface SemesterRepository extends JpaRepository<Semester, Long> {

    /**
     * Find semester by code
     */
    Optional<Semester> findBySemesterCode(String semesterCode);

    /**
     * Find current active semester
     */
    List<Semester> findByStatus(SemesterStatus status);

    /**
     * Check if semester code exists
     */
    boolean existsBySemesterCode(String semesterCode);

    /**
     * Count active semesters
     */
    long countByStatus(SemesterStatus status);
}