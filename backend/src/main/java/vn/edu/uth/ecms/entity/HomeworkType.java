package vn.edu.uth.ecms.entity;

/**
 * HomeworkType Enum
 * 
 * Defines the type of homework/assignment
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
public enum HomeworkType {
    
    /**
     * Regular homework - Bài tập thường xuyên
     * Multiple assignments throughout the semester
     * Weight: 20% of total grade
     */
    REGULAR("Thường xuyên", "Regular homework/assignments", 0.20),
    
    /**
     * Midterm exam/assignment - Bài kiểm tra giữa kỳ
     * Usually one per semester
     * Weight: 30% of total grade
     */
    MIDTERM("Giữa kỳ", "Midterm exam/assignment", 0.30),
    
    /**
     * Final exam/assignment - Bài thi cuối kỳ
     * End of semester assessment
     * Weight: 50% of total grade
     */
    FINAL("Cuối kỳ", "Final exam/assignment", 0.50);
    
    private final String displayName;
    private final String description;
    private final double weight;
    
    /**
     * Constructor
     * 
     * @param displayName Vietnamese display name
     * @param description English description
     * @param weight Weight in grade calculation (0.0 - 1.0)
     */
    HomeworkType(String displayName, String description, double weight) {
        this.displayName = displayName;
        this.description = description;
        this.weight = weight;
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
     * Get weight for grade calculation
     * 
     * @return Weight as decimal (0.0 - 1.0)
     */
    public double getWeight() {
        return weight;
    }
    
    /**
     * Check if this is a regular homework
     * 
     * @return true if REGULAR type
     */
    public boolean isRegular() {
        return this == REGULAR;
    }
    
    /**
     * Check if this is a midterm
     * 
     * @return true if MIDTERM type
     */
    public boolean isMidterm() {
        return this == MIDTERM;
    }
    
    /**
     * Check if this is a final exam
     * 
     * @return true if FINAL type
     */
    public boolean isFinal() {
        return this == FINAL;
    }
    
    /**
     * Check if this type counts toward final grade
     * All types count toward grade
     * 
     * @return always true
     */
    public boolean countsTowardGrade() {
        return true;
    }
    
    /**
     * Get formatted display string
     * Format: "REGULAR - Thường xuyên (20%)"
     * 
     * @return Formatted string
     */
    public String getFullDisplay() {
        return String.format("%s - %s (%.0f%%)", 
            this.name(), 
            this.displayName, 
            this.weight * 100);
    }
    
    @Override
    public String toString() {
        return displayName;
    }
}