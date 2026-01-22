package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.SubjectCreateRequest;
import vn.edu.uth.ecms.dto.request.SubjectUpdateRequest;
import vn.edu.uth.ecms.dto.response.SubjectResponse;
import vn.edu.uth.ecms.dto.response.TeacherResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.exception.DuplicateResourceException;
import vn.edu.uth.ecms.exception.InvalidRequestException;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.exception.ResourceNotFoundException;
import vn.edu.uth.ecms.repository.*;
import vn.edu.uth.ecms.service.SubjectService;

import java.util.HashSet;
import java.util.Set;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of SubjectService
 * Phase 3 Sprint 3.2 - Version 2
 *
 * Changes:
 * - Added Major support
 * - Replaced hours with sessions
 * - Added auto-calculation for sessions based on credits
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;
    private final DepartmentRepository departmentRepository;
    private final MajorRepository majorRepository;
    private final SubjectPrerequisiteRepository prerequisiteRepository;
    private final TeacherSubjectRepository teacherSubjectRepository;

    @Override
    @Transactional(timeout = 30)
    public SubjectResponse createSubject(SubjectCreateRequest request) {
        log.info("Creating subject with code: {}", request.getSubjectCode());

        // Check if subject code already exists
        if (subjectRepository.existsBySubjectCode(request.getSubjectCode())) {
            throw new DuplicateResourceException(
                    "Subject with code '" + request.getSubjectCode() + "' already exists"
            );
        }

        // Find department
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found with ID: " + request.getDepartmentId()
                ));

        // Find major if provided
        Major major = null;
        if (request.getMajorId() != null) {
            major = majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Major not found with ID: " + request.getMajorId()
                    ));
        }

        // AUTO-CALCULATE SESSIONS if not provided or validation failed
        int totalSessions = request.getTotalSessions();
        int elearningSessions = request.getElearningSessions();
        int inpersonSessions = request.getInpersonSessions();

        // Validate and auto-fix if needed
        if (totalSessions != (elearningSessions + inpersonSessions)) {
            log.warn("Session sum mismatch. Auto-calculating based on credits: {}", request.getCredits());
            SessionCalculation calc = calculateSessions(request.getCredits());
            totalSessions = calc.total;
            elearningSessions = calc.elearning;
            inpersonSessions = calc.inperson;
        }

        // Create subject
        Subject subject = Subject.builder()
                .subjectCode(request.getSubjectCode())
                .subjectName(request.getSubjectName())
                .credits(request.getCredits())
                .totalSessions(totalSessions)
                .elearningSessions(elearningSessions)
                .inpersonSessions(inpersonSessions)
                .department(department)
                .major(major)
                .description(request.getDescription())
                .build();

        log.info("About to save subject...");
        Subject savedSubject = subjectRepository.save(subject);
        log.info("Subject saved with ID: {}", savedSubject.getSubjectId());

        // Force flush
        subjectRepository.flush();
        log.info("Flush completed");

        // Force load department
        String deptName = savedSubject.getDepartment().getDepartmentName();
        log.info("Department pre-loaded: {}", deptName);

        // Force load major if exists
        if (savedSubject.getMajor() != null) {
            String majorName = savedSubject.getMajor().getMajorName();
            log.info("Major pre-loaded: {}", majorName);
        }

        log.info("About to map to response...");
        SubjectResponse response = mapToResponse(savedSubject);

        log.info("Subject created successfully: {}", response.getSubjectName());
        return response;
    }

    @Override
    @Transactional(timeout = 30)
    public SubjectResponse updateSubject(Long id, SubjectUpdateRequest request) {
        log.info("Updating subject with ID: {}", id);

        // Find existing subject
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with ID: " + id));

        // Find department
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found with ID: " + request.getDepartmentId()
                ));

        // Find major if provided
        Major major = null;
        if (request.getMajorId() != null) {
            major = majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Major not found with ID: " + request.getMajorId()
                    ));
        }

        // AUTO-CALCULATE SESSIONS if validation failed
        int totalSessions = request.getTotalSessions();
        int elearningSessions = request.getElearningSessions();
        int inpersonSessions = request.getInpersonSessions();

        if (totalSessions != (elearningSessions + inpersonSessions)) {
            log.warn("Session sum mismatch. Auto-calculating based on credits: {}", request.getCredits());
            SessionCalculation calc = calculateSessions(request.getCredits());
            totalSessions = calc.total;
            elearningSessions = calc.elearning;
            inpersonSessions = calc.inperson;
        }

        // Update fields
        subject.setSubjectName(request.getSubjectName());
        subject.setCredits(request.getCredits());
        subject.setTotalSessions(totalSessions);
        subject.setElearningSessions(elearningSessions);
        subject.setInpersonSessions(inpersonSessions);
        subject.setDepartment(department);
        subject.setMajor(major);
        subject.setDescription(request.getDescription());

        Subject updatedSubject = subjectRepository.save(subject);
        subjectRepository.flush();

        // Force load department
        updatedSubject.getDepartment().getDepartmentName();

        // Force load major if exists
        if (updatedSubject.getMajor() != null) {
            updatedSubject.getMajor().getMajorName();
        }

        log.info("Subject updated successfully: {}", id);
        return mapToResponse(updatedSubject);
    }

    @Override
    public void deleteSubject(Long id) {
        log.info("Deleting subject with ID: {}", id);

        if (!subjectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Subject not found with ID: " + id);
        }

        subjectRepository.deleteById(id);
        log.info("Subject deleted successfully: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectResponse getSubjectById(Long id) {
        log.info("Fetching subject with ID: {}", id);

        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with ID: " + id));

        return mapToResponse(subject);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SubjectResponse> getAllSubjects(Pageable pageable) {
        log.info("Fetching all subjects with pagination");

        Page<Subject> subjects = subjectRepository.findAll(pageable);
        return subjects.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponse> getAllSubjects() {
        log.info("Fetching all subjects without pagination");

        List<Subject> subjects = subjectRepository.findAll();
        return subjects.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponse> getSubjectsByDepartmentId(Long departmentId) {
        log.info("Fetching subjects for department ID: {}", departmentId);

        if (!departmentRepository.existsById(departmentId)) {
            throw new ResourceNotFoundException("Department not found with ID: " + departmentId);
        }

        List<Subject> subjects = subjectRepository.findByDepartmentDepartmentId(departmentId);
        return subjects.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SubjectResponse> searchSubjects(String keyword, Pageable pageable) {
        log.info("Searching subjects with keyword: {}", keyword);

        Page<Subject> subjects = subjectRepository
                .findBySubjectCodeContainingOrSubjectNameContaining(keyword, keyword, pageable);

        return subjects.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsBySubjectCode(String subjectCode) {
        return subjectRepository.existsBySubjectCode(subjectCode);
    }

    /**
     * Add prerequisite to subject
     */
    @Override
    @Transactional
    public void addPrerequisite(Long subjectId, Long prerequisiteId) {
        log.info("[SubjectService] Adding prerequisite {} to subject {}", prerequisiteId, subjectId);

        if (subjectId.equals(prerequisiteId)) {
            throw new InvalidRequestException("Subject cannot be its own prerequisite");
        }

        Subject subject = findSubjectById(subjectId);
        Subject prerequisite = findSubjectById(prerequisiteId);

        if (prerequisiteRepository.existsBySubject_SubjectIdAndPrerequisiteSubject_SubjectId(
                subjectId, prerequisiteId)) {
            throw new DuplicateResourceException("Prerequisite already exists");
        }

        if (wouldCreateCircularDependency(subjectId, prerequisiteId)) {
            throw new InvalidRequestException(
                    "Cannot add prerequisite: Would create circular dependency");
        }

        SubjectPrerequisite sp = new SubjectPrerequisite();
        sp.setSubject(subject);
        sp.setPrerequisiteSubject(prerequisite);

        prerequisiteRepository.save(sp);
        log.info("[SubjectService] Added prerequisite successfully");
    }

    /**
     * Remove prerequisite from subject
     */
    @Override
    @Transactional
    public void removePrerequisite(Long subjectId, Long prerequisiteId) {
        log.info("[SubjectService] Removing prerequisite {} from subject {}", prerequisiteId, subjectId);

        if (!prerequisiteRepository.existsBySubject_SubjectIdAndPrerequisiteSubject_SubjectId(
                subjectId, prerequisiteId)) {
            throw new ResourceNotFoundException("Prerequisite relationship not found");
        }

        prerequisiteRepository.deleteBySubject_SubjectIdAndPrerequisiteSubject_SubjectId(
                subjectId, prerequisiteId);

        log.info("[SubjectService] Removed prerequisite successfully");
    }

    /**
     * Get all prerequisites for a subject
     */
    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponse> getPrerequisites(Long subjectId) {
        log.info("[SubjectService] Getting prerequisites for subject {}", subjectId);

        findSubjectById(subjectId);

        List<SubjectPrerequisite> prerequisites = prerequisiteRepository
                .findBySubject_SubjectId(subjectId);

        return prerequisites.stream()
                .map(sp -> mapToResponse(sp.getPrerequisiteSubject()))
                .collect(Collectors.toList());
    }

    /**
     * Check if subject has prerequisites
     */
    @Override
    @Transactional(readOnly = true)
    public boolean hasPrerequisites(Long subjectId) {
        List<SubjectPrerequisite> prerequisites = prerequisiteRepository
                .findBySubject_SubjectId(subjectId);
        return !prerequisites.isEmpty();
    }

    /**
     * Helper: Check if adding prerequisite would create circular dependency
     */
    private boolean wouldCreateCircularDependency(Long subjectId, Long newPrerequisiteId) {
        Set<Long> visited = new HashSet<>();
        return hasPath(newPrerequisiteId, subjectId, visited);
    }

    /**
     * Helper: DFS to detect cycle
     */
    private boolean hasPath(Long from, Long to, Set<Long> visited) {
        if (from.equals(to)) {
            return true;
        }

        if (visited.contains(from)) {
            return false;
        }

        visited.add(from);

        List<SubjectPrerequisite> prerequisites = prerequisiteRepository
                .findBySubject_SubjectId(from);

        for (SubjectPrerequisite sp : prerequisites) {
            if (hasPath(sp.getPrerequisiteSubject().getSubjectId(), to, visited)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Map Subject entity to SubjectResponse DTO
     */
    private SubjectResponse mapToResponse(Subject subject) {
        log.info("mapToResponse START - Subject ID: {}", subject.getSubjectId());

        try {
            log.info("Getting department...");
            Department dept = subject.getDepartment();
            log.info("Department loaded: {} - {}", dept.getDepartmentCode(), dept.getDepartmentName());

            // Load major info (nullable)
            Major major = subject.getMajor();
            Long majorId = null;
            String majorCode = null;
            String majorName = null;

            if (major != null) {
                majorId = major.getMajorId();
                majorCode = major.getMajorCode();
                majorName = major.getMajorName();
                log.info("Major loaded: {} - {}", majorCode, majorName);
            }

           SubjectResponse response = SubjectResponse.builder()
        .subjectId(subject.getSubjectId())
        .subjectCode(subject.getSubjectCode())
        .subjectName(subject.getSubjectName())
        .credits(subject.getCredits())
        .totalSessions(subject.getTotalSessions())
        .elearningSessions(subject.getElearningSessions())
        .inpersonSessions(subject.getInpersonSessions())
        // Department info
        .departmentId(dept.getDepartmentId())
        .departmentCode(dept.getDepartmentCode())
        .departmentName(dept.getDepartmentName())
        .departmentKnowledgeType(dept.getKnowledgeType() != null ? dept.getKnowledgeType().name() : null)  // ← ĐÚNG!
        // Major info
        .majorId(majorId)
        .majorCode(majorCode)
        .majorName(majorName)
        .description(subject.getDescription())
        .createdAt(subject.getCreatedAt())
        .updatedAt(subject.getUpdatedAt())
        .build();

log.info("✅ Mapped knowledge_type: {}", response.getDepartmentKnowledgeType());
log.info("mapToResponse DONE");
            return response;

        } catch (Exception e) {
            log.error("mapToResponse ERROR: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Helper method: Find subject by ID or throw exception
     */
    private Subject findSubjectById(Long subjectId) {
        return subjectRepository.findById(subjectId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Subject not found with ID: " + subjectId
                ));
    }

    /**
     * BACKEND AUTO-CALCULATION: Calculate sessions based on credits
     *
     * Rules:
     * - 2 credits = 10 sessions (5 E-Learning + 5 In-person)
     * - 3 credits = 15 sessions (5 E-Learning + 10 In-person)
     * - 4 credits = 20 sessions (5 E-Learning + 15 In-person)
     * - Other credits = 5 sessions per credit (1/3 E-Learning)
     */
    private SessionCalculation calculateSessions(int credits) {
        switch (credits) {
            case 2:
                return new SessionCalculation(10, 5, 5);
            case 3:
                return new SessionCalculation(15, 5, 10);
            case 4:
                return new SessionCalculation(20, 5, 15);
            default:
                int total = credits * 5;
                int elearning = Math.max(1, total / 3);
                int inperson = total - elearning;
                return new SessionCalculation(total, elearning, inperson);
        }
    }

    /**
     * Inner class for session calculation result
     */
    private static class SessionCalculation {
        final int total;
        final int elearning;
        final int inperson;

        SessionCalculation(int total, int elearning, int inperson) {
            this.total = total;
            this.elearning = elearning;
            this.inperson = inperson;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherResponse> getTeachersForSubject(Long subjectId) {
        log.info("🔍 Finding teachers for subject ID: {}", subjectId);

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new NotFoundException("Subject not found"));

        List<Teacher> teachers = teacherSubjectRepository.findTeachersBySubjectId(subjectId);

        log.info("✅ Found {} teachers for subject {}", teachers.size(), subject.getSubjectCode());

        return teachers.stream()
                .map(this::mapTeacherToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public long countAll() {
        return subjectRepository.count();
    }

    private TeacherResponse mapTeacherToResponse(Teacher teacher) {
        TeacherResponse.TeacherResponseBuilder builder = TeacherResponse.builder()
                .teacherId(teacher.getTeacherId())
                .fullName(teacher.getFullName())
                .email(teacher.getEmail())
                .phone(teacher.getPhone())
                .degree(teacher.getDegree())
                .departmentId(teacher.getDepartment().getDepartmentId())
                .departmentName(teacher.getDepartment().getDepartmentName());

        if (teacher.getMajor() != null) {
            builder.majorId(teacher.getMajor().getMajorId())
                    .majorName(teacher.getMajor().getMajorName());
        }

        return builder.build();
    }
}