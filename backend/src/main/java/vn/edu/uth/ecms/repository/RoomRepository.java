package vn.edu.uth.ecms.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.Room;
import vn.edu.uth.ecms.entity.enums.RoomType;
import vn.edu.uth.ecms.entity.enums.TimeSlot;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;


@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    

    List<Room> findAllByIsActiveTrueOrderByBuildingAscFloorAscRoomCodeAsc();

    boolean existsByRoomCode(String roomCode);

    Optional<Room> findByRoomCode(String roomCode);

    @Query("SELECT r FROM Room r WHERE r.isActive = true AND r.roomType != 'ONLINE' ORDER BY r.roomCode")
    List<Room> findAllPhysicalRooms();

    @Query("SELECT r FROM Room r WHERE r.roomCode = 'ONLINE' AND r.isActive = true")
    Optional<Room> findOnlineRoom();

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


    @Query("SELECT cs FROM ClassSession cs " +
            "WHERE (cs.originalRoom.roomId = :roomId OR cs.actualRoom.roomId = :roomId) " +
            "AND cs.isPending = false " +
            "AND cs.status = 'SCHEDULED' " +
            "AND (" +
            "    (cs.isRescheduled = false AND cs.originalDate = :today) " +
            "    OR " +
            "    (cs.isRescheduled = true AND cs.actualDate = :today)" +
            ")")
    List<Object[]> findCurrentSessionsInRoom(
            @Param("roomId") Long roomId,
            @Param("today") LocalDate today
    );


    @Query("SELECT CASE WHEN COUNT(cs) > 0 THEN true ELSE false END " +
            "FROM ClassSession cs " +
            "WHERE (cs.originalRoom.roomId = :roomId OR cs.actualRoom.roomId = :roomId) " +
            "AND cs.isPending = false " +
            "AND cs.status = 'SCHEDULED' " +
            "AND (" +
            "    (cs.isRescheduled = false AND cs.originalDate = :today) " +
            "    OR " +
            "    (cs.isRescheduled = true AND cs.actualDate = :today)" +
            ")")
    boolean isRoomInUseToday(
            @Param("roomId") Long roomId,
            @Param("today") LocalDate today
    );

    @Query("SELECT DISTINCT " +
            "CASE " +
            "    WHEN cs.isRescheduled = true THEN cs.actualRoom.roomId " +
            "    ELSE cs.originalRoom.roomId " +
            "END " +
            "FROM ClassSession cs " +
            "WHERE cs.isPending = false " +
            "AND cs.status = 'SCHEDULED' " +
            "AND (" +
            "    (cs.isRescheduled = false AND cs.originalDate = :today) " +
            "    OR " +
            "    (cs.isRescheduled = true AND cs.actualDate = :today)" +
            ")")
    List<Long> findRoomIdsInUseToday(@Param("today") LocalDate today);

 
    @Query("SELECT cs FROM ClassSession cs " +
            "WHERE (cs.originalRoom.roomId = :roomId OR cs.actualRoom.roomId = :roomId) " +
            "AND cs.isPending = false " +
            "AND cs.status = 'SCHEDULED' " +
            "AND (" +
            "    (cs.isRescheduled = false AND cs.originalDate > :today) " +
            "    OR " +
            "    (cs.isRescheduled = true AND cs.actualDate > :today)" +
            ") " +
            "ORDER BY " +
            "CASE " +
            "    WHEN cs.isRescheduled = true THEN cs.actualDate " +
            "    ELSE cs.originalDate " +
            "END ASC")
    List<Object[]> findNextSessionsInRoom(
            @Param("roomId") Long roomId,
            @Param("today") LocalDate today,
            Pageable pageable
    );

    @Query("SELECT r FROM Room r " +
            "WHERE UPPER(r.roomCode) LIKE UPPER(CONCAT('%', :keyword, '%')) " +
            "OR UPPER(r.roomName) LIKE UPPER(CONCAT('%', :keyword, '%')) " +
            "OR UPPER(r.building) LIKE UPPER(CONCAT('%', :keyword, '%')) " +
            "ORDER BY r.roomCode")
    Page<Room> searchRooms(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Find rooms by building
     */
    Page<Room> findByBuildingOrderByFloorAscRoomCodeAsc(String building, Pageable pageable);

    /**
     * Find rooms by floor
     */
    Page<Room> findByFloorOrderByBuildingAscRoomCodeAsc(Integer floor, Pageable pageable);

    /**
     * Find rooms by type
     */
    Page<Room> findByRoomTypeOrderByRoomCodeAsc(RoomType roomType, Pageable pageable);

    /**
     * Find rooms by status (active/inactive)
     */
    Page<Room> findByIsActiveOrderByRoomCodeAsc(Boolean isActive, Pageable pageable);

  
    @Query("SELECT r FROM Room r " +
            "WHERE (:building IS NULL OR r.building = :building) " +
            "AND (:floor IS NULL OR r.floor = :floor) " +
            "AND (:roomType IS NULL OR r.roomType = :roomType) " +
            "AND (:isActive IS NULL OR r.isActive = :isActive) " +
            "ORDER BY r.building, r.floor, r.roomCode")
    Page<Room> findByFilters(
            @Param("building") String building,
            @Param("floor") Integer floor,
            @Param("roomType") RoomType roomType,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );


    @Query("SELECT cs.status, COUNT(cs) " +
            "FROM ClassSession cs " +
            "WHERE (cs.originalRoom.roomId = :roomId OR cs.actualRoom.roomId = :roomId) " +
            "AND cs.classEntity.semester.semesterId = :semesterId " +
            "AND cs.isPending = false " +
            "GROUP BY cs.status")
    List<Object[]> countSessionsByStatus(
            @Param("roomId") Long roomId,
            @Param("semesterId") Long semesterId
    );

    /**
     * Get all distinct buildings
     */
    @Query("SELECT DISTINCT r.building FROM Room r " +
            "WHERE r.building IS NOT NULL " +
            "ORDER BY r.building")
    List<String> findDistinctBuildings();

    /**
     * Get all distinct floors in a building
     */
    @Query("SELECT DISTINCT r.floor FROM Room r " +
            "WHERE r.building = :building AND r.floor IS NOT NULL " +
            "ORDER BY r.floor")
    List<Integer> findDistinctFloorsByBuilding(@Param("building") String building);

    /**
     * Get paginated list with ordering
     */
    Page<Room> findAllByOrderByRoomCodeAsc(Pageable pageable);
    Page<Room> findAllByOrderByBuildingAscFloorAscRoomCodeAsc(Pageable pageable);
}