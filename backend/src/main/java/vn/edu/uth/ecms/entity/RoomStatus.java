package vn.edu.uth.ecms.entity;

/**
 * Room Status Enum
 */
public enum RoomStatus {
    /**
     * Phòng sẵn sàng sử dụng
     */
    AVAILABLE("Sẵn sàng", "Available for use"),

    /**
     * Phòng đang bảo trì
     */
    MAINTENANCE("Đang bảo trì", "Under maintenance"),

    /**
     * Phòng không khả dụng
     */
    UNAVAILABLE("Không khả dụng", "Unavailable");

    private final String vietnameseName;
    private final String description;

    RoomStatus(String vietnameseName, String description) {
        this.vietnameseName = vietnameseName;
        this.description = description;
    }

    public String getVietnameseName() {
        return vietnameseName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Check if room can be used for classes
     */
    public boolean canBeUsed() {
        return this == AVAILABLE;
    }
}