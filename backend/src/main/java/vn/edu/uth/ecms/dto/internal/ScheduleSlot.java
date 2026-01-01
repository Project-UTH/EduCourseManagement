package vn.edu.uth.ecms.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.Room;
import vn.edu.uth.ecms.entity.TimeSlot;

import java.time.DayOfWeek;
import java.time.LocalDate;

/**
 * ScheduleSlot - Internal DTO for scheduling logic
 *
 * Purpose: Represent a time slot candidate for scheduling extra sessions
 *
 * Used in: ExtraSessionScheduler
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleSlot {

    /**
     * The specific date
     */
    private LocalDate date;

    /**
     * Day of week (must match date)
     */
    private DayOfWeek dayOfWeek;

    /**
     * Time slot (CA1-CA5)
     */
    private TimeSlot timeSlot;

    /**
     * Assigned room (can be null if not yet assigned)
     */
    private Room room;

    // ==================== CONSTRUCTORS ====================

    public ScheduleSlot(LocalDate date, DayOfWeek dayOfWeek, TimeSlot timeSlot) {
        this.date = date;
        this.dayOfWeek = dayOfWeek;
        this.timeSlot = timeSlot;
        this.room = null;
    }

    // ==================== HELPER METHODS ====================

    /**
     * Check if this slot has a room assigned
     */
    public boolean hasRoom() {
        return room != null;
    }

    /**
     * Get display string
     */
    public String getDisplay() {
        String roomCode = room != null ? room.getRoomCode() : "NO_ROOM";
        return String.format("%s (%s) %s %s",
                date,
                dayOfWeek,
                timeSlot,
                roomCode);
    }

    @Override
    public String toString() {
        return "ScheduleSlot{" +
                "date=" + date +
                ", dayOfWeek=" + dayOfWeek +
                ", timeSlot=" + timeSlot +
                ", room=" + (room != null ? room.getRoomCode() : "null") +
                '}';
    }
}