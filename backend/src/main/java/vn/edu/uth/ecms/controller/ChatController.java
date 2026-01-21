package vn.edu.uth.ecms.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import vn.edu.uth.ecms.entity.ChatMessage;
import vn.edu.uth.ecms.entity.ClassEntity;
import vn.edu.uth.ecms.security.UserPrincipal;
import vn.edu.uth.ecms.service.ChatService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ChatController with JPA-based Unread Tracking
 * Uses RestTemplate to call existing APIs - NO ClassRepository dependencies
 * 
 * @author ECMS
 * @since 2026-01-21
 */
@RestController
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // ============================================================================
    // WebSocket Endpoints
    // ============================================================================

    /**
     * Send message via WebSocket
     */
    @MessageMapping("/chat.sendMessage/{classId}")
    @SendTo("/topic/class/{classId}")
    public ChatMessage sendMessage(
            @Payload Map<String, String> payload,
            @DestinationVariable Long classId,
            Authentication authentication
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String content = payload.get("content");

        log.info("[ChatController] Message in class {} from {}: {}", 
                classId, userPrincipal.getUsername(), content);

        return chatService.saveMessage(
            classId, 
            userPrincipal.getUsername(), 
            userPrincipal.getRole(), 
            content
        );
    }

    // ============================================================================
    // REST API Endpoints
    // ============================================================================

    /**
     * Get chat history for a class
     * GET /api/chat/{classId}
     */
    @GetMapping("/api/chat/{classId}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(
            @PathVariable Long classId,
            Authentication authentication
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        log.info("[ChatController] Get chat history for class {} by {}", 
                classId, userPrincipal.getUsername());

        List<ChatMessage> messages = chatService.getChatHistory(classId);
        return ResponseEntity.ok(messages);
    }

    /**
     * Get unread count for a specific class
     * GET /api/chat/{classId}/unread-count
     */
    @GetMapping("/api/chat/{classId}/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @PathVariable Long classId,
            Authentication authentication
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String username = userPrincipal.getUsername();
        
        log.info("[ChatController] Get unread count for class {} by {}", classId, username);

        Long unreadCount = chatService.getUnreadCount(classId, username);
        
        Map<String, Object> response = new HashMap<>();
        response.put("classId", classId);
        response.put("unreadCount", unreadCount);
        response.put("hasUnread", unreadCount > 0);

        return ResponseEntity.ok(response);
    }

    /**
     * Get unread counts for all classes of current user
     * GET /api/chat/unread-counts
     */
    @GetMapping("/api/chat/unread-counts")
    public ResponseEntity<Map<String, Object>> getAllUnreadCounts(
            Authentication authentication,
            @RequestHeader("Authorization") String authHeader
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String username = userPrincipal.getUsername();
        String role = userPrincipal.getRole();
        
        log.info("[ChatController] Get all unread counts for {} ({})", username, role);

        try {
            // ✅ Call existing APIs to get class IDs
            List<Long> classIds = getClassIdsForUser(role, authHeader);
            
            log.info("[ChatController] Found {} classes for user", classIds.size());

            // Get unread counts for all classes
            Map<Long, Long> unreadByClass = chatService.getUnreadCountsByUser(username, classIds);
            
            Long totalUnread = unreadByClass.values().stream()
                .mapToLong(Long::longValue)
                .sum();

            Map<String, Object> response = new HashMap<>();
            response.put("unreadByClass", unreadByClass);
            response.put("totalUnread", totalUnread);

            log.info("[ChatController] ✅ Total unread: {}", totalUnread);

            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("[ChatController] ❌ Error getting unread counts", e);
            
            // Return empty result on error (don't fail the request)
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("unreadByClass", new HashMap<>());
            errorResponse.put("totalUnread", 0);
            
            return ResponseEntity.ok(errorResponse);
        }
    }

    /**
     * Helper method: Call existing REST APIs to get class IDs
     * This method calls:
     * - /api/teacher/classes (for teachers)
     * - /api/student/classes (for students)
     */
    private List<Long> getClassIdsForUser(String role, String authHeader) {
        List<Long> classIds = new ArrayList<>();
        
        try {
            // Determine API endpoint based on role
            String apiUrl;
            if ("TEACHER".equals(role)) {
                apiUrl = "http://localhost:8080/api/teacher/classes/my";
            } else if ("STUDENT".equals(role)) {
                apiUrl = "http://localhost:8080/api/student/classes";
            } else {
                log.warn("[ChatController] Unknown role: {}", role);
                return classIds;
            }

            // Create HTTP headers with Authorization
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", authHeader);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            log.info("[ChatController] Calling API: {}", apiUrl);

            // Call the API
            ResponseEntity<String> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.GET,
                entity,
                String.class
            );

            // Parse response
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                
                // Response might be wrapped in "data" field or direct array
                JsonNode dataNode = root.has("data") ? root.get("data") : root;
                
                // Extract classIds from array
                if (dataNode.isArray()) {
                    for (JsonNode classNode : dataNode) {
                        if (classNode.has("classId")) {
                            Long classId = classNode.get("classId").asLong();
                            classIds.add(classId);
                        }
                    }
                }
                
                log.info("[ChatController] ✅ Retrieved {} class IDs from API", classIds.size());
            } else {
                log.warn("[ChatController] API returned status: {}", response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("[ChatController] ❌ Error calling class API: {}", e.getMessage(), e);
        }
        
        return classIds;
    }

    /**
     * Mark all messages in a class as read
     * POST /api/chat/{classId}/mark-read
     */
    @PostMapping("/api/chat/{classId}/mark-read")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @PathVariable Long classId,
            Authentication authentication
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String username = userPrincipal.getUsername();
        
        log.info("[ChatController] Mark all as read in class {} for {}", classId, username);

        try {
            chatService.markAllAsRead(classId, username);

            Map<String, Object> response = new HashMap<>();
            response.put("classId", classId);
            response.put("success", true);

            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("[ChatController] ❌ Error marking as read", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Get unread messages for a class
     * GET /api/chat/{classId}/unread-messages
     */
    @GetMapping("/api/chat/{classId}/unread-messages")
    public ResponseEntity<List<ChatMessage>> getUnreadMessages(
            @PathVariable Long classId,
            Authentication authentication
    ) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String username = userPrincipal.getUsername();
        
        log.info("[ChatController] Get unread messages for class {} by {}", classId, username);

        List<ChatMessage> unreadMessages = chatService.getUnreadMessages(classId, username);
        return ResponseEntity.ok(unreadMessages);
    }
}