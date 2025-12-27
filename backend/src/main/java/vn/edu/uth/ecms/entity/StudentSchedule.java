package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Student Schedule Entity
 *
 * Purpose: Store individual class sessions for each student
 *
 * Lifecycle:
 * - AUTO CREATED: When student enrolls in a class (via EnrollmentService)
 * - AUTO DELETED: When student drops class or admin removes (CASCADE)
 *
 * Usage:
 * - Conflict detection: Check if student has another class at same date/time
 * - Student timetable: Display weekly/monthly schedule
 * - Attendance tracking: Mark ATTENDED/ABSENT for each session
 * - Session management: Track CANCELLED sessions
 */
@Entity
@Table(name = "student_schedule", indexes = {
        // CRITICAL: Fast conflict detection
        @Index(name = "idx_student_date_time",
                columnList = "student_id, session_date, day_of_week, time_slot"),
        // Student timetable query
        @Index(name = "idx_student_semester",
                columnList = "student_id, semester_id"),
        // Class attendance list
        @Index(name = "idx_class_session",
                columnList = "class_id, class_session_id"),
        // Date range queries
        @Index(name = "idx_session_date",
                columnList = "session_date, time_slot"),
        // Status filter
        @Index(name = "idx_status",
                columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long scheduleId;

    // ==================== REFERENCES ====================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_session_id", nullable = false)
    private ClassSession classSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    // ==================== SCHEDULE DATA (Denormalized for fast query) ====================

    /**
     * Actual date of this session
     * Example: 2026-09-01 (Monday, September 1st, 2026)
     */
    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    /**
     * Day of week
     * Example: MONDAY, TUESDAY, etc.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 10)
    private DayOfWeek dayOfWeek;

    /**
     * Time slot
     * CA1: 06:45-09:15
     * CA2: 09:25-11:55
     * CA3: 12:10-14:40
     * CA4: 14:50-17:20
     * CA5: 17:30-20:00
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "time_slot", nullable = false, length = 5)
    private TimeSlot timeSlot;

    /**
     * Classroom
     * Example: "A201", "B105", "C303"
     */
    @Column(name = "room", length = 50)
    private String room;

    // ==================== STATUS ====================

    /**
     * Session status for this student
     * SCHEDULED: Not attended yet (default)
     * ATTENDED: Student attended (marked by teacher)
     * ABSENT: Student was absent
     * CANCELLED: Session was cancelled (for all students)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ScheduleStatus status = ScheduleStatus.SCHEDULED;

    // ==================== METADATA ====================

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ==================== HELPER METHODS ====================

    /**
     * Check if this schedule conflicts with another
     */
    public boolean conflictsWith(StudentSchedule other) {
        return this.sessionDate.equals(other.sessionDate)
                && this.dayOfWeek == other.dayOfWeek
                && this.timeSlot == other.timeSlot;
    }

    /**
     * Check if student attended this session
     */
    public boolean isAttended() {
        return status == ScheduleStatus.ATTENDED;
    }

    /**
     * Check if student was absent
     */
    public boolean isAbsent() {
        return status == ScheduleStatus.ABSENT;
    }

    /**
     * Check if session was cancelled
     */
    public boolean isCancelled() {
        return status == ScheduleStatus.CANCELLED;
    }

    /**
     * Check if session is in the past
     */
    public boolean isPast() {
        return sessionDate.isBefore(LocalDate.now());
    }

    /**
     * Check if session is today
     */
    public boolean isToday() {
        return sessionDate.equals(LocalDate.now());
    }

    /**
     * Check if session is upcoming
     */
    public boolean isUpcoming() {
        return sessionDate.isAfter(LocalDate.now());
    }

    /**
     * Get display text for day and time
     */
    public String getScheduleDisplay() {
        return getDayOfWeekVietnamese() + " " + timeSlot.getFullDisplay();
    }

    /**
     * Get Vietnamese day of week
     */
    public String getDayOfWeekVietnamese() {
        return switch (dayOfWeek) {
            case MONDAY -> "Thứ 2";
            case TUESDAY -> "Thứ 3";
            case WEDNESDAY -> "Thứ 4";
            case THURSDAY -> "Thứ 5";
            case FRIDAY -> "Thứ 6";
            case SATURDAY -> "Thứ 7";
            case SUNDAY -> "Chủ nhật";
        };
    }

    @Override
    public String toString() {
        return "StudentSchedule{" +
                "scheduleId=" + scheduleId +
                ", studentId=" + (student != null ? student.getStudentId() : null) +
                ", classId=" + (classEntity != null ? classEntity.getClassId() : null) +
                ", sessionDate=" + sessionDate +
                ", dayOfWeek=" + dayOfWeek +
                ", timeSlot=" + timeSlot +
                ", room='" + room + '\'' +
                ", status=" + status +
                '}';
    }
}