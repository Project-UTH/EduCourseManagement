package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalDate;


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

   

    @Column(name = "is_rescheduled", nullable = false)
    private Boolean isRescheduled = false;

    @Column(name = "reschedule_reason", columnDefinition = "TEXT")
    private String rescheduleReason;

   

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SessionStatus status = SessionStatus.SCHEDULED;

    
    public LocalDate getEffectiveDate() {
        // 1. Check if rescheduled
        if (Boolean.TRUE.equals(isRescheduled) && actualDate != null) {
            return actualDate;
        }
        
        // 2. Check original date
        if (originalDate != null) {
            return originalDate;
        }
        
        // 3. Calculate from class schedule
        // For FIXED sessions, dates should be calculated and set during schedule generation
        // For EXTRA sessions, dates are set when allocated
        return null;
    }

  
    public DayOfWeek getEffectiveDayOfWeek() {
        // 1. Check if rescheduled
        if (Boolean.TRUE.equals(isRescheduled) && actualDayOfWeek != null) {
            return actualDayOfWeek;
        }
        
        // 2. Check original day
        if (originalDayOfWeek != null) {
            return originalDayOfWeek;
        }
        
        // 3. Fall back to class's fixed day (for FIXED sessions only)
        if (category == SessionCategory.FIXED && classEntity != null) {
            return classEntity.getDayOfWeek();
        }
        
        return null;
    }

   
    public TimeSlot getEffectiveTimeSlot() {
        // 1. Check if rescheduled
        if (Boolean.TRUE.equals(isRescheduled) && actualTimeSlot != null) {
            return actualTimeSlot;
        }
        
        // 2. Check original slot
        if (originalTimeSlot != null) {
            return originalTimeSlot;
        }
        
        // 3. Fall back to class's fixed slot (for FIXED sessions only)
        if (category == SessionCategory.FIXED && classEntity != null) {
            return classEntity.getTimeSlot();
        }
        
        return null;
    }

  
    public Room getEffectiveRoom() {
        // 1. Check if rescheduled
        if (Boolean.TRUE.equals(isRescheduled) && actualRoom != null) {
            return actualRoom;
        }
        
        // 2. Check original room
        if (originalRoom != null) {
            return originalRoom;
        }
        
        // 3. Fall back to class's fixed room (for FIXED sessions only)
        
        return null;
    }

   
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
     */
    public String getDisplayName() {
        String categoryStr = (category != null) ? " - " + category.name() : "";
        return "Buổi " + sessionNumber + categoryStr;
    }

    /**
     * Get schedule summary
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