package vn.edu.uth.ecms.service;

import vn.edu.uth.ecms.dto.request.ChangePasswordRequest;
import vn.edu.uth.ecms.dto.request.LoginRequest;
import vn.edu.uth.ecms.dto.response.LoginResponse;
import vn.edu.uth.ecms.dto.response.UserResponse;

public interface AuthService {

    /**
     * Authenticate user and generate JWT token
     */
    LoginResponse login(LoginRequest loginRequest);

    /**
     * Change user password
     */
    void changePassword(String username, ChangePasswordRequest changePasswordRequest);

    /**
     * Get current user information
     */
    UserResponse getCurrentUser(String username);
}