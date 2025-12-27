package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalDate;

/**
 * Class Entity - Represents a class for a subject in a semester
 *
 * IMPORTANT: This entity stores the FIXED schedule configuration
 * - dayOfWeek: Admin-selected fixed day (e.g., MONDAY)
 * - timeSlot: Admin-selected fixed time slot (e.g., CA1)
 * - room: Admin-selected fixed room (e.g., A201)
 *
 * ClassSession entities are auto-generated based on this configuration
 */
@Entity
@Table(name = "class")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassEntity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "class_id")
    private Long classId;

    @Column(name = "class_code", unique = true, nullable = false, length = 20)
    private String classCode;

    // ==================== RELATIONSHIPS ====================

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

    // ==================== CAPACITY ====================

    @Column(name = "max_students", nullable = false)
    private Integer maxStudents;

    @Column(name = "enrolled_count")
    @Builder.Default
    private Integer enrolledCount = 0;

    // ==================== STATUS ====================

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ClassStatus status = ClassStatus.OPEN;

    // ==================== FIXED SCHEDULE (Admin-selected) ====================

    /**
     * Fixed day of week for regular sessions
     * Example: MONDAY → Every Monday
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;

    /**
     * Fixed time slot for regular sessions
     * Example: CA1 → 06:45-09:15
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "time_slot", nullable = false)
    private TimeSlot timeSlot;

    /**
     * Fixed room for regular sessions
     * Example: A201
     */
    @Column(name = "room", nullable = false, length = 50)
    private String room;

    // ==================== SEMESTER DATES ====================

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    // ==================== HELPER METHODS ====================

    /**
     * Check if class is full
     */
    public boolean isFull() {
        return enrolledCount >= maxStudents;
    }

    /**
     * Get available seats
     */
    public int getAvailableSeats() {
        return maxStudents - enrolledCount;
    }

    /**
     * Check if can register (open and not full)
     */
    public boolean canRegister() {
        return status == ClassStatus.OPEN && !isFull();
    }

    /**
     * Increment enrolled count
     */
    public void incrementEnrolled() {
        this.enrolledCount++;
        if (this.enrolledCount >= this.maxStudents) {
            this.status = ClassStatus.FULL;
        }
    }

    /**
     * Decrement enrolled count
     */
    public void decrementEnrolled() {
        if (this.enrolledCount > 0) {
            this.enrolledCount--;
            if (this.status == ClassStatus.FULL) {
                this.status = ClassStatus.OPEN;
            }
        }
    }
}