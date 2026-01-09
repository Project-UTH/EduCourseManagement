package vn.edu.uth.ecms.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        logger.info("🔍 JWT Filter called for: {} {}", request.getMethod(), request.getRequestURI());

        // ✅ FIX: Skip authentication for OPTIONS requests (CORS preflight)
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            logger.info("⏩ Skipping JWT authentication for OPTIONS request (CORS preflight)");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String username = tokenProvider.getUsernameFromToken(jwt);
                Claims claims = tokenProvider.getClaimsFromToken(jwt);
                
                // Extract data from JWT claims
                Long userId = claims.get("id", Long.class);
                String role = claims.get("role", String.class);
                String fullName = claims.get("fullName", String.class);

                // Add ROLE_ prefix if not present and role is not null
                if (role != null && !role.isEmpty() && !role.startsWith("ROLE_")) {
                    role = "ROLE_" + role;
                }

                logger.info("JWT Authentication - Username: {}, Role: {}, ID: {}", username, role, userId);

                // ✅ FIX: Create UserPrincipal using AllArgsConstructor
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority(role != null ? role : "ROLE_USER");
                
                UserPrincipal userPrincipal = new UserPrincipal(
                        userId,                                      // id
                        username,                                    // username
                        null,                                        // password (not needed from JWT)
                        fullName,                                    // fullName
                        role != null ? role.replace("ROLE_", "") : "USER",  // role (without ROLE_ prefix)
                        false,                                       // isFirstLogin
                        true,                                        // isActive
                        Collections.singletonList(authority)         // authorities
                );

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userPrincipal,
                                null,
                                userPrincipal.getAuthorities()
                        );

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);

                logger.info("✅ Authentication successful for user: {} (ID: {}) with authority: {}",
                        username, userId, authority.getAuthority());
            }
        } catch (Exception ex) {
            logger.error("❌ Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}