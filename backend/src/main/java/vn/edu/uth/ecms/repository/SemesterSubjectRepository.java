package vn.edu.uth.ecms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.uth.ecms.entity.SemesterSubject;

import java.util.List;
import java.util.Optional;

@Repository
public interface SemesterSubjectRepository extends JpaRepository<SemesterSubject, Long> {

    List<SemesterSubject> findBySemester_SemesterId(Long semesterId);

    List<SemesterSubject> findBySubject_SubjectId(Long subjectId);

    boolean existsBySemester_SemesterIdAndSubject_SubjectId(Long semesterId, Long subjectId);

    Optional<SemesterSubject> findBySemester_SemesterIdAndSubject_SubjectId(
            Long semesterId, Long subjectId);

    void deleteBySemester_SemesterIdAndSubject_SubjectId(Long semesterId, Long subjectId);

    long countBySemester_SemesterId(Long semesterId);
}