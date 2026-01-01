package vn.edu.uth.ecms.service;

import vn.edu.uth.ecms.dto.response.StudentResponse;
import java.util.List;

/**
 * Service for finding eligible students for classes
 * Based on subject's department and knowledge type
 *
 * Business Logic:
 * - GENERAL subjects: All students eligible
 * - SPECIALIZED (no major): Students from same department
 * - SPECIALIZED (with major): Students from same major only
 */
public interface EligibleStudentService {

    /**
     * Get list of students eligible to enroll in a class
     * Filters based on subject's department and knowledge type
     * Excludes students already enrolled
     *
     * @param classId Class ID
     * @return List of eligible students (not yet enrolled)
     */
    List<StudentResponse> getEligibleStudentsForClass(Long classId);

    /**
     * Check if a student is eligible for a class
     *
     * @param studentId Student ID
     * @param classId Class ID
     * @return true if eligible, false otherwise
     */
    boolean isStudentEligible(Long studentId, Long classId);

    /**
     * Get eligibility info/reason for display
     *
     * @param classId Class ID
     * @return Eligibility description (e.g., "All students", "CNTT students only")
     */
    String getEligibilityInfo(Long classId);
}