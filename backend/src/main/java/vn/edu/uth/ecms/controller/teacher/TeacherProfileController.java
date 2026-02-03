package vn.edu.uth.ecms.controller.teacher;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.request.ChangePasswordRequest;
import vn.edu.uth.ecms.dto.request.UpdateTeacherProfileRequest;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.TeacherResponse;
import vn.edu.uth.ecms.service.TeacherService;


@Slf4j
@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherProfileController {

    private final TeacherService teacherService;

    /**
     * Get current teacher profile
     * GET /api/teacher/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<TeacherResponse>> getProfile(Authentication authentication) {
        log.info(" [TeacherProfile] Getting profile for: {}", authentication.getName());
        
        String citizenId = authentication.getName();
        TeacherResponse profile = teacherService.getByCitizenId(citizenId);
        
        log.info(" [TeacherProfile] Profile fetched: {}", profile.getFullName());
        ApiResponse<TeacherResponse> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Profile retrieved successfully");
        response.setData(profile);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Update current teacher profile
     * PUT /api/teacher/profile
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<TeacherResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateTeacherProfileRequest request
    ) {
        log.info(" [TeacherProfile] Updating profile for: {}", authentication.getName());
        
        String citizenId = authentication.getName();
        TeacherResponse updatedProfile = teacherService.updateProfile(citizenId, request);
        
        log.info("[TeacherProfile] Profile updated: {}", updatedProfile.getFullName());
        
      
        ApiResponse<TeacherResponse> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Profile updated successfully");
        response.setData(updatedProfile);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Change password
     * POST /api/teacher/change-password
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        log.info(" [TeacherProfile] Changing password for: {}", authentication.getName());
        
        String citizenId = authentication.getName();
        teacherService.changePassword(citizenId, request);
        
        log.info(" [TeacherProfile] Password changed successfully");
        
       
        ApiResponse<Void> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Password changed successfully");
        response.setData(null);
        
        return ResponseEntity.ok(response);
    }
}