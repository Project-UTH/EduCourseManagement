package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Subject Response DTO - Updated with Prerequisites
 * 
 * @author Phase 4 - Student Features
 * @since 2026-01-22
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectResponse {

    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Integer credits;

    // Số buổi học
    private Integer totalSessions;
    private Integer elearningSessions;
    private Integer inpersonSessions;

    // Department information
    private Long departmentId;
    private String departmentCode;
    private String departmentName;

    // Major information (nullable)
    private Long majorId;
    private String majorCode;
    private String majorName;

    private String description;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Statistics
    private Integer totalClasses;
    private Integer totalStudents;
    
    private String departmentKnowledgeType; // BASIC or SPECIALIZED
    
    /**
     * ✅ NEW: List of prerequisite subjects with completion status
     */
    private List<PrerequisiteInfo> prerequisites;
}