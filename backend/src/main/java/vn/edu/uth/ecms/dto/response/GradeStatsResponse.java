package vn.edu.uth.ecms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * GradeStatsResponse DTO
 * 
 * Class grade statistics and analytics
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 * @updated 2026-01-28 - Added helper methods for Excel export
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GradeStatsResponse {
    
    private Long classId;
    private String classCode;
    private OverallStats overall;
    private ScoreStats scores;
    private LetterGradeDistribution distribution;
    private PassFailStats passFail;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverallStats {
        private Integer totalStudents;
        private Integer gradedStudents;
        private Integer inProgress;
        private Double completionRate;
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
        
        // Helper methods for Excel export (return Double)
        public Double getAverageDouble() {
            return average != null ? average.doubleValue() : null;
        }
        
        public Double getHighestDouble() {
            return highest != null ? highest.doubleValue() : null;
        }
        
        public Double getLowestDouble() {
            return lowest != null ? lowest.doubleValue() : null;
        }
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LetterGradeDistribution {
        private Integer countA;
        private Integer countBPlus;
        private Integer countB;
        private Integer countCPlus;
        private Integer countC;
        private Integer countDPlus;
        private Integer countD;
        private Integer countF;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PassFailStats {
        private Integer passedCount;
        private Integer failedCount;
        private Double passRate;
    }
}