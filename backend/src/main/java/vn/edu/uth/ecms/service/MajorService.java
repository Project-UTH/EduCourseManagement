package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.uth.ecms.dto.request.MajorCreateRequest;
import vn.edu.uth.ecms.dto.request.MajorUpdateRequest;
import vn.edu.uth.ecms.dto.response.MajorResponse;

import java.util.List;

/**
 * Service interface for Major management
 * Phase 3 Sprint 3.1
 */
public interface MajorService {

    /**
     * Create a new major
     * @param request Major creation data
     * @return Created major response
     */
    MajorResponse createMajor(MajorCreateRequest request);

    /**
     * Update an existing major
     * @param id Major ID
     * @param request Major update data
     * @return Updated major response
     */
    MajorResponse updateMajor(Long id, MajorUpdateRequest request);

    /**
     * Delete a major by ID
     * @param id Major ID
     */
    void deleteMajor(Long id);

    /**
     * Get major by ID
     * @param id Major ID
     * @return Major response
     */
    MajorResponse getMajorById(Long id);

    /**
     * Get all majors (with pagination)
     * @param pageable Pagination parameters
     * @return Page of majors
     */
    Page<MajorResponse> getAllMajors(Pageable pageable);

    /**
     * Get all majors (without pagination)
     * @return List of all majors
     */
    List<MajorResponse> getAllMajors();

    /**
     * Get majors by department ID
     * @param departmentId Department ID
     * @return List of majors in the department
     */
    List<MajorResponse> getMajorsByDepartmentId(Long departmentId);

    /**
     * Search majors by keyword
     * @param keyword Search keyword (code or name)
     * @param pageable Pagination parameters
     * @return Page of majors matching keyword
     */
    Page<MajorResponse> searchMajors(String keyword, Pageable pageable);

    /**
     * Check if major code already exists
     * @param majorCode Major code to check
     * @return true if exists, false otherwise
     */
    boolean existsByMajorCode(String majorCode);
}