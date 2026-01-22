package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.uth.ecms.dto.request.DepartmentCreateRequest;
import vn.edu.uth.ecms.dto.request.DepartmentUpdateRequest;
import vn.edu.uth.ecms.dto.response.DepartmentResponse;

import java.util.List;

/**
 * Service interface for Department management
 * Phase 3 Sprint 3.1
 */
public interface DepartmentService {

    /**
     * Create a new department
     * @param request Department creation data
     * @return Created department response
     */
    DepartmentResponse createDepartment(DepartmentCreateRequest request);

    /**
     * Update an existing department
     * @param id Department ID
     * @param request Department update data
     * @return Updated department response
     */
    DepartmentResponse updateDepartment(Long id, DepartmentUpdateRequest request);

    /**
     * Delete a department by ID
     * @param id Department ID
     */
    void deleteDepartment(Long id);

    /**
     * Get department by ID
     * @param id Department ID
     * @return Department response
     */
    DepartmentResponse getDepartmentById(Long id);

    /**
     * Get all departments (with pagination)
     * @param pageable Pagination parameters
     * @return Page of departments
     */
    Page<DepartmentResponse> getAllDepartments(Pageable pageable);

    /**
     * Get all departments (without pagination)
     * @return List of all departments
     */
    List<DepartmentResponse> getAllDepartments();

    /**
     * Search departments by keyword
     * @param keyword Search keyword (code or name)
     * @param pageable Pagination parameters
     * @return Page of departments matching keyword
     */
    Page<DepartmentResponse> searchDepartments(String keyword, Pageable pageable);

    /**
     * Check if department code already exists
     * @param departmentCode Department code to check
     * @return true if exists, false otherwise
     */
    boolean existsByDepartmentCode(String departmentCode);

    long countAll();
}