package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for Major response (includes department information)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MajorResponse {

    private Long majorId;
    private String majorCode;
    private String majorName;
    private String description;

    private Long departmentId;
    private String departmentCode;
    private String departmentName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Integer totalStudents;
    private Integer totalTeachers;
}