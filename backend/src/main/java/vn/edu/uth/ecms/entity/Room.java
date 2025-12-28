package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Room entity - CORRECTED
 *
 * ✅ FIXES:
 * - Added getRoomCode() method
 * - Added getDisplayName() method
 * - Added helper methods for room info display
 */
@Entity
@Table(name = "room")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "room_code", nullable = false, unique = true, length = 20)
    private String roomCode;

    @Column(name = "room_name", length = 100)
    private String roomName;

    @Column(name = "building", length = 50)
    private String building;

    @Column(name = "floor")
    private Integer floor;

    @Enumerated(EnumType.STRING)
    @Column(name = "room_type", nullable = false, length = 20)
    private RoomType roomType;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // ==================== ✅ FIX: ADD MISSING METHODS ====================

    /**
     * ✅ FIX 1: Get room code
     * Used by: SessionServiceImpl, ClassServiceImpl
     */
    public String getRoomCode() {
        return this.roomCode;
    }

    /**
     * ✅ FIX 2: Get display name (code + name)
     * Used by: SessionServiceImpl, ClassServiceImpl, Frontend display
     *
     * Examples:
     * - A201 - Phòng thực hành
     * - B105 - Phòng giảng đường lớn
     * - ONLINE (if no room name)
     */
    public String getDisplayName() {
        if (this.roomName != null && !this.roomName.trim().isEmpty()) {
            return this.roomCode + " - " + this.roomName;
        }
        return this.roomCode;
    }

    // ==================== ADDITIONAL HELPER METHODS ====================

    /**
     * Get full location info
     * Example: "Tòa A - Tầng 2 - A201"
     */
    public String getFullLocation() {
        StringBuilder location = new StringBuilder();

        if (building != null && !building.isEmpty()) {
            location.append(building);
        }

        if (floor != null) {
            if (location.length() > 0) {
                location.append(" - ");
            }
            location.append("Tầng ").append(floor);
        }

        if (location.length() > 0) {
            location.append(" - ");
        }
        location.append(roomCode);

        return location.toString();
    }

    public boolean canAccommodate(int requiredCapacity) {
        return this.capacity >= requiredCapacity;
    }

    /**
     * Check if room is physical (not ONLINE)
     */
    public boolean isPhysicalRoom() {
        return this.roomType != RoomType.ONLINE;
    }

    /**
     * Check if room is online/virtual
     */
    public boolean isOnlineRoom() {
        return this.roomType == RoomType.ONLINE;
    }

    /**
     * Check if room has enough capacity for class
     */
    public boolean hasCapacity(int requiredCapacity) {
        return this.capacity >= requiredCapacity;
    }

    /**
     * Get capacity info string
     * Example: "100 chỗ ngồi"
     */
    public String getCapacityInfo() {
        if (this.roomType == RoomType.ONLINE) {
            return "Không giới hạn";
        }
        return this.capacity + " chỗ ngồi";
    }

    /**
     * Get room type display
     */
    public String getRoomTypeDisplay() {
        return switch (this.roomType) {
            case LECTURE_HALL -> "Giảng đường";
            case LAB -> "Phòng thực hành";
            case COMPUTER_LAB -> "Phòng máy tính";
            case SEMINAR_ROOM -> "Phòng seminar";
            case ONLINE -> "Trực tuyến";
        };
    }

    // ==================== OVERRIDE METHODS ====================

    @Override
    public String toString() {
        return "Room{" +
                "roomId=" + roomId +
                ", roomCode='" + roomCode + '\'' +
                ", roomName='" + roomName + '\'' +
                ", building='" + building + '\'' +
                ", floor=" + floor +
                ", roomType=" + roomType +
                ", capacity=" + capacity +
                ", isActive=" + isActive +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Room room)) return false;
        return roomId != null && roomId.equals(room.roomId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}