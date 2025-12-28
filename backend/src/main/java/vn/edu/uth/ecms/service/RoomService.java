package vn.edu.uth.ecms.service;

import vn.edu.uth.ecms.entity.Room;
import vn.edu.uth.ecms.entity.TimeSlot;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

/**
 * Room Service Interface - CORRECTED
 *
 * ✅ FIXES:
 * - Changed getRoomUtilization() signature to match repository
 */
public interface RoomService {

    /**
     * Find room available for fixed schedule (all 10 dates)
     */
    Room findRoomForFixedSchedule(
            Long semesterId,
            List<LocalDate> dates,
            DayOfWeek dayOfWeek,
            TimeSlot timeSlot,
            int minCapacity
    );

    /**
     * Find room for a single session
     */
    Room findRoomForSingleSession(
            Long semesterId,
            LocalDate date,
            DayOfWeek dayOfWeek,
            TimeSlot timeSlot,
            int minCapacity
    );

    /**
     * Get ONLINE room
     */
    Room getOnlineRoom();

    /**
     * Check if room has conflict at given slot
     */
    boolean hasRoomConflict(
            Long semesterId,
            Long roomId,
            LocalDate date,
            DayOfWeek dayOfWeek,
            TimeSlot timeSlot,
            Long excludeSessionId
    );

    /**
     * Get all physical rooms
     */
    List<Room> getAllPhysicalRooms();

    /**
     * Get room by code
     */
    Room getRoomByCode(String roomCode);

    /**
     * Get room by ID
     */
    Room getRoomById(Long roomId);

    /**
     * ✅ CORRECTED: Get utilization percentage for a specific room
     *
     * BEFORE (WRONG):
     * List<Object[]> getRoomUtilization(Long semesterId);
     *
     * AFTER (CORRECT):
     */
    Double getRoomUtilization(Long roomId, Long semesterId);
}