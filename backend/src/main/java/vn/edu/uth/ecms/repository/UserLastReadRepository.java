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
 * @author 
 * @since 
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

    void deleteByClassId(Long classId);

    void deleteByUsername(String username);
}