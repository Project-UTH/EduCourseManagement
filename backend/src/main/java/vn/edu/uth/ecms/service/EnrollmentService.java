package vn.edu.uth.ecms.service;

import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.ManualEnrollRequest;
import vn.edu.uth.ecms.dto.response.CourseRegistrationResponse;
import vn.edu.uth.ecms.entity.ClassEntity;
import vn.edu.uth.ecms.entity.Semester;
import vn.edu.uth.ecms.entity.Student;

import java.util.List;

/**
 * Service interface for student enrollment management
 *
 * ✅ FIXED: Removed duplicate createStudentSchedule method
 */
public interface EnrollmentService {

    /**
     * Manually enroll a student to a class (Admin only)
     * For special cases: late enrollment, transfer, makeup class
     *
     * @param classId Class ID
     * @param request Enrollment request with student ID and reason
     * @return CourseRegistrationResponse
     */
    CourseRegistrationResponse manuallyEnrollStudent(Long classId, ManualEnrollRequest request);

    /**
     * Drop a student from a class (Admin only)
     *
     * @param classId Class ID
     * @param studentId Student ID
     * @param reason Drop reason (optional)
     */
    void dropStudent(Long classId, Long studentId, String reason);

    /**
     * Get all students enrolled in a class
     *
     * @param classId Class ID
     * @return List of active registrations
     */
    List<CourseRegistrationResponse> getStudentsInClass(Long classId);

    /**
     * Get all manual enrollments for audit
     *
     * @return List of manual enrollments
     */
    List<CourseRegistrationResponse> getManualEnrollments();

    /**
     * Count active students in a class
     *
     * @param classId Class ID
     * @return Student count
     */
    long countStudentsInClass(Long classId);

    /**
     * ✅ FIXED: Single method with 3 parameters
     * Create student schedule entries when enrolling
     *
     * @param student Student entity
     * @param classEntity Class entity
     * @param semester Semester entity
     */
    @Transactional
    void createStudentSchedule(Student student, ClassEntity classEntity, Semester semester);
}