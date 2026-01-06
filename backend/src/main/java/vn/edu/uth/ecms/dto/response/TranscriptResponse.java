package vn.edu.uth.ecms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * TranscriptResponse DTO
 * 
 * Student's complete transcript (bảng điểm)
 * Shows all grades across all classes
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TranscriptResponse {
    
    /**
     * Student information
     */
    private StudentInfo studentInfo;
    
    /**
     * Academic summary
     */
    private AcademicSummary summary;
    
    /**
     * List of grades by semester
     */
    private List<SemesterGrades> semesters;
    
    // ========================================
    // NESTED CLASSES
    // ========================================
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentInfo {
        private Long studentId;
        private String studentCode;
        private String fullName;
        private String majorName;
        private Integer currentYear;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AcademicSummary {
        private BigDecimal overallGPA;          // GPA trung bình tích lũy
        private BigDecimal averageScore;        // Điểm trung bình
        private Integer totalCredits;           // Tổng số tín chỉ
        private Integer completedCredits;       // Tín chỉ đã hoàn thành
        private Integer passedCredits;          // Tín chỉ đã đạt
        private Integer failedCredits;          // Tín chỉ không đạt
        private Integer totalCourses;           // Tổng số môn học
        private Integer passedCourses;          // Số môn đạt
        private Integer failedCourses;          // Số môn không đạt
        private Double passRate;                // Tỷ lệ đạt (%)
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SemesterGrades {
        private String semesterName;            // HK1 2024-2025
        private BigDecimal semesterGPA;         // GPA học kỳ
        private BigDecimal semesterAverage;     // Điểm TB học kỳ
        private Integer semesterCredits;        // Tín chỉ học kỳ
        private List<CourseGrade> courses;      // Các môn trong kỳ
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseGrade {
        private String classCode;               // Mã lớp
        private String subjectCode;             // Mã môn
        private String subjectName;             // Tên môn
        private Integer credits;                // Số tín chỉ
        private BigDecimal regularScore;        // Điểm thường xuyên
        private BigDecimal midtermScore;        // Điểm giữa kỳ
        private BigDecimal finalScore;          // Điểm cuối kỳ
        private BigDecimal totalScore;          // Điểm tổng kết
        private String letterGrade;             // Điểm chữ
        private BigDecimal gradePoint;          // Điểm số (4.0 scale)
        private String status;                  // PASSED/FAILED/IN_PROGRESS
        private String teacherComment;          // Nhận xét giáo viên
    }
    
    // ========================================
    // HELPER METHODS
    // ========================================
    
    /**
     * Get academic standing based on GPA
     * Excellent (≥3.6), Good (3.2-3.59), Average (2.5-3.19), Weak (<2.5)
     */
    public String getAcademicStanding() {
        if (summary == null || summary.getOverallGPA() == null) {
            return "Unknown";
        }
        
        double gpa = summary.getOverallGPA().doubleValue();
        if (gpa >= 3.6) return "Excellent (Xuất sắc)";
        if (gpa >= 3.2) return "Good (Giỏi)";
        if (gpa >= 2.5) return "Average (Khá)";
        return "Weak (Yếu)";
    }
    
    /**
     * Check if student is eligible for graduation
     * Basic check: passed all required credits
     */
    public boolean isEligibleForGraduation(int requiredCredits) {
        if (summary == null || summary.getPassedCredits() == null) {
            return false;
        }
        return summary.getPassedCredits() >= requiredCredits;
    }
}