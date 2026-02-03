package vn.edu.uth.ecms.entity;

/**
 * Room Type Enum 
 */
public enum RoomType {
    /**
     * Giảng đường lớn (Lecture Hall)
     * Capacity: 100-300
     */
    LECTURE_HALL,

    /**
     * Phòng thực hành (Laboratory)
     * Capacity: 20-40
     */
    LAB,

    /**
     * Phòng máy tính (Computer Lab)
     * Capacity: 30-50
     */
    COMPUTER_LAB,

    /**
     * Phòng seminar nhỏ (Seminar Room)
     * Capacity: 15-30
     */
    SEMINAR_ROOM,

    /**
     * Trực tuyến (Online/Virtual)
     * Capacity: Unlimited
     */
    ONLINE;

    /**
     * Get Vietnamese display name
     */
    public String getDisplayName() {
        return switch (this) {
            case LECTURE_HALL -> "Giảng đường";
            case LAB -> "Phòng thực hành";
            case COMPUTER_LAB -> "Phòng máy tính";
            case SEMINAR_ROOM -> "Phòng seminar";
            case ONLINE -> "Trực tuyến";
        };
    }

    /**
     * Check if room type is physical (not online)
     */
    public boolean isPhysical() {
        return this != ONLINE;
    }

    /**
     * Check if room type is online
     */
    public boolean isOnline() {
        return this == ONLINE;
    }
}