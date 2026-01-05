package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.uth.ecms.dto.request.SemesterCreateRequest;
import vn.edu.uth.ecms.dto.request.SemesterUpdateRequest;
import vn.edu.uth.ecms.dto.response.SemesterResponse;

import java.time.LocalDate;
import java.util.List;

/**
 * Service interface for Semester operations
 *
 * CRITICAL BUSINESS RULES:
 * 1. Only ONE semester can be ACTIVE at any time
 * 2. When activating semester A, automatically complete current ACTIVE semester
 * 3. Registration period must be within semester dates
 * 4. Cannot delete semester with classes
 * 5. Cannot edit COMPLETED semesters
 */
public interface SemesterService {


    // ==================== CRUD OPERATIONS ====================

    /**
     * Create a new semester
     * Validates dates and prevents overlaps
     */
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

    // ==================== STATUS MANAGEMENT ====================

    /**
     * Activate a semester
     *
     * CRITICAL LOGIC:
     * 1. Find current ACTIVE semester (if exists)
     * 2. Set current ACTIVE to COMPLETED
     * 3. Set target semester to ACTIVE
     *
     * Only ONE semester can be ACTIVE
     */
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

    /**
     * Get semester accepting registrations
     *
     * Returns semester where:
     * 1. status = ACTIVE
     * 2. registrationEnabled = true
     * 3. Current date within registration period
     *
     * This is what students see in registration page
     */
    SemesterResponse getRegistrationOpenSemester();

    // ==================== REGISTRATION CONTROL ====================

    /**
     * Enable registration for a semester
     *
     * Validation:
     * - Semester must be ACTIVE
     * - Registration period must be set
     * - Registration dates must be valid
     */
    SemesterResponse enableRegistration(Long id);

    /**
     * Disable registration for a semester
     */
    SemesterResponse disableRegistration(Long id);

    /**
     * Update registration period
     *
     * Validation:
     * - Start date before end date
     * - End date before or on semester start date
     */
    SemesterResponse updateRegistrationPeriod(
            Long id,
            LocalDate registrationStartDate,
            LocalDate registrationEndDate
    );

    /**
     * Check if registration is currently open for a semester
     */
    boolean isRegistrationOpen(Long semesterId);

    // ==================== VALIDATION ====================

    /**
     * Validate semester dates
     * - End date after start date
     * - Duration around 10 weeks (60-80 days recommended)
     */
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