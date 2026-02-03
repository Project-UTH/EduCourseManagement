package vn.edu.uth.ecms.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.request.ChangePasswordRequest;
import vn.edu.uth.ecms.dto.request.LoginRequest;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.LoginResponse;
import vn.edu.uth.ecms.dto.response.UserResponse;
import vn.edu.uth.ecms.security.UserPrincipal;
import vn.edu.uth.ecms.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    /**
     * Login endpoint
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        logger.info("Login request received for username: {}", loginRequest.getUsername());

        LoginResponse loginResponse = authService.login(loginRequest);

        return ResponseEntity.ok(
                ApiResponse.success("Login successful", loginResponse)
        );
    }

    /**
     * Change password endpoint
     * POST /api/auth/change-password
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest changePasswordRequest) {

        String username = getCurrentUsername();
        logger.info("Change password request received for username: {}", username);

        authService.changePassword(username, changePasswordRequest);

        return ResponseEntity.ok(
                ApiResponse.success("Password changed successfully", null)
        );
    }

    /**
     * Get current user information
     * GET /api/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        String username = getCurrentUsername();
        logger.info("Get current user request for username: {}", username);

        UserResponse userResponse = authService.getCurrentUser(username);

        return ResponseEntity.ok(
                ApiResponse.success(userResponse)
        );
    }

    /**
     * Logout endpoint (client-side only - remove token)
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        String username = getCurrentUsername();
        logger.info("Logout request for username: {}", username);
        SecurityContextHolder.clearContext();

        return ResponseEntity.ok(
                ApiResponse.success("Logout successful", null)
        );
    }

    /**
     * Helper method to get current username from security context
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            return userPrincipal.getUsername();
        }
        throw new RuntimeException("Unable to get current user");
    }
}