package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.ChatMessage;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ChatMessageRepository
 * 
 * Repository for managing chat messages with unread tracking support
 * 
 * @author ECMS
 * @since 2026-01-21
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    // ============================================================================
    // EXISTING METHOD (keep this)
    // ============================================================================
    
    /**
     * Find all messages in a class, ordered by timestamp
     */
    List<ChatMessage> findByClassIdOrderByTimestampAsc(Long classId);
    
    // ============================================================================
    // NEW METHODS FOR UNREAD TRACKING ✅
    // ============================================================================
    
    /**
     * Count unread messages for a user in a class
     * 
     * Messages are "unread" if:
     * - They are in the specified class
     * - They were sent AFTER the user's last_read_at timestamp
     * - They were NOT sent by the user themselves
     * 
     * Spring Data JPA automatically generates the SQL:
     * SELECT COUNT(*)
     * FROM chat_message
     * WHERE class_id = ?
     *   AND sender_username != ?
     *   AND timestamp > ?
     */
    Long countByClassIdAndSenderUsernameNotAndTimestampAfter(
        Long classId,
        String senderUsername,
        LocalDateTime timestamp
    );
    
    /**
     * Get unread messages for a user in a class
     * 
     * Same criteria as countByClassIdAndSenderUsernameNotAndTimestampAfter,
     * but returns the actual messages ordered by timestamp
     * 
     * Spring Data JPA automatically generates the SQL:
     * SELECT *
     * FROM chat_message
     * WHERE class_id = ?
     *   AND sender_username != ?
     *   AND timestamp > ?
     * ORDER BY timestamp ASC
     */
    List<ChatMessage> findByClassIdAndSenderUsernameNotAndTimestampAfterOrderByTimestampAsc(
        Long classId,
        String senderUsername,
        LocalDateTime timestamp
    );
    
    // ============================================================================
    // OPTIONAL: Additional utility methods
    // ============================================================================
    
    /**
     * Count all messages in a class after a timestamp
     * (includes messages from the user themselves)
     */
    Long countByClassIdAndTimestampAfter(
        Long classId,
        LocalDateTime timestamp
    );
    
    /**
     * Get all messages in a class after a timestamp
     */
    List<ChatMessage> findByClassIdAndTimestampAfterOrderByTimestampAsc(
        Long classId,
        LocalDateTime timestamp
    );
    
    /**
     * Count messages in a class by a specific sender
     */
    Long countByClassIdAndSenderUsername(
        Long classId,
        String senderUsername
    );
}