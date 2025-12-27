package vn.edu.uth.ecms.entity;

/**
 * Status of a student's class session
 */
public enum ScheduleStatus {
    /**
     * Session is scheduled but not attended yet
     * Default status when schedule is created
     */
    SCHEDULED("Đã lên lịch", "Session is scheduled"),

    /**
     * Student attended this session
     * Marked by teacher during attendance
     */
    ATTENDED("Đã điểm danh", "Student attended"),

    /**
     * Student was absent
     * Marked by teacher during attendance
     */
    ABSENT("Vắng mặt", "Student was absent"),

    /**
     * Session was cancelled
     * Applied to all students when teacher/admin cancels the session
     */
    CANCELLED("Đã hủy", "Session was cancelled");

    private final String vietnameseName;
    private final String description;

    ScheduleStatus(String vietnameseName, String description) {
        this.vietnameseName = vietnameseName;
        this.description = description;
    }

    public String getVietnameseName() {
        return vietnameseName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Check if student can still attend (not past or cancelled)
     */
    public boolean canAttend() {
        return this == SCHEDULED;
    }

    /**
     * Check if attendance is finalized
     */
    public boolean isFinalized() {
        return this == ATTENDED || this == ABSENT;
    }
}