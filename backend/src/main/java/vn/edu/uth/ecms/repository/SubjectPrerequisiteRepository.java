package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.SubjectPrerequisite;

import java.util.List;
import java.util.Optional;

/**
 * Subject Prerequisite Repository
 */
@Repository
public interface SubjectPrerequisiteRepository extends JpaRepository<SubjectPrerequisite, Long> {

    /**
     * Find all prerequisites for a subject
     */
    List<SubjectPrerequisite> findBySubject_SubjectId(Long subjectId);

    /**
     * Check if prerequisite exists
     */
    boolean existsBySubject_SubjectIdAndPrerequisiteSubject_SubjectId(
            Long subjectId,
            Long prerequisiteId
    );

    /**
     * Find specific prerequisite relationship
     */
    Optional<SubjectPrerequisite> findBySubject_SubjectIdAndPrerequisiteSubject_SubjectId(
            Long subjectId,
            Long prerequisiteId
    );

    /**
     * Delete specific prerequisite
     */
    void deleteBySubject_SubjectIdAndPrerequisiteSubject_SubjectId(
            Long subjectId,
            Long prerequisiteId
    );

    /**
     * Check if subjectA is prerequisite of subjectB (for circular dependency check)
     */
    @Query("SELECT COUNT(sp) > 0 FROM SubjectPrerequisite sp " +
            "WHERE sp.subject.subjectId = :subjectId " +
            "AND sp.prerequisiteSubject.subjectId = :prerequisiteId")
    boolean isPrerequisiteOf(@Param("subjectId") Long subjectId,
                             @Param("prerequisiteId") Long prerequisiteId);
}