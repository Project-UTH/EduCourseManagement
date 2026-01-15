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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * HomeworkSubmission Entity
 * 
 * Represents a student's submission for a homework assignment
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@Entity
@Table(name = "homework_submission",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_homework_student", 
                         columnNames = {"homework_id", "student_id"})
    },
    indexes = {
        @Index(name = "idx_submission_homework", columnList = "homework_id"),
        @Index(name = "idx_submission_student", columnList = "student_id"),
        @Index(name = "idx_submission_status", columnList = "status"),
        @Index(name = "idx_submission_date", columnList = "submission_date"),
        @Index(name = "idx_submission_graded", columnList = "graded_date")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HomeworkSubmission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    private Long submissionId;
    
    // ========================================
    // RELATIONSHIPS
    // ========================================
    
    /**
     * The homework this submission is for
     * Many submissions belong to one homework
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homework_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_submission_homework"))
    @NotNull(message = "Homework is required")
    private Homework homework;
    
    /**
     * The student who submitted
     * Many submissions belong to one student
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_submission_student"))
    @NotNull(message = "Student is required")
    private Student student;
    
    // ========================================
    // SUBMISSION INFO
    // ========================================
    
    /**
     * URL to submitted file
     * Student can upload their homework file
     */
   @Deprecated
@Column(name = "submission_file_url", length = 500)
@Size(max = 500, message = "Submission file URL must not exceed 500 characters")
private String submissionFileUrl;
    @Deprecated
@Column(name = "submission_file_name", length = 255)
private String submissionFileName;
    /**
     * When student submitted
     * Automatically set when created
     */
    @CreationTimestamp
    @Column(name = "submission_date", nullable = false, updatable = false,
            columnDefinition = "DATETIME(6)")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime submissionDate;
    
    /**
     * Optional text submission
     * Student can submit text instead of/in addition to file
     */
    @Column(name = "submission_text", columnDefinition = "TEXT")
    @Size(max = 10000, message = "Submission text must not exceed 10000 characters")
    private String submissionText;
    
    // ========================================
    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
private List<SubmissionFile> submissionFiles = new ArrayList<>();
    // GRADING INFO (filled by teacher)
    // ========================================
    
    /**
     * Score given by teacher
     * Range: 0.00 - homework.maxScore
     */
    @Column(name = "score", precision = 4, scale = 2)
    @DecimalMin(value = "0.0", message = "Score must be at least 0")
    @DecimalMax(value = "10.0", message = "Score must not exceed 10")
    private BigDecimal score;
    
    /**
     * Teacher's feedback/comments
     * Optional comments about the submission
     */
    @Column(name = "teacher_feedback", columnDefinition = "TEXT")
    @Size(max = 5000, message = "Teacher feedback must not exceed 5000 characters")
    private String teacherFeedback;
    
    /**
     * When teacher graded the submission
     * Set when teacher assigns a score
     */
    @Column(name = "graded_date", columnDefinition = "DATETIME(6)")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime gradedDate;
    
    // ========================================
    // STATUS
    // ========================================
    
    /**
     * Submission status
     * SUBMITTED (on time), GRADED, LATE (after deadline)
     * Auto-set by trigger based on deadline
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @NotNull(message = "Status is required")
    private SubmissionStatus status = SubmissionStatus.SUBMITTED;
    
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
    // BUSINESS METHODS
    // ========================================
    
    /**
     * Check if submission was late
     * 
     * @return true if submitted after deadline
     */
    public boolean isLate() {
        return status == SubmissionStatus.LATE;
    }
    
    /**
     * Check if submission has been graded
     * 
     * @return true if status is GRADED
     */
    public boolean isGraded() {
        return status == SubmissionStatus.GRADED;
    }
    
    /**
     * Check if submission needs grading
     * 
     * @return true if not yet graded
     */
    public boolean needsGrading() {
        return status != SubmissionStatus.GRADED;
    }
    
    /**
     * Check if student can edit this submission
     * Can only edit if not graded
     * 
     * @return true if student can still edit
     */
    public boolean canEdit() {
        return status != SubmissionStatus.GRADED;
    }
    
    /**
     * Grade this submission
     * Sets score, feedback, graded date, and status
     * 
     * @param score Score to assign
     * @param feedback Teacher's feedback
     */
    public void grade(BigDecimal score, String feedback) {
        if (score == null) {
            throw new IllegalArgumentException("Score cannot be null");
        }
        
        // Validate score is within range
        if (homework != null) {
            BigDecimal maxScore = homework.getMaxScore();
            if (score.compareTo(BigDecimal.ZERO) < 0 || 
                score.compareTo(maxScore) > 0) {
                throw new IllegalArgumentException(
                    "Score must be between 0 and " + maxScore
                );
            }
        }
        
        this.score = score;
        this.teacherFeedback = feedback;
        this.gradedDate = LocalDateTime.now();
        this.status = SubmissionStatus.GRADED;
    }
    
    /**
     * Ungrade this submission
     * Removes score, feedback, graded date
     * Resets status to SUBMITTED or LATE
     */
    public void ungrade() {
        this.score = null;
        this.teacherFeedback = null;
        this.gradedDate = null;
        
        // Reset to appropriate status
        if (homework != null && homework.getDeadline() != null) {
            if (submissionDate.isAfter(homework.getDeadline())) {
                this.status = SubmissionStatus.LATE;
            } else {
                this.status = SubmissionStatus.SUBMITTED;
            }
        } else {
            this.status = SubmissionStatus.SUBMITTED;
        }
    }
    
    /**
     * Get score percentage
     * 
     * @return Score as percentage (0-100) or null if not graded
     */
    public BigDecimal getScorePercentage() {
        if (score == null || homework == null || homework.getMaxScore() == null) {
            return null;
        }
        
        return score.divide(homework.getMaxScore(), 4, BigDecimal.ROUND_HALF_UP)
                   .multiply(new BigDecimal("100"));
    }
    
    /**
     * Get time between submission and deadline
     * 
     * @return Duration in human-readable format
     */
    public String getSubmissionTiming() {
        if (homework == null || homework.getDeadline() == null) {
            return "Unknown";
        }
        
        LocalDateTime deadline = homework.getDeadline();
        long minutes = java.time.Duration.between(submissionDate, deadline).toMinutes();
        
        if (minutes > 0) {
            // Submitted early
            if (minutes < 60) {
                return minutes + " minutes early";
            } else if (minutes < 1440) {
                return (minutes / 60) + " hours early";
            } else {
                return (minutes / 1440) + " days early";
            }
        } else {
            // Submitted late
            minutes = Math.abs(minutes);
            if (minutes < 60) {
                return minutes + " minutes late";
            } else if (minutes < 1440) {
                return (minutes / 60) + " hours late";
            } else {
                return (minutes / 1440) + " days late";
            }
        }
    }
    
    /**
     * Check if submission has file attachment
     * 
     * @return true if file URL is not empty
     */
    public boolean hasFile() {
        return submissionFileUrl != null && !submissionFileUrl.trim().isEmpty();
    }
    
    /**
     * Check if submission has text content
     * 
     * @return true if text is not empty
     */
    public boolean hasText() {
        return submissionText != null && !submissionText.trim().isEmpty();
    }
    
    /**
     * Check if submission has any content
     * 
     * @return true if has file or text
     */
    public boolean hasContent() {
        return hasFile() || hasText();
    }
    
    // ========================================
    // LIFECYCLE CALLBACKS
    // ========================================
    
    /**
     * Before persist - set status based on deadline
     * This mimics the trigger behavior
     */
    @PrePersist
    protected void onCreate() {
        // Set submission date if not already set
        if (submissionDate == null) {
            submissionDate = LocalDateTime.now();
        }
        
        // Determine status based on deadline
        if (homework != null && homework.getDeadline() != null) {
            if (submissionDate.isAfter(homework.getDeadline())) {
                status = SubmissionStatus.LATE;
            } else {
                status = SubmissionStatus.SUBMITTED;
            }
        } else {
            status = SubmissionStatus.SUBMITTED;
        }
    }
    
    /**
     * Before update - validate grading data consistency
     */
    @PreUpdate
    protected void onUpdate() {
        // If score is set, ensure graded date is set
        if (score != null && gradedDate == null) {
            gradedDate = LocalDateTime.now();
        }
        
        // If score is set, status should be GRADED
        if (score != null && status != SubmissionStatus.GRADED) {
            status = SubmissionStatus.GRADED;
        }
    }
    public void addFile(SubmissionFile file) {
        if (submissionFiles == null) {
            submissionFiles = new ArrayList<>();
        }
        submissionFiles.add(file);
        file.setSubmission(this);
    }
    
    /**
     * Remove a file from this submission
     */
    public void removeFile(SubmissionFile file) {
        if (submissionFiles != null) {
            submissionFiles.remove(file);
            file.setSubmission(null);
        }
    }
    
    /**
     * Remove a file by fileId
     */
    public void removeFileById(Long fileId) {
        if (submissionFiles != null) {
            submissionFiles.removeIf(f -> f.getFileId().equals(fileId));
        }
    }
    
    /**
     * Get total file count
     */
    public int getFileCount() {
        return submissionFiles != null ? submissionFiles.size() : 0;
    }
    
    /**
     * Check if has any files (new multi-file way)
     */
    public boolean hasMultipleFiles() {
        return submissionFiles != null && !submissionFiles.isEmpty();
    }
    
    /**
     * Get total file size in bytes
     */
    public long getTotalFileSize() {
        if (submissionFiles == null) return 0;
        return submissionFiles.stream()
                .mapToLong(f -> f.getFileSize() != null ? f.getFileSize() : 0)
                .sum();
    }
    
    /**
     * Get formatted total file size
     */
    public String getFormattedTotalFileSize() {
        long total = getTotalFileSize();
        if (total < 1024) {
            return total + " B";
        } else if (total < 1024 * 1024) {
            return String.format("%.2f KB", total / 1024.0);
        } else {
            return String.format("%.2f MB", total / (1024.0 * 1024.0));
        }
    }
}