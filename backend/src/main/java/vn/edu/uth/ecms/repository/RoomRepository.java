package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.Room;
import vn.edu.uth.ecms.entity.TimeSlot;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    // ✅ Thêm phương thức sắp xếp mà Service yêu cầu
    List<Room> findAllByIsActiveTrueOrderByBuildingAscFloorAscRoomCodeAsc();

    boolean existsByRoomCode(String roomCode);

    Optional<Room> findByRoomCode(String roomCode);

    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.roomType != 'ONLINE' ORDER BY r.roomCode")
    List<Room> findAllPhysicalRooms();

    @Query("SELECT r FROM Room r WHERE r.roomCode = 'ONLINE' AND r.isActive = true")
    Optional<Room> findOnlineRoom();

    // ✅ Chuyển tham số sang TimeSlot enum
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
            "        (cs.isRescheduled = false AND cs.originalRoom.roomId = r.roomId AND cs.originalDate = :date AND cs.originalTimeSlot = :timeSlot) " +
            "        OR " +
            "        (cs.isRescheduled = true AND cs.actualRoom.roomId = r.roomId AND cs.actualDate = :date AND cs.actualTimeSlot = :timeSlot)" +
            "    )" +
            ") ORDER BY r.capacity ASC")
    List<Room> findAvailableRoomsForSlot(
            @Param("semesterId") Long semesterId,
            @Param("date") LocalDate date,
            @Param("timeSlot") TimeSlot timeSlot,
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
            "        (cs.isRescheduled = false AND cs.originalRoom.roomId = r.roomId AND cs.originalDate IN :dates AND cs.originalTimeSlot = :timeSlot) " +
            "        OR " +
            "        (cs.isRescheduled = true AND cs.actualRoom.roomId = r.roomId AND cs.actualDate IN :dates AND cs.actualTimeSlot = :timeSlot)" +
            "    )" +
            ") ORDER BY r.capacity ASC")
    List<Room> findRoomsAvailableForAllDates(
            @Param("semesterId") Long semesterId,
            @Param("dates") List<LocalDate> dates,
            @Param("timeSlot") TimeSlot timeSlot,
            @Param("minCapacity") Integer minCapacity
    );

    @Query("SELECT CASE WHEN COUNT(cs) > 0 THEN true ELSE false END " +
            "FROM ClassSession cs " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "AND cs.isPending = false " +
            "AND cs.status != 'CANCELLED' " +
            "AND (" +
            "    (cs.isRescheduled = false AND cs.originalRoom.roomId = :roomId AND (:date IS NULL OR cs.originalDate = :date) AND cs.originalTimeSlot = :timeSlot) " +
            "    OR " +
            "    (cs.isRescheduled = true AND cs.actualRoom.roomId = :roomId AND (:date IS NULL OR cs.actualDate = :date) AND cs.actualTimeSlot = :timeSlot)" +
            ") AND (:excludeSessionId IS NULL OR cs.sessionId != :excludeSessionId)")
    boolean existsRoomConflict(
            @Param("semesterId") Long semesterId,
            @Param("roomId") Long roomId,
            @Param("date") LocalDate date,
            @Param("timeSlot") TimeSlot timeSlot,
            @Param("excludeSessionId") Long excludeSessionId
    );

    @Query("SELECT COUNT(DISTINCT cs.sessionId) FROM ClassSession cs " +
            "WHERE cs.classEntity.semester.semesterId = :semesterId " +
            "AND cs.isPending = false " +
            "AND cs.status != 'CANCELLED' " +
            "AND (cs.originalRoom.roomId = :roomId OR cs.actualRoom.roomId = :roomId)")
    Long countSessionsUsingRoom(@Param("roomId") Long roomId, @Param("semesterId") Long semesterId);

    @Query("SELECT COUNT(cs) FROM ClassSession cs WHERE cs.classEntity.semester.semesterId = :semesterId AND cs.isPending = false")
    Long countTotalSessionsInSemester(@Param("semesterId") Long semesterId);
}