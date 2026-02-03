package vn.edu.uth.ecms.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.Grade;
import vn.edu.uth.ecms.entity.enums.GradeStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * GradeResponse DTO
 * 
 * Response body for grade data
 * 
 * @author 
 * @since 
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GradeResponse {
    
    /**
     * Grade ID
     */
    private Long gradeId;
    
    /**
     * Student information
     */
    private StudentInfo studentInfo;
    
    /**
     * Class information
     */
    private ClassInfo classInfo;
    
    /**
     * Component scores
     */
    private BigDecimal regularScore;
    private BigDecimal midtermScore;
    private BigDecimal finalScore;
    
    /**
     * Calculated total score
     */
    private BigDecimal totalScore;
    
    /**
     * Letter grade
     */
    private String letterGrade;
    
    /**
     * Grade status
     */
    private GradeStatus status;
    
    /**
     * Status display name
     */
    private String statusDisplay;
    
    /**
     * Attendance rate
     */
    private BigDecimal attendanceRate;
    
    /**
     * Teacher comment
     */
    private String teacherComment;
    
    /**
     * Grade point (for GPA)
     */
    private BigDecimal gradePoint;
    
    /**
     * Is complete?
     */
    private Boolean isComplete;
    
    /**
     * Is passed?
     */
    private Boolean isPassed;
    
    /**
     * Score breakdown
     */
    private String scoreBreakdown;
    
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
 
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentInfo {
        private Long studentId;
        private String studentCode;
        private String fullName;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassInfo {
        private Long classId;
        private String classCode;
        private String subjectName;
        private String subjectCode;
        private Integer credits;
    }
    
    
    public static GradeResponse fromEntity(Grade grade) {
        if (grade == null) return null;
        
        return GradeResponse.builder()
            .gradeId(grade.getGradeId())
            .studentInfo(buildStudentInfo(grade))
            .classInfo(buildClassInfo(grade))
            .regularScore(grade.getRegularScore())
            .midtermScore(grade.getMidtermScore())
            .finalScore(grade.getFinalScore())
            .totalScore(grade.getTotalScore())
            .letterGrade(grade.getLetterGrade())
            .status(grade.getStatus())
            .statusDisplay(grade.getStatus() != null ?
                          grade.getStatus().getDisplayName() : null)
            .attendanceRate(grade.getAttendanceRate())
            .teacherComment(grade.getTeacherComment())
            .gradePoint(grade.getGradePoint())
            .isComplete(grade.isComplete())
            .isPassed(grade.isPassed())
            .scoreBreakdown(grade.getScoreBreakdown())
            .createdAt(grade.getCreatedAt())
            .updatedAt(grade.getUpdatedAt())
            .build();
    }
    
    private static StudentInfo buildStudentInfo(Grade grade) {
        if (grade.getStudent() == null) return null;
        return StudentInfo.builder()
            .studentId(grade.getStudent().getStudentId())
            .studentCode(grade.getStudent().getStudentCode())
            .fullName(grade.getStudent().getFullName())
            .build();
    }
    
    private static ClassInfo buildClassInfo(Grade grade) {
        if (grade.getClassEntity() == null) return null;
        return ClassInfo.builder()
            .classId(grade.getClassEntity().getClassId())
            .classCode(grade.getClassEntity().getClassCode())
            .subjectName(grade.getClassEntity().getSubject() != null ?
                        grade.getClassEntity().getSubject().getSubjectName() : null)
            .subjectCode(grade.getClassEntity().getSubject() != null ?
                        grade.getClassEntity().getSubject().getSubjectCode() : null)
            .credits(grade.getClassEntity().getSubject() != null ?
                    grade.getClassEntity().getSubject().getCredits() : null)
            .build();
    }
}