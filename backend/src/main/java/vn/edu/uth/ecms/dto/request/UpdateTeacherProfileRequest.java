package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating teacher profile
 * Only allows updating: email, phone, address
 * Other fields (name, DOB, CCCD, department, etc.) can only be updated by admin
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTeacherProfileRequest {
    
    @Email(message = "Email không hợp lệ")
    private String email;
    
    @Size(min = 10, max = 15, message = "Số điện thoại phải từ 10-15 ký tự")
    private String phone;
    
    @Size(max = 255, message = "Địa chỉ không được quá 255 ký tự")
    private String address;
}