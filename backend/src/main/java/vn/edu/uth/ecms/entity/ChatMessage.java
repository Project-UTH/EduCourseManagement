package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_message", indexes = {
        @Index(name = "idx_chat_class", columnList = "class_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
   
    @Column(name = "class_id", nullable = false)
    private Long classId;

    @Column(name = "sender_username", nullable = false)
    private String senderUsername;

    @Column(name = "sender_role", nullable = false)
    private String senderRole; // TEACHER, STUDENT, ADMIN

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "timestamp", nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}