package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.uth.ecms.dto.request.SubjectCreateRequest;
import vn.edu.uth.ecms.dto.request.SubjectUpdateRequest;
import vn.edu.uth.ecms.dto.response.SubjectResponse;
import vn.edu.uth.ecms.dto.response.TeacherResponse;

import java.util.List;


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

    // Prerequisites
    // Add these to SubjectService interface:
    void addPrerequisite(Long subjectId, Long prerequisiteId);

    void removePrerequisite(Long subjectId, Long prerequisiteId);

    List<SubjectResponse> getPrerequisites(Long subjectId);

    boolean hasPrerequisites(Long subjectId);

    /**
     * Get teachers who can teach this subject
     * Queries teacher_subject table to find assigned teachers
     *
     * @param subjectId Subject ID
     * @return List of teachers who can teach this subject
     */
    List<TeacherResponse> getTeachersForSubject(Long subjectId);

    long countAll();
}