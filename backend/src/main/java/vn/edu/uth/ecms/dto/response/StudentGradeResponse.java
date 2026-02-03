package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.enums.GradeStatus;

import java.math.BigDecimal;

/**
 * Student Grade Response DTO
 * 
 * Response format for student viewing their grades
 * 
 * @author 
 * @since 
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentGradeResponse {
    
    private Long gradeId;
    
    // Student info
    private String studentCode;
    
    // Class info
    private String classCode;
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    private String semesterName;
    
    // Scores
    private BigDecimal regularScore;   // 20%
    private BigDecimal midtermScore;   // 30%
    private BigDecimal finalScore;     // 50%
    private BigDecimal totalScore;     // Calculated
    
    // Grade
    private String letterGrade;        // A, B+, B, etc.
    private GradeStatus status;        // PASSED, FAILED, IN_PROGRESS
}