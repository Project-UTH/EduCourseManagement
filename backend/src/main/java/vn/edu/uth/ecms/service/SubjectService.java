package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.uth.ecms.dto.request.SubjectCreateRequest;
import vn.edu.uth.ecms.dto.request.SubjectUpdateRequest;
import vn.edu.uth.ecms.dto.response.SubjectResponse;

import java.util.List;

/**
 * Service interface for Subject management
 * Phase 3 Sprint 3.2
 */
public interface SubjectService {

    /**
     * Create a new subject
     */
    SubjectResponse createSubject(SubjectCreateRequest request);

    /**
     * Update an existing subject
     */
    SubjectResponse updateSubject(Long id, SubjectUpdateRequest request);

    /**
     * Delete a subject by ID
     */
    void deleteSubject(Long id);

    /**
     * Get subject by ID
     */
    SubjectResponse getSubjectById(Long id);

    /**
     * Get all subjects (with pagination)
     */
    Page<SubjectResponse> getAllSubjects(Pageable pageable);

    /**
     * Get all subjects (without pagination)
     */
    List<SubjectResponse> getAllSubjects();

    /**
     * Get subjects by department ID
     */
    List<SubjectResponse> getSubjectsByDepartmentId(Long departmentId);

    /**
     * Search subjects by keyword
     */
    Page<SubjectResponse> searchSubjects(String keyword, Pageable pageable);

    /**
     * Check if subject code exists
     */
    boolean existsBySubjectCode(String subjectCode);
}