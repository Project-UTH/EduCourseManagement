package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.ClassMaterial;

import java.util.List;

/**
 * ClassMaterialRepository
 * 
 * Repository for class materials
 * 
 * @author ECMS Team
 * @since 2026-01-16
 */
@Repository
public interface ClassMaterialRepository extends JpaRepository<ClassMaterial, Long> {
    
    /**
     * Find all materials for a class
     * Ordered by upload date (newest first)
     */
    List<ClassMaterial> findByClassEntity_ClassIdOrderByUploadedAtDesc(Long classId);
    
    /**
     * Find materials uploaded by a teacher
     */
    List<ClassMaterial> findByUploadedBy_TeacherIdOrderByUploadedAtDesc(Long teacherId);
    
    /**
     * Count materials in a class
     */
    long countByClassEntity_ClassId(Long classId);
}