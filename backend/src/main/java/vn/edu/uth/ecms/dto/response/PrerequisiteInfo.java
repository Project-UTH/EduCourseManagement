package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Prerequisite Information DTO
 * 
 * Contains information about a prerequisite subject
 * and whether the student has completed it
 * 
 * @author Phase 4 - Student Features
 * @since 2026-01-22
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrerequisiteInfo {
    
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    
    /**
     * Has the student completed this prerequisite?
     */
    private Boolean isCompleted;
    
    /**
     * Student's total score in this subject (if completed)
     */
    private BigDecimal totalScore;
    
    /**
     * Minimum passing score for this subject
     */
    private BigDecimal minPassGrade;
}