package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalDate;

/**
 * StudentSchedule entity
 */
@Entity
@Table(name = "student_schedule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentSchedule extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long scheduleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ClassSession classSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;


    @Column(name = "session_date")
    private LocalDate sessionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", length = 10)
    private DayOfWeek dayOfWeek;

    @Enumerated(EnumType.STRING)
    @Column(name = "time_slot", length = 10)
    private TimeSlot timeSlot;

    /**
     * @Column(name = "room")
     * private String room;  
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;  

    

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false, length = 20)
    private AttendanceStatus attendanceStatus = AttendanceStatus.ABSENT;

    @Column(name = "attendance_note", columnDefinition = "TEXT")
    private String attendanceNote;

    

    /**
     * Check if student attended this session
     */
    public boolean isPresent() {
        return this.attendanceStatus == AttendanceStatus.PRESENT;
    }

    /**
     * Check if student was absent
     */
    public boolean isAbsent() {
        return this.attendanceStatus == AttendanceStatus.ABSENT;
    }

    /**
     * Check if student was late
     */
    public boolean isLate() {
        return this.attendanceStatus == AttendanceStatus.LATE;
    }

    /**
     * Check if student had permission to be absent
     */
    public boolean hasPermission() {
        return this.attendanceStatus == AttendanceStatus.PERMISSION;
    }

    /**
     * Mark student as present
     */
    public void markPresent(String note) {
        this.attendanceStatus = AttendanceStatus.PRESENT;
        this.attendanceNote = note;
    }

    /**
     * Mark student as absent
     */
    public void markAbsent(String note) {
        this.attendanceStatus = AttendanceStatus.ABSENT;
        this.attendanceNote = note;
    }

    /**
     * Mark student as late
     */
    public void markLate(String note) {
        this.attendanceStatus = AttendanceStatus.LATE;
        this.attendanceNote = note;
    }

    /**
     * Mark student with permission
     */
    public void markPermission(String note) {
        this.attendanceStatus = AttendanceStatus.PERMISSION;
        this.attendanceNote = note;
    }

    /**
     * Get schedule display string
     */
    public String getScheduleDisplay() {
        String dayStr = (dayOfWeek != null) ? getDayOfWeekDisplay() : "N/A";
        String slotStr = (timeSlot != null) ? timeSlot.getFullDisplay() : "N/A";
        String roomStr = (room != null) ? room.getRoomCode() : "N/A";

        return dayStr + ", " + slotStr + ", " + roomStr;
    }

    /**
     * Get day of week in Vietnamese
     */
    private String getDayOfWeekDisplay() {
        if (dayOfWeek == null) return "N/A";

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

    /**
     * Get attendance status display
     */
    public String getAttendanceDisplay() {
        return switch (attendanceStatus) {
            case PRESENT -> "Có mặt";
            case ABSENT -> "Vắng";
            case LATE -> "Đi muộn";
            case PERMISSION -> "Có phép";
        };
    }


    @Override
    public String toString() {
        return "StudentSchedule{" +
                "scheduleId=" + scheduleId +
                ", sessionDate=" + sessionDate +
                ", dayOfWeek=" + dayOfWeek +
                ", timeSlot=" + timeSlot +
                ", room=" + (room != null ? room.getRoomCode() : "null") +
                ", attendanceStatus=" + attendanceStatus +
                '}';
    }
}

