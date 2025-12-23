package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.MajorCreateRequest;
import vn.edu.uth.ecms.dto.request.MajorUpdateRequest;
import vn.edu.uth.ecms.dto.response.MajorResponse;
import vn.edu.uth.ecms.entity.Department;
import vn.edu.uth.ecms.entity.Major;
import vn.edu.uth.ecms.exception.DuplicateResourceException;
import vn.edu.uth.ecms.exception.ResourceNotFoundException;
import vn.edu.uth.ecms.repository.DepartmentRepository;
import vn.edu.uth.ecms.repository.MajorRepository;
import vn.edu.uth.ecms.service.MajorService;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of MajorService
 * Phase 3 Sprint 3.1
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MajorServiceImpl implements MajorService {

    private final MajorRepository majorRepository;
    private final DepartmentRepository departmentRepository;


    @Override
    @Transactional(timeout = 30)  // ← THÊM timeout
    public MajorResponse createMajor(MajorCreateRequest request) {
        log.info("Creating major with code: {}", request.getMajorCode());

        // Check if major code already exists
        if (majorRepository.existsByMajorCode(request.getMajorCode())) {
            throw new DuplicateResourceException(
                    "Major with code '" + request.getMajorCode() + "' already exists"
            );
        }

        // Find department
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found with ID: " + request.getDepartmentId()
                ));

        // Create new major
        Major major = Major.builder()
                .majorCode(request.getMajorCode())
                .majorName(request.getMajorName())
                .department(department)
                .description(request.getDescription())
                .build();

        log.info("🔍 [createMajor] About to save major...");
        Major savedMajor = majorRepository.save(major);

        log.info("✅ [createMajor] Major saved with ID: {}", savedMajor.getMajorId());

        // Force flush to database
        majorRepository.flush();
        log.info("✅ [createMajor] Flush completed");

        // Force load department to avoid lazy loading issues
        String deptName = savedMajor.getDepartment().getDepartmentName();
        log.info("✅ [createMajor] Department pre-loaded: {}", deptName);

        log.info("🔍 [createMajor] About to map to response...");
        MajorResponse response = mapToResponse(savedMajor);

        log.info("✅ [createMajor] Major created successfully: {}", response.getMajorName());
        return response;
    }

    @Override
    public MajorResponse updateMajor(Long id, MajorUpdateRequest request) {
        log.info("Updating major with ID: {}", id);

        // Find existing major
        Major major = majorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Major not found with ID: " + id));

        // Check if new code conflicts with existing major
        if (!major.getMajorCode().equals(request.getMajorCode()) &&
                majorRepository.existsByMajorCode(request.getMajorCode())) {
            throw new DuplicateResourceException(
                    "Major with code '" + request.getMajorCode() + "' already exists"
            );
        }

        // Find department (in case it changed)
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Department not found with ID: " + request.getDepartmentId()
                ));

        // Update fields
        major.setMajorCode(request.getMajorCode());
        major.setMajorName(request.getMajorName());
        major.setDepartment(department);
        major.setDescription(request.getDescription());

        Major updatedMajor = majorRepository.save(major);
        log.info("Major updated successfully: {}", id);

        return mapToResponse(updatedMajor);
    }

    @Override
    public void deleteMajor(Long id) {
        log.info("Deleting major with ID: {}", id);

        // Check if major exists
        if (!majorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Major not found with ID: " + id);
        }

        // TODO: Check if major has related data (students, teachers) before deleting
        // For now, just delete
        majorRepository.deleteById(id);
        log.info("Major deleted successfully: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public MajorResponse getMajorById(Long id) {
        log.info("Fetching major with ID: {}", id);

        Major major = majorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Major not found with ID: " + id));

        return mapToResponse(major);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MajorResponse> getAllMajors(Pageable pageable) {
        log.info("Fetching all majors with pagination");

        Page<Major> majors = majorRepository.findAll(pageable);
        return majors.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MajorResponse> getAllMajors() {
        log.info("Fetching all majors without pagination");

        List<Major> majors = majorRepository.findAll();
        return majors.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MajorResponse> getMajorsByDepartmentId(Long departmentId) {
        log.info("Fetching majors for department ID: {}", departmentId);

        // Verify department exists
        if (!departmentRepository.existsById(departmentId)) {
            throw new ResourceNotFoundException("Department not found with ID: " + departmentId);
        }

        List<Major> majors = majorRepository.findByDepartmentDepartmentId(departmentId);
        return majors.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MajorResponse> searchMajors(String keyword, Pageable pageable) {
        log.info("Searching majors with keyword: {}", keyword);

        Page<Major> majors = majorRepository
                .findByMajorCodeContainingOrMajorNameContaining(keyword, keyword, pageable);

        return majors.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByMajorCode(String majorCode) {
        return majorRepository.existsByMajorCode(majorCode);
    }

    /**
     * Map Major entity to MajorResponse DTO
     */
    private MajorResponse mapToResponse(Major major) {
        log.info("🔍 [mapToResponse] START - Major ID: {}", major.getMajorId());

        try {
            log.info("🔍 [mapToResponse] Getting department...");
            Department dept = major.getDepartment();

            log.info("✅ [mapToResponse] Department loaded: {} - {}",
                    dept.getDepartmentCode(), dept.getDepartmentName());

            MajorResponse response = MajorResponse.builder()
                    .majorId(major.getMajorId())
                    .majorCode(major.getMajorCode())
                    .majorName(major.getMajorName())
                    .description(major.getDescription())
                    // Department info
                    .departmentId(dept.getDepartmentId())
                    .departmentCode(dept.getDepartmentCode())
                    .departmentName(dept.getDepartmentName())
                    .createdAt(major.getCreatedAt())
                    .updatedAt(major.getUpdatedAt())
                    .build();

            log.info("✅ [mapToResponse] DONE - Response built successfully");
            return response;

        } catch (Exception e) {
            log.error("❌ [mapToResponse] ERROR: {}", e.getMessage(), e);
            throw e;
        }
    }
}