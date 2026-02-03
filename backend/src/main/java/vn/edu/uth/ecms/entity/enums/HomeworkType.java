package vn.edu.uth.ecms.entity;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * HomeworkType Enum
 * 
 * Defines the type of homework/assignment
 * @author 
 * @since 
 */
public enum HomeworkType {
    

    REGULAR("Thường xuyên", "Regular homework/assignments", 0.20),
    
   
    MIDTERM("Giữa kỳ", "Midterm exam/assignment", 0.30),
    
  
    FINAL("Cuối kỳ", "Final exam/assignment", 0.50);
    
    private final String displayName;
    private final String description;
    private final double weight;
    
    /**
     * Constructor
     * 
     * @param displayName 
     * @param description 
     * @param weight 
     */
    HomeworkType(String displayName, String description, double weight) {
        this.displayName = displayName;
        this.description = description;
        this.weight = weight;
    }
    
    /**
     * @return Display name in Vietnamese
     */
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * @return Description in English
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * @return 
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
    
    /**
     * @return 
     */
    @JsonValue
    public String toJson() {
        return this.name();
    }
    
    /**
     * @return 
     */
    @Override
    public String toString() {
        return displayName;
    }
}