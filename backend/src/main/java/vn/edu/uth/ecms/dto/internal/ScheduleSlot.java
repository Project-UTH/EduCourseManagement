package vn.edu.uth.ecms.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.Room;
import vn.edu.uth.ecms.entity.enums.TimeSlot;

import java.time.DayOfWeek;
import java.time.LocalDate;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleSlot {

   
    private LocalDate date;

   
    private DayOfWeek dayOfWeek;

  
    private TimeSlot timeSlot;

   
    private Room room;

  

    public ScheduleSlot(LocalDate date, DayOfWeek dayOfWeek, TimeSlot timeSlot) {
        this.date = date;
        this.dayOfWeek = dayOfWeek;
        this.timeSlot = timeSlot;
        this.room = null;
    }

  
    public boolean hasRoom() {
        return room != null;
    }

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