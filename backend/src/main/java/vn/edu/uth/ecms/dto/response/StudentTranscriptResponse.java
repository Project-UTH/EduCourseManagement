package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.GradeStatus;

import java.math.BigDecimal;
import java.util.List;

/**
 * Student Transcript Response DTO
 * 
 * Complete transcript with student info, grades grouped by semester, and statistics
 * 
 * @author Phase 4 - Student Features
 * @since 2026-01-22
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentTranscriptResponse {
    
    /**
     * Student information
     */
    private StudentInfo student;
    
    /**
     * Overall GPA (grade point average on 4.0 scale)
     */
    private Double gpa;
    
    /**
     * Total credits (all courses)
     */
    private Integer totalCredits;
    
    /**
     * Total credits earned (passed courses only)
     */
    private Integer totalCreditsEarned;
    
    /**
     * Number of passed classes
     */
    private Integer passedClasses;
    
    /**
     * Number of failed classes
     */
    private Integer failedClasses;
    
    /**
     * Number of in-progress classes
     */
    private Integer inProgressClasses;
    
    /**
     * Grades grouped by semester
     */
    private List<SemesterData> semesters;
    
    /**
     * Student basic information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentInfo {
        private String studentCode;
        private String fullName;
        private String major;
    }
    
    /**
     * Semester data with grades
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SemesterData {
        private String semesterName;
        private List<ClassGrade> classes;
    }
    
    /**
     * Individual class grade
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassGrade {
        private String subjectCode;
        private String subjectName;
        private Integer credits;
        private BigDecimal totalScore;
        private String letterGrade;
        private GradeStatus status;
    }
}