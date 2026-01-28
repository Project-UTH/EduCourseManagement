package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * StudentEnrollmentDto
 * 
 * Response DTO for displaying students enrolled in a class
 * Used by Teacher to view their class roster
 * 
 * @author ECMS Team
 * @since 2026-01-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentEnrollmentDto {
    
    // ==================== STUDENT INFO ====================
    
    private Long studentId;
    private String studentCode;      // MSSV
    private String fullName;
    private String gender;           // MALE, FEMALE
    private String email;
    private String phone;
    
    // ==================== ACADEMIC INFO ====================
    
    private String majorName;        // Tên chuyên ngành
    private String majorCode;        // Mã chuyên ngành
    private String academicYear;     // Khóa học (VD: 2021-2025)
    private String educationLevel;   // Bậc đào tạo (VD: Đại học)
    
    // ==================== ENROLLMENT INFO ====================
    
    private Long enrollmentId;
    private LocalDateTime registrationDate;  // Ngày đăng ký lớp
    private String enrollmentStatus;         // REGISTERED, COMPLETED, DROPPED
    private String enrollmentType;           // NORMAL, RETAKE, IMPROVE
    
    // ==================== PERFORMANCE INFO (Optional) ====================
    
    private Double regularScore;     // Điểm thường xuyên
    private Double midtermScore;     // Điểm giữa kỳ
    private Double finalScore;       // Điểm cuối kỳ
    private Double totalScore;       // Tổng điểm (auto-calculated)
    private String letterGrade;      // Điểm chữ (A, B+, B, C+, C, D+, D, F)
    private String gradeStatus;      // PASSED, FAILED, IN_PROGRESS
}