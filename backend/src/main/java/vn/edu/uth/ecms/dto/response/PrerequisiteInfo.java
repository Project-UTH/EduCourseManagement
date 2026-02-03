package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Prerequisite Information DTO
 * @author
 * @since 
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
    
   
    private Boolean isCompleted;
    
    
    private BigDecimal totalScore;
    
   
    private BigDecimal minPassGrade;
}