package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.uth.ecms.dto.request.ClassCreateRequest;
import vn.edu.uth.ecms.dto.request.ClassUpdateRequest;
import vn.edu.uth.ecms.dto.response.ClassResponse;
import vn.edu.uth.ecms.dto.response.StudentEnrollmentDto;

import java.util.List;

/**
 * Service interface for Class management
 *
 * ✅ UPDATED FOR NEW LOGIC:
 * - Extra schedule conflict detection
 * - E-learning schedule conflict detection
 * - New session generation (fixed + extra + elearning)
 * - Get enrolled students (Phase 4)
 *
 * MAIN RESPONSIBILITIES:
 * 1. CRUD operations for classes
 * 2. Auto-generate sessions when creating/updating class
 * 3. Conflict detection (teacher, room) for ALL schedules
 * 4. Enrollment management
 * 5. Search & filter
 * 6. Get enrolled students with grades
 */
public interface ClassService {

    // ==================== CRUD OPERATIONS ====================
    
    ClassResponse createClass(ClassCreateRequest request);

    /**
     * Update an existing class
     *
     * WARNING: Updating ANY schedule will DELETE and REGENERATE all sessions!
     *
     * ✅ UPDATED LOGIC:
     * 1. Find class
     * 2. Check if has enrolled students (if yes, warn)
     * 3. Validate extra & e-learning schedules (same as create)
     * 4. Check conflicts for ALL schedules (fixed, extra, e-learning)
     * 5. Update class fields (including extra & e-learning)
     * 6. If ANY schedule changed: DELETE old sessions, GENERATE new sessions
     * 7. Return response
     *
     * @param id Class ID
     * @param request Update data (includes all schedules)
     * @return Updated class
     */
    ClassResponse updateClass(Long id, ClassUpdateRequest request);

    /**
     * Delete a class
     *
     * VALIDATION:
     * - Cannot delete if has enrolled students
     * - Will cascade delete all sessions
     *
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

    // ==================== FILTER & SEARCH ====================

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
    
    // ==================== ✅ NEW: PHASE 4 - STUDENT ROSTER ====================
    
    /**
     * Get list of students enrolled in a class (for Teacher)
     * 
     * Returns detailed information about each student including:
     * - Personal info (name, email, phone, gender)
     * - Academic info (major, academic year)
     * - Enrollment info (registration date, type, status)
     * - Performance info (scores, grade status)
     * 
     * SECURITY:
     * - Only teacher who owns the class can access
     * - Throws ForbiddenException if teacher doesn't own class
     * 
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