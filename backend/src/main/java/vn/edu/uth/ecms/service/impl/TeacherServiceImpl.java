package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.TeacherCreateRequest;
import vn.edu.uth.ecms.dto.request.TeacherUpdateRequest;
import vn.edu.uth.ecms.dto.response.TeacherResponse;
import vn.edu.uth.ecms.dto.response.TeacherSubjectResponse;
import vn.edu.uth.ecms.entity.Department;
import vn.edu.uth.ecms.entity.Major;
import vn.edu.uth.ecms.entity.Teacher;
import vn.edu.uth.ecms.entity.TeacherSubject;
import vn.edu.uth.ecms.exception.BadRequestException;
import vn.edu.uth.ecms.exception.DuplicateException;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.DepartmentRepository;
import vn.edu.uth.ecms.repository.MajorRepository;
import vn.edu.uth.ecms.repository.TeacherRepository;
import vn.edu.uth.ecms.repository.TeacherSubjectRepository;
import vn.edu.uth.ecms.service.TeacherService;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of TeacherService
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository teacherRepository;
    private final DepartmentRepository departmentRepository;
    private final MajorRepository majorRepository;
    private final PasswordEncoder passwordEncoder;
    private final TeacherSubjectRepository teacherSubjectRepository;

    /**
     * Generate default password from date of birth
     * Format: ddMMyyyy
     */
    private String generateDefaultPassword(LocalDate dateOfBirth) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("ddMMyyyy");
        return dateOfBirth.format(formatter);
    }

    /**
     * Map Teacher entity to TeacherResponse DTO
     */
    private TeacherResponse mapToResponse(Teacher teacher) {
        TeacherResponse.TeacherResponseBuilder builder = TeacherResponse.builder()
                .teacherId(teacher.getTeacherId())
                .citizenId(teacher.getCitizenId())
                .fullName(teacher.getFullName())
                .gender(teacher.getGender())
                .dateOfBirth(teacher.getDateOfBirth())
                .email(teacher.getEmail())
                .phone(teacher.getPhone())
                .departmentId(teacher.getDepartment().getDepartmentId())
                .departmentCode(teacher.getDepartment().getDepartmentCode())
                .departmentName(teacher.getDepartment().getDepartmentName())
                .degree(teacher.getDegree())
                .address(teacher.getAddress())
                .avatarUrl(teacher.getAvatarUrl())
                .isFirstLogin(teacher.getIsFirstLogin())
                .isActive(teacher.getIsActive())
                .createdAt(teacher.getCreatedAt())
                .updatedAt(teacher.getUpdatedAt());

        // Add major info if exists
        if (teacher.getMajor() != null) {
            builder.majorId(teacher.getMajor().getMajorId())
                    .majorCode(teacher.getMajor().getMajorCode())
                    .majorName(teacher.getMajor().getMajorName());
        }

        // Add subjects list
        if (teacher.getTeacherSubjects() != null && !teacher.getTeacherSubjects().isEmpty()) {
            List<TeacherSubjectResponse> subjects = teacher.getTeacherSubjects().stream()
                    .map(this::mapTeacherSubjectToResponse)
                    .collect(Collectors.toList());
            builder.subjects(subjects);
        }

        return builder.build();
    }

    /**
     * Map TeacherSubject entity to TeacherSubjectResponse DTO
     */
    private TeacherSubjectResponse mapTeacherSubjectToResponse(TeacherSubject teacherSubject) {
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
                .yearsOfExperience(teacherSubject.getYearsOfExperience())
                .notes(teacherSubject.getNotes())
                .build();
    }

    /**
     * Validate that major belongs to department
     */
    private void validateMajorBelongsToDepartment(Major major, Department department) {
        if (!major.getDepartment().getDepartmentId().equals(department.getDepartmentId())) {
            throw new BadRequestException(
                    String.format("Major '%s' does not belong to department '%s'",
                            major.getMajorName(), department.getDepartmentName())
            );
        }
    }

    // Service methods implementation will continue in next parts...

    @Override
    public TeacherResponse createTeacher(TeacherCreateRequest request) {
        log.info("Creating teacher with citizen ID: {}", request.getCitizenId());

        // 1. Validate citizen ID is unique
        if (teacherRepository.existsByCitizenId(request.getCitizenId())) {
            throw new DuplicateException("Citizen ID already exists: " + request.getCitizenId());
        }

        // 2. Find and validate department
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new NotFoundException("Department not found with ID: " + request.getDepartmentId()));

        // 3. Find and validate major (if provided)
        Major major = null;
        if (request.getMajorId() != null) {
            major = majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new NotFoundException("Major not found with ID: " + request.getMajorId()));

            // Validate major belongs to department
            validateMajorBelongsToDepartment(major, department);
        }

        // 4. Generate default password (ddMMyyyy from date of birth)
        String defaultPassword = generateDefaultPassword(request.getDateOfBirth());
        String hashedPassword = passwordEncoder.encode(defaultPassword);

        // 5. Build teacher entity
        Teacher teacher = Teacher.builder()
                .citizenId(request.getCitizenId())
                .password(hashedPassword)
                .fullName(request.getFullName())
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .email(request.getEmail())
                .phone(request.getPhone())
                .department(department)
                .major(major)
                .degree(request.getDegree())
                .address(request.getAddress())
                .isFirstLogin(true)
                .isActive(true)
                .build();

        // 6. Save and return
        Teacher savedTeacher = teacherRepository.save(teacher);
        log.info("Teacher created successfully with ID: {}", savedTeacher.getTeacherId());

        return mapToResponse(savedTeacher);
    }

    @Override
    public TeacherResponse updateTeacher(Long id, TeacherUpdateRequest request) {
        log.info("Updating teacher with ID: {}", id);

        // 1. Find existing teacher
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Teacher not found with ID: " + id));

        // 2. Update department (validate if changed)
        Department newDepartment = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new NotFoundException("Department not found with ID: " + request.getDepartmentId()));

        // If department changed, reset major to null
        if (!teacher.getDepartment().getDepartmentId().equals(newDepartment.getDepartmentId())) {
            log.info("Department changed, resetting major to null");
            teacher.setDepartment(newDepartment);
            teacher.setMajor(null);
        }

        // 3. Update major (validate cascade)
        if (request.getMajorId() != null) {
            Major major = majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new NotFoundException("Major not found with ID: " + request.getMajorId()));

            // Validate major belongs to current department
            validateMajorBelongsToDepartment(major, teacher.getDepartment());
            teacher.setMajor(major);
        } else {
            teacher.setMajor(null);
        }

        // 4. Update other fields
        teacher.setFullName(request.getFullName());
        teacher.setGender(request.getGender());
        teacher.setDateOfBirth(request.getDateOfBirth());
        teacher.setEmail(request.getEmail());
        teacher.setPhone(request.getPhone());
        teacher.setDegree(request.getDegree());
        teacher.setAddress(request.getAddress());

        // 5. Save and return
        Teacher updatedTeacher = teacherRepository.save(teacher);
        log.info("Teacher updated successfully with ID: {}", updatedTeacher.getTeacherId());

        return mapToResponse(updatedTeacher);
    }

    @Override
    public void deleteTeacher(Long id) {
        log.info("Deleting teacher with ID: {}", id);

        // 1. Find teacher
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Teacher not found with ID: " + id));

        // 2. Soft delete (set isActive = false)
        teacher.setIsActive(false);
        teacherRepository.save(teacher);

        log.info("Teacher soft deleted successfully with ID: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherResponse getTeacherById(Long id) {
        log.info("Getting teacher with ID: {}", id);

        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Teacher not found with ID: " + id));

        return mapToResponse(teacher);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TeacherResponse> getAllTeachers(Pageable pageable) {
        log.info("Getting all teachers with pagination: page={}, size={}",
                pageable.getPageNumber(), pageable.getPageSize());

        return teacherRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherResponse> getTeachersByDepartment(Long departmentId) {
        log.info("Getting teachers by department ID: {}", departmentId);

        // Validate department exists
        if (!departmentRepository.existsById(departmentId)) {
            throw new NotFoundException("Department not found with ID: " + departmentId);
        }

        return teacherRepository.findByDepartmentDepartmentId(departmentId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherResponse> getTeachersByMajor(Long majorId) {
        log.info("Getting teachers by major ID: {}", majorId);

        // Validate major exists
        if (!majorRepository.existsById(majorId)) {
            throw new NotFoundException("Major not found with ID: " + majorId);
        }

        return teacherRepository.findByMajorMajorId(majorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TeacherResponse> searchTeachers(String keyword, Pageable pageable) {
        log.info("Searching teachers with keyword: {}", keyword);

        return teacherRepository.searchTeachers(keyword, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherResponse> getActiveTeachers() {
        log.info("Getting all active teachers");

        return teacherRepository.findByIsActiveTrue()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
}