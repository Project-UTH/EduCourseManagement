package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassCreateRequest {

    @NotBlank(message = "Class code is required")
    @Size(max = 20, message = "Class code max 20 characters")
    @Pattern(regexp = "^[A-Z0-9-]+$", message = "Class code must be uppercase alphanumeric with dash")
    private String classCode;

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    @NotNull(message = "Teacher ID is required")
    private Long teacherId;

    @NotNull(message = "Semester ID is required")
    private Long semesterId;

    @NotNull(message = "Max students is required")
    @Min(value = 1, message = "Max students must be at least 1")
    @Max(value = 200, message = "Max students cannot exceed 200")
    private Integer maxStudents;

   
    @NotBlank(message = "Day of week is required")
    @Pattern(regexp = "MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY",
            message = "Invalid day of week")
    private String dayOfWeek;

    
    @NotBlank(message = "Time slot is required")
    @Pattern(regexp = "CA1|CA2|CA3|CA4|CA5",
            message = "Invalid time slot")
    private String timeSlot;

    
    @Pattern(regexp = "MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY",
            message = "Invalid e-learning day of week")
    private String elearningDayOfWeek;

    
    @Pattern(regexp = "CA1|CA2|CA3|CA4|CA5",
            message = "Invalid e-learning time slot")
    private String elearningTimeSlot;
}