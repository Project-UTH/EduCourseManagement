package vn.edu.uth.ecms.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import vn.edu.uth.ecms.dto.response.RoomResponse;
import vn.edu.uth.ecms.dto.response.RoomScheduleResponse;
import vn.edu.uth.ecms.entity.Room;
import vn.edu.uth.ecms.entity.RoomType;
import vn.edu.uth.ecms.entity.TimeSlot;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;


public interface RoomService {


    Room findRoomForFixedSchedule(
            Long semesterId,
            List<LocalDate> dates,
            DayOfWeek dayOfWeek,
            TimeSlot timeSlot,
            int minCapacity
    );

    Room findRoomForSingleSession(
            Long semesterId,
            LocalDate date,
            DayOfWeek dayOfWeek,
            TimeSlot timeSlot,
            int minCapacity
    );

    Room getOnlineRoom();

    boolean hasRoomConflict(
            Long semesterId,
            Long roomId,
            LocalDate date,
            DayOfWeek dayOfWeek,
            TimeSlot timeSlot,
            Long excludeSessionId
    );

    List<Room> getAllPhysicalRooms();

    Room getRoomByCode(String roomCode);

    Room getRoomById(Long roomId);

    Double getRoomUtilization(Long roomId, Long semesterId);

    
    /**
     * Get all rooms with real-time status (paginated)
     *
     * Returns:
     * - Basic room info
     * - Admin status (ACTIVE/INACTIVE)
     * - Real-time status (IN_USE/AVAILABLE/INACTIVE)
     * - Current session info (if in use)
     * - Usage statistics
     *
     * @param semesterId Current semester for statistics
     * @param pageable Pagination parameters
     * @return Page of rooms with status
     */
    Page<RoomResponse> getAllRoomsWithStatus(Long semesterId, Pageable pageable);

    /**
     * Get room by ID with real-time status
     */
    RoomResponse getRoomWithStatus(Long roomId, Long semesterId);

    /**
     * @param status "IN_USE" or "AVAILABLE" or "INACTIVE"
     * @param semesterId Current semester
     * @param pageable Pagination
     * @return Rooms matching status
     */
    Page<RoomResponse> getRoomsByCurrentStatus(
            String status,
            Long semesterId,
            Pageable pageable
    );

    

    /**
     * Search rooms by keyword
     */
    Page<RoomResponse> searchRooms(
            String keyword,
            Long semesterId,
            Pageable pageable
    );

    /**
     * Filter rooms by multiple criteria
     */
    Page<RoomResponse> filterRooms(
            String building,
            Integer floor,
            RoomType roomType,
            Boolean isActive,
            String currentStatus,  
            Long semesterId,
            Pageable pageable
    );

    /**
     * Get rooms by building
     */
    Page<RoomResponse> getRoomsByBuilding(
            String building,
            Long semesterId,
            Pageable pageable
    );

    /**
     * Get rooms by floor
     */
    Page<RoomResponse> getRoomsByFloor(
            Integer floor,
            Long semesterId,
            Pageable pageable
    );

    /**
     * Get rooms by type
     */
    Page<RoomResponse> getRoomsByType(
            RoomType roomType,
            Long semesterId,
            Pageable pageable
    );

    /**
     * Get rooms by admin status (active/inactive)
     */
    Page<RoomResponse> getRoomsByAdminStatus(
            Boolean isActive,
            Long semesterId,
            Pageable pageable
    );

 

    /**
     * Get room schedule for a semester
     * Shows all sessions using this room
     */
    List<RoomScheduleResponse> getRoomSchedule(
            Long roomId,
            Long semesterId
    );

    /**
     * Get room schedule for today
     */
    List<RoomScheduleResponse> getRoomScheduleToday(Long roomId);

    /**
     * Get room schedule for specific date
     */
    List<RoomScheduleResponse> getRoomScheduleForDate(
            Long roomId,
            LocalDate date
    );

    /**
     * Get room statistics for semester
     * - Total sessions
     * - Completed sessions
     * - Upcoming sessions
     * - Utilization percentage
     */
    RoomResponse.RoomStatistics getRoomStatistics(
            Long roomId,
            Long semesterId
    );

    /**
     * Get building & floor lists
     */
    List<String> getAllBuildings();
    List<Integer> getFloorsByBuilding(String building);

   

    /**
     * Check if room is currently in use (RIGHT NOW)
     *
     * @param roomId Room ID
     * @return true if room has session happening now
     */
    boolean isRoomCurrentlyInUse(Long roomId);

    /**
     * Get current session using room (if any)
     * Returns null if room is not in use
     */
    RoomResponse.CurrentSessionInfo getCurrentSession(Long roomId);

    /**
     * Calculate real-time status for a room
     * - INACTIVE: Admin disabled room
     * - IN_USE: Room has session RIGHT NOW
     * - AVAILABLE: Room is free RIGHT NOW
     */
    String calculateCurrentStatus(Room room);

    

    /**
     * Create a new room
     *
     * @param room Room entity to create
     * @return Created room
     */
    Room createRoom(Room room);

    /**
     * Update an existing room
     *
     * @param room Room entity with updated data
     * @return Updated room
     */
    Room updateRoom(Room room);

    /**
     * Delete a room by ID
     *
     * @param roomId Room ID to delete
     */
    void deleteRoom(Long roomId);

    long countAll();
}

