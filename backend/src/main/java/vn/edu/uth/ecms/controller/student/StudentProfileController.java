package vn.edu.uth.ecms.controller.student;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.request.UpdateStudentProfileRequest;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.StudentResponse;
import vn.edu.uth.ecms.service.StudentService;

/**
 * Student Profile Controller
 * 
 * Handles student profile management endpoints:
 * - GET /api/student/profile - Get current student profile
 * - PUT /api/student/profile - Update profile
 * 
 * Note: Password change uses shared /api/auth/change-password endpoint
 */
@Slf4j
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentProfileController {

    private final StudentService studentService;

    /**
     * Get current student profile
     * GET /api/student/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<StudentResponse>> getProfile(Authentication authentication) {
        log.info("📋 [StudentProfile] Getting profile for: {}", authentication.getName());
        
        String studentCode = authentication.getName(); // JWT contains student code
        StudentResponse profile = studentService.getByStudentCode(studentCode);
        
        log.info("✅ [StudentProfile] Profile fetched: {}", profile.getFullName());
        
        ApiResponse<StudentResponse> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Profile retrieved successfully");
        response.setData(profile);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Update current student profile
     * PUT /api/student/profile
     * Only allows updating: email, phone
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<StudentResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateStudentProfileRequest request
    ) {
        log.info("✏️ [StudentProfile] Updating profile for: {}", authentication.getName());
        
        String studentCode = authentication.getName();
        StudentResponse updatedProfile = studentService.updateProfile(studentCode, request);
        
        log.info("✅ [StudentProfile] Profile updated: {}", updatedProfile.getFullName());
        
        ApiResponse<StudentResponse> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage("Profile updated successfully");
        response.setData(updatedProfile);
        
        return ResponseEntity.ok(response);
    }
}