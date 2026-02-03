package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.uth.ecms.dto.request.ClassCreateRequest;
import vn.edu.uth.ecms.dto.request.ClassUpdateRequest;
import vn.edu.uth.ecms.dto.response.ClassResponse;
import vn.edu.uth.ecms.dto.response.StudentEnrollmentDto;

import java.util.List;


public interface ClassService {

   
    
    ClassResponse createClass(ClassCreateRequest request);

    /**
     * @param id Class ID
     * @param request Update data (includes all schedules)
     * @return Updated class
     */
    ClassResponse updateClass(Long id, ClassUpdateRequest request);

    /**
     * @param id Class ID
     */
    void deleteClass(Long id);

    /**
     * Get class by ID
     */
    ClassResponse getClassById(Long id);

    /**
     * Get all classes with pagination
     */
    Page<ClassResponse> getAllClasses(Pageable pageable);

   

    /**
     * Get classes by semester
     */
    List<ClassResponse> getClassesBySemester(Long semesterId);

    /**
     * Get classes by teacher
     */
    List<ClassResponse> getClassesByTeacher(Long teacherId);

    /**
     * Get classes by subject
     */
    List<ClassResponse> getClassesBySubject(Long subjectId);

    /**
     * Search classes by keyword
     */
    Page<ClassResponse> searchClasses(String keyword, Pageable pageable);

    /**
     * Increment enrolled count
     * Called when student registers
     */
    void incrementEnrollment(Long classId);

    /**
     * Decrement enrolled count
     * Called when student drops
     */
    void decrementEnrollment(Long classId);

    /**
     * Check if class can accept new registrations
     */
    boolean canRegister(Long classId);

    long countAll();
    
    
    /**
     * @param classId Class ID
     * @param teacherId Teacher ID (to verify ownership)
     * @return List of enrolled students with their information
     * @throws ForbiddenException if teacher doesn't own this class
     * @throws ResourceNotFoundException if class not found
     * 
     * @author ECMS Team
     * @since 2026-01-28
     */
    List<StudentEnrollmentDto> getEnrolledStudents(Long classId, Long teacherId);
}