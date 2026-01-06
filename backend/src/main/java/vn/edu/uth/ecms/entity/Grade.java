package vn.edu.uth.ecms.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

/**
 * Grade Entity
 * 
 * Represents final grades for a student in a class
 * Calculated from: Regular (20%), Midterm (30%), Final (50%)
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@Entity
@Table(name = "grade",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_class_grade",
                         columnNames = {"student_id", "class_id"})
    },
    indexes = {
        @Index(name = "idx_grade_student", columnList = "student_id"),
        @Index(name = "idx_grade_class", columnList = "class_id"),
        @Index(name = "idx_grade_status", columnList = "status"),
        @Index(name = "idx_grade_total_score", columnList = "total_score"),
        @Index(name = "idx_grade_letter", columnList = "letter_grade")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Grade {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "grade_id")
    private Long gradeId;
    
    // ========================================
    // RELATIONSHIPS
    // ========================================
    
    /**
     * The student this grade belongs to
     * Many grades belong to one student
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_grade_student"))
    @NotNull(message = "Student is required")
    private Student student;
    
    /**
     * The class this grade is for
     * Many grades belong to one class
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_grade_class"))
    @NotNull(message = "Class is required")
    private ClassEntity classEntity;
    
    // ========================================
    // COMPONENT SCORES
    // ========================================
    
    /**
     * Regular score (average of all REGULAR homework)
     * Weight: 20% of total grade
     * Điểm thường xuyên
     */
    @Column(name = "regular_score", precision = 4, scale = 2)
    @DecimalMin(value = "0.0", message = "Regular score must be at least 0")
    @DecimalMax(value = "10.0", message = "Regular score must not exceed 10")
    private BigDecimal regularScore;
    
    /**
     * Midterm score (from MIDTERM homework)
     * Weight: 30% of total grade
     * Điểm giữa kỳ
     */
    @Column(name = "midterm_score", precision = 4, scale = 2)
    @DecimalMin(value = "0.0", message = "Midterm score must be at least 0")
    @DecimalMax(value = "10.0", message = "Midterm score must not exceed 10")
    private BigDecimal midtermScore;
    
    /**
     * Final score (from FINAL homework)
     * Weight: 50% of total grade
     * Điểm cuối kỳ
     */
    @Column(name = "final_score", precision = 4, scale = 2)
    @DecimalMin(value = "0.0", message = "Final score must be at least 0")
    @DecimalMax(value = "10.0", message = "Final score must not exceed 10")
    private BigDecimal finalScore;
    
    // ========================================
    // CALCULATED TOTAL SCORE
    // ========================================
    
    /**
     * Total score (calculated)
     * Formula: regular*0.2 + midterm*0.3 + final*0.5
     * Auto-calculated by trigger or service
     */
    @Column(name = "total_score", precision = 4, scale = 2)
    @DecimalMin(value = "0.0", message = "Total score must be at least 0")
    @DecimalMax(value = "10.0", message = "Total score must not exceed 10")
    private BigDecimal totalScore;
    
    /**
     * Letter grade (A, B+, B, C+, C, D+, D, F)
     * Auto-calculated based on total score
     */
    @Column(name = "letter_grade", length = 2)
    @Size(max = 2, message = "Letter grade must not exceed 2 characters")
    private String letterGrade;
    
    // ========================================
    // STATUS
    // ========================================
    
    /**
     * Grade status
     * PASSED (>=4.0), FAILED (<4.0), IN_PROGRESS (incomplete)
     * Auto-updated by trigger or service
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @NotNull(message = "Status is required")
    private GradeStatus status = GradeStatus.IN_PROGRESS;
    
    // ========================================
    // ADDITIONAL INFO
    // ========================================
    
    /**
     * Attendance rate percentage
     * Optional - can be calculated from student_schedule
     */
    @Column(name = "attendance_rate", precision = 5, scale = 2)
    @DecimalMin(value = "0.0", message = "Attendance rate must be at least 0")
    @DecimalMax(value = "100.0", message = "Attendance rate must not exceed 100")
    private BigDecimal attendanceRate;
    
    /**
     * Overall teacher comment
     * Optional feedback about student's performance
     */
    @Column(name = "teacher_comment", columnDefinition = "TEXT")
    @Size(max = 5000, message = "Teacher comment must not exceed 5000 characters")
    private String teacherComment;
    
    // ========================================
    // TIMESTAMPS
    // ========================================
    
    /**
     * When record was created
     * Automatically set on creation
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false,
            columnDefinition = "DATETIME(6)")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    /**
     * When record was last updated
     * Automatically updated on modification
     */
    @UpdateTimestamp
    @Column(name = "updated_at", columnDefinition = "DATETIME(6)")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // ========================================
    // CONSTANTS
    // ========================================
    
    /**
     * Component weights for grade calculation
     */
    public static final BigDecimal REGULAR_WEIGHT = new BigDecimal("0.20");
    public static final BigDecimal MIDTERM_WEIGHT = new BigDecimal("0.30");
    public static final BigDecimal FINAL_WEIGHT = new BigDecimal("0.50");
    
    /**
     * Minimum passing score
     */
    public static final BigDecimal MIN_PASSING_SCORE = new BigDecimal("4.0");
    
    // ========================================
    // BUSINESS METHODS
    // ========================================
    
    /**
     * Calculate total score from component scores
     * Formula: regular*0.2 + midterm*0.3 + final*0.5
     * 
     * @return Calculated total score or null if any component is missing
     */
    public BigDecimal calculateTotalScore() {
        if (regularScore == null || midtermScore == null || finalScore == null) {
            return null;
        }
        
        BigDecimal total = regularScore.multiply(REGULAR_WEIGHT)
            .add(midtermScore.multiply(MIDTERM_WEIGHT))
            .add(finalScore.multiply(FINAL_WEIGHT));
        
        return total.setScale(2, RoundingMode.HALF_UP);
    }
    
    /**
     * Calculate letter grade from total score
     * A: 8.5-10, B+: 8.0-8.4, B: 7.0-7.9, C+: 6.5-6.9,
     * C: 5.5-6.4, D+: 5.0-5.4, D: 4.0-4.9, F: <4.0
     * 
     * @param score Total score
     * @return Letter grade
     */
    public static String calculateLetterGrade(BigDecimal score) {
        if (score == null) return null;
        
        double scoreValue = score.doubleValue();
        
        if (scoreValue >= 8.5) return "A";
        if (scoreValue >= 8.0) return "B+";
        if (scoreValue >= 7.0) return "B";
        if (scoreValue >= 6.5) return "C+";
        if (scoreValue >= 5.5) return "C";
        if (scoreValue >= 5.0) return "D+";
        if (scoreValue >= 4.0) return "D";
        return "F";
    }
    
    /**
     * Calculate and update all derived fields
     * Updates: totalScore, letterGrade, status
     */
    public void recalculate() {
        // Calculate total score
        this.totalScore = calculateTotalScore();
        
        // Calculate letter grade
        if (this.totalScore != null) {
            this.letterGrade = calculateLetterGrade(this.totalScore);
            
            // Update status
            if (this.totalScore.compareTo(MIN_PASSING_SCORE) >= 0) {
                this.status = GradeStatus.PASSED;
            } else {
                this.status = GradeStatus.FAILED;
            }
        } else {
            this.letterGrade = null;
            this.status = GradeStatus.IN_PROGRESS;
        }
    }
    
    /**
     * Check if all component scores are present
     * 
     * @return true if all scores are set
     */
    public boolean isComplete() {
        return regularScore != null && midtermScore != null && finalScore != null;
    }
    
    /**
     * Check if student passed
     * 
     * @return true if total score >= 4.0
     */
    public boolean isPassed() {
        return status == GradeStatus.PASSED;
    }
    
    /**
     * Check if student failed
     * 
     * @return true if total score < 4.0
     */
    public boolean isFailed() {
        return status == GradeStatus.FAILED;
    }
    
    /**
     * Check if grading is in progress
     * 
     * @return true if any component score is missing
     */
    public boolean isInProgress() {
        return status == GradeStatus.IN_PROGRESS;
    }
    
    /**
     * Get grade point (for GPA calculation)
     * 
     * @return Grade point based on letter grade
     */
    public BigDecimal getGradePoint() {
        if (letterGrade == null) return null;
        
        return switch (letterGrade) {
            case "A" -> new BigDecimal("4.0");
            case "B+" -> new BigDecimal("3.5");
            case "B" -> new BigDecimal("3.0");
            case "C+" -> new BigDecimal("2.5");
            case "C" -> new BigDecimal("2.0");
            case "D+" -> new BigDecimal("1.5");
            case "D" -> new BigDecimal("1.0");
            case "F" -> new BigDecimal("0.0");
            default -> null;
        };
    }
    
    /**
     * Get score breakdown as string
     * 
     * @return Formatted string with all component scores
     */
    public String getScoreBreakdown() {
        return String.format(
            "Regular: %s (20%%), Midterm: %s (30%%), Final: %s (50%%), Total: %s",
            regularScore != null ? regularScore : "N/A",
            midtermScore != null ? midtermScore : "N/A",
            finalScore != null ? finalScore : "N/A",
            totalScore != null ? totalScore : "N/A"
        );
    }
    
    /**
     * Get missing components
     * 
     * @return List of missing score components
     */
    public String getMissingComponents() {
        if (isComplete()) return "None";
        
        StringBuilder missing = new StringBuilder();
        if (regularScore == null) missing.append("Regular, ");
        if (midtermScore == null) missing.append("Midterm, ");
        if (finalScore == null) missing.append("Final, ");
        
        return missing.substring(0, missing.length() - 2);
    }
    
    /**
     * Set regular score and recalculate
     * 
     * @param score Regular score
     */
    public void setRegularScoreAndRecalculate(BigDecimal score) {
        this.regularScore = score;
        recalculate();
    }
    
    /**
     * Set midterm score and recalculate
     * 
     * @param score Midterm score
     */
    public void setMidtermScoreAndRecalculate(BigDecimal score) {
        this.midtermScore = score;
        recalculate();
    }
    
    /**
     * Set final score and recalculate
     * 
     * @param score Final score
     */
    public void setFinalScoreAndRecalculate(BigDecimal score) {
        this.finalScore = score;
        recalculate();
    }
    
    /**
     * Set all component scores and recalculate
     * 
     * @param regular Regular score
     * @param midterm Midterm score
     * @param finalExam Final score
     */
    public void setAllScoresAndRecalculate(BigDecimal regular, BigDecimal midterm, BigDecimal finalExam) {
        this.regularScore = regular;
        this.midtermScore = midterm;
        this.finalScore = finalExam;
        recalculate();
    }
    
    // ========================================
    // LIFECYCLE CALLBACKS
    // ========================================
    
    /**
     * Before persist - set default status
     */
    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = GradeStatus.IN_PROGRESS;
        }
        // Calculate on creation if scores are present
        recalculate();
    }
    
    /**
     * Before update - recalculate derived fields
     */
    @PreUpdate
    protected void onUpdate() {
        // Auto-recalculate when any score changes
        recalculate();
    }
}