package vn.edu.uth.ecms.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.uth.ecms.entity.RoomType;

/**
 * DTO for updating an existing room
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomUpdateRequest {

    @NotBlank(message = "Room name is required")
    @Size(max = 100, message = "Room name must not exceed 100 characters")
    private String roomName;

    @NotBlank(message = "Building is required")
    @Size(min = 1, max = 1, message = "Building must be a single uppercase letter")
    @Pattern(regexp = "^[A-Z]$", message = "Building must be a single uppercase letter (A-Z)")
    private String building;

    @NotNull(message = "Floor is required")
    @Min(value = 1, message = "Floor must be at least 1")
    @Max(value = 20, message = "Floor must not exceed 20")
    private Integer floor;

    @NotNull(message = "Room type is required")
    private RoomType roomType;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Max(value = 500, message = "Capacity must not exceed 500")
    private Integer capacity;

    @NotNull(message = "Active status is required")
    private Boolean isActive;
}