package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Class Response DTO - UPDATED
 *
 * NEW FIELDS:
 * - fixedRoom (room code)
 * - fixedRoomName (display name)
 * - fixedRoomCapacity
 * - pendingSessionsCount (extra sessions not yet scheduled)
 *
 * REMOVED FIELDS:
 * - room (replaced by fixedRoom)
 * - extraDayOfWeek, extraTimeSlot, extraRoom (no longer exist)
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

    private String status;           // OPEN, FULL, CLOSED
    private Boolean canRegister;
    private Boolean isFull;

    // ==================== FIXED SCHEDULE (for 10 sessions) ====================

    private String dayOfWeek;        // MONDAY, TUESDAY, etc.
    private String dayOfWeekDisplay; // "Thứ 2", "Thứ 3", etc.
    private String timeSlot;         // CA1, CA2, etc.
    private String timeSlotDisplay;  // "Ca 1 (06:45-09:15)"

    /**
     * ✅ NEW: Fixed room (auto-assigned by system)
     */
    private String fixedRoom;        // Room code: "A201", "B105"

    /**
     * ✅ NEW: Fixed room display name
     */
    private String fixedRoomName;    // "A201 - Giảng đường lớn"

    /**
     * ✅ NEW: Fixed room capacity
     */
    private Integer fixedRoomCapacity;

    // ==================== E-LEARNING SCHEDULE (optional) ====================

    private String elearningDayOfWeek;
    private String elearningTimeSlot;

    // ==================== DATES ====================

    private LocalDate startDate;
    private LocalDate endDate;

    // ==================== SESSION STATISTICS ====================

    /**
     * Total sessions generated (fixed + extra + elearning)
     */
    private Long totalSessionsGenerated;

    /**
     * ✅ NEW: Number of pending extra sessions
     * (not yet scheduled, waiting for semester activation)
     */
    private Long pendingSessionsCount;

    /**
     * Number of completed sessions
     */
    private Long completedSessions;

    /**
     * Number of rescheduled sessions
     */
    private Long rescheduledSessionsCount;

    // ==================== METADATA ====================

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}