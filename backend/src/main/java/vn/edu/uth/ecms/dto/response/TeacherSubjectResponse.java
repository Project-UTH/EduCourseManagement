package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for TeacherSubject response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeacherSubjectResponse {

    private Long teacherSubjectId;

    // Teacher info
    private Long teacherId;
    private String teacherName;
    private String teacherCitizenId;

    // Subject info
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Integer credits;

    // Relationship metadata
    private Boolean isPrimary;
    private String notes;
}