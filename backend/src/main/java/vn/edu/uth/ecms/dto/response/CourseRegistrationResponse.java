package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for course registration
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseRegistrationResponse {

    private Long registrationId;

    // Student
    private Long studentId;
    private String studentCode;
    private String studentName;
    private String studentEmail;

    // Class
    private Long classId;
    private String classCode;
    private String subjectCode;
    private String subjectName;

    // Semester
    private Long semesterId;
    private String semesterCode;

    // Registration metadata
    private LocalDateTime registeredAt;
    private LocalDateTime droppedAt;
    private String enrollmentType;  // NORMAL, MANUAL
    private String manualReason;
    private String manualNote;
    private String enrolledByAdmin;
    private String majorName;
    private String departmentName;

    // Status
    private String status;  // REGISTERED, DROPPED, COMPLETED

    // Timestamps
    private LocalDateTime createdAt;
}