package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.uth.ecms.dto.request.StudentCreateRequest;
import vn.edu.uth.ecms.dto.request.StudentUpdateRequest;
import vn.edu.uth.ecms.dto.response.StudentResponse;

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
}