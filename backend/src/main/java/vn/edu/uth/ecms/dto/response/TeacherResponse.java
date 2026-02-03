package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.enums.Gender;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Teacher response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherResponse {

    private Long teacherId;
    private String citizenId;
    private String fullName;
    private Gender gender;
    private LocalDate dateOfBirth;
    private String email;
    private String phone;

    // Department info
    private Long departmentId;
    private String departmentCode;
    private String departmentName;

    // Major info (nullable)
    private Long majorId;
    private String majorCode;
    private String majorName;

    // Subjects this teacher can teach
    private List<TeacherSubjectResponse> subjects;

    private String degree;
    private String address;
    private Boolean isFirstLogin;
    private Boolean isActive;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}