package vn.edu.uth.ecms.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import vn.edu.uth.ecms.security.CustomUserDetailsService;
import vn.edu.uth.ecms.security.JwtAuthenticationEntryPoint;
import vn.edu.uth.ecms.security.JwtAuthenticationFilter;

/**
 * SecurityConfig
 * 
 * Spring Security configuration with JWT authentication
 * 
 * Security Rules:
 * - Public: /api/auth/**, /api/files/**, /api/health, /uploads/**, /favicon.ico
 * - Admin: /api/admin/**
 * - Teacher: /api/teacher/**
 * - Student: /api/student/**
 * 
 * @author Education Course Management System
 * @since 2026-01-11
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;
    private final JwtAuthenticationEntryPoint unauthorizedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configure(http))
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(unauthorizedHandler)
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // ==================== CORS PREFLIGHT ====================
                        // Allow OPTIONS requests for CORS preflight
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ==================== PUBLIC ENDPOINTS ====================
                        // Authentication endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        
                        // File download endpoints - PUBLIC ACCESS
                        // Students/Teachers can download without re-authentication
                        .requestMatchers("/api/files/**").permitAll()
                        
                        // ✅ ADDED: Uploaded files - PUBLIC ACCESS
                        // Allow direct download of homework and materials
                        .requestMatchers("/uploads/**").permitAll()
                        
                        // ✅ ADDED: Favicon and static resources
                        .requestMatchers("/favicon.ico", "/*.png", "/*.ico").permitAll()
                        
                        // Health check
                        .requestMatchers("/api/health").permitAll()
                        
                        // API Documentation (Swagger)
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // ==================== ADMIN ENDPOINTS ====================
                        // Require ADMIN role
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // ==================== TEACHER ENDPOINTS ====================
                        // Require TEACHER role
                        .requestMatchers("/api/teacher/**").hasRole("TEACHER")

                        // ==================== STUDENT ENDPOINTS ====================
                        // Require STUDENT role
                        .requestMatchers("/api/student/**").hasRole("STUDENT")

                        // ==================== DEFAULT ====================
                        // All other requests need authentication
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}