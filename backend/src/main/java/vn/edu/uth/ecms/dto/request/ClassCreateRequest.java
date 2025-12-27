package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new class
 *
 * VALIDATION RULES:
 * - Class code: unique, max 20 chars
 * - Max students: 1-200
 * - Day of week: MONDAY-SATURDAY
 * - Time slot: CA1-CA5
 * - Room: max 50 chars
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassCreateRequest {

    @NotBlank(message = "Class code is required")
    @Size(max = 20, message = "Class code must not exceed 20 characters")
    @Pattern(regexp = "^[A-Z0-9-]+$", message = "Class code must contain only uppercase letters, numbers, and hyphens")
    private String classCode;

    @NotNull(message = "Subject ID is required")
    @Positive(message = "Subject ID must be positive")
    private Long subjectId;

    @NotNull(message = "Teacher ID is required")
    @Positive(message = "Teacher ID must be positive")
    private Long teacherId;

    @NotNull(message = "Semester ID is required")
    @Positive(message = "Semester ID must be positive")
    private Long semesterId;

    @NotNull(message = "Max students is required")
    @Min(value = 1, message = "Max students must be at least 1")
    @Max(value = 200, message = "Max students must not exceed 200")
    private Integer maxStudents;

    @NotBlank(message = "Day of week is required")
    @Pattern(regexp = "^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)$",
            message = "Invalid day of week")
    private String dayOfWeek;

    @NotBlank(message = "Time slot is required")
    @Pattern(regexp = "^(CA1|CA2|CA3|CA4|CA5)$",
            message = "Invalid time slot")
    private String timeSlot;

    @NotBlank(message = "Room is required")
    @Size(max = 50, message = "Room must not exceed 50 characters")
    private String room;
}