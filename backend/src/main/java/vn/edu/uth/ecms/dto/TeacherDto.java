package vn.edu.uth.ecms.dto;

import lombok.Data;

/**
 * TeacherDto - Nested DTO for teacher information
 */
@Data
public class TeacherDto {
    private Long teacherId;
    private String fullName;
    private String email;
}