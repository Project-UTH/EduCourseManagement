package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.DepartmentCreateRequest;
import vn.edu.uth.ecms.dto.request.DepartmentUpdateRequest;
import vn.edu.uth.ecms.dto.response.DepartmentResponse;
import vn.edu.uth.ecms.entity.Department;
import vn.edu.uth.ecms.exception.ResourceNotFoundException;
import vn.edu.uth.ecms.exception.DuplicateResourceException;
import vn.edu.uth.ecms.repository.DepartmentRepository;
import vn.edu.uth.ecms.service.DepartmentService;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of DepartmentService
 * Phase 3 Sprint 3.1
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;

    @Override
    public DepartmentResponse createDepartment(DepartmentCreateRequest request) {
        log.info("Creating department with code: {}", request.getDepartmentCode());

        // Check if department code already exists
        if (departmentRepository.existsByDepartmentCode(request.getDepartmentCode())) {
            throw new DuplicateResourceException(
                    "Department with code '" + request.getDepartmentCode() + "' already exists"
            );
        }

        // Create new department
        Department department = Department.builder()
                .departmentCode(request.getDepartmentCode())
                .departmentName(request.getDepartmentName())
                .knowledgeType(request.getKnowledgeType())
                .description(request.getDescription())
                .build();

        Department savedDepartment = departmentRepository.save(department);
        log.info("Department created successfully with ID: {}", savedDepartment.getDepartmentId());

        return mapToResponse(savedDepartment);
    }

    @Override
    public DepartmentResponse updateDepartment(Long id, DepartmentUpdateRequest request) {
        log.info("Updating department with ID: {}", id);

        // Find existing department
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));

        // Check if new code conflicts with existing department
        if (!department.getDepartmentCode().equals(request.getDepartmentCode()) &&
                departmentRepository.existsByDepartmentCode(request.getDepartmentCode())) {
            throw new DuplicateResourceException(
                    "Department with code '" + request.getDepartmentCode() + "' already exists"
            );
        }

        // Update fields
        department.setDepartmentCode(request.getDepartmentCode());
        department.setDepartmentName(request.getDepartmentName());
        department.setKnowledgeType(request.getKnowledgeType());
        department.setDescription(request.getDescription());

        Department updatedDepartment = departmentRepository.save(department);
        log.info("Department updated successfully: {}", id);

        return mapToResponse(updatedDepartment);
    }

    @Override
    public void deleteDepartment(Long id) {
        log.info("Deleting department with ID: {}", id);

        // Check if department exists
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Department not found with ID: " + id);
        }

        // TODO: Check if department has related data (majors, teachers) before deleting
        // For now, just delete
        departmentRepository.deleteById(id);
        log.info("Department deleted successfully: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentResponse getDepartmentById(Long id) {
        log.info("Fetching department with ID: {}", id);

        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with ID: " + id));

        return mapToResponse(department);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DepartmentResponse> getAllDepartments(Pageable pageable) {
        log.info("Fetching all departments with pagination");

        Page<Department> departments = departmentRepository.findAll(pageable);
        return departments.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        log.info("Fetching all departments without pagination");

        List<Department> departments = departmentRepository.findAll();
        return departments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DepartmentResponse> searchDepartments(String keyword, Pageable pageable) {
        log.info("Searching departments with keyword: {}", keyword);

        Page<Department> departments = departmentRepository
                .findByDepartmentCodeContainingOrDepartmentNameContaining(keyword, keyword, pageable);

        return departments.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByDepartmentCode(String departmentCode) {
        return departmentRepository.existsByDepartmentCode(departmentCode);
    }

    /**
     * Map Department entity to DepartmentResponse DTO
     */
    private DepartmentResponse mapToResponse(Department department) {
        return DepartmentResponse.builder()
                .departmentId(department.getDepartmentId())
                .departmentCode(department.getDepartmentCode())
                .departmentName(department.getDepartmentName())
                .knowledgeType(department.getKnowledgeType())
                .description(department.getDescription())
                .createdAt(department.getCreatedAt())
                .updatedAt(department.getUpdatedAt())
                // TODO: Add statistics (totalMajors, totalTeachers, totalStudents) later
                .build();
    }
}