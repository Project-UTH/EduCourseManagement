package vn.edu.uth.ecms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * HomeworkStatsResponse DTO
 * 
 * Statistics and analytics for homework
 * Used for teacher dashboard and reports
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HomeworkStatsResponse {
    
    /**
     * Homework ID
     */
    private Long homeworkId;
    
    /**
     * Homework title
     */
    private String title;
    
    /**
     * Class code
     */
    private String classCode;
    
    /**
     * Total students in class
     */
    private Integer totalStudents;
    
    /**
     * Submission statistics
     */
    private SubmissionStats submissionStats;
    
    /**
     * Score statistics
     */
    private ScoreStats scoreStats;
    
    /**
     * Score distribution
     */
    private ScoreDistribution scoreDistribution;
    
    /**
     * Late submission statistics
     */
    private LateStats lateStats;
    
    // ========================================
    // NESTED CLASSES
    // ========================================
    
    /**
     * Submission statistics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmissionStats {
        private Integer totalSubmissions;
        private Integer gradedSubmissions;
        private Integer ungradedSubmissions;
        private Integer notSubmitted;
        private Double submissionRate;      // Percentage submitted
        private Double gradingCompletion;   // Percentage graded
    }
    
    /**
     * Score statistics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreStats {
        private BigDecimal averageScore;
        private BigDecimal medianScore;
        private BigDecimal highestScore;
        private BigDecimal lowestScore;
        private BigDecimal standardDeviation;
        private Double passRate;            // Percentage >= 4.0
    }
    
    /**
     * Score distribution
     * Count of students in each score range
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScoreDistribution {
        private Integer range_0_4;      // F (0.0-3.9)
        private Integer range_4_5;      // D (4.0-4.9)
        private Integer range_5_6;      // D+, C (5.0-6.4)
        private Integer range_6_7;      // C+, B (6.5-7.9)
        private Integer range_7_8;      // B (7.0-7.9)
        private Integer range_8_9;      // B+, A (8.0-8.9)
        private Integer range_9_10;     // A (9.0-10.0)
        
        /**
         * Get distribution as list for charts
         */
        public List<RangeCount> toList() {
            return List.of(
                new RangeCount("0-4 (F)", range_0_4),
                new RangeCount("4-5 (D)", range_4_5),
                new RangeCount("5-6 (D+/C)", range_5_6),
                new RangeCount("6-7 (C+)", range_6_7),
                new RangeCount("7-8 (B)", range_7_8),
                new RangeCount("8-9 (B+)", range_8_9),
                new RangeCount("9-10 (A)", range_9_10)
            );
        }
    }
    
    /**
     * Range count for distribution
     */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RangeCount {
        private String range;
        private Integer count;
    }
    
    /**
     * Late submission statistics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LateStats {
        private Integer totalLate;
        private Double lateRate;            // Percentage late
        private BigDecimal averageLateScore;
        private BigDecimal averageOnTimeScore;
        private String averageLateDuration; // Human-readable
    }
    
    // ========================================
    // BUILDER METHODS
    // ========================================
    
    /**
     * Create SubmissionStats
     */
    public static SubmissionStats buildSubmissionStats(
        int totalStudents,
        int totalSubmissions,
        int gradedSubmissions,
        int ungradedSubmissions
    ) {
        int notSubmitted = totalStudents - totalSubmissions;
        double submissionRate = totalStudents > 0 ?
                               (totalSubmissions * 100.0 / totalStudents) : 0.0;
        double gradingCompletion = totalSubmissions > 0 ?
                                  (gradedSubmissions * 100.0 / totalSubmissions) : 0.0;
        
        return SubmissionStats.builder()
            .totalSubmissions(totalSubmissions)
            .gradedSubmissions(gradedSubmissions)
            .ungradedSubmissions(ungradedSubmissions)
            .notSubmitted(notSubmitted)
            .submissionRate(Math.round(submissionRate * 100.0) / 100.0)
            .gradingCompletion(Math.round(gradingCompletion * 100.0) / 100.0)
            .build();
    }
    
    /**
     * Create ScoreStats
     */
    public static ScoreStats buildScoreStats(
        BigDecimal average,
        BigDecimal median,
        BigDecimal highest,
        BigDecimal lowest,
        BigDecimal stdDev,
        int passedCount,
        int totalGraded
    ) {
        double passRate = totalGraded > 0 ?
                         (passedCount * 100.0 / totalGraded) : 0.0;
        
        return ScoreStats.builder()
            .averageScore(average)
            .medianScore(median)
            .highestScore(highest)
            .lowestScore(lowest)
            .standardDeviation(stdDev)
            .passRate(Math.round(passRate * 100.0) / 100.0)
            .build();
    }
    
    /**
     * Create ScoreDistribution from counts map
     */
    public static ScoreDistribution buildScoreDistribution(Map<String, Integer> counts) {
        return ScoreDistribution.builder()
            .range_0_4(counts.getOrDefault("0-4", 0))
            .range_4_5(counts.getOrDefault("4-5", 0))
            .range_5_6(counts.getOrDefault("5-6", 0))
            .range_6_7(counts.getOrDefault("6-7", 0))
            .range_7_8(counts.getOrDefault("7-8", 0))
            .range_8_9(counts.getOrDefault("8-9", 0))
            .range_9_10(counts.getOrDefault("9-10", 0))
            .build();
    }
    
    /**
     * Create LateStats
     */
    public static LateStats buildLateStats(
        int totalLate,
        int totalSubmissions,
        BigDecimal avgLateScore,
        BigDecimal avgOnTimeScore,
        String avgLateDuration
    ) {
        double lateRate = totalSubmissions > 0 ?
                         (totalLate * 100.0 / totalSubmissions) : 0.0;
        
        return LateStats.builder()
            .totalLate(totalLate)
            .lateRate(Math.round(lateRate * 100.0) / 100.0)
            .averageLateScore(avgLateScore)
            .averageOnTimeScore(avgOnTimeScore)
            .averageLateDuration(avgLateDuration)
            .build();
    }
}