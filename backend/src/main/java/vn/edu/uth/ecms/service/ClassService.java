package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.uth.ecms.dto.request.ClassCreateRequest;
import vn.edu.uth.ecms.dto.request.ClassUpdateRequest;
import vn.edu.uth.ecms.dto.response.ClassResponse;
import vn.edu.uth.ecms.entity.TimeSlot;

import java.time.DayOfWeek;
import java.util.List;

/**
 * Service interface for Class management
 *
 * MAIN RESPONSIBILITIES:
 * 1. CRUD operations for classes
 * 2. Auto-generate sessions when creating/updating class
 * 3. Conflict detection (teacher, room)
 * 4. Enrollment management
 * 5. Search & filter
 */
public interface ClassService {

    // ==================== CRUD OPERATIONS ====================

    /**
     * Create a new class
     *
     * LOGIC:
     * 1. Validate: subject, teacher, semester exist
     * 2. Check class code unique
     * 3. Check teacher schedule conflict
     * 4. Check room conflict
     * 5. Create class entity
     * 6. Auto-generate sessions based on subject's inPersonSessions & eLearningSessions
     * 7. Return response
     *
     * @param request Class creation data
     * @return Created class with generated sessions
     * @throws DuplicateException if class code exists
     * @throws ConflictException if teacher/room has conflict
     */
    ClassResponse createClass(ClassCreateRequest request);

    /**
     * Update an existing class
     *
     * WARNING: Updating schedule (day/time/room) will DELETE and REGENERATE all sessions!
     *
     * LOGIC:
     * 1. Find class
     * 2. Check if has enrolled students (if yes, warn)
     * 3. Check new teacher/room conflicts
     * 4. Update class fields
     * 5. If schedule changed: DELETE old sessions, GENERATE new sessions
     * 6. Return response
     *
     * @param id Class ID
     * @param request Update data
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

    // ==================== CONFLICT DETECTION ====================

    /**
     * Check if teacher has schedule conflict
     *
     * Conflict occurs when:
     * - Same teacher
     * - Same semester
     * - Same day of week
     * - Same time slot
     *
     * @param semesterId Semester to check
     * @param teacherId Teacher to check
     * @param dayOfWeek Day of week
     * @param timeSlot Time slot
     * @param excludeClassId Exclude this class (for update)
     * @return true if conflict exists
     */
    boolean hasTeacherConflict(
            Long semesterId,
            Long teacherId,
            DayOfWeek dayOfWeek,
            TimeSlot timeSlot,
            Long excludeClassId
    );

    /**
     * Check if room has schedule conflict
     */
    boolean hasRoomConflict(
            Long semesterId,
            String room,
            DayOfWeek dayOfWeek,
            TimeSlot timeSlot,
            Long excludeClassId
    );

    // ==================== ENROLLMENT MANAGEMENT ====================

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
}