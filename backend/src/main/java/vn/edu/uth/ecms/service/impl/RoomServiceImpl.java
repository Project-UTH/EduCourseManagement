package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.entity.Room;
import vn.edu.uth.ecms.entity.TimeSlot;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.RoomRepository;
import vn.edu.uth.ecms.service.RoomService;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

/**
 * Room Service Implementation - CORRECTED
 *
 * ✅ FIXES:
 * - Added missing minCapacity parameter to findRoomsAvailableForAllDates()
 * - Fixed getRoomUtilization() to return Double (not List<Object[]>)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;

    // ==================== AUTO ROOM ASSIGNMENT ====================

    @Override
    @Transactional(readOnly = true)
    public Room findRoomForFixedSchedule(
            Long semesterId,
            List<LocalDate> dates,
            DayOfWeek dayOfWeek,
            TimeSlot timeSlot,
            int minCapacity) {

        log.info("🔍 Finding room for FIXED schedule: {} dates, {}, {}, capacity >= {}",
                dates.size(), dayOfWeek, timeSlot, minCapacity);

        // ✅ FIX 1: Add minCapacity parameter (was missing!)
        List<Room> availableRooms = roomRepository.findRoomsAvailableForAllDates(
                semesterId,
                dates,
                dayOfWeek,
                timeSlot.name(),
                minCapacity  // ✅ Added this parameter
        );

        if (availableRooms.isEmpty()) {
            log.warn("❌ No room available for fixed schedule {} {}", dayOfWeek, timeSlot);
            return null;
        }

        log.debug("Found {} candidate rooms", availableRooms.size());

        // 2. Filter by capacity and select smallest suitable room
        Room selectedRoom = availableRooms.stream()
                .filter(room -> room.canAccommodate(minCapacity))
                .findFirst()  // Already ordered by capacity ASC
                .orElse(null);

        if (selectedRoom != null) {
            log.info("✅ Selected room: {} (capacity: {})",
                    selectedRoom.getRoomCode(), selectedRoom.getCapacity());
        } else {
            log.warn("❌ No room with sufficient capacity (need: {})", minCapacity);
        }

        return selectedRoom;
    }

    @Override
    @Transactional(readOnly = true)
    public Room findRoomForSingleSession(
            Long semesterId,
            LocalDate date,
            DayOfWeek dayOfWeek,
            TimeSlot timeSlot,
            int minCapacity) {

        log.debug("🔍 Finding room for SINGLE session: {}, {}, {}, capacity >= {}",
                date, dayOfWeek, timeSlot, minCapacity);

        // 1. Get all physical rooms with sufficient capacity
        List<Room> candidateRooms = roomRepository.findAvailableRoomsByMinCapacity(minCapacity);

        if (candidateRooms.isEmpty()) {
            log.warn("❌ No rooms with capacity >= {}", minCapacity);
            return null;
        }

        // 2. Find first room without conflict
        for (Room room : candidateRooms) {
            boolean hasConflict = hasRoomConflict(
                    semesterId,
                    room.getRoomId(),
                    date,
                    dayOfWeek,
                    timeSlot,
                    null
            );

            if (!hasConflict) {
                log.debug("✅ Found available room: {} (capacity: {})",
                        room.getRoomCode(), room.getCapacity());
                return room;
            }
        }

        log.warn("❌ No room available for {} {} {}", date, dayOfWeek, timeSlot);
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public Room getOnlineRoom() {
        return roomRepository.findOnlineRoom()
                .orElseThrow(() -> new NotFoundException(
                        "CRITICAL: ONLINE room not found in database! " +
                                "Please run: INSERT INTO room (room_code, ...) VALUES ('ONLINE', ...)"
                ));
    }

    // ==================== CONFLICT DETECTION ====================

    @Override
    @Transactional(readOnly = true)
    public boolean hasRoomConflict(
            Long semesterId,
            Long roomId,
            LocalDate date,
            DayOfWeek dayOfWeek,
            TimeSlot timeSlot,
            Long excludeSessionId) {

        return roomRepository.existsRoomConflict(
                semesterId,
                roomId,
                date,
                dayOfWeek,
                timeSlot.name(),
                excludeSessionId
        );
    }

    // ==================== ROOM QUERIES ====================

    @Override
    @Transactional(readOnly = true)
    public List<Room> getAllPhysicalRooms() {
        return roomRepository.findAllPhysicalRooms();
    }

    @Override
    @Transactional(readOnly = true)
    public Room getRoomByCode(String roomCode) {
        return roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new NotFoundException("Room not found: " + roomCode));
    }

    @Override
    @Transactional(readOnly = true)
    public Room getRoomById(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("Room not found: " + roomId));
    }

    // ==================== STATISTICS ====================

    @Override
    public Double getRoomUtilization(Long roomId, Long semesterId) {
        // 1. Get counts from repository
        Long roomSessions = roomRepository.countSessionsUsingRoom(roomId, semesterId);
        Long totalSessions = roomRepository.countTotalSessionsInSemester(semesterId);

        // 2. Handle edge cases
        if (totalSessions == null || totalSessions == 0) {
            return 0.0;  // No sessions → 0% utilization
        }

        if (roomSessions == null) {
            roomSessions = 0L;
        }

        // 3. Calculate percentage in Java (not JPQL!)
        return (roomSessions * 100.0) / totalSessions;
    }

    /**
     * ✅ NEW: Get utilization for all rooms in semester
     * If you need statistics for ALL rooms, use this method
     */
    @Transactional(readOnly = true)
    public List<Room> getAllRoomsWithUtilization(Long semesterId) {
        List<Room> allRooms = roomRepository.findAllActive();

        // You can enhance this to include utilization data
        // For now, just return all active rooms
        return allRooms;
    }
}