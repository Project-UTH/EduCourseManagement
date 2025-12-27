package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for manually enrolling a student to a class
 * Admin only - for special cases like late enrollment, transfer
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualEnrollRequest {

    @NotNull(message = "Class ID is required")
    private Long classId;

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotBlank(message = "Reason is required")
    @Size(min = 10, max = 500, message = "Reason must be between 10 and 500 characters")
    private String reason;  // "Học bù", "Chuyển lớp", "Đăng ký muộn", etc.

    private String note;  // Optional additional note
}