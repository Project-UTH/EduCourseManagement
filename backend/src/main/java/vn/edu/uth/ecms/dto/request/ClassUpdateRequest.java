package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassUpdateRequest {

    @NotNull(message = "Teacher ID is required")
    @Positive(message = "Teacher ID must be positive")
    private Long teacherId;

    @NotNull(message = "Max students is required")
    @Min(value = 1, message = "Max students must be at least 1")
    @Max(value = 200, message = "Max students must not exceed 200")
    private Integer maxStudents;

   
    @Pattern(regexp = "^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)?$",
            message = "Invalid day of week")
    private String dayOfWeek;

    
    @Pattern(regexp = "^(CA1|CA2|CA3|CA4|CA5)?$",
            message = "Invalid time slot")
    private String timeSlot;

    @Pattern(regexp = "^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)?$",
            message = "Invalid e-learning day of week")
    private String elearningDayOfWeek;

   
    @Pattern(regexp = "^(CA1|CA2|CA3|CA4|CA5)?$",
            message = "Invalid e-learning time slot")
    private String elearningTimeSlot;

    
    public boolean isScheduleUpdate() {
        return dayOfWeek != null || timeSlot != null;
    }

   
    public boolean hasCompleteFixedSchedule() {
        boolean hasAny = dayOfWeek != null || timeSlot != null;
        boolean hasAll = dayOfWeek != null && timeSlot != null;

        if (!hasAny) return true;  
        return hasAll;  
    }

 
    public boolean hasCompleteElearningSchedule() {
        boolean hasAny = elearningDayOfWeek != null || elearningTimeSlot != null;
        boolean hasAll = elearningDayOfWeek != null && elearningTimeSlot != null;

        if (!hasAny) return true;
        return hasAll;
    }
}