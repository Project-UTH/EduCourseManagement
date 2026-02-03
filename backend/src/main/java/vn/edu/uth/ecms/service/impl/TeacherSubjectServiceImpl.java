package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.TeacherSubjectRequest;
import vn.edu.uth.ecms.dto.response.TeacherSubjectResponse;
import vn.edu.uth.ecms.entity.Subject;
import vn.edu.uth.ecms.entity.Teacher;
import vn.edu.uth.ecms.entity.TeacherSubject;
import vn.edu.uth.ecms.exception.DuplicateException;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.SubjectRepository;
import vn.edu.uth.ecms.repository.TeacherRepository;
import vn.edu.uth.ecms.repository.TeacherSubjectRepository;
import vn.edu.uth.ecms.service.TeacherSubjectService;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of TeacherSubjectService
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TeacherSubjectServiceImpl implements TeacherSubjectService {

    private final TeacherSubjectRepository teacherSubjectRepository;
    private final TeacherRepository teacherRepository;
    private final SubjectRepository subjectRepository;

    /**
     * Map TeacherSubject entity to response DTO
     */
    private TeacherSubjectResponse mapToResponse(TeacherSubject teacherSubject) {
        return TeacherSubjectResponse.builder()
                .teacherSubjectId(teacherSubject.getTeacherSubjectId())
                .teacherId(teacherSubject.getTeacher().getTeacherId())
                .teacherName(teacherSubject.getTeacher().getFullName())
                .teacherCitizenId(teacherSubject.getTeacher().getCitizenId())
                .subjectId(teacherSubject.getSubject().getSubjectId())
                .subjectCode(teacherSubject.getSubject().getSubjectCode())
                .subjectName(teacherSubject.getSubject().getSubjectName())
                .credits(teacherSubject.getSubject().getCredits())
                .isPrimary(teacherSubject.getIsPrimary())
                .notes(teacherSubject.getNotes())
                .build();
    }

    @Override
    public TeacherSubjectResponse addSubjectToTeacher(Long teacherId, TeacherSubjectRequest request) {
        log.info("Adding subject {} to teacher {}", request.getSubjectId(), teacherId);

        // Validate teacher exists
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new NotFoundException("Teacher not found with ID: " + teacherId));

        // Validate subject exists
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new NotFoundException("Subject not found with ID: " + request.getSubjectId()));

        // Check if relationship already exists
        if (teacherSubjectRepository.existsByTeacherTeacherIdAndSubjectSubjectId(teacherId, request.getSubjectId())) {
            throw new DuplicateException("Teacher already teaches this subject");
        }

        // Create relationship
        TeacherSubject teacherSubject = TeacherSubject.builder()
                .teacher(teacher)
                .subject(subject)
                .isPrimary(request.getIsPrimary())
                .notes(request.getNotes())
                .build();

        TeacherSubject saved = teacherSubjectRepository.save(teacherSubject);
        log.info("Subject {} added to teacher {} successfully", request.getSubjectId(), teacherId);

        return mapToResponse(saved);
    }

    @Override
    public List<TeacherSubjectResponse> addSubjectsToTeacher(Long teacherId, List<TeacherSubjectRequest> requests) {
        log.info("Adding {} subjects to teacher {}", requests.size(), teacherId);

        List<TeacherSubjectResponse> responses = new ArrayList<>();
        for (TeacherSubjectRequest request : requests) {
            try {
                TeacherSubjectResponse response = addSubjectToTeacher(teacherId, request);
                responses.add(response);
            } catch (DuplicateException e) {
                log.warn("Skipping duplicate subject {} for teacher {}", request.getSubjectId(), teacherId);
            }
        }

        return responses;
    }

    @Override
    public void removeSubjectFromTeacher(Long teacherId, Long subjectId) {
        log.info("Removing subject {} from teacher {}", subjectId, teacherId);

        // Validate relationship exists
        if (!teacherSubjectRepository.existsByTeacherTeacherIdAndSubjectSubjectId(teacherId, subjectId)) {
            throw new NotFoundException("Teacher does not teach this subject");
        }

        teacherSubjectRepository.deleteByTeacherTeacherIdAndSubjectSubjectId(teacherId, subjectId);
        log.info("Subject {} removed from teacher {} successfully", subjectId, teacherId);
    }

    @Override
    public TeacherSubjectResponse updateTeacherSubject(Long teacherId, Long subjectId, TeacherSubjectRequest request) {
        log.info("Updating teacher-subject relationship: teacher={}, subject={}", teacherId, subjectId);

        TeacherSubject teacherSubject = teacherSubjectRepository
                .findByTeacherTeacherIdAndSubjectSubjectId(teacherId, subjectId)
                .orElseThrow(() -> new NotFoundException("Teacher-subject relationship not found"));

        teacherSubject.setIsPrimary(request.getIsPrimary());
        teacherSubject.setNotes(request.getNotes());

        TeacherSubject updated = teacherSubjectRepository.save(teacherSubject);
        log.info("Teacher-subject relationship updated successfully");

        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherSubjectResponse> getSubjectsByTeacher(Long teacherId) {
        log.info("Getting subjects for teacher {}", teacherId);

        return teacherSubjectRepository.findByTeacherTeacherId(teacherId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherSubjectResponse> getTeachersBySubject(Long subjectId) {
        log.info("Getting teachers for subject {}", subjectId);

        return teacherSubjectRepository.findBySubjectSubjectId(subjectId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherSubjectResponse> getQualifiedTeachers(Long subjectId) {
        log.info("Getting qualified teachers for subject {}", subjectId);

        return teacherSubjectRepository.findQualifiedTeachersForSubject(subjectId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TeacherSubjectResponse> replaceTeacherSubjects(Long teacherId, List<TeacherSubjectRequest> requests) {
        log.info("Replacing all subjects for teacher {}", teacherId);

        // Validate teacher exists
        if (!teacherRepository.existsById(teacherId)) {
            throw new NotFoundException("Teacher not found with ID: " + teacherId);
        }

        // Delete all existing relationships
        teacherSubjectRepository.deleteByTeacherTeacherId(teacherId);

        // Add new relationships
        return addSubjectsToTeacher(teacherId, requests);
    }
}