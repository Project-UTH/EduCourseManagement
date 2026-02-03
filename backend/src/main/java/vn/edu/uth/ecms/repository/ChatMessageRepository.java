package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.ChatMessage;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ChatMessageRepository
 * @author 
 * @since 
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
   
    List<ChatMessage> findByClassIdOrderByTimestampAsc(Long classId);
    

    Long countByClassIdAndSenderUsernameNotAndTimestampAfter(
        Long classId,
        String senderUsername,
        LocalDateTime timestamp
    );
    

    List<ChatMessage> findByClassIdAndSenderUsernameNotAndTimestampAfterOrderByTimestampAsc(
        Long classId,
        String senderUsername,
        LocalDateTime timestamp
    );
    
 
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