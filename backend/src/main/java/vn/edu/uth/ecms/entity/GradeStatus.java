package vn.edu.uth.ecms.entity;

/**
 * GradeStatus Enum
 * 
 * Defines the status of a student's grade in a class
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
public enum GradeStatus {
    
    /**
     * Passed - Đạt
     * Student achieved passing grade (total_score >= 4.0)
     */
    PASSED("Đạt", "Passed (score >= 4.0)", true),
    
    /**
     * Failed - Không đạt
     * Student did not achieve passing grade (total_score < 4.0)
     */
    FAILED("Không đạt", "Failed (score < 4.0)", false),
    
    /**
     * In Progress - Đang học
     * Grading not yet complete
     * Missing one or more component scores
     */
    IN_PROGRESS("Đang học", "In progress (grading incomplete)", false);
    
    private final String displayName;
    private final String description;
    private final boolean passed;
    
    /**
     * Minimum passing score
     */
    public static final double MIN_PASSING_SCORE = 4.0;
    
    /**
     * Constructor
     * 
     * @param displayName Vietnamese display name
     * @param description English description
     * @param passed Whether this status means passing
     */
    GradeStatus(String displayName, String description, boolean passed) {
        this.displayName = displayName;
        this.description = description;
        this.passed = passed;
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
     * Check if this status means student passed
     * 
     * @return true if PASSED
     */
    public boolean isPassed() {
        return passed;
    }
    
    /**
     * Check if this is passed status
     * 
     * @return true if PASSED
     */
    public boolean isPassedStatus() {
        return this == PASSED;
    }
    
    /**
     * Check if this is failed status
     * 
     * @return true if FAILED
     */
    public boolean isFailed() {
        return this == FAILED;
    }
    
    /**
     * Check if grading is in progress
     * 
     * @return true if IN_PROGRESS
     */
    public boolean isInProgress() {
        return this == IN_PROGRESS;
    }
    
    /**
     * Check if grade is finalized
     * 
     * @return true if PASSED or FAILED (not IN_PROGRESS)
     */
    public boolean isFinalized() {
        return this == PASSED || this == FAILED;
    }
    
    /**
     * Check if student can retake
     * Only failed students need to retake
     * 
     * @return true if FAILED
     */
    public boolean canRetake() {
        return this == FAILED;
    }
    
    /**
     * Get status from score
     * 
     * @param score Total score (0.0 - 10.0)
     * @return Appropriate GradeStatus
     */
    public static GradeStatus fromScore(Double score) {
        if (score == null) {
            return IN_PROGRESS;
        }
        
        if (score >= MIN_PASSING_SCORE) {
            return PASSED;
        } else {
            return FAILED;
        }
    }
    
    /**
     * Get CSS class for UI styling
     * 
     * @return CSS class name
     */
    public String getCssClass() {
        return switch (this) {
            case PASSED -> "grade-passed";
            case FAILED -> "grade-failed";
            case IN_PROGRESS -> "grade-in-progress";
        };
    }
    
    /**
     * Get color code for UI display
     * 
     * @return Hex color code
     */
    public String getColorCode() {
        return switch (this) {
            case PASSED -> "#52c41a";    // Green
            case FAILED -> "#f5222d";    // Red
            case IN_PROGRESS -> "#1890ff"; // Blue
        };
    }
    
    /**
     * Get icon for UI display
     * 
     * @return Unicode icon character
     */
    public String getIcon() {
        return switch (this) {
            case PASSED -> "✓";
            case FAILED -> "✗";
            case IN_PROGRESS -> "⋯";
        };
    }
    
    /**
     * Get formatted display string with icon
     * 
     * @return Formatted string
     */
    public String getFullDisplay() {
        return String.format("%s %s", getIcon(), this.displayName);
    }
    
    /**
     * Get grade letter range for display
     * 
     * @return Letter grade range description
     */
    public String getLetterGradeRange() {
        return switch (this) {
            case PASSED -> "D to A (4.0 - 10.0)";
            case FAILED -> "F (< 4.0)";
            case IN_PROGRESS -> "Not yet calculated";
        };
    }
    
    @Override
    public String toString() {
        return displayName;
    }
}