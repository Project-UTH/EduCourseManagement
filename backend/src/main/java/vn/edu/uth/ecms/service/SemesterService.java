package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.uth.ecms.dto.request.SemesterCreateRequest;
import vn.edu.uth.ecms.dto.request.SemesterUpdateRequest;
import vn.edu.uth.ecms.dto.response.SemesterResponse;

import java.time.LocalDate;
import java.util.List;


public interface SemesterService {


    SemesterResponse createSemester(SemesterCreateRequest request);

    /**
     * Update an existing semester
     * Cannot update if status = COMPLETED
     */
    SemesterResponse updateSemester(Long id, SemesterUpdateRequest request);

    /**
     * Delete a semester
     * Cannot delete if:
     * - Status = ACTIVE
     * - Has classes assigned
     */
    void deleteSemester(Long id);

    /**
     * Get semester by ID
     */
    SemesterResponse getSemesterById(Long id);

    /**
     * Get all semesters with pagination
     */
    Page<SemesterResponse> getAllSemesters(Pageable pageable);

    /**
     * Search semesters by keyword
     */
    Page<SemesterResponse> searchSemesters(String keyword, Pageable pageable);

   
    SemesterResponse activateSemester(Long id);

    /**
     * Complete a semester
     * Sets status to COMPLETED
     * Auto-disables registration
     */
    SemesterResponse completeSemester(Long id);

    /**
     * Get current ACTIVE semester
     * Returns null if no active semester
     */
    SemesterResponse getCurrentSemester();


    SemesterResponse getRegistrationOpenSemester();

 


    SemesterResponse enableRegistration(Long id);

    /**
     * Disable registration for a semester
     */
    SemesterResponse disableRegistration(Long id);


    SemesterResponse updateRegistrationPeriod(
            Long id,
            LocalDate registrationStartDate,
            LocalDate registrationEndDate
    );

    /**
     * Check if registration is currently open for a semester
     */
    boolean isRegistrationOpen(Long semesterId);

   
    void validateSemesterDates(LocalDate startDate, LocalDate endDate);

    /**
     * Validate registration period
     * - Start before end
     * - Period before semester start
     */
    void validateRegistrationPeriod(
            LocalDate semesterStart,
            LocalDate registrationStart,
            LocalDate registrationEnd
    );

    /**
     * Check if semester dates overlap with existing semesters
     */
    boolean hasDateOverlap(LocalDate startDate, LocalDate endDate, Long excludeSemesterId);
    /**
 * Get active semesters (for student registration)
 * ACTIVE or UPCOMING status
 */
List<SemesterResponse> getActiveSemesters();

/**
 * Get all semesters
 */
List<SemesterResponse> getAllSemesters();
}