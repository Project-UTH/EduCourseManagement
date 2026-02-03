package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import vn.edu.uth.ecms.dto.request.GradeSubmissionRequest;
import vn.edu.uth.ecms.dto.request.SubmissionRequest;
import vn.edu.uth.ecms.dto.response.SubmissionResponse;
import vn.edu.uth.ecms.dto.response.SubmissionStatsResponse;

import java.util.List;

/**
 * SubmissionService Interface
 * @author
 * @since
 */
public interface SubmissionService {
    
  
    
   
    SubmissionResponse submitHomework(SubmissionRequest request, Long studentId);
    
    /**
     * Student updates submission (before grading)
     * Validates: not graded yet
     */
    SubmissionResponse updateSubmission(Long submissionId, SubmissionRequest request, Long studentId);
    
    /**
     * Student deletes submission (before grading)
     */
    void deleteSubmission(Long submissionId, Long studentId);
    
    /**
     * Get student's submission for homework
     */
    SubmissionResponse getMySubmission(Long homeworkId, Long studentId);
    
    /**
     * Get all submissions by student
     */
    List<SubmissionResponse> getMySubmissions(Long studentId);
    
   
    /**
     * Teacher grades a submission
     * Validates: teacher owns homework, score range
     * Updates: grade table for regular homework
     */
    SubmissionResponse gradeSubmission(Long submissionId, GradeSubmissionRequest request, Long teacherId);
    
    /**
     * Teacher ungrades a submission
     */
    SubmissionResponse ungradeSubmission(Long submissionId, Long teacherId);
    
    /**
     * Get submissions needing grading
     */
    List<SubmissionResponse> getSubmissionsForGrading(Long homeworkId, Long teacherId);
    
    /**
     * Get all submissions for homework
     */
    List<SubmissionResponse> getSubmissionsByHomework(Long homeworkId, Long teacherId);
    
    /**
     * Get all submissions for homework with pagination
     */
    Page<SubmissionResponse> getSubmissionsByHomework(Long homeworkId, Long teacherId, Pageable pageable);
    
    /**
     * Bulk grade submissions
     */
    List<SubmissionResponse> bulkGrade(List<GradeSubmissionRequest> requests, Long teacherId);
    
    
    
    /**
     * Get submission statistics
     */
    SubmissionStatsResponse getSubmissionStats(Long homeworkId);
    
    /**
     * Check if student can submit
     * Considers: deadline, existing submission
     */
    boolean canSubmit(Long homeworkId, Long studentId);
    
    /**
     * Check if submission can be edited
     */
    boolean canEdit(Long submissionId, Long studentId);
     SubmissionResponse submitHomework(
        Long homeworkId, 
        String studentCode, 
        String submissionText, 
        MultipartFile file
    );
     SubmissionResponse updateSubmissionByStudent(
        Long homeworkId,
        String studentCode,
        String submissionText,
        MultipartFile file
    );
    void deleteSubmissionFile(Long homeworkId, String studentCode);
}