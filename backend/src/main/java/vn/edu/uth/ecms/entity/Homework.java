package vn.edu.uth.ecms.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import vn.edu.uth.ecms.entity.enums.HomeworkType;
import vn.edu.uth.ecms.entity.enums.SubmissionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Homework Entity
 * 
 * Represents homework/assignments created by teachers for a class
 * 
 * @author 
 * @since 
 */
@Entity
@Table(name = "homework", indexes = {
    @Index(name = "idx_homework_class", columnList = "class_id"),
    @Index(name = "idx_homework_type", columnList = "homework_type"),
    @Index(name = "idx_homework_deadline", columnList = "deadline"),
    @Index(name = "idx_homework_created", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Homework {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "homework_id")
    private Long homeworkId;
    
    
   
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false, 
                foreignKey = @ForeignKey(name = "fk_homework_class"))
    private ClassEntity classEntity;
    
  
    @OneToMany(mappedBy = "homework", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HomeworkSubmission> submissions = new ArrayList<>();
    
 
    @Column(name = "title", nullable = false, length = 200)
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;
    

    @Column(name = "description", columnDefinition = "TEXT")
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;
    
    
    @Enumerated(EnumType.STRING)
    @Column(name = "homework_type", nullable = false, length = 20)
    @NotNull(message = "Homework type is required")
    private HomeworkType homeworkType = HomeworkType.REGULAR;
    

    @Column(name = "max_score", nullable = false, precision = 4, scale = 2)
    @NotNull(message = "Max score is required")
    @DecimalMin(value = "0.0", message = "Max score must be at least 0")
    @DecimalMax(value = "10.0", message = "Max score must not exceed 10")
    private BigDecimal maxScore = new BigDecimal("10.00");
    
 
    @Column(name = "deadline", nullable = false)
    @NotNull(message = "Deadline is required")
    @Future(message = "Deadline must be in the future")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime deadline;
    
    
    @Column(name = "attachment_url", length = 500)
    @Size(max = 500, message = "Attachment URL must not exceed 500 characters")
    private String attachmentUrl;
    
   
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false, 
            columnDefinition = "DATETIME(6)")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    /**
     * When homework was last updated
     * Automatically updated on modification
     */
    @UpdateTimestamp
    @Column(name = "updated_at", columnDefinition = "DATETIME(6)")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
 
    /**
     * Check if homework is overdue
     * 
     * @return true if current time is past deadline
     */
    public boolean isOverdue() {
        return LocalDateTime.now().isAfter(deadline);
    }
    
    /**
     * Check if submission is allowed
     * Submission allowed if not overdue
     * 
     * @return true if students can still submit
     */
    public boolean canSubmit() {
        return !isOverdue();
    }
    
    /**
     * Get time remaining until deadline
     * 
     * @return Time remaining in human-readable format
     */
    public String getTimeRemaining() {
        if (isOverdue()) {
            return "Overdue";
        }
        
        LocalDateTime now = LocalDateTime.now();
        long minutes = java.time.Duration.between(now, deadline).toMinutes();
        
        if (minutes < 60) {
            return minutes + " minutes";
        } else if (minutes < 1440) { // 24 hours
            return (minutes / 60) + " hours";
        } else {
            return (minutes / 1440) + " days";
        }
    }
    
    /**
     * Get number of submissions
     * 
     * @return Total submissions count
     */
    public int getSubmissionCount() {
        return submissions != null ? submissions.size() : 0;
    }
    
    /**
     * Get number of graded submissions
     * 
     * @return Count of graded submissions
     */
    public int getGradedCount() {
        if (submissions == null) return 0;
        return (int) submissions.stream()
            .filter(s -> s.getStatus() == SubmissionStatus.GRADED)
            .count();
    }
    
    /**
     * Get number of ungraded submissions
     * 
     * @return Count of submissions needing grading
     */
    public int getUngradedCount() {
        if (submissions == null) return 0;
        return (int) submissions.stream()
            .filter(s -> s.getStatus() != SubmissionStatus.GRADED)
            .count();
    }
    
    /**
     * Get average score of all graded submissions
     * 
     * @return Average score or null if no graded submissions
     */
    public BigDecimal getAverageScore() {
        if (submissions == null || submissions.isEmpty()) return null;
        
        List<BigDecimal> scores = submissions.stream()
            .filter(s -> s.getStatus() == SubmissionStatus.GRADED)
            .filter(s -> s.getScore() != null)
            .map(HomeworkSubmission::getScore)
            .toList();
        
        if (scores.isEmpty()) return null;
        
        BigDecimal sum = scores.stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return sum.divide(new BigDecimal(scores.size()), 2, BigDecimal.ROUND_HALF_UP);
    }
    
    /**
     * Check if this is a regular homework
     * 
     * @return true if type is REGULAR
     */
    public boolean isRegular() {
        return homeworkType == HomeworkType.REGULAR;
    }
    
    /**
     * Check if this is a midterm
     * 
     * @return true if type is MIDTERM
     */
    public boolean isMidterm() {
        return homeworkType == HomeworkType.MIDTERM;
    }
    
    /**
     * Check if this is a final exam
     * 
     * @return true if type is FINAL
     */
    public boolean isFinal() {
        return homeworkType == HomeworkType.FINAL;
    }
    
    /**
     * Add a submission to this homework
     * 
     * @param submission The submission to add
     */
    public void addSubmission(HomeworkSubmission submission) {
        if (submissions == null) {
            submissions = new ArrayList<>();
        }
        submissions.add(submission);
        submission.setHomework(this);
    }
    
    /**
     * Remove a submission from this homework
     * 
     * @param submission The submission to remove
     */
    public void removeSubmission(HomeworkSubmission submission) {
        if (submissions != null) {
            submissions.remove(submission);
            submission.setHomework(null);
        }
    }
    

    @PrePersist
    protected void onCreate() {
        if (homeworkType == null) {
            homeworkType = HomeworkType.REGULAR;
        }
        if (maxScore == null) {
            maxScore = new BigDecimal("10.00");
        }
    }
    
    /**
     * Prevent deletion if has graded submissions
     */
    @PreRemove
    protected void onDelete() {
        long gradedCount = submissions.stream()
            .filter(s -> s.getStatus() == SubmissionStatus.GRADED)
            .count();
        
        if (gradedCount > 0) {
            throw new IllegalStateException(
                "Cannot delete homework with graded submissions. " +
                "Found " + gradedCount + " graded submissions."
            );
        }
    }
}