package vn.edu.uth.ecms.service;

import vn.edu.uth.ecms.dto.request.GradeRequest;
import vn.edu.uth.ecms.dto.response.GradeResponse;
import vn.edu.uth.ecms.dto.response.GradeStatsResponse;
import vn.edu.uth.ecms.dto.response.TranscriptResponse;

import java.math.BigDecimal;
import java.util.List;

/**
 * GradeService Interface
 * 
 * Service layer for grade management
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
public interface GradeService {
    
    // ==================== CRUD OPERATIONS ====================
    
    /**
     * Create or update grade
     * Creates if not exists, updates if exists
     */
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
    
    // ==================== AUTO-CALCULATION ====================
    
    /**
     * Calculate regular score (average of REGULAR homework)
     * Called automatically when REGULAR homework is graded
     */
    void calculateRegularScore(Long studentId, Long classId);
    
    /**
     * Update component score (midterm or final)
     * Called when MIDTERM or FINAL homework is graded
     */
    void updateComponentScore(Long studentId, Long classId, String component, BigDecimal score);
    
    /**
     * Calculate GPA for student
     * Weighted by credits
     */
    BigDecimal calculateGPA(Long studentId);
    
    // ==================== STATISTICS ====================
    
    /**
     * Get class grade statistics
     */
    GradeStatsResponse getClassStats(Long classId);
    
    /**
     * Get student rank in class
     */
    Long getStudentRank(Long studentId, Long classId);
    
    // ==================== BULK OPERATIONS ====================
    
    /**
     * Bulk update grades
     */
    List<GradeResponse> bulkUpdateGrades(List<GradeRequest> requests, Long teacherId);
    
    /**
     * Initialize grades for all students in class
     * Creates empty grade records
     */
    void initializeGradesForClass(Long classId);
}