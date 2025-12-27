package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalDate;

/**
 * ClassSession - Buổi học
 *
 * Represents a single class session with support for rescheduling
 *
 * CRITICAL DESIGN:
 * - original* fields: NEVER change (for reference and reset)
 * - actual* fields: Current schedule (null if not rescheduled)
 * - effective* methods: Return actual if rescheduled, else original
 */
@Entity
@Table(name = "class_session",
        indexes = {
                @Index(name = "idx_session_class", columnList = "class_id"),
                @Index(name = "idx_session_type", columnList = "session_type"),
                @Index(name = "idx_session_status", columnList = "status"),
                @Index(name = "idx_session_rescheduled", columnList = "is_rescheduled"),
                @Index(name = "idx_session_date", columnList = "original_date"),
                @Index(name = "idx_session_actual_date", columnList = "actual_date")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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

    // ==================== ORIGINAL SCHEDULE (NEVER CHANGE) ====================

    @Column(name = "original_date")
    private LocalDate originalDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "original_day_of_week", length = 20)
    private DayOfWeek originalDayOfWeek;

    @Enumerated(EnumType.STRING)
    @Column(name = "original_time_slot", length = 10)
    private TimeSlot originalTimeSlot;

    @Column(name = "original_room", length = 50)
    private String originalRoom;

    // ==================== ACTUAL SCHEDULE (RESCHEDULED) ====================

    @Column(name = "actual_date")
    private LocalDate actualDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "actual_day_of_week", length = 20)
    private DayOfWeek actualDayOfWeek;

    @Enumerated(EnumType.STRING)
    @Column(name = "actual_time_slot", length = 10)
    private TimeSlot actualTimeSlot;

    @Column(name = "actual_room", length = 50)
    private String actualRoom;

    // ==================== RESCHEDULE METADATA ====================

    @Column(name = "is_rescheduled", nullable = false)
    private Boolean isRescheduled = false;

    @Column(name = "reschedule_reason", length = 500)
    private String rescheduleReason;

    // ==================== STATUS ====================

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SessionStatus status;

    // ==================== EFFECTIVE SCHEDULE (COMPUTED) ====================

    /**
     * Get effective date (actual if rescheduled, else original)
     */
    public LocalDate getEffectiveDate() {
        return (isRescheduled != null && isRescheduled && actualDate != null)
                ? actualDate
                : originalDate;
    }

    /**
     * Get effective day of week
     */
    public DayOfWeek getEffectiveDayOfWeek() {
        return (isRescheduled != null && isRescheduled && actualDayOfWeek != null)
                ? actualDayOfWeek
                : originalDayOfWeek;
    }

    /**
     * Get effective time slot
     */
    public TimeSlot getEffectiveTimeSlot() {
        return (isRescheduled != null && isRescheduled && actualTimeSlot != null)
                ? actualTimeSlot
                : originalTimeSlot;
    }

    /**
     * Get effective room
     */
    public String getEffectiveRoom() {
        return (isRescheduled != null && isRescheduled && actualRoom != null)
                ? actualRoom
                : originalRoom;
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
}