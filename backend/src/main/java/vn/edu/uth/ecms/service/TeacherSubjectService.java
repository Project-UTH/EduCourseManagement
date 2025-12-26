package vn.edu.uth.ecms.service;

import vn.edu.uth.ecms.dto.request.TeacherSubjectRequest;
import vn.edu.uth.ecms.dto.response.TeacherSubjectResponse;

import java.util.List;

/**
 * Service for managing teacher-subject relationships
 */
public interface TeacherSubjectService {

    /**
     * Add a subject to a teacher
     */
    TeacherSubjectResponse addSubjectToTeacher(Long teacherId, TeacherSubjectRequest request);

    /**
     * Add multiple subjects to a teacher
     */
    List<TeacherSubjectResponse> addSubjectsToTeacher(Long teacherId, List<TeacherSubjectRequest> requests);

    /**
     * Remove a subject from a teacher
     */
    void removeSubjectFromTeacher(Long teacherId, Long subjectId);

    /**
     * Update teacher-subject relationship
     */
    TeacherSubjectResponse updateTeacherSubject(Long teacherId, Long subjectId, TeacherSubjectRequest request);

    /**
     * Get all subjects taught by a teacher
     */
    List<TeacherSubjectResponse> getSubjectsByTeacher(Long teacherId);

    /**
     * Get all teachers who can teach a subject
     */
    List<TeacherSubjectResponse> getTeachersBySubject(Long subjectId);

    /**
     * Get qualified teachers for a subject (sorted by priority)
     */
    List<TeacherSubjectResponse> getQualifiedTeachers(Long subjectId);

    /**
     * Replace all subjects for a teacher
     */
    List<TeacherSubjectResponse> replaceTeacherSubjects(Long teacherId, List<TeacherSubjectRequest> requests);
}