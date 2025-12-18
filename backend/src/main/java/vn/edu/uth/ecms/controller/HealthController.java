package vn.edu.uth.ecms.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "Education Course Management System API is running!");
        response.put("timestamp", LocalDateTime.now());
        response.put("database", "Connected to MySQL");
        return response;
    }

    @GetMapping("/")
    public Map<String, String> welcome() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Welcome to Education Course Management System API");
        response.put("project", "EduCourseManagement - UTH");
        response.put("version", "1.0.0");
        response.put("documentation", "/swagger-ui.html");
        return response;
    }
}