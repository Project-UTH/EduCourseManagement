package vn.edu.uth.ecms.entity;

/**
 * SubmissionStatus Enum
 * @author 
 * @since 
 */
public enum SubmissionStatus {
    
 
    SUBMITTED("Đã nộp", "Submitted on time", true),
    

    GRADED("Đã chấm", "Graded by teacher", true),
    

    LATE("Nộp trễ", "Submitted late (after deadline)", false);
    
    private final String displayName;
    private final String description;
    private final boolean onTime;
    
    /**
     * @param displayName Vietnamese display name
     * @param description English description
     * @param onTime Whether submission was on time
     */
    SubmissionStatus(String displayName, String description, boolean onTime) {
        this.displayName = displayName;
        this.description = description;
        this.onTime = onTime;
    }
    
    /**
     * Get Vietnamese display name
     * 
     * @return Display name in Vietnamese
     */
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * Get English description
     * 
     * @return Description in English
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * Check if submission was on time
     * 
     * @return true if submitted before deadline
     */
    public boolean isOnTime() {
        return onTime;
    }
    
    /**
     * Check if this is a submitted status
     * 
     * @return true if SUBMITTED
     */
    public boolean isSubmitted() {
        return this == SUBMITTED;
    }
    
    /**
     * Check if this is graded
     * 
     * @return true if GRADED
     */
    public boolean isGraded() {
        return this == GRADED;
    }
    
    /**
     * Check if this is late submission
     * 
     * @return true if LATE
     */
    public boolean isLate() {
        return this == LATE;
    }
    
    /**
     * @return true if not yet graded
     */
    public boolean needsGrading() {
        return this == SUBMITTED || this == LATE;
    }
    
    /**
     * @return true if student can still edit
     */
    public boolean canEdit() {
        return this != GRADED;
    }
    
    /**
     * Get CSS class for UI styling
     * 
     * @return CSS class name
     */
    public String getCssClass() {
        return switch (this) {
            case SUBMITTED -> "status-submitted";
            case GRADED -> "status-graded";
            case LATE -> "status-late";
        };
    }
    
    /**
     * Get color code for UI display
     * 
     * @return Hex color code
     */
    public String getColorCode() {
        return switch (this) {
            case SUBMITTED -> "#1890ff"; 
            case GRADED -> "#52c41a";    
            case LATE -> "#faad14";     
        };
    }
    
    /**
     * Get formatted display string with icon
     * 
     * @return Formatted string
     */
    public String getFullDisplay() {
        String icon = switch (this) {
            case SUBMITTED -> "✓";
            case GRADED -> "★";
            case LATE -> "⚠";
        };
        return String.format("%s %s", icon, this.displayName);
    }
    
    @Override
    public String toString() {
        return displayName;
    }
}