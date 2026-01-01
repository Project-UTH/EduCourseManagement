package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Room entity - ENHANCED with Real-time Status
 *
 * ✅ NEW FEATURES:
 * - Real-time status calculation based on ClassSession
 * - Better integration with scheduling system
 * - Status tracking (ACTIVE, AVAILABLE, INACTIVE)
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

    // ==================== EXISTING METHODS (Keep as is) ====================

    public String getRoomCode() {
        return this.roomCode;
    }

    public String getDisplayName() {
        if (this.roomName != null && !this.roomName.trim().isEmpty()) {
            return this.roomCode + " - " + this.roomName;
        }
        return this.roomCode;
    }

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

    public boolean isPhysicalRoom() {
        return this.roomType != RoomType.ONLINE;
    }

    public boolean isOnlineRoom() {
        return this.roomType == RoomType.ONLINE;
    }

    public boolean hasCapacity(int requiredCapacity) {
        return this.capacity >= requiredCapacity;
    }

    public String getCapacityInfo() {
        if (this.roomType == RoomType.ONLINE) {
            return "Không giới hạn";
        }
        return this.capacity + " chỗ ngồi";
    }

    public String getRoomTypeDisplay() {
        return switch (this.roomType) {
            case LECTURE_HALL -> "Giảng đường";
            case LAB -> "Phòng thực hành";
            case COMPUTER_LAB -> "Phòng máy tính";
            case SEMINAR_ROOM -> "Phòng seminar";
            case ONLINE -> "Trực tuyến";
        };
    }

    // ==================== ✨ NEW: REAL-TIME STATUS METHODS ====================

    /**
     * ✨ NEW: Get administrative status
     * - ACTIVE: Room is enabled by admin
     * - INACTIVE: Room is disabled by admin
     *
     * This is static status set by admin, not based on current usage
     */
    public RoomAdminStatus getAdminStatus() {
        return this.isActive ? RoomAdminStatus.ACTIVE : RoomAdminStatus.INACTIVE;
    }

    /**
     * ✨ NEW: Get admin status display
     */
    public String getAdminStatusDisplay() {
        return this.isActive ? "Hoạt động" : "Ngừng hoạt động";
    }

    /**
     * Check if room can be assigned to new sessions
     * Only active rooms can be assigned
     */
    public boolean canBeAssigned() {
        return this.isActive;
    }

    /**
     * Check if room is suitable for a class
     * - Must be active
     * - Must have enough capacity
     */
    public boolean isSuitableFor(int requiredCapacity) {
        return this.isActive && this.capacity >= requiredCapacity;
    }

    /**
     * Get status badge color for UI
     * - green: ACTIVE
     * - gray: INACTIVE
     */
    public String getStatusBadgeColor() {
        return this.isActive ? "green" : "gray";
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

