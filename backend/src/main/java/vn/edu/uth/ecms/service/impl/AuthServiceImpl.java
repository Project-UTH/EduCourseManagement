package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.ChangePasswordRequest;
import vn.edu.uth.ecms.dto.request.LoginRequest;
import vn.edu.uth.ecms.dto.response.LoginResponse;
import vn.edu.uth.ecms.dto.response.UserResponse;
import vn.edu.uth.ecms.entity.Admin;
import vn.edu.uth.ecms.entity.Student;
import vn.edu.uth.ecms.entity.Teacher;
import vn.edu.uth.ecms.exception.BadRequestException;
import vn.edu.uth.ecms.exception.ResourceNotFoundException;
import vn.edu.uth.ecms.repository.AdminRepository;
import vn.edu.uth.ecms.repository.StudentRepository;
import vn.edu.uth.ecms.repository.TeacherRepository;
import vn.edu.uth.ecms.security.JwtTokenProvider;
import vn.edu.uth.ecms.security.UserPrincipal;
import vn.edu.uth.ecms.service.AuthService;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final AdminRepository adminRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;

    @Override
    @Transactional
    public LoginResponse login(LoginRequest loginRequest) {
        logger.info("Login attempt for username: {}", loginRequest.getUsername());

        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Generate JWT token
        String token = tokenProvider.generateToken(authentication);

        // Get user details
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        // Build user info
        LoginResponse.UserInfo userInfo = LoginResponse.UserInfo.builder()
                .id(userPrincipal.getId())
                .username(userPrincipal.getUsername())
                .fullName(userPrincipal.getFullName())
                .email(getEmailByRole(userPrincipal))
                .role(userPrincipal.getRole())
                .isFirstLogin(userPrincipal.getIsFirstLogin())
                .build();

        logger.info("Login successful for username: {} with role: {}",
                loginRequest.getUsername(), userPrincipal.getRole());

        return LoginResponse.builder()
                .user(userInfo)
                .token(token)
                .tokenType("Bearer")
                .build();
    }

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        logger.info("Password change attempt for username: {}", username);

        // Validate new password matches confirm password
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        // Try to find and update password for each user type
        Admin admin = adminRepository.findByUsername(username).orElse(null);
        if (admin != null) {
            updateAdminPassword(admin, request);
            return;
        }

        Teacher teacher = teacherRepository.findByCitizenId(username).orElse(null);
        if (teacher != null) {
            updateTeacherPassword(teacher, request);
            return;
        }

        Student student = studentRepository.findByStudentCode(username).orElse(null);
        if (student != null) {
            updateStudentPassword(student, request);
            return;
        }

        throw new ResourceNotFoundException("User", "username", username);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        logger.info("Getting current user info for username: {}", username);

        // Try Admin
        Admin admin = adminRepository.findByUsername(username).orElse(null);
        if (admin != null) {
            return buildUserResponse(
                    admin.getAdminId(),
                    admin.getUsername(),
                    admin.getFullName(),
                    admin.getEmail(),
                    "ADMIN",
                    false,
                    true
            );
        }

        // Try Teacher
        Teacher teacher = teacherRepository.findByCitizenId(username).orElse(null);
        if (teacher != null) {
            return buildUserResponse(
                    teacher.getTeacherId(),
                    teacher.getCitizenId(),
                    teacher.getFullName(),
                    teacher.getEmail(),
                    "TEACHER",
                    teacher.getIsFirstLogin(),
                    teacher.getIsActive()
            );
        }

        // Try Student
        Student student = studentRepository.findByStudentCode(username).orElse(null);
        if (student != null) {
            return buildUserResponse(
                    student.getStudentId(),
                    student.getStudentCode(),
                    student.getFullName(),
                    null, // Students don't have email in entity
                    "STUDENT",
                    student.getIsFirstLogin(),
                    student.getIsActive()
            );
        }

        throw new ResourceNotFoundException("User", "username", username);
    }

    // ==================== Private Helper Methods ====================

    private void updateAdminPassword(Admin admin, ChangePasswordRequest request) {
        // Verify old password
        if (!passwordEncoder.matches(request.getOldPassword(), admin.getPassword())) {
            throw new BadRequestException("Old password is incorrect");
        }

        // Update password
        admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        adminRepository.save(admin);

        logger.info("Password changed successfully for admin: {}", admin.getUsername());
    }

    private void updateTeacherPassword(Teacher teacher, ChangePasswordRequest request) {
        // Verify old password
        if (!passwordEncoder.matches(request.getOldPassword(), teacher.getPassword())) {
            throw new BadRequestException("Old password is incorrect");
        }

        // Update password and clear first login flag
        teacher.setPassword(passwordEncoder.encode(request.getNewPassword()));
        teacher.setIsFirstLogin(false);
        teacherRepository.save(teacher);

        logger.info("Password changed successfully for teacher: {}", teacher.getCitizenId());
    }

    private void updateStudentPassword(Student student, ChangePasswordRequest request) {
        // Verify old password
        if (!passwordEncoder.matches(request.getOldPassword(), student.getPassword())) {
            throw new BadRequestException("Old password is incorrect");
        }

        // Update password and clear first login flag
        student.setPassword(passwordEncoder.encode(request.getNewPassword()));
        student.setIsFirstLogin(false);
        studentRepository.save(student);

        logger.info("Password changed successfully for student: {}", student.getStudentCode());
    }

    private String getEmailByRole(UserPrincipal userPrincipal) {
        String role = userPrincipal.getRole();
        String username = userPrincipal.getUsername();

        switch (role) {
            case "ADMIN":
                return adminRepository.findByUsername(username)
                        .map(Admin::getEmail)
                        .orElse(null);
            case "TEACHER":
                return teacherRepository.findByCitizenId(username)
                        .map(Teacher::getEmail)
                        .orElse(null);
            case "STUDENT":
                return null; // Students don't have email
            default:
                return null;
        }
    }

    private UserResponse buildUserResponse(Long id, String username, String fullName,
                                           String email, String role,
                                           Boolean isFirstLogin, Boolean isActive) {
        return UserResponse.builder()
                .id(id)
                .username(username)
                .fullName(fullName)
                .email(email)
                .role(role)
                .isFirstLogin(isFirstLogin)
                .isActive(isActive)
                .build();
    }
}