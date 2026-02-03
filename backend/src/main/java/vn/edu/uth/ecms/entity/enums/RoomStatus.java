package vn.edu.uth.ecms.entity.enums;

/**
 * Room Status Enum
 */
public enum RoomStatus {
   
    AVAILABLE("Sẵn sàng", "Available for use"),

 
    MAINTENANCE("Đang bảo trì", "Under maintenance"),

    
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

   
    public boolean canBeUsed() {
        return this == AVAILABLE;
    }
}