package vn.edu.uth.ecms.entity.enums;

import lombok.Getter;


@Getter
public enum TimeSlot {
    CA1("Ca 1", "06:45", "09:15"),
    CA2("Ca 2", "09:25", "11:55"),
    CA3("Ca 3", "12:10", "14:40"),
    CA4("Ca 4", "14:50", "17:20"),
    CA5("Ca 5", "17:30", "20:00");

    private final String displayName;
    private final String startTime;
    private final String endTime;

    TimeSlot(String displayName, String startTime, String endTime) {
        this.displayName = displayName;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    /**
     * Get formatted time range
     * Example: "06:45 - 09:15"
     */
    public String getTimeRange() {
        return startTime + " - " + endTime;
    }

    /**
     * Get full display string
     * Example: "Ca 1 (06:45 - 09:15)"
     */
    public String getFullDisplay() {
        return displayName + " (" + getTimeRange() + ")";
    }
}