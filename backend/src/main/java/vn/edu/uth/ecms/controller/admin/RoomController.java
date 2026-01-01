package vn.edu.uth.ecms.controller.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.RoomResponse;
import vn.edu.uth.ecms.dto.response.RoomScheduleResponse;
import vn.edu.uth.ecms.entity.Room;
import vn.edu.uth.ecms.entity.RoomType;
import vn.edu.uth.ecms.service.RoomService;

import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;
import vn.edu.uth.ecms.dto.request.RoomCreateRequest;
import vn.edu.uth.ecms.dto.request.RoomUpdateRequest;
import vn.edu.uth.ecms.exception.NotFoundException;

import java.time.LocalDate;
import java.util.List;

/**
 * ✨ ENHANCED RoomController with Real-time Status
 *
 * ENDPOINTS: 20 total
 *
 * CORE (5):
 * - GET all rooms with status
 * - GET room by ID with status
 * - GET rooms by current status
 * - Search rooms
 * - Filter rooms
 *
 * FILTERS (5):
 * - By building
 * - By floor
 * - By type
 * - By admin status
 * - Advanced filter
 *
 * SCHEDULE (3):
 * - Get room schedule (semester)
 * - Get room schedule (today)
 * - Get room schedule (specific date)
 *
 * STATISTICS (2):
 * - Get room statistics
 * - Get utilization
 *
 * LOOKUPS (2):
 * - Get all buildings
 * - Get floors by building
 *
 * STATUS (3):
 * - Check if room in use
 * - Get current session
 * - Calculate current status
 */
@RestController
@RequestMapping("/api/admin/rooms")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class RoomController {

    private final RoomService roomService;

    // ==================== CORE ENDPOINTS ====================

    /**
     * 1. Get all rooms with real-time status (paginated)
     *
     * GET /api/admin/rooms?semesterId=1&page=0&size=10&sortBy=roomCode&sortDir=asc
     *
     * Response includes:
     * - Basic room info
     * - Admin status (ACTIVE/INACTIVE)
     * - Real-time status (IN_USE/AVAILABLE/INACTIVE)
     * - Current session info (if in use)
     * - Usage statistics
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getAllRooms(
            @RequestParam Long semesterId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "roomCode") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        log.debug("GET /api/admin/rooms - semesterId: {}, page: {}, size: {}",
                semesterId, page, size);

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() :
                Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<RoomResponse> rooms = roomService.getAllRoomsWithStatus(semesterId, pageable);

        return ResponseEntity.ok(
                ApiResponse.success(
                        rooms.getTotalElements() + " room(s) found",
                        rooms
                )
        );
    }

    /**
     * 2. Get room by ID with real-time status
     *
     * GET /api/admin/rooms/{id}?semesterId=1
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoomById(
            @PathVariable Long id,
            @RequestParam Long semesterId) {

        log.debug("GET /api/admin/rooms/{} - semesterId: {}", id, semesterId);

        RoomResponse room = roomService.getRoomWithStatus(id, semesterId);

        return ResponseEntity.ok(
                ApiResponse.success("Room retrieved successfully", room)
        );
    }

    /**
     * 3. Get rooms by current real-time status
     *
     * GET /api/admin/rooms/by-status?status=IN_USE&semesterId=1&page=0&size=10
     *
     * Status options:
     * - IN_USE: Rooms with sessions happening RIGHT NOW
     * - AVAILABLE: Rooms that are free RIGHT NOW
     * - INACTIVE: Rooms disabled by admin
     */
    @GetMapping("/by-status")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getRoomsByStatus(
            @RequestParam String status,
            @RequestParam Long semesterId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.debug("GET /api/admin/rooms/by-status - status: {}", status);

        Pageable pageable = PageRequest.of(page, size);

        Page<RoomResponse> rooms = roomService.getRoomsByCurrentStatus(
                status, semesterId, pageable
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        rooms.getTotalElements() + " room(s) with status " + status,
                        rooms
                )
        );
    }

    /**
     * 4. Search rooms by keyword
     *
     * GET /api/admin/rooms/search?keyword=A201&semesterId=1&page=0&size=10
     *
     * Searches in: room code, room name, building
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> searchRooms(
            @RequestParam String keyword,
            @RequestParam Long semesterId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.debug("GET /api/admin/rooms/search - keyword: {}", keyword);

        Pageable pageable = PageRequest.of(page, size);

        Page<RoomResponse> rooms = roomService.searchRooms(keyword, semesterId, pageable);

        return ResponseEntity.ok(
                ApiResponse.success(
                        rooms.getTotalElements() + " room(s) found",
                        rooms
                )
        );
    }

    /**
     * 5. Advanced filter (combine multiple criteria)
     *
     * GET /api/admin/rooms/filter?building=A&floor=2&roomType=LECTURE_HALL&isActive=true&currentStatus=AVAILABLE&semesterId=1
     */
    @GetMapping("/filter")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> filterRooms(
            @RequestParam(required = false) String building,
            @RequestParam(required = false) Integer floor,
            @RequestParam(required = false) RoomType roomType,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String currentStatus,
            @RequestParam Long semesterId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.debug("GET /api/admin/rooms/filter - building: {}, floor: {}, type: {}, active: {}, status: {}",
                building, floor, roomType, isActive, currentStatus);

        Pageable pageable = PageRequest.of(page, size);

        Page<RoomResponse> rooms = roomService.filterRooms(
                building, floor, roomType, isActive, currentStatus, semesterId, pageable
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        rooms.getTotalElements() + " room(s) match filter",
                        rooms
                )
        );
    }

    // ==================== FILTER ENDPOINTS ====================

    /**
     * 6. Get rooms by building
     *
     * GET /api/admin/rooms/building/{building}?semesterId=1
     */
    @GetMapping("/building/{building}")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getRoomsByBuilding(
            @PathVariable String building,
            @RequestParam Long semesterId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);

        Page<RoomResponse> rooms = roomService.getRoomsByBuilding(
                building, semesterId, pageable
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        rooms.getTotalElements() + " room(s) in building " + building,
                        rooms
                )
        );
    }

    /**
     * 7. Get rooms by floor
     *
     * GET /api/admin/rooms/floor/{floor}?semesterId=1
     */
    @GetMapping("/floor/{floor}")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getRoomsByFloor(
            @PathVariable Integer floor,
            @RequestParam Long semesterId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);

        Page<RoomResponse> rooms = roomService.getRoomsByFloor(floor, semesterId, pageable);

        return ResponseEntity.ok(
                ApiResponse.success(
                        rooms.getTotalElements() + " room(s) on floor " + floor,
                        rooms
                )
        );
    }

    /**
     * 8. Get rooms by type
     *
     * GET /api/admin/rooms/type/{roomType}?semesterId=1
     */
    @GetMapping("/type/{roomType}")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getRoomsByType(
            @PathVariable RoomType roomType,
            @RequestParam Long semesterId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);

        Page<RoomResponse> rooms = roomService.getRoomsByType(roomType, semesterId, pageable);

        return ResponseEntity.ok(
                ApiResponse.success(
                        rooms.getTotalElements() + " room(s) of type " + roomType,
                        rooms
                )
        );
    }

    /**
     * 9. Get rooms by admin status (active/inactive)
     *
     * GET /api/admin/rooms/admin-status/{isActive}?semesterId=1
     */
    @GetMapping("/admin-status/{isActive}")
    public ResponseEntity<ApiResponse<Page<RoomResponse>>> getRoomsByAdminStatus(
            @PathVariable Boolean isActive,
            @RequestParam Long semesterId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);

        Page<RoomResponse> rooms = roomService.getRoomsByAdminStatus(
                isActive, semesterId, pageable
        );

        String status = isActive ? "active" : "inactive";

        return ResponseEntity.ok(
                ApiResponse.success(
                        rooms.getTotalElements() + " " + status + " room(s)",
                        rooms
                )
        );
    }

    // ==================== SCHEDULE ENDPOINTS ====================

    /**
     * 10. Get room schedule for semester
     *
     * GET /api/admin/rooms/{id}/schedule?semesterId=1
     *
     * Shows all sessions using this room in the semester
     */
    @GetMapping("/{id}/schedule")
    public ResponseEntity<ApiResponse<List<RoomScheduleResponse>>> getRoomSchedule(
            @PathVariable Long id,
            @RequestParam Long semesterId) {

        log.debug("GET /api/admin/rooms/{}/schedule - semesterId: {}", id, semesterId);

        List<RoomScheduleResponse> schedule = roomService.getRoomSchedule(id, semesterId);

        return ResponseEntity.ok(
                ApiResponse.success(
                        schedule.size() + " session(s) scheduled",
                        schedule
                )
        );
    }

    /**
     * 11. Get room schedule for TODAY
     *
     * GET /api/admin/rooms/{id}/schedule/today
     */
    @GetMapping("/{id}/schedule/today")
    public ResponseEntity<ApiResponse<List<RoomScheduleResponse>>> getRoomScheduleToday(
            @PathVariable Long id) {

        log.debug("GET /api/admin/rooms/{}/schedule/today", id);

        List<RoomScheduleResponse> schedule = roomService.getRoomScheduleToday(id);

        return ResponseEntity.ok(
                ApiResponse.success(
                        schedule.size() + " session(s) today",
                        schedule
                )
        );
    }

    /**
     * 12. Get room schedule for specific date
     *
     * GET /api/admin/rooms/{id}/schedule/date?date=2024-12-26
     */
    @GetMapping("/{id}/schedule/date")
    public ResponseEntity<ApiResponse<List<RoomScheduleResponse>>> getRoomScheduleForDate(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        log.debug("GET /api/admin/rooms/{}/schedule/date - date: {}", id, date);

        List<RoomScheduleResponse> schedule = roomService.getRoomScheduleForDate(id, date);

        return ResponseEntity.ok(
                ApiResponse.success(
                        schedule.size() + " session(s) on " + date,
                        schedule
                )
        );
    }

    // ==================== STATISTICS ENDPOINTS ====================

    /**
     * 13. Get room statistics
     *
     * GET /api/admin/rooms/{id}/statistics?semesterId=1
     */
    @GetMapping("/{id}/statistics")
    public ResponseEntity<ApiResponse<RoomResponse.RoomStatistics>> getRoomStatistics(
            @PathVariable Long id,
            @RequestParam Long semesterId) {

        log.debug("GET /api/admin/rooms/{}/statistics - semesterId: {}", id, semesterId);

        RoomResponse.RoomStatistics statistics = roomService.getRoomStatistics(id, semesterId);

        return ResponseEntity.ok(
                ApiResponse.success("Room statistics retrieved", statistics)
        );
    }

    /**
     * 14. Get room utilization percentage
     *
     * GET /api/admin/rooms/{id}/utilization?semesterId=1
     */
    @GetMapping("/{id}/utilization")
    public ResponseEntity<ApiResponse<Double>> getRoomUtilization(
            @PathVariable Long id,
            @RequestParam Long semesterId) {

        log.debug("GET /api/admin/rooms/{}/utilization - semesterId: {}", id, semesterId);

        Double utilization = roomService.getRoomUtilization(id, semesterId);

        return ResponseEntity.ok(
                ApiResponse.success(
                        String.format("Room utilization: %.2f%%", utilization),
                        utilization
                )
        );
    }

    // ==================== LOOKUP ENDPOINTS ====================

    /**
     * 15. Get all buildings
     *
     * GET /api/admin/rooms/buildings
     */
    @GetMapping("/buildings")
    public ResponseEntity<ApiResponse<List<String>>> getAllBuildings() {

        log.debug("GET /api/admin/rooms/buildings");

        List<String> buildings = roomService.getAllBuildings();

        return ResponseEntity.ok(
                ApiResponse.success(
                        buildings.size() + " building(s) found",
                        buildings
                )
        );
    }

    /**
     * 16. Get floors in building
     *
     * GET /api/admin/rooms/buildings/{building}/floors
     */
    @GetMapping("/buildings/{building}/floors")
    public ResponseEntity<ApiResponse<List<Integer>>> getFloorsByBuilding(
            @PathVariable String building) {

        log.debug("GET /api/admin/rooms/buildings/{}/floors", building);

        List<Integer> floors = roomService.getFloorsByBuilding(building);

        return ResponseEntity.ok(
                ApiResponse.success(
                        floors.size() + " floor(s) in building " + building,
                        floors
                )
        );
    }

    // ==================== REAL-TIME STATUS ENDPOINTS ====================

    /**
     * 17. Check if room is currently in use
     *
     * GET /api/admin/rooms/{id}/in-use
     *
     * Returns: true if room has session happening RIGHT NOW
     */
    @GetMapping("/{id}/in-use")
    public ResponseEntity<ApiResponse<Boolean>> isRoomInUse(@PathVariable Long id) {

        log.debug("GET /api/admin/rooms/{}/in-use", id);

        boolean inUse = roomService.isRoomCurrentlyInUse(id);

        String message = inUse ? "Room is currently in use" : "Room is available";

        return ResponseEntity.ok(
                ApiResponse.success(message, inUse)
        );
    }

    /**
     * 18. Get current session using room
     *
     * GET /api/admin/rooms/{id}/current-session
     *
     * Returns: Session info if room is in use, null otherwise
     */
    @GetMapping("/{id}/current-session")
    public ResponseEntity<ApiResponse<RoomResponse.CurrentSessionInfo>> getCurrentSession(
            @PathVariable Long id) {

        log.debug("GET /api/admin/rooms/{}/current-session", id);

        RoomResponse.CurrentSessionInfo session = roomService.getCurrentSession(id);

        String message = session != null ?
                "Room is in use" :
                "Room is available";

        return ResponseEntity.ok(
                ApiResponse.success(message, session)
        );
    }

    /**
     * 19. Calculate current status of room
     *
     * GET /api/admin/rooms/{id}/current-status
     *
     * Returns: IN_USE, AVAILABLE, or INACTIVE
     */
    @GetMapping("/{id}/current-status")
    public ResponseEntity<ApiResponse<String>> getCurrentStatus(@PathVariable Long id) {

        log.debug("GET /api/admin/rooms/{}/current-status", id);

        Room room = roomService.getRoomById(id);
        String status = roomService.calculateCurrentStatus(room);

        return ResponseEntity.ok(
                ApiResponse.success("Current status: " + status, status)
        );
    }

    // ==================== CRUD ENDPOINTS ====================

    /**
     * 20. CREATE: Create a new room
     *
     * POST /api/admin/rooms
     */
    @PostMapping
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @Valid @RequestBody RoomCreateRequest request,
            @RequestParam(required = false, defaultValue = "1") Long semesterId) {

        log.info("POST /api/admin/rooms - Creating room: {}", request.getRoomCode());

        try {
            // Check if room code already exists
            try {
                roomService.getRoomByCode(request.getRoomCode());
                // If we get here, room already exists
                return ResponseEntity
                        .badRequest()
                        .body(ApiResponse.<RoomResponse>builder()
                                .success(false)
                                .message("Room code already exists: " + request.getRoomCode())
                                .build());
            } catch (NotFoundException e) {
                // Room doesn't exist, we can create it
            }

            // Create room entity
            Room room = Room.builder()
                    .roomCode(request.getRoomCode())
                    .roomName(request.getRoomName())
                    .building(request.getBuilding())
                    .floor(request.getFloor())
                    .roomType(request.getRoomType())
                    .capacity(request.getCapacity())
                    .isActive(request.getIsActive())
                    .build();

            // Save using service
            Room saved = roomService.createRoom(room);

            log.info("✅ Room created: {}", saved.getRoomCode());

            // Return with status
            RoomResponse response = roomService.getRoomWithStatus(saved.getRoomId(), semesterId);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Room created successfully", response));

        } catch (Exception e) {
            log.error("❌ Error creating room: {}", e.getMessage());
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.<RoomResponse>builder()
                            .success(false)
                            .message("Error creating room: " + e.getMessage())
                            .build());
        }
    }

    /**
     * 21. UPDATE: Update an existing room
     *
     * PUT /api/admin/rooms/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody RoomUpdateRequest request,
            @RequestParam(required = false, defaultValue = "1") Long semesterId) {

        log.info("PUT /api/admin/rooms/{} - Updating room", id);

        try {
            Room room = roomService.getRoomById(id);

            // Update fields (room code cannot be changed)
            room.setRoomName(request.getRoomName());
            room.setBuilding(request.getBuilding());
            room.setFloor(request.getFloor());
            room.setRoomType(request.getRoomType());
            room.setCapacity(request.getCapacity());
            room.setIsActive(request.getIsActive());

            Room updated = roomService.updateRoom(room);

            log.info("✅ Room updated: {}", updated.getRoomCode());

            // Return with status
            RoomResponse response = roomService.getRoomWithStatus(updated.getRoomId(), semesterId);

            return ResponseEntity.ok(
                    ApiResponse.success("Room updated successfully", response)
            );

        } catch (NotFoundException e) {
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.<RoomResponse>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build());
        } catch (Exception e) {
            log.error("❌ Error updating room: {}", e.getMessage());
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.<RoomResponse>builder()
                            .success(false)
                            .message("Error updating room: " + e.getMessage())
                            .build());
        }
    }

    /**
     * 22. DELETE: Delete a room
     *
     * DELETE /api/admin/rooms/{id}
     *
     * NOTE: Cannot delete room if it has sessions
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "1") Long semesterId) {

        log.info("DELETE /api/admin/rooms/{} - Deleting room", id);

        try {
            Room room = roomService.getRoomById(id);

            // Check if room has any sessions
            Double utilization = roomService.getRoomUtilization(room.getRoomId(), semesterId);

            // If utilization > 0, room has sessions
            if (utilization > 0) {
                return ResponseEntity
                        .badRequest()
                        .body(ApiResponse.<Void>builder()
                                .success(false)
                                .message("Cannot delete room. It has sessions assigned in semester " + semesterId)
                                .build());
            }

            roomService.deleteRoom(room.getRoomId());

            log.info("✅ Room deleted: {}", room.getRoomCode());

            return ResponseEntity.ok(
                    ApiResponse.<Void>builder()
                            .success(true)
                            .message("Room deleted successfully")
                            .build()
            );

        } catch (NotFoundException e) {
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.<Void>builder()
                            .success(false)
                            .message(e.getMessage())
                            .build());
        } catch (Exception e) {
            log.error("❌ Error deleting room: {}", e.getMessage());
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.<Void>builder()
                            .success(false)
                            .message("Error deleting room: " + e.getMessage())
                            .build());
        }
    }
}