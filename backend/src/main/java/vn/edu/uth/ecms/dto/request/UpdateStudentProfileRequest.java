package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating student profile
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStudentProfileRequest {
    
    @Email(message = "Email không hợp lệ")
    private String email;
    
    @Size(min = 10, max = 15, message = "Số điện thoại phải từ 10-15 ký tự")
    private String phone;
}