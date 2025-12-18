package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.Major;

import java.util.List;
import java.util.Optional;

@Repository
public interface MajorRepository extends JpaRepository<Major, Long> {

    Optional<Major> findByMajorCode(String majorCode);

    boolean existsByMajorCode(String majorCode);

    List<Major> findByDepartmentDepartmentId(Long departmentId);
}