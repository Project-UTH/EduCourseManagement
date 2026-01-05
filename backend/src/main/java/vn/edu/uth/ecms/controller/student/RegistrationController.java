package vn.edu.uth.ecms.controller.student;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.RegistrationResponse;
import vn.edu.uth.ecms.service.RegistrationService;

import java.util.List;

@RestController
@RequestMapping("/api/student/registration")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('STUDENT')")
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping("/register/{classId}")
    public ResponseEntity<ApiResponse<RegistrationResponse>> registerForClass(@PathVariable Long classId) {
        log.info("Student registering for class ID: {}", classId);
        RegistrationResponse response = registrationService.registerForClass(classId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    @DeleteMapping("/{registrationId}")
    public ResponseEntity<ApiResponse<String>> dropClass(@PathVariable Long registrationId) {
        log.info("Dropping registration ID: {}", registrationId);
        registrationService.dropClass(registrationId);
        return ResponseEntity.ok(ApiResponse.success("Class dropped successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RegistrationResponse>>> getMyRegistrations(
            @RequestParam(required = false) Long semesterId) {
        List<RegistrationResponse> registrations = registrationService.getMyRegistrations(semesterId);
        return ResponseEntity.ok(ApiResponse.success(registrations.size() + " registration(s) found", registrations));
    }

    @GetMapping("/{registrationId}")
    public ResponseEntity<ApiResponse<RegistrationResponse>> getRegistrationById(@PathVariable Long registrationId) {
        RegistrationResponse response = registrationService.getRegistrationById(registrationId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}