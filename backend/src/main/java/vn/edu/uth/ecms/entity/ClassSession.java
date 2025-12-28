package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalDate;

/**
 * ClassSession entity - CORRECTED
 *
 * ✅ FIXES:
 * - Fixed getEffectiveRoom() method type mismatch
 * - Fixed getEffectiveDate() method
 * - Fixed getEffectiveDayOfWeek() method
 * - Fixed getEffectiveTimeSlot() method
 */
@Entity
@Table(name = "class_session")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassSession extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Long sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private ClassEntity classEntity;

    @Column(name = "session_number", nullable = false)
    private Integer sessionNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "session_type", nullable = false, length = 20)
    private SessionType sessionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 20)
    private SessionCategory category;

    @Column(name = "is_pending", nullable = false)
    private Boolean isPending = false;

    // ==================== ORIGINAL SCHEDULE ====================

    @Column(name = "original_date")
    private LocalDate originalDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "original_day_of_week", length = 10)
    private DayOfWeek originalDayOfWeek;

    @Enumerated(EnumType.STRING)
    @Column(name = "original_time_slot", length = 10)
    private TimeSlot originalTimeSlot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_room_id")
    private Room originalRoom;

    // ==================== ACTUAL SCHEDULE (if rescheduled) ====================

    @Column(name = "actual_date")
    private LocalDate actualDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "actual_day_of_week", length = 10)
    private DayOfWeek actualDayOfWeek;

    @Enumerated(EnumType.STRING)
    @Column(name = "actual_time_slot", length = 10)
    private TimeSlot actualTimeSlot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actual_room_id")
    private Room actualRoom;

    // ==================== RESCHEDULE INFO ====================

    @Column(name = "is_rescheduled", nullable = false)
    private Boolean isRescheduled = false;

    @Column(name = "reschedule_reason", columnDefinition = "TEXT")
    private String rescheduleReason;

    // ==================== STATUS ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SessionStatus status = SessionStatus.SCHEDULED;

    // ==================== ✅ FIX: EFFECTIVE GETTERS (with type safety) ====================

    /**
     * ✅ FIX 1: Get effective date
     * Returns actual date if rescheduled, otherwise original date
     * Type-safe: Always returns LocalDate or null
     */
    public LocalDate getEffectiveDate() {
        if (Boolean.TRUE.equals(isRescheduled) && actualDate != null) {
            return actualDate;
        }
        return originalDate;
    }

    /**
     * ✅ FIX 2: Get effective day of week
     * Type-safe: Always returns DayOfWeek or null
     */
    public DayOfWeek getEffectiveDayOfWeek() {
        if (Boolean.TRUE.equals(isRescheduled) && actualDayOfWeek != null) {
            return actualDayOfWeek;
        }
        return originalDayOfWeek;
    }

    /**
     * ✅ FIX 3: Get effective time slot
     * Type-safe: Always returns TimeSlot or null
     */
    public TimeSlot getEffectiveTimeSlot() {
        if (Boolean.TRUE.equals(isRescheduled) && actualTimeSlot != null) {
            return actualTimeSlot;
        }
        return originalTimeSlot;
    }

    /**
     * ✅ FIX 4: Get effective room (FIXED TYPE MISMATCH)
     * Type-safe: Always returns Room entity or null
     * <p>
     * BEFORE (ERROR):
     * return isRescheduled ? actualRoom : originalRoom;  // Type mismatch!
     * <p>
     * AFTER (CORRECT):
     * Use Boolean.TRUE.equals() for null-safe comparison
     */
    public Room getEffectiveRoom() {
        if (Boolean.TRUE.equals(isRescheduled) && actualRoom != null) {
            return actualRoom;
        }
        return originalRoom;
    }

    // ==================== HELPER METHODS ====================

    /**
     * Reset session to original schedule
     */
    public void resetToOriginal() {
        this.actualDate = null;
        this.actualDayOfWeek = null;
        this.actualTimeSlot = null;
        this.actualRoom = null;
        this.isRescheduled = false;
        this.rescheduleReason = null;
    }

    /**
     * Check if session can be rescheduled
     */
    public boolean canReschedule() {
        return this.sessionType == SessionType.IN_PERSON
                && !Boolean.TRUE.equals(this.isPending)
                && this.status != SessionStatus.CANCELLED
                && this.status != SessionStatus.COMPLETED;
    }

    /**
     * Check if session is scheduled (not pending)
     */
    public boolean isScheduled() {
        return !Boolean.TRUE.equals(this.isPending);
    }

    /**
     * Check if session is in the past
     */
    public boolean isPast() {
        LocalDate effectiveDate = getEffectiveDate();
        return effectiveDate != null && effectiveDate.isBefore(LocalDate.now());
    }

    /**
     * Check if session is today
     */
    public boolean isToday() {
        LocalDate effectiveDate = getEffectiveDate();
        return effectiveDate != null && effectiveDate.isEqual(LocalDate.now());
    }

    /**
     * Check if session is upcoming
     */
    public boolean isUpcoming() {
        LocalDate effectiveDate = getEffectiveDate();
        return effectiveDate != null && effectiveDate.isAfter(LocalDate.now());
    }

    /**
     * Get session display name
     * Example: "Buổi 1 - FIXED" or "Buổi 11 - EXTRA"
     */
    public String getDisplayName() {
        String categoryStr = (category != null) ? " - " + category.name() : "";
        return "Buổi " + sessionNumber + categoryStr;
    }

    /**
     * Get schedule summary
     * Example: "Thứ 2, 06:45-09:15, A201"
     */
    public String getScheduleSummary() {
        if (Boolean.TRUE.equals(isPending)) {
            return "Chưa xếp lịch";
        }

        DayOfWeek day = getEffectiveDayOfWeek();
        TimeSlot slot = getEffectiveTimeSlot();
        Room room = getEffectiveRoom();

        String dayStr = (day != null) ? getDayOfWeekDisplay(day) : "N/A";
        String slotStr = (slot != null) ? slot.getFullDisplay() : "N/A";
        String roomStr = (room != null) ? room.getRoomCode() : "N/A";

        return dayStr + ", " + slotStr + ", " + roomStr;
    }

    /**
     * Convert DayOfWeek to Vietnamese
     */
    private String getDayOfWeekDisplay(DayOfWeek day) {
        return switch (day) {
            case MONDAY -> "Thứ 2";
            case TUESDAY -> "Thứ 3";
            case WEDNESDAY -> "Thứ 4";
            case THURSDAY -> "Thứ 5";
            case FRIDAY -> "Thứ 6";
            case SATURDAY -> "Thứ 7";
            case SUNDAY -> "Chủ nhật";
        };
    }

    // ==================== OVERRIDE METHODS ====================

    @Override
    public String toString() {
        return "ClassSession{" +
                "sessionId=" + sessionId +
                ", sessionNumber=" + sessionNumber +
                ", sessionType=" + sessionType +
                ", category=" + category +
                ", isPending=" + isPending +
                ", effectiveDate=" + getEffectiveDate() +
                ", status=" + status +
                '}';
    }
}