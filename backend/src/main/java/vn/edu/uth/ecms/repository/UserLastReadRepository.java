package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.entity.UserLastRead;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * UserLastReadRepository
 * 
 * Repository for managing user's last read timestamps
 * 
 * @author ECMS
 * @since 2026-01-21
 */
@Repository
public interface UserLastReadRepository extends JpaRepository<UserLastRead, Long> {

    /**
     * Find last read record by username and class
     */
    Optional<UserLastRead> findByUsernameAndClassId(String username, Long classId);

    /**
     * Find all last read records for a user
     */
    List<UserLastRead> findByUsername(String username);

    /**
     * Update or insert last read timestamp
     * Uses native query for UPSERT operation
     */
    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO user_last_read (username, class_id, last_read_at, updated_at)
        VALUES (:username, :classId, :lastReadAt, :lastReadAt)
        ON DUPLICATE KEY UPDATE 
            last_read_at = :lastReadAt,
            updated_at = :lastReadAt
        """, nativeQuery = true)
    void upsertLastRead(
        @Param("username") String username,
        @Param("classId") Long classId,
        @Param("lastReadAt") LocalDateTime lastReadAt
    );

    /**
     * Delete last read record for a class (cleanup)
     */
    void deleteByClassId(Long classId);

    /**
     * Delete all last read records for a user
     */
    void deleteByUsername(String username);
}