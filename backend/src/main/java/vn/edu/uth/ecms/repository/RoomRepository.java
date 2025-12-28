package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.Room;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Room entity - FINAL FIX v2
 *
 * ✅ FIXED: getRoomUtilization() return type
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    // ==================== BASIC QUERIES ====================

    Optional<Room> findByRoomCode(String roomCode);

    @Query("SELECT r FROM Room r WHERE r.isActive = true ORDER BY r.roomCode")
    List<Room> findAllActive();

    @Query("SELECT r FROM Room r " +
            "WHERE r.isActive = true " +
            "AND r.roomType != 'ONLINE' " +
            "ORDER BY r.capacity ASC")
    List<Room> findAllPhysicalRooms();

    @Query("SELECT r FROM Room r " +
            "WHERE r.roomCode = :roomCode " +
            "AND r.isActive = true")
    Optional<Room> findActiveByRoomCode(@Param("roomCode") String roomCode);

    @Query("SELECT r FROM Room r " +
            "WHERE r.building = :building " +
            "AND r.isActive = true " +
            "ORDER BY r.floor, r.roomCode")
    List<Room> findByBuilding(@Param("building") String building);

    @Query("SELECT r FROM Room r " +
            "WHERE r.roomType = :roomType " +
            "AND r.isActive = true " +
            "ORDER BY r.capacity ASC")
    List<Room> findByRoomType(@Param("roomType") String roomType);

    @Query("SELECT r FROM Room r " +
            "WHERE r.capacity BETWEEN :minCapacity AND :maxCapacity " +
            "AND r.isActive = true " +
            "AND r.roomType != 'ONLINE' " +
            "ORDER BY r.capacity ASC")
    List<Room> findByCapacityRange(
            @Param("minCapacity") Integer minCapacity,
            @Param("maxCapacity") Integer maxCapacity
    );

    boolean existsByRoomCode(String roomCode);

    @Query("SELECT COUNT(r) FROM Room r WHERE r.isActive = true")
    long countActiveRooms();

    @Query("SELECT COUNT(r) FROM Room r " +
            "WHERE r.roomType = :roomType " +
            "AND r.isActive = true")
    long countByRoomType(@Param("roomType") String roomType);

    // ==================== AVAILABILITY QUERIES ====================

    @Query("SELECT r FROM Room r " +
            "WHERE r.isActive = true " +
            "AND r.roomType != 'ONLINE' " +
            "AND r.capacity >= :minCapacity " +
            "AND NOT EXISTS (" +
            "    SELECT 1 FROM ClassSession cs " +
            "    WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "    AND cs.isPending = false " +
            "    AND cs.status != 'CANCELLED' " +
            "    AND (" +
            "        (cs.isRescheduled = false " +
            "         AND cs.originalRoom.roomId = r.roomId " +
            "         AND cs.originalDate = :date " +
            "         AND cs.originalDayOfWeek = :dayOfWeek " +
            "         AND cs.originalTimeSlot = :timeSlot) " +
            "        OR " +
            "        (cs.isRescheduled = true " +
            "         AND cs.actualRoom.roomId = r.roomId " +
            "         AND cs.actualDate = :date " +
            "         AND cs.actualDayOfWeek = :dayOfWeek " +
            "         AND cs.actualTimeSlot = :timeSlot)" +
            "    )" +
            ") " +
            "ORDER BY r.capacity ASC")
    List<Room> findAvailableRoomsForSlot(
            @Param("semesterId") Long semesterId,
            @Param("date") LocalDate date,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("timeSlot") String timeSlot,
            @Param("minCapacity") Integer minCapacity
    );

    @Query("SELECT r FROM Room r " +
            "WHERE r.isActive = true " +
            "AND r.roomType != 'ONLINE' " +
            "AND r.capacity >= :minCapacity " +
            "AND NOT EXISTS (" +
            "    SELECT 1 FROM ClassSession cs " +
            "    WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "    AND cs.isPending = false " +
            "    AND cs.status != 'CANCELLED' " +
            "    AND (" +
            "        (cs.isRescheduled = false " +
            "         AND cs.originalRoom.roomId = r.roomId " +
            "         AND cs.originalDate IN :dates " +
            "         AND cs.originalDayOfWeek = :dayOfWeek " +
            "         AND cs.originalTimeSlot = :timeSlot) " +
            "        OR " +
            "        (cs.isRescheduled = true " +
            "         AND cs.actualRoom.roomId = r.roomId " +
            "         AND cs.actualDate IN :dates " +
            "         AND cs.actualDayOfWeek = :dayOfWeek " +
            "         AND cs.actualTimeSlot = :timeSlot)" +
            "    )" +
            ") " +
            "ORDER BY r.capacity ASC")
    List<Room> findRoomsAvailableForAllDates(
            @Param("semesterId") Long semesterId,
            @Param("dates") List<LocalDate> dates,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("timeSlot") String timeSlot,
            @Param("minCapacity") Integer minCapacity
    );

    @Query("SELECT r FROM Room r " +
            "WHERE r.isActive = true " +
            "AND r.roomType != 'ONLINE' " +
            "AND r.capacity >= :minCapacity " +
            "ORDER BY r.capacity ASC")
    List<Room> findAvailableRoomsByMinCapacity(@Param("minCapacity") Integer minCapacity);

    @Query("SELECT r FROM Room r " +
            "WHERE r.roomCode = 'ONLINE' " +
            "AND r.isActive = true")
    Optional<Room> findOnlineRoom();

    // ==================== CONFLICT DETECTION ====================

    @Query("SELECT CASE WHEN COUNT(cs) > 0 THEN true ELSE false END " +
            "FROM ClassSession cs " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "AND cs.isPending = false " +
            "AND cs.status != 'CANCELLED' " +
            "AND (" +
            "    (cs.isRescheduled = false " +
            "     AND cs.originalRoom.roomId = :roomId " +
            "     AND (:date IS NULL OR cs.originalDate = :date) " +
            "     AND cs.originalDayOfWeek = :dayOfWeek " +
            "     AND cs.originalTimeSlot = :timeSlot) " +
            "    OR " +
            "    (cs.isRescheduled = true " +
            "     AND cs.actualRoom.roomId = :roomId " +
            "     AND (:date IS NULL OR cs.actualDate = :date) " +
            "     AND cs.actualDayOfWeek = :dayOfWeek " +
            "     AND cs.actualTimeSlot = :timeSlot)" +
            ") " +
            "AND (:excludeSessionId IS NULL OR cs.sessionId != :excludeSessionId)")
    boolean existsRoomConflict(
            @Param("semesterId") Long semesterId,
            @Param("roomId") Long roomId,
            @Param("date") LocalDate date,
            @Param("dayOfWeek") DayOfWeek dayOfWeek,
            @Param("timeSlot") String timeSlot,
            @Param("excludeSessionId") Long excludeSessionId
    );

    // ==================== STATISTICS ====================
    @Query("SELECT COUNT(DISTINCT cs.sessionId) " +
            "FROM ClassSession cs " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "AND cs.isPending = false " +
            "AND cs.status != 'CANCELLED' " +
            "AND (cs.originalRoom.roomId = :roomId OR cs.actualRoom.roomId = :roomId)")
    Long countSessionsUsingRoom(
            @Param("roomId") Long roomId,
            @Param("semesterId") Long semesterId
    );

    /**
     * Count total scheduled sessions in semester
     * Used to calculate room utilization percentage
     */
    @Query("SELECT COUNT(cs) " +
            "FROM ClassSession cs " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "AND cs.isPending = false")
    Long countTotalSessionsInSemester(@Param("semesterId") Long semesterId);
}
