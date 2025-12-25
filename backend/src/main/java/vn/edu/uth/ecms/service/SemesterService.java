package vn.edu.uth.ecms.service;

import vn.edu.uth.ecms.dto.request.SemesterCreateRequest;
import vn.edu.uth.ecms.dto.request.SemesterUpdateRequest;
import vn.edu.uth.ecms.dto.response.SemesterResponse;

import java.time.LocalDate;
import java.util.List;

/**
 * Semester Service Interface
 */
public interface SemesterService {

    /**
     * Create new semester
     */
    SemesterResponse createSemester(SemesterCreateRequest request);

    /**
     * Update semester
     */
    SemesterResponse updateSemester(Long semesterId, SemesterUpdateRequest request);

    /**
     * Delete semester
     */
    void deleteSemester(Long semesterId);

    /**
     * Get semester by ID
     */
    SemesterResponse getSemesterById(Long semesterId);

    /**
     * Get all semesters
     */
    List<SemesterResponse> getAllSemesters();

    /**
     * Activate semester (only one active at a time)
     */
    SemesterResponse activateSemester(Long semesterId);

    /**
     * Complete semester
     */
    SemesterResponse completeSemester(Long semesterId);

    /**
     * Enable/Disable registration
     */
    SemesterResponse toggleRegistration(Long semesterId,
                                        Boolean enabled,
                                        LocalDate startDate,
                                        LocalDate endDate);

    /**
     * Get current active semester
     */
    SemesterResponse getCurrentSemester();

    /**
     * Check if registration is currently open
     */
    boolean isRegistrationOpen();
}