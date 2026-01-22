package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.uth.ecms.dto.request.StudentCreateRequest;
import vn.edu.uth.ecms.dto.request.StudentUpdateRequest;
import vn.edu.uth.ecms.dto.request.UpdateStudentProfileRequest;
import vn.edu.uth.ecms.dto.response.ClassResponse;
import vn.edu.uth.ecms.dto.response.ImportResult;
import vn.edu.uth.ecms.dto.response.StudentResponse;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

/**
 * Service interface for Student operations
 */
public interface StudentService {

    /**
     * Create a new student
     * Auto-generates password from date of birth (ddMMyyyy)
     */
    StudentResponse createStudent(StudentCreateRequest request);

    /**
     * Update an existing student
     */
    StudentResponse updateStudent(Long id, StudentUpdateRequest request);

    /**
     * Soft delete a student (set isActive = false)
     */
    void deleteStudent(Long id);

    /**
     * Get student by ID
     */
    StudentResponse getStudentById(Long id);

    /**
     * Get all students with pagination
     */
    Page<StudentResponse> getAllStudents(Pageable pageable);

    /**
     * Get active students only
     */
    Page<StudentResponse> getActiveStudents(Pageable pageable);

    /**
     * Get students by major
     */
    List<StudentResponse> getStudentsByMajor(Long majorId);

    /**
     * Get students by major with pagination
     */
    Page<StudentResponse> getStudentsByMajor(Long majorId, Pageable pageable);

    /**
     * Get students by department (through major)
     */
    List<StudentResponse> getStudentsByDepartment(Long departmentId);

    /**
     * Get students by academic year
     */
    Page<StudentResponse> getStudentsByAcademicYear(Integer academicYear, Pageable pageable);

    /**
     * Search students by keyword
     */
    Page<StudentResponse> searchStudents(String keyword, Pageable pageable);

    // ==================== PROFILE METHODS (NEW) ====================

    /**
     * Get student by student code (for current user profile)
     * @param studentCode Student's code
     * @return Student response
     */
    StudentResponse getByStudentCode(String studentCode);

    /**
     * Update student profile (self-service for current user)
     * Only allows updating: email, phone
     * @param studentCode Student's code
     * @param request Profile update request
     * @return Updated student response
     */
    StudentResponse updateProfile(String studentCode, UpdateStudentProfileRequest request);
     /**
     * Get all classes that student has enrolled in
     */
    List<ClassResponse> getEnrolledClasses(String studentCode);
    
    /**
     * Get detailed information about a class that student has enrolled in
     */
    ClassResponse getEnrolledClassDetail(String studentCode, Long classId);
    
    /**
     * Get student's schedule for current semester
     */
    List<ClassResponse> getCurrentSchedule(String studentCode);
    
    /**
     * Get student's schedule for a specific semester
     */
    List<ClassResponse> getScheduleBySemester(String studentCode, Long semesterId);

    /**
     * Import students from Excel file
     */
    ImportResult importFromExcel(MultipartFile file);

    /**
     * Generate Excel template for import
     */
    ByteArrayOutputStream generateImportTemplate() throws IOException;
}