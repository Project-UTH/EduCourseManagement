package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.SubmissionFile;

import java.util.List;
import java.util.Optional;

/**
 * SubmissionFileRepository
 * 
 * Repository for SubmissionFile entity
 * 
 * @author Phase 5 - Student Features
 * @since 2026-01-13
 */
@Repository
public interface SubmissionFileRepository extends JpaRepository<SubmissionFile, Long> {
    
    /**
     * Find all files for a submission
     */
    List<SubmissionFile> findBySubmission_SubmissionId(Long submissionId);
    
    /**
     * Find file by submission and original filename
     */
    Optional<SubmissionFile> findBySubmission_SubmissionIdAndOriginalFilename(
            Long submissionId, 
            String originalFilename
    );
    
    /**
     * Find file by stored filename
     */
    Optional<SubmissionFile> findByStoredFilename(String storedFilename);
    
    /**
     * Count files for a submission
     */
    long countBySubmission_SubmissionId(Long submissionId);
    
    /**
     * Delete all files for a submission
     */
    void deleteBySubmission_SubmissionId(Long submissionId);
    
    /**
     * Get total file size for a submission
     */
    @Query("SELECT COALESCE(SUM(sf.fileSize), 0) FROM SubmissionFile sf " +
           "WHERE sf.submission.submissionId = :submissionId")
    Long getTotalFileSizeBySubmissionId(@Param("submissionId") Long submissionId);
    
    /**
     * Check if file exists for submission
     */
    boolean existsBySubmission_SubmissionIdAndOriginalFilename(
            Long submissionId, 
            String originalFilename
    );
}