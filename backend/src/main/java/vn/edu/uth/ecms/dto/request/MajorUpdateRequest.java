package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class MajorUpdateRequest {

    @NotBlank(message = "Major code is required")
    @Size(max = 10, message = "Major code must not exceed 10 characters")
    private String majorCode;

    @NotBlank(message = "Major name is required")
    @Size(max = 100, message = "Major name must not exceed 100 characters")
    private String majorName;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
}