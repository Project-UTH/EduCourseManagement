package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.uth.ecms.dto.request.HomeworkRequest;
import vn.edu.uth.ecms.dto.response.HomeworkDetailResponse;
import vn.edu.uth.ecms.dto.response.HomeworkResponse;
import vn.edu.uth.ecms.dto.response.HomeworkStatsResponse;
import vn.edu.uth.ecms.entity.HomeworkType;
import vn.edu.uth.ecms.dto.response.HomeworkWithSubmissionResponse;

import java.time.LocalDateTime;
import java.util.List;

/**
 * HomeworkService Interface
 * 
 * @author
 * @since
 */
public interface HomeworkService {
    
    /**
     * Create new homework
     * Validates: class exists, teacher owns class, type constraints
     */
    HomeworkResponse createHomework(HomeworkRequest request, Long teacherId);
    
    /**
     * Update homework
     * Validates: homework exists, teacher owns class
     */
    HomeworkResponse updateHomework(Long homeworkId, HomeworkRequest request, Long teacherId);
    
    /**
     * Delete homework
     * Validates: no graded submissions
     */
    void deleteHomework(Long homeworkId, Long teacherId);
    
    /**
     * Get homework by ID
     */
    HomeworkResponse getHomeworkById(Long homeworkId);
    
    /**
     * Get homework detail with submissions
     */
    HomeworkDetailResponse getHomeworkDetail(Long homeworkId, Long teacherId);
    
    /**
     * Get all homework for a class
     */
    List<HomeworkResponse> getHomeworkByClass(Long classId);
    
    /**
     * Get homework by class with pagination
     */
    Page<HomeworkResponse> getHomeworkByClass(Long classId, Pageable pageable);
    
    /**
     * Get homework by teacher
     */
    List<HomeworkResponse> getHomeworkByTeacher(Long teacherId);
    
    /**
     * Get homework by teacher with pagination
     */
    Page<HomeworkResponse> getHomeworkByTeacher(Long teacherId, Pageable pageable);
    
    /**
     * Filter homework by multiple criteria
     */
    Page<HomeworkResponse> filterHomework(Long classId, HomeworkType type, 
                                         LocalDateTime startDate, LocalDateTime endDate,
                                         Pageable pageable);
    
    /**
     * Get homework statistics
     */
    HomeworkStatsResponse getHomeworkStats(Long homeworkId);
    
    /**
     * Check if teacher owns homework
     */
    boolean isTeacherOwner(Long homeworkId, Long teacherId);
    List<HomeworkResponse> getHomeworksByClass(Long classId);
    HomeworkDetailResponse getHomeworkDetailForStudent(Long homeworkId, String studentCode);
    List<HomeworkWithSubmissionResponse> getHomeworksByClassWithSubmissionStatus(
        Long classId, String studentCode);
}