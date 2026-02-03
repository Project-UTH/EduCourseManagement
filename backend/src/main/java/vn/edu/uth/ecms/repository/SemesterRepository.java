package vn.edu.uth.ecms.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.Semester;
import vn.edu.uth.ecms.entity.enums.SemesterStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;


/**
 * Repository for Semester entity
 */
@Repository
public interface SemesterRepository extends JpaRepository<Semester, Long> {

    /**
     * Check if semester code exists
     */
    boolean existsBySemesterCode(String semesterCode);

    /**
     * Find semester by code
     */
    Optional<Semester> findBySemesterCode(String semesterCode);

    /**
     * Find semester by status
     * CRITICAL: Only ONE semester should have status = ACTIVE
     */
    Optional<Semester> findByStatus(SemesterStatus status);


    Page<Semester> findAllByOrderByStartDateDesc(Pageable pageable);

    @Query("SELECT s FROM Semester s WHERE " +
            "s.status = 'ACTIVE' AND " +
            "s.registrationEnabled = true AND " +
            "s.registrationStartDate IS NOT NULL AND " +
            "s.registrationEndDate IS NOT NULL AND " +
            "CURRENT_DATE >= s.registrationStartDate AND " +
            "CURRENT_DATE <= s.registrationEndDate")
    Optional<Semester> findActiveWithOpenRegistration();

    /**
     * Count ACTIVE semesters
     * Should always return 0 or 1
     */
    @Query("SELECT COUNT(s) FROM Semester s WHERE s.status = 'ACTIVE'")
    Long countActiveSemesters();

    /**
     * Find overlapping semesters
     * Used to prevent date conflicts
     */
    @Query("SELECT s FROM Semester s WHERE " +
            "s.status IN ('UPCOMING', 'ACTIVE') AND " +
            "((s.startDate <= :endDate AND s.endDate >= :startDate))")
    List<Semester> findOverlappingSemesters(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Search semesters by keyword (code or name)
     */
    @Query("SELECT s FROM Semester s WHERE " +
            "LOWER(s.semesterCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(s.semesterName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Semester> searchSemesters(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Find semesters by year
     */
    @Query("SELECT s FROM Semester s WHERE " +
            "YEAR(s.startDate) = :year " +
            "ORDER BY s.startDate")
    List<Semester> findByYear(@Param("year") int year);

    /**
     * Get upcoming semesters (status = UPCOMING)
     */
    Page<Semester> findByStatusOrderByStartDateAsc(SemesterStatus status, Pageable pageable);

    /**
     * Find all semesters with registration enabled
     * Used by scheduler to auto-disable expired registrations
     */
    List<Semester> findByRegistrationEnabled(Boolean enabled);
    List<Semester> findByStatusIn(List<SemesterStatus> statuses);
}