package vn.edu.uth.ecms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * SubmissionStatsResponse DTO
 * 
 * Aggregated statistics for homework submissions
 * Used for teacher analytics and reports
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubmissionStatsResponse {
    
    /**
     * Overall statistics
     */
    private OverallStats overall;
    
    /**
     * Score statistics
     */
    private ScoreStats scores;
    
    /**
     * Grading progress
     */
    private GradingProgress grading;
    
    /**
     * Late submission statistics
     */
    private LateStats late;
    
    /**
     * Top submissions
     */
    private List<TopSubmission> topSubmissions;
    
    // ========================================
    // NESTED CLASSES
    // ========================================
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverallStats {
        private Integer totalStudents;
        private Integer totalSubmissions;
        private Integer notSubmitted;
        private Double submissionRate;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreStats {
        private BigDecimal average;
        private BigDecimal median;
        private BigDecimal highest;
        private BigDecimal lowest;
        private BigDecimal standardDeviation;
        private Integer passCount;
        private Integer failCount;
        private Double passRate;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GradingProgress {
        private Integer gradedCount;
        private Integer ungradedCount;
        private Double completionRate;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LateStats {
        private Integer lateCount;
        private Double lateRate;
        private BigDecimal avgLateScore;
        private BigDecimal avgOnTimeScore;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopSubmission {
        private String studentName;
        private String studentCode;
        private BigDecimal score;
        private Integer rank;
    }
}