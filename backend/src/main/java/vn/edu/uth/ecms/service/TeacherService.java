package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.uth.ecms.dto.request.ChangePasswordRequest;
import vn.edu.uth.ecms.dto.request.TeacherCreateRequest;
import vn.edu.uth.ecms.dto.request.TeacherUpdateRequest;
import vn.edu.uth.ecms.dto.request.UpdateTeacherProfileRequest;
import vn.edu.uth.ecms.dto.response.TeacherResponse;

import java.util.List;

/**
 * Service interface for Teacher management
 */
public interface TeacherService {

    /**
     * Create a new teacher
     * @param request Teacher creation data
     * @return Created teacher response
     */
    TeacherResponse createTeacher(TeacherCreateRequest request);

    /**
     * Update an existing teacher (admin function)
     * @param id Teacher ID
     * @param request Teacher update data
     * @return Updated teacher response
     */
    TeacherResponse updateTeacher(Long id, TeacherUpdateRequest request);

    /**
     * Delete a teacher (soft delete)
     * @param id Teacher ID
     */
    void deleteTeacher(Long id);

    /**
     * Get teacher by ID
     * @param id Teacher ID
     * @return Teacher response
     */
    TeacherResponse getTeacherById(Long id);

    /**
     * Get all teachers with pagination
     * @param pageable Pagination parameters
     * @return Page of teacher responses
     */
    Page<TeacherResponse> getAllTeachers(Pageable pageable);

    /**
     * Get teachers by department
     * @param departmentId Department ID
     * @return List of teacher responses
     */
    List<TeacherResponse> getTeachersByDepartment(Long departmentId);

    /**
     * Get teachers by major
     * @param majorId Major ID
     * @return List of teacher responses
     */
    List<TeacherResponse> getTeachersByMajor(Long majorId);

    /**
     * Search teachers by keyword
     * @param keyword Search keyword
     * @param pageable Pagination parameters
     * @return Page of teacher responses
     */
    Page<TeacherResponse> searchTeachers(String keyword, Pageable pageable);

    /**
     * Get active teachers only
     * @return List of active teacher responses
     */
    List<TeacherResponse> getActiveTeachers();

    // ==================== PROFILE METHODS (NEW) ====================

    /**
     * Get teacher by citizen ID (for current user profile)
     * @param citizenId Teacher's citizen ID
     * @return Teacher response
     */
    TeacherResponse getByCitizenId(String citizenId);

    /**
     * Update teacher profile (self-service for current user)
     * Only allows updating: email, phone, address
     * @param citizenId Teacher's citizen ID
     * @param request Profile update request
     * @return Updated teacher response
     */
    TeacherResponse updateProfile(String citizenId, UpdateTeacherProfileRequest request);

    /**
     * Change password (self-service for current user)
     * @param citizenId Teacher's citizen ID
     * @param request Change password request
     */
    void changePassword(String citizenId, ChangePasswordRequest request);
}