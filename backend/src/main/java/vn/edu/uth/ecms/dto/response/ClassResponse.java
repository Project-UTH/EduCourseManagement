package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Class Response DTO - COMPLETE VERSION WITH PREREQUISITES
 *
 * ✅ UPDATED: Added prerequisites, isRegistered, and subjectDescription fields
 *
 * NEW FIELDS:
 * - prerequisites (List<PrerequisiteInfo>) - Danh sách môn tiên quyết
 * - isRegistered (Boolean) - Sinh viên đã đăng ký chưa
 * - subjectDescription (String) - Mô tả môn học
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
    
    /**
     * ✅ NEW: Subject description
     * Mô tả chi tiết về môn học (hiển thị cho sinh viên)
     */
    private String subjectDescription;

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
     * ✅ Fixed room (auto-assigned by system)
     */
    private String fixedRoom;        // Room code: "A201", "B105"

    /**
     * ✅ Fixed room display name
     */
    private String fixedRoomName;    // "A201 - Giảng đường lớn"

    /**
     * ✅ Fixed room capacity
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
     * ✅ Number of pending extra sessions
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

    // ==================== ✅ NEW: PREREQUISITES INFO ====================

    /**
     * ✅ NEW: Danh sách môn tiên quyết
     * 
     * Hiển thị các môn học cần hoàn thành trước khi đăng ký môn này
     * Bao gồm thông tin trạng thái hoàn thành của sinh viên hiện tại
     */
    private List<PrerequisiteInfo> prerequisites;

    /**
     * ✅ NEW: Sinh viên đã đăng ký lớp này chưa
     * 
     * true = Đã đăng ký (status = REGISTERED)
     * false = Chưa đăng ký
     * null = Không áp dụng (dành cho admin/teacher)
     */
    private Boolean isRegistered;

    // ==================== ✅ INNER CLASS: PREREQUISITE INFO ====================

    /**
     * ✅ Inner class: Thông tin môn tiên quyết
     * 
     * Chứa thông tin về môn học tiên quyết và trạng thái hoàn thành
     * của sinh viên hiện tại
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrerequisiteInfo {
        
        /**
         * ID môn học tiên quyết
         */
        private Long subjectId;
        
        /**
         * Mã môn học (vd: CS101)
         */
        private String subjectCode;
        
        /**
         * Tên môn học (vd: "Lập trình căn bản")
         */
        private String subjectName;
        
        /**
         * Số tín chỉ
         */
        private Integer credits;
        
        /**
         * ✅ Sinh viên đã hoàn thành môn này chưa
         * 
         * Điều kiện hoàn thành:
         * - Có điểm trong bảng Grade
         * - totalScore >= 4.0
         * - status = PASSED
         * 
         * true = Đã hoàn thành (có thể đăng ký)
         * false = Chưa hoàn thành (không thể đăng ký)
         */
        private Boolean isCompleted;
        
        /**
         * ✅ Điểm đã đạt (nếu có)
         * 
         * null = Chưa có điểm
         * 0.0 - 10.0 = Điểm đã đạt
         */
        private Double totalScore;
    }
}