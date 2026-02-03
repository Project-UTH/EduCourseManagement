package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.KnowledgeType;

import java.time.LocalDateTime;

/**
 * DTO for Department response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentResponse {

    private Long departmentId;
    private String departmentCode;
    private String departmentName;
    private KnowledgeType knowledgeType;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer totalMajors;
    private Integer totalTeachers;
    private Integer totalStudents;
}