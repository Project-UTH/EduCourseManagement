package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.edu.uth.ecms.entity.enums.ClassStatus;
import vn.edu.uth.ecms.entity.enums.TimeSlot;

import java.time.DayOfWeek;
import java.time.LocalDate;


@Entity
@Table(name = "class", indexes = {
        @Index(name = "idx_class_code", columnList = "class_code", unique = true),
        @Index(name = "idx_semester", columnList = "semester_id"),
        @Index(name = "idx_teacher", columnList = "teacher_id"),
        @Index(name = "idx_subject", columnList = "subject_id")
})
@Getter
@Setter
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

    

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private Teacher teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;

   

    @Column(name = "max_students", nullable = false)
    private Integer maxStudents;

    @Column(name = "enrolled_count", nullable = false)
    @Builder.Default
    private Integer enrolledCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ClassStatus status = ClassStatus.OPEN;

   
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 10)
    private DayOfWeek dayOfWeek;

    /**
     * Time slot for FIXED sessions
     * Admin inputs this
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "time_slot", nullable = false, length = 10)
    private TimeSlot timeSlot;

   
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fixed_room_id", nullable = false)
    private Room fixedRoom;
    
    /**
     * Day of week for E-LEARNING sessions
     * Optional - NULL if no e-learning
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "elearning_day_of_week", length = 10)
    private DayOfWeek elearningDayOfWeek;

    /**
     * Time slot for E-LEARNING sessions
     * Optional - NULL if no e-learning
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "elearning_time_slot", length = 10)
    private TimeSlot elearningTimeSlot;

    
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    

    public int getAvailableSeats() {
        return maxStudents - enrolledCount;
    }

    public boolean isFull() {
        return enrolledCount >= maxStudents;
    }

    public boolean canRegister() {
        return status == ClassStatus.OPEN && !isFull();
    }

    public void incrementEnrolled() {
        this.enrolledCount++;
        if (this.enrolledCount >= this.maxStudents) {
            this.status = ClassStatus.FULL;
        }
    }

    public void decrementEnrolled() {
        if (this.enrolledCount > 0) {
            this.enrolledCount--;
            if (this.status == ClassStatus.FULL) {
                this.status = ClassStatus.OPEN;
            }
        }
    }

    public boolean hasElearningSchedule() {
        return elearningDayOfWeek != null && elearningTimeSlot != null;
    }

    @Override
    public String toString() {
        return "ClassEntity{" +
                "classId=" + classId +
                ", classCode='" + classCode + '\'' +
                ", subject=" + (subject != null ? subject.getSubjectCode() : null) +
                ", teacher=" + (teacher != null ? teacher.getFullName() : null) +
                ", semester=" + (semester != null ? semester.getSemesterCode() : null) +
                ", fixedRoom=" + (fixedRoom != null ? fixedRoom.getRoomCode() : null) +
                ", dayOfWeek=" + dayOfWeek +
                ", timeSlot=" + timeSlot +
                ", maxStudents=" + maxStudents +
                ", enrolledCount=" + enrolledCount +
                ", status=" + status +
                '}';
    }
}