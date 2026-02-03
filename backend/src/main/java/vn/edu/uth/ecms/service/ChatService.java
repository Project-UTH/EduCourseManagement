package vn.edu.uth.ecms.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.entity.ChatMessage;
import vn.edu.uth.ecms.entity.ClassEntity;
import vn.edu.uth.ecms.entity.UserLastRead;
import vn.edu.uth.ecms.repository.ChatMessageRepository;
import vn.edu.uth.ecms.repository.UserLastReadRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * ChatService with JPA-based Unread Tracking
 * @author 
 * @since 
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserLastReadRepository userLastReadRepository;

    /**
     * Save message
     */
    @Transactional
    public ChatMessage saveMessage(Long classId, String senderUsername, String senderRole, String content) {
        log.info("[ChatService] Saving message in class {} from {}", classId, senderUsername);

        ChatMessage message = ChatMessage.builder()
                .classId(classId)
                .senderUsername(senderUsername)
                .senderRole(senderRole)
                .content(content)
                .timestamp(LocalDateTime.now())
                .build();
        
        message = chatMessageRepository.save(message);
        log.info("[ChatService]  Message saved with ID: {}", message.getId());

        return message;
    }

    /**
     * Get chat history for a class
     */
    @Transactional(readOnly = true)
    public List<ChatMessage> getChatHistory(Long classId) {
        return chatMessageRepository.findByClassIdOrderByTimestampAsc(classId);
    }

    /**
     * Get unread count for a user in a specific class
     */
    @Transactional(readOnly = true)
    public Long getUnreadCount(Long classId, String username) {
        log.info("[ChatService] Getting unread count for class {} and user {}", classId, username);

        // Get user's last read timestamp for this class
        Optional<UserLastRead> lastReadOpt = userLastReadRepository.findByUsernameAndClassId(username, classId);
        
        LocalDateTime lastReadAt = lastReadOpt
            .map(UserLastRead::getLastReadAt)
            .orElse(LocalDateTime.of(1970, 1, 1, 0, 0)); // Default: very old date

        // Count messages after last read timestamp (excluding sender's own messages)
        Long unreadCount = chatMessageRepository.countByClassIdAndSenderUsernameNotAndTimestampAfter(
            classId, 
            username, 
            lastReadAt
        );

        log.info("[ChatService]  Unread count: {}", unreadCount);
        return unreadCount;
    }

  
    @Transactional(readOnly = true)
    public Map<Long, Long> getUnreadCountsByUser(String username, List<Long> classIds) {
        log.info("[ChatService] Getting unread counts for {} classes", classIds.size());

        Map<Long, Long> unreadByClass = new HashMap<>();

        for (Long classId : classIds) {
            Long unreadCount = getUnreadCount(classId, username);
            if (unreadCount > 0) {
                unreadByClass.put(classId, unreadCount);
            }
        }

        log.info("[ChatService]  Found {} classes with unread messages", unreadByClass.size());
        return unreadByClass;
    }

    
    @Transactional
    public void markAllAsRead(Long classId, String username) {
        log.info("[ChatService] Marking all messages as read in class {} for {}", classId, username);

        try {
            
            userLastReadRepository.upsertLastRead(username, classId, LocalDateTime.now());
            
            log.info("[ChatService]  Successfully marked as read");
        } catch (Exception e) {
            log.error("[ChatService]  Error marking as read", e);
            throw e;
        }
    }

    /**
     * Get last read timestamp for a user in a class
     */
    @Transactional(readOnly = true)
    public Optional<LocalDateTime> getLastReadTimestamp(Long classId, String username) {
        return userLastReadRepository.findByUsernameAndClassId(username, classId)
            .map(UserLastRead::getLastReadAt);
    }

    /**
     * Get all unread messages for a user in a class
     */
    @Transactional(readOnly = true)
    public List<ChatMessage> getUnreadMessages(Long classId, String username) {
        Optional<UserLastRead> lastReadOpt = userLastReadRepository.findByUsernameAndClassId(username, classId);
        
        LocalDateTime lastReadAt = lastReadOpt
            .map(UserLastRead::getLastReadAt)
            .orElse(LocalDateTime.of(1970, 1, 1, 0, 0));

        return chatMessageRepository.findByClassIdAndSenderUsernameNotAndTimestampAfterOrderByTimestampAsc(
            classId,
            username,
            lastReadAt
        );
    }
}