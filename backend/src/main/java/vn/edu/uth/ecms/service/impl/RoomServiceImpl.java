package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.response.RoomResponse;
import vn.edu.uth.ecms.dto.response.RoomScheduleResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.ClassSessionRepository;
import vn.edu.uth.ecms.repository.RoomRepository;
import vn.edu.uth.ecms.service.RoomService;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * ✅ FIXED: RoomServiceImpl with Proper Real-time Status Logic
 *
 * KEY FIXES:
 * 1. Only IN_PERSON sessions can mark rooms as IN_USE
 * 2. E_LEARNING sessions are EXCLUDED from room status calculation
 * 3. ONLINE room is ALWAYS AVAILABLE (never IN_USE)
 * 4. Real-time status based on current time matching session time slots
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final ClassSessionRepository sessionRepository;

    // ==================== CONSTANTS ====================

    private static final String ONLINE_ROOM_CODE = "ONLINE";

    // ==================== CRUD OPERATIONS ====================

    @Override
    @Transactional
    public Room createRoom(Room room) {
        log.info("Creating room: {}", room.getRoomCode());

        if (roomRepository.existsByRoomCode(room.getRoomCode())) {
            throw new IllegalArgumentException("Room code already exists: " + room.getRoomCode());
        }

        Room saved = roomRepository.save(room);
        log.info("✅ Room created successfully: {}", saved.getRoomCode());

        return saved;
    }

    @Override
    @Transactional
    public Room updateRoom(Room room) {
        log.info("Updating room: {}", room.getRoomCode());

        if (!roomRepository.existsById(room.getRoomId())) {
            throw new NotFoundException("Room not found with ID: " + room.getRoomId());
        }

        Room updated = roomRepository.save(room);
        log.info("✅ Room updated successfully: {}", updated.getRoomCode());

        return updated;
    }

    @Override
    @Transactional
    public void deleteRoom(Long roomId) {
        log.info("Deleting room ID: {}", roomId);
        Room room = getRoomById(roomId);
        roomRepository.delete(room);
        log.info("✅ Room deleted successfully: {}", room.getRoomCode());
    }

    @Override
    public long countAll() {
        return roomRepository.count();
    }

    // ==================== EXISTING METHODS ====================

    @Override
    @Transactional(readOnly = true)
    public Room findRoomForFixedSchedule(
            Long semesterId,
            List<LocalDate> dates,
            DayOfWeek dayOfWeek,
            TimeSlot timeSlot,
            int minCapacity) {

        List<Room> availableRooms = roomRepository.findRoomsAvailableForAllDates(
                semesterId, dates, timeSlot, minCapacity
        );

        if (availableRooms.isEmpty()) {
            throw new NotFoundException("Không tìm thấy phòng trống cho lịch cố định.");
        }

        return availableRooms.get(0);
    }

    @Override
    @Transactional(readOnly = true)
    public Room findRoomForSingleSession(
            Long semesterId,
            LocalDate date,
            DayOfWeek dayOfWeek,
            TimeSlot timeSlot,
            int minCapacity) {

        List<Room> availableRooms = roomRepository.findAvailableRoomsForSlot(
                semesterId, date, timeSlot, minCapacity
        );

        if (availableRooms.isEmpty()) {
            throw new NotFoundException("Không tìm thấy phòng trống cho ngày " + date);
        }

        return availableRooms.get(0);
    }

    @Override
    @Transactional(readOnly = true)
    public Room getOnlineRoom() {
        return roomRepository.findOnlineRoom()
                .orElseThrow(() -> new NotFoundException("Phòng ONLINE chưa được cấu hình."));
    }

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
                semesterId, roomId, date, timeSlot, excludeSessionId
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<Room> getAllPhysicalRooms() {
        return roomRepository.findAllPhysicalRooms();
    }

    @Override
    @Transactional(readOnly = true)
    public Room getRoomByCode(String roomCode) {
        return roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phòng: " + roomCode));
    }

    @Override
    @Transactional(readOnly = true)
    public Room getRoomById(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("Phòng không tồn tại: " + roomId));
    }

    @Override
    @Transactional(readOnly = true)
    public Double getRoomUtilization(Long roomId, Long semesterId) {
        Long sessionsInRoom = roomRepository.countSessionsUsingRoom(roomId, semesterId);
        Long totalSessions = roomRepository.countTotalSessionsInSemester(semesterId);

        if (totalSessions == 0) return 0.0;

        return (sessionsInRoom.doubleValue() / totalSessions.doubleValue()) * 100.0;
    }

    // ==================== ROOM MANAGEMENT WITH STATUS ====================

    @Override
    @Transactional(readOnly = true)
    public Page<RoomResponse> getAllRoomsWithStatus(Long semesterId, Pageable pageable) {
        log.debug("Getting all rooms with status for semester: {}", semesterId);

        Page<Room> roomPage = roomRepository.findAllByOrderByBuildingAscFloorAscRoomCodeAsc(pageable);

        List<RoomResponse> roomResponses = roomPage.getContent().stream()
                .map(room -> mapToResponseWithStatus(room, semesterId))
                .collect(Collectors.toList());

        return new PageImpl<>(roomResponses, pageable, roomPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public RoomResponse getRoomWithStatus(Long roomId, Long semesterId) {
        log.debug("Getting room {} with status", roomId);

        Room room = getRoomById(roomId);
        return mapToResponseWithStatus(room, semesterId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RoomResponse> getRoomsByCurrentStatus(
            String status,
            Long semesterId,
            Pageable pageable) {

        log.debug("Getting rooms by status: {}", status);

        Page<Room> allRooms = roomRepository.findByIsActiveOrderByRoomCodeAsc(true, pageable);

        List<RoomResponse> filteredRooms = allRooms.getContent().stream()
                .map(room -> mapToResponseWithStatus(room, semesterId))
                .filter(response -> response.getCurrentStatus().equals(status))
                .collect(Collectors.toList());

        return new PageImpl<>(filteredRooms, pageable, filteredRooms.size());
    }

    // ==================== SEARCH & FILTER ====================

    @Override
    @Transactional(readOnly = true)
    public Page<RoomResponse> searchRooms(
            String keyword,
            Long semesterId,
            Pageable pageable) {

        log.debug("Searching rooms with keyword: {}", keyword);

        Page<Room> roomPage = roomRepository.searchRooms(keyword, pageable);

        List<RoomResponse> roomResponses = roomPage.getContent().stream()
                .map(room -> mapToResponseWithStatus(room, semesterId))
                .collect(Collectors.toList());

        return new PageImpl<>(roomResponses, pageable, roomPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RoomResponse> filterRooms(
            String building,
            Integer floor,
            RoomType roomType,
            Boolean isActive,
            String currentStatus,
            Long semesterId,
            Pageable pageable) {

        log.debug("Filtering rooms - building: {}, floor: {}, type: {}, active: {}, status: {}",
                building, floor, roomType, isActive, currentStatus);

        Page<Room> roomPage = roomRepository.findByFilters(
                building, floor, roomType, isActive, pageable
        );

        List<RoomResponse> roomResponses = roomPage.getContent().stream()
                .map(room -> mapToResponseWithStatus(room, semesterId))
                .filter(response -> currentStatus == null ||
                        response.getCurrentStatus().equals(currentStatus))
                .collect(Collectors.toList());

        return new PageImpl<>(roomResponses, pageable, roomResponses.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RoomResponse> getRoomsByBuilding(
            String building,
            Long semesterId,
            Pageable pageable) {

        Page<Room> roomPage = roomRepository.findByBuildingOrderByFloorAscRoomCodeAsc(
                building, pageable
        );

        List<RoomResponse> roomResponses = roomPage.getContent().stream()
                .map(room -> mapToResponseWithStatus(room, semesterId))
                .collect(Collectors.toList());

        return new PageImpl<>(roomResponses, pageable, roomPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RoomResponse> getRoomsByFloor(
            Integer floor,
            Long semesterId,
            Pageable pageable) {

        Page<Room> roomPage = roomRepository.findByFloorOrderByBuildingAscRoomCodeAsc(
                floor, pageable
        );

        List<RoomResponse> roomResponses = roomPage.getContent().stream()
                .map(room -> mapToResponseWithStatus(room, semesterId))
                .collect(Collectors.toList());

        return new PageImpl<>(roomResponses, pageable, roomPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RoomResponse> getRoomsByType(
            RoomType roomType,
            Long semesterId,
            Pageable pageable) {

        Page<Room> roomPage = roomRepository.findByRoomTypeOrderByRoomCodeAsc(
                roomType, pageable
        );

        List<RoomResponse> roomResponses = roomPage.getContent().stream()
                .map(room -> mapToResponseWithStatus(room, semesterId))
                .collect(Collectors.toList());

        return new PageImpl<>(roomResponses, pageable, roomPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RoomResponse> getRoomsByAdminStatus(
            Boolean isActive,
            Long semesterId,
            Pageable pageable) {

        Page<Room> roomPage = roomRepository.findByIsActiveOrderByRoomCodeAsc(
                isActive, pageable
        );

        List<RoomResponse> roomResponses = roomPage.getContent().stream()
                .map(room -> mapToResponseWithStatus(room, semesterId))
                .collect(Collectors.toList());

        return new PageImpl<>(roomResponses, pageable, roomPage.getTotalElements());
    }

    // ==================== SCHEDULE & SESSIONS ====================

    @Override
    @Transactional(readOnly = true)
    public List<RoomScheduleResponse> getRoomSchedule(Long roomId, Long semesterId) {
        log.debug("Getting schedule for room {} in semester {}", roomId, semesterId);

        Room room = getRoomById(roomId);

        // KEY FIX: Only get IN_PERSON sessions
        List<ClassSession> sessions = sessionRepository.findByClass(roomId).stream()
                .filter(session -> session.getClassEntity().getSemester().getSemesterId().equals(semesterId))
                .filter(session -> !session.getIsPending())
                .filter(session -> session.getSessionType() == SessionType.IN_PERSON)  //CRITICAL
                .collect(Collectors.toList());

        return sessions.stream()
                .map(this::mapToScheduleResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomScheduleResponse> getRoomScheduleToday(Long roomId) {
        LocalDate today = LocalDate.now();
        return getRoomScheduleForDate(roomId, today);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoomScheduleResponse> getRoomScheduleForDate(Long roomId, LocalDate date) {
        log.debug("Getting schedule for room {} on {}", roomId, date);

        Room room = getRoomById(roomId);

        // ⭐ KEY FIX: Only find IN_PERSON sessions on this date
        List<Object[]> results = roomRepository.findCurrentSessionsInRoom(roomId, date);

        return results.stream()
                .map(row -> {
                    ClassSession session = (ClassSession) row[0];
                    // Filter out E_LEARNING
                    return session.getSessionType() == SessionType.IN_PERSON ?
                            mapToScheduleResponse(session) : null;
                })
                .filter(response -> response != null)
                .collect(Collectors.toList());
    }

    // ==================== STATISTICS ====================

    @Override
    @Transactional(readOnly = true)
    public RoomResponse.RoomStatistics getRoomStatistics(Long roomId, Long semesterId) {
        log.debug("Getting statistics for room {} in semester {}", roomId, semesterId);

        List<Object[]> statusCounts = roomRepository.countSessionsByStatus(roomId, semesterId);

        long totalSessions = 0;
        long completedSessions = 0;
        long cancelledSessions = 0;

        for (Object[] row : statusCounts) {
            SessionStatus status = (SessionStatus) row[0];
            Long count = (Long) row[1];

            totalSessions += count;

            if (status == SessionStatus.COMPLETED) {
                completedSessions = count;
            } else if (status == SessionStatus.CANCELLED) {
                cancelledSessions = count;
            }
        }

        long upcomingSessions = totalSessions - completedSessions - cancelledSessions;
        Double utilizationPercentage = getRoomUtilization(roomId, semesterId);

        return RoomResponse.RoomStatistics.builder()
                .totalSessions(totalSessions)
                .completedSessions(completedSessions)
                .upcomingSessions(upcomingSessions)
                .cancelledSessions(cancelledSessions)
                .utilizationPercentage(utilizationPercentage)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAllBuildings() {
        return roomRepository.findDistinctBuildings();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Integer> getFloorsByBuilding(String building) {
        return roomRepository.findDistinctFloorsByBuilding(building);
    }

    // ==================== ✅ FIXED: REAL-TIME STATUS CALCULATION ====================

    /**
     * ✅ FIXED: Check if room is currently in use
     * - ONLINE room: NEVER in use (always return false)
     * - Physical rooms: Only check IN_PERSON sessions
     * - Must match current time with session time slot
     */
    @Override
    @Transactional(readOnly = true)
    public boolean isRoomCurrentlyInUse(Long roomId) {
        Room room = getRoomById(roomId);

        // ⭐ RULE 1: ONLINE room is NEVER "in use"
        if (ONLINE_ROOM_CODE.equals(room.getRoomCode()) || room.getRoomType() == RoomType.ONLINE) {
            log.debug("ONLINE room {} is never IN_USE", room.getRoomCode());
            return false;
        }

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        log.debug("Checking if room {} is in use at {} on {}", room.getRoomCode(), now, today);

        // Get today's IN_PERSON sessions for this room
        List<Object[]> todaySessions = roomRepository.findCurrentSessionsInRoom(roomId, today);

        for (Object[] row : todaySessions) {
            ClassSession session = (ClassSession) row[0];

            // RULE 2: Only check IN_PERSON sessions
            if (session.getSessionType() != SessionType.IN_PERSON) {
                log.debug("Skipping E_LEARNING session {} - doesn't occupy room", session.getSessionId());
                continue;
            }

            // Check if session is happening NOW
            TimeSlot timeSlot = session.getEffectiveTimeSlot();

            if (timeSlot != null && isTimeSlotActive(timeSlot, now)) {
                log.debug("✅ Room {} is IN_USE by session {} ({})",
                        room.getRoomCode(), session.getSessionId(), timeSlot);
                return true;
            }
        }

        log.debug("Room {} is AVAILABLE - no active IN_PERSON session", room.getRoomCode());
        return false;
    }

    /**
     * ✅ FIXED: Get current session info
     * - Returns null for ONLINE room
     * - Returns null if no IN_PERSON session is active
     * - Returns session info only for active IN_PERSON sessions
     */
    @Override
    @Transactional(readOnly = true)
    public RoomResponse.CurrentSessionInfo getCurrentSession(Long roomId) {
        Room room = getRoomById(roomId);

        // RULE 1: ONLINE room has no "current session"
        if (ONLINE_ROOM_CODE.equals(room.getRoomCode()) || room.getRoomType() == RoomType.ONLINE) {
            log.debug("ONLINE room {} has no current session", room.getRoomCode());
            return null;
        }

        if (!isRoomCurrentlyInUse(roomId)) {
            return null;
        }

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        List<Object[]> todaySessions = roomRepository.findCurrentSessionsInRoom(roomId, today);

        for (Object[] row : todaySessions) {
            ClassSession session = (ClassSession) row[0];

            // RULE 2: Only consider IN_PERSON sessions
            if (session.getSessionType() != SessionType.IN_PERSON) {
                continue;
            }

            TimeSlot timeSlot = session.getEffectiveTimeSlot();

            if (timeSlot != null && isTimeSlotActive(timeSlot, now)) {
                log.debug("Found current IN_PERSON session {} in room {}",
                        session.getSessionId(), room.getRoomCode());
                return mapToCurrentSessionInfo(session, timeSlot, now);
            }
        }

        return null;
    }

    /**
     * ✅ FIXED: Calculate current status
     * - ONLINE room: ALWAYS "AVAILABLE"
     * - Admin disabled: "INACTIVE"
     * - Has active IN_PERSON session: "IN_USE"
     * - Otherwise: "AVAILABLE"
     */
    @Override
    @Transactional(readOnly = true)
    public String calculateCurrentStatus(Room room) {
        log.debug("Calculating status for room: {}", room.getRoomCode());

        // RULE 1: ONLINE room is ALWAYS AVAILABLE
        if (ONLINE_ROOM_CODE.equals(room.getRoomCode()) || room.getRoomType() == RoomType.ONLINE) {
            log.debug("ONLINE room {} → AVAILABLE", room.getRoomCode());
            return "AVAILABLE";
        }

        // RULE 2: Admin disabled room → INACTIVE
        if (!room.getIsActive()) {
            log.debug("Room {} is disabled by admin → INACTIVE", room.getRoomCode());
            return "INACTIVE";
        }

        // RULE 3: Check if IN_PERSON session is active NOW
        if (isRoomCurrentlyInUse(room.getRoomId())) {
            log.debug("Room {} has active IN_PERSON session → IN_USE", room.getRoomCode());
            return "IN_USE";
        }

        // RULE 4: Otherwise → AVAILABLE
        log.debug("Room {} has no active session → AVAILABLE", room.getRoomCode());
        return "AVAILABLE";
    }

    // ==================== HELPER METHODS ====================

    /**
     * Check if current time is within a time slot
     */
    private boolean isTimeSlotActive(TimeSlot timeSlot, LocalTime now) {
        LocalTime start = LocalTime.parse(timeSlot.getStartTime());
        LocalTime end = LocalTime.parse(timeSlot.getEndTime());

        boolean isActive = !now.isBefore(start) && !now.isAfter(end);

        log.debug("TimeSlot {} ({}-{}) active at {}? {}",
                timeSlot, start, end, now, isActive);

        return isActive;
    }

    /**
     * Calculate minutes remaining in session
     */
    private Integer calculateMinutesRemaining(TimeSlot timeSlot, LocalTime now) {
        LocalTime end = LocalTime.parse(timeSlot.getEndTime());

        if (now.isAfter(end)) {
            return 0;
        }

        int hours = end.getHour() - now.getHour();
        int minutes = end.getMinute() - now.getMinute();

        return hours * 60 + minutes;
    }

    /**
     * Get current status display in Vietnamese
     */
    private String getCurrentStatusDisplay(String status) {
        return switch (status) {
            case "IN_USE" -> "Đang sử dụng";
            case "AVAILABLE" -> "Trống";
            case "INACTIVE" -> "Ngừng hoạt động";
            default -> "Không xác định";
        };
    }

    // ==================== MAPPERS ====================

    /**
     * ✅ FIXED: Map Room entity to RoomResponse with real-time status
     */
    private RoomResponse mapToResponseWithStatus(Room room, Long semesterId) {
        // Calculate real-time status (fixed to exclude E_LEARNING)
        String currentStatus = calculateCurrentStatus(room);
        RoomResponse.CurrentSessionInfo currentSession =
                "IN_USE".equals(currentStatus) ? getCurrentSession(room.getRoomId()) : null;

        // Get statistics (should also exclude E_LEARNING in repository queries)
        Long totalSessions = roomRepository.countSessionsUsingRoom(room.getRoomId(), semesterId);

        List<Object[]> statusCounts = roomRepository.countSessionsByStatus(
                room.getRoomId(), semesterId
        );

        Long completedSessions = 0L;
        Long upcomingSessions = 0L;

        for (Object[] row : statusCounts) {
            SessionStatus status = (SessionStatus) row[0];
            Long count = (Long) row[1];

            if (status == SessionStatus.COMPLETED) {
                completedSessions = count;
            } else if (status == SessionStatus.SCHEDULED) {
                upcomingSessions = count;
            }
        }

        Double utilizationPercentage = getRoomUtilization(room.getRoomId(), semesterId);

        return RoomResponse.builder()
                // Basic info
                .roomId(room.getRoomId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .building(room.getBuilding())
                .floor(room.getFloor())
                .roomType(room.getRoomType().name())
                .roomTypeDisplay(room.getRoomTypeDisplay())
                .capacity(room.getCapacity())
                // Admin status
                .isActive(room.getIsActive())
                .adminStatus(room.getAdminStatus().name())
                .adminStatusDisplay(room.getAdminStatusDisplay())
                // Real-time status (FIXED)
                .currentStatus(currentStatus)
                .currentStatusDisplay(getCurrentStatusDisplay(currentStatus))
                .currentSession(currentSession)
                // Statistics
                .totalSessionsInSemester(totalSessions)
                .completedSessions(completedSessions)
                .upcomingSessions(upcomingSessions)
                .utilizationPercentage(utilizationPercentage)
                // Location
                .fullLocation(room.getFullLocation())
                .capacityInfo(room.getCapacityInfo())
                // Metadata
                .createdAt(room.getCreatedAt())
                .updatedAt(room.getUpdatedAt())
                .build();
    }

    /**
     * Map ClassSession to CurrentSessionInfo
     */
    private RoomResponse.CurrentSessionInfo mapToCurrentSessionInfo(
            ClassSession session,
            TimeSlot timeSlot,
            LocalTime now) {

        ClassEntity classEntity = session.getClassEntity();
        Teacher teacher = classEntity.getTeacher();
        Subject subject = classEntity.getSubject();

        return RoomResponse.CurrentSessionInfo.builder()
                .sessionId(session.getSessionId())
                .classId(classEntity.getClassId())
                .classCode(classEntity.getClassCode())
                .subjectName(subject.getSubjectName())
                .teacherName(teacher.getFullName())
                .timeSlot(timeSlot.name())
                .timeSlotDisplay(timeSlot.getFullDisplay())
                .startTime(timeSlot.getStartTime())
                .endTime(timeSlot.getEndTime())
                .minutesRemaining(calculateMinutesRemaining(timeSlot, now))
                .build();
    }

    /**
     * Map ClassSession to RoomScheduleResponse
     */
    private RoomScheduleResponse mapToScheduleResponse(ClassSession session) {
        ClassEntity classEntity = session.getClassEntity();
        Teacher teacher = classEntity.getTeacher();
        Subject subject = classEntity.getSubject();

        return RoomScheduleResponse.builder()
                .sessionId(session.getSessionId())
                .sessionDate(session.getEffectiveDate())
                .dayOfWeek(session.getEffectiveDayOfWeek() != null ?
                        session.getEffectiveDayOfWeek().name() : null)
                .timeSlot(session.getEffectiveTimeSlot() != null ?
                        session.getEffectiveTimeSlot().name() : null)
                .classId(classEntity.getClassId())
                .classCode(classEntity.getClassCode())
                .subjectName(subject.getSubjectName())
                .teacherName(teacher.getFullName())
                .status(session.getStatus().name())
                .isRescheduled(session.getIsRescheduled())
                .build();
    }
}