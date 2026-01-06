package vn.edu.uth.ecms.entity;

/**
 * SubmissionStatus Enum
 * 
 * Defines the status of a homework submission
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
public enum SubmissionStatus {
    
    /**
     * Submitted on time - Đã nộp đúng hạn
     * Student submitted before or at deadline
     */
    SUBMITTED("Đã nộp", "Submitted on time", true),
    
    /**
     * Graded by teacher - Đã chấm điểm
     * Teacher has reviewed and assigned a score
     */
    GRADED("Đã chấm", "Graded by teacher", true),
    
    /**
     * Submitted late - Nộp trễ hạn
     * Student submitted after deadline
     * May result in score penalty
     */
    LATE("Nộp trễ", "Submitted late (after deadline)", false);
    
    private final String displayName;
    private final String description;
    private final boolean onTime;
    
    /**
     * Constructor
     * 
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
     * Check if submission needs grading
     * SUBMITTED and LATE need grading
     * 
     * @return true if not yet graded
     */
    public boolean needsGrading() {
        return this == SUBMITTED || this == LATE;
    }
    
    /**
     * Check if submission can be edited by student
     * Only ungraded submissions can be edited
     * 
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
            case SUBMITTED -> "#1890ff"; // Blue
            case GRADED -> "#52c41a";    // Green
            case LATE -> "#faad14";      // Orange/Yellow
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