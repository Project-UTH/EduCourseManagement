package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for Class entity
 *
 * Contains:
 * - Class basic info
 * - Related entities (subject, teacher, semester)
 * - Capacity & enrollment
 * - Schedule info
 * - Session statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassResponse {

    // ==================== BASIC INFO ====================

    private Long classId;
    private String classCode;

    // ==================== SUBJECT INFO ====================

    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Integer credits;
    private Integer totalSessions;
    private Integer inPersonSessions;
    private Integer eLearningSessions;

    // ==================== TEACHER INFO ====================

    private Long teacherId;
    private String teacherName;
    private String teacherEmail;
    private String teacherDegree;

    // ==================== SEMESTER INFO ====================

    private Long semesterId;
    private String semesterCode;
    private String semesterName;
    private String semesterStatus;

    // ==================== CAPACITY ====================

    private Integer maxStudents;
    private Integer enrolledCount;
    private Integer availableSeats;

    // ==================== STATUS ====================

    private String status;  // OPEN, FULL, CLOSED, IN_PROGRESS, COMPLETED
    private Boolean canRegister;
    private Boolean isFull;

    // ==================== SCHEDULE (FIXED) ====================

    private String dayOfWeek;  // MONDAY
    private String dayOfWeekDisplay;  // "Thứ 2"

    private String timeSlot;  // CA1
    private String timeSlotDisplay;  // "Ca 1 (06:45 - 09:15)"

    private String room;  // A201

    // ==================== DATES ====================

    private LocalDate startDate;
    private LocalDate endDate;

    // ==================== SESSION STATISTICS ====================

    private Long totalSessionsGenerated;
    private Long completedSessions;
    private Long rescheduledSessionsCount;

    // ==================== METADATA ====================

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}