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
 * @author
 * @since 
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentEnrollmentDto {
    
  
    
    private Long studentId;
    private String studentCode;      
    private String fullName;
    private String gender;           
    private String email;
    private String phone;
    
    
    
    private String majorName;        // Tên chuyên ngành
    private String majorCode;        // Mã chuyên ngành
    private String academicYear;     // Khóa học (VD: 2021-2025)
    private String educationLevel;   // Bậc đào tạo (VD: Đại học)
    
    
    
    private Long enrollmentId;
    private LocalDateTime registrationDate;  // Ngày đăng ký lớp
    private String enrollmentStatus;         // REGISTERED, COMPLETED, DROPPED
    private String enrollmentType;           // NORMAL, RETAKE, IMPROVE
    
    
    
    private Double regularScore;     // Điểm thường xuyên
    private Double midtermScore;     // Điểm giữa kỳ
    private Double finalScore;       // Điểm cuối kỳ
    private Double totalScore;       // Tổng điểm (auto-calculated)
    private String letterGrade;      // Điểm chữ (A, B+, B, C+, C, D+, D, F)
    private String gradeStatus;      // PASSED, FAILED, IN_PROGRESS
}