package vn.edu.uth.ecms.service;

import vn.edu.uth.ecms.dto.request.GradeRequest;
import vn.edu.uth.ecms.dto.response.GradeResponse;
import vn.edu.uth.ecms.dto.response.GradeStatsResponse;
import vn.edu.uth.ecms.dto.response.TranscriptResponse;

import java.math.BigDecimal;
import java.util.List;

/**
 * GradeService Interface
 * @author 
 * @since 
 */
public interface GradeService {
    
  
    GradeResponse createOrUpdateGrade(GradeRequest request, Long teacherId);
    
    /**
     * Get grade for student in class
     */
    GradeResponse getGrade(Long studentId, Long classId);
    
    /**
     * Get all grades for a class
     */
    List<GradeResponse> getGradesByClass(Long classId, Long teacherId);
    
    /**
     * Get student's transcript (all grades)
     */
    TranscriptResponse getTranscript(Long studentId);
    
 
    void calculateRegularScore(Long studentId, Long classId);
    
    
    void updateComponentScore(Long studentId, Long classId, String component, BigDecimal score);
    
    
    BigDecimal calculateGPA(Long studentId);
    
    
    GradeStatsResponse getClassStats(Long classId);

    Long getStudentRank(Long studentId, Long classId);

    List<GradeResponse> bulkUpdateGrades(List<GradeRequest> requests, Long teacherId);
    
  
    void initializeGradesForClass(Long classId);
}