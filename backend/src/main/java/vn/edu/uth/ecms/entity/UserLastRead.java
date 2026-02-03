package vn.edu.uth.ecms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * UserLastRead Entity
 * @author 
 * @since 
 */
@Entity
@Table(name = "user_last_read", 
    indexes = {
        @Index(name = "idx_username_class", columnList = "username, class_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_username_class", columnNames = {"username", "class_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLastRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "username", nullable = false, length = 255)
    private String username;

    @Column(name = "class_id", nullable = false)
    private Long classId;

    @Column(name = "last_read_at", nullable = false)
    @Builder.Default
    private LocalDateTime lastReadAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}