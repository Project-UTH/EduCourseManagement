package vn.edu.uth.ecms.entity;

/**
 * Session Category Enum
 *
 * Purpose: Categorize sessions by how they are scheduled
 *
 * Categories:
 * - FIXED: 10 buổi cố định (scheduled immediately when class created)
 * - EXTRA: Buổi trực tiếp dư (pending, scheduled when semester activated)
 * - ELEARNING: E-learning sessions (scheduled immediately, room=ONLINE)
 */
public enum SessionCategory {
    /**
     * Fixed sessions (up to 10)
     * - Scheduled immediately when class is created
     * - Same day/time/room every week
     * - isPending = false
     */
    FIXED("Buổi cố định", "Fixed weekly session"),

    /**
     * Extra in-person sessions (beyond 10)
     * - Created as pending (isPending = true)
     * - Scheduled when semester is activated
     * - System finds available slots automatically
     */
    EXTRA("Buổi bổ sung", "Extra session"),

    /**
     * E-learning sessions
     * - Scheduled immediately when class is created
     * - Uses ONLINE room
     * - isPending = false
     */
    ELEARNING("E-learning", "E-learning session");

    private final String vietnameseName;
    private final String description;

    SessionCategory(String vietnameseName, String description) {
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
     * Check if this category needs scheduling on activation
     */
    public boolean needsActivationScheduling() {
        return this == EXTRA;
    }

    /**
     * Check if this category is scheduled immediately on class creation
     */
    public boolean isScheduledImmediately() {
        return this == FIXED || this == ELEARNING;
    }
}