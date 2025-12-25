package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.SemesterCreateRequest;
import vn.edu.uth.ecms.dto.request.SemesterUpdateRequest;
import vn.edu.uth.ecms.dto.response.SemesterResponse;
import vn.edu.uth.ecms.entity.Semester;
import vn.edu.uth.ecms.entity.SemesterStatus;
import vn.edu.uth.ecms.exception.DuplicateResourceException;
import vn.edu.uth.ecms.exception.InvalidRequestException;
import vn.edu.uth.ecms.exception.ResourceNotFoundException;
import vn.edu.uth.ecms.repository.SemesterRepository;
import vn.edu.uth.ecms.service.SemesterService;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Semester Service Implementation
 * FIXED: Removed Subject prerequisite methods (they belong to SubjectServiceImpl)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SemesterServiceImpl implements SemesterService {

    private final SemesterRepository semesterRepository;

    @Override
    @Transactional
    public SemesterResponse createSemester(SemesterCreateRequest request) {
        log.info("[SemesterService] Creating semester: {}", request.getSemesterCode());

        if (semesterRepository.existsBySemesterCode(request.getSemesterCode())) {
            throw new DuplicateResourceException("Semester code already exists: " + request.getSemesterCode());
        }

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new InvalidRequestException("End date must be after start date");
        }

        Semester semester = new Semester();
        semester.setSemesterCode(request.getSemesterCode());
        semester.setSemesterName(request.getSemesterName());
        semester.setStartDate(request.getStartDate());
        semester.setEndDate(request.getEndDate());
        semester.setDescription(request.getDescription());
        semester.setStatus(SemesterStatus.UPCOMING);
        semester.setIsRegistrationEnabled(false);

        Semester savedSemester = semesterRepository.save(semester);
        log.info("[SemesterService] Created semester: {}", savedSemester.getSemesterId());

        return mapToResponse(savedSemester);
    }

    @Override
    @Transactional
    public SemesterResponse updateSemester(Long semesterId, SemesterUpdateRequest request) {
        log.info("[SemesterService] Updating semester: {}", semesterId);

        Semester semester = findSemesterById(semesterId);

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new InvalidRequestException("End date must be after start date");
        }

        semester.setSemesterName(request.getSemesterName());
        semester.setStartDate(request.getStartDate());
        semester.setEndDate(request.getEndDate());
        semester.setDescription(request.getDescription());

        Semester updatedSemester = semesterRepository.save(semester);
        log.info("[SemesterService] Updated semester: {}", semesterId);

        return mapToResponse(updatedSemester);
    }

    @Override
    @Transactional
    public void deleteSemester(Long semesterId) {
        log.info("[SemesterService] Deleting semester: {}", semesterId);

        Semester semester = findSemesterById(semesterId);

        if (semester.getStatus() == SemesterStatus.ACTIVE) {
            throw new InvalidRequestException("Cannot delete active semester");
        }

        semesterRepository.delete(semester);
        log.info("[SemesterService] Deleted semester: {}", semesterId);
    }

    @Override
    @Transactional(readOnly = true)
    public SemesterResponse getSemesterById(Long semesterId) {
        log.info("[SemesterService] Getting semester: {}", semesterId);
        Semester semester = findSemesterById(semesterId);
        return mapToResponse(semester);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SemesterResponse> getAllSemesters() {
        log.info("[SemesterService] Getting all semesters");
        return semesterRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SemesterResponse activateSemester(Long semesterId) {
        log.info("[SemesterService] Activating semester: {}", semesterId);

        Semester semester = findSemesterById(semesterId);

        if (semester.getStatus() == SemesterStatus.ACTIVE) {
            throw new InvalidRequestException("Semester is already active");
        }

        if (semester.getStatus() == SemesterStatus.COMPLETED) {
            throw new InvalidRequestException("Cannot activate completed semester");
        }

        List<Semester> activeSemesters = semesterRepository.findByStatus(SemesterStatus.ACTIVE);
        for (Semester activeSemester : activeSemesters) {
            activeSemester.setStatus(SemesterStatus.COMPLETED);
            semesterRepository.save(activeSemester);
            log.info("[SemesterService] Completed semester: {}", activeSemester.getSemesterId());
        }

        semester.setStatus(SemesterStatus.ACTIVE);
        Semester activatedSemester = semesterRepository.save(semester);
        log.info("[SemesterService] Activated semester: {}", semesterId);

        return mapToResponse(activatedSemester);
    }

    @Override
    @Transactional
    public SemesterResponse completeSemester(Long semesterId) {
        log.info("[SemesterService] Completing semester: {}", semesterId);

        Semester semester = findSemesterById(semesterId);

        if (semester.getStatus() != SemesterStatus.ACTIVE) {
            throw new InvalidRequestException("Can only complete active semester");
        }

        semester.setStatus(SemesterStatus.COMPLETED);
        semester.setIsRegistrationEnabled(false);

        Semester completedSemester = semesterRepository.save(semester);
        log.info("[SemesterService] Completed semester: {}", semesterId);

        return mapToResponse(completedSemester);
    }

    @Override
    @Transactional
    public SemesterResponse toggleRegistration(Long semesterId,
                                               Boolean enabled,
                                               LocalDate startDate,
                                               LocalDate endDate) {
        log.info("[SemesterService] Toggle registration for semester: {}, enabled: {}", semesterId, enabled);

        Semester semester = findSemesterById(semesterId);

        if (enabled && semester.getStatus() != SemesterStatus.ACTIVE) {
            throw new InvalidRequestException("Can only enable registration for active semester");
        }

        if (enabled) {
            if (startDate == null || endDate == null) {
                throw new InvalidRequestException("Registration start and end dates are required");
            }
            if (endDate.isBefore(startDate)) {
                throw new InvalidRequestException("Registration end date must be after start date");
            }

            // ⭐ NEW VALIDATION: Registration must end BEFORE semester starts
            if (!endDate.isBefore(semester.getStartDate())) {
                throw new InvalidRequestException(
                        "Registration period must end BEFORE semester starts"
                );
            }

            if (startDate.isBefore(semester.getStartDate()) || endDate.isAfter(semester.getEndDate())) {
                throw new InvalidRequestException("Registration period must be within semester dates");
            }
        }

        semester.setIsRegistrationEnabled(enabled);
        semester.setRegistrationStartDate(enabled ? startDate : null);
        semester.setRegistrationEndDate(enabled ? endDate : null);

        Semester updatedSemester = semesterRepository.save(semester);
        log.info("[SemesterService] Updated registration for semester: {}", semesterId);

        return mapToResponse(updatedSemester);
    }

    @Override
    @Transactional(readOnly = true)
    public SemesterResponse getCurrentSemester() {
        log.info("[SemesterService] Getting current active semester");

        return semesterRepository.findByStatus(SemesterStatus.ACTIVE)
                .stream()
                .findFirst()
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isRegistrationOpen() {
        log.info("[SemesterService] Checking if registration is open");

        return semesterRepository.findByStatus(SemesterStatus.ACTIVE)
                .stream()
                .findFirst()
                .map(semester -> {
                    if (!semester.getIsRegistrationEnabled()) {
                        return false;
                    }

                    LocalDate today = LocalDate.now();
                    LocalDate startDate = semester.getRegistrationStartDate();
                    LocalDate endDate = semester.getRegistrationEndDate();

                    if (startDate == null || endDate == null) {
                        return false;
                    }

                    return !today.isBefore(startDate) && !today.isAfter(endDate);
                })
                .orElse(false);
    }

    private Semester findSemesterById(Long semesterId) {
        return semesterRepository.findById(semesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Semester not found with id: " + semesterId));
    }

    private SemesterResponse mapToResponse(Semester semester) {
        return SemesterResponse.builder()
                .semesterId(semester.getSemesterId())
                .semesterCode(semester.getSemesterCode())
                .semesterName(semester.getSemesterName())
                .startDate(semester.getStartDate())
                .endDate(semester.getEndDate())
                .status(semester.getStatus())
                .registrationEnabled(semester.getIsRegistrationEnabled())
                .registrationStartDate(semester.getRegistrationStartDate())
                .registrationEndDate(semester.getRegistrationEndDate())
                .description(semester.getDescription())
                .createdAt(semester.getCreatedAt())
                .updatedAt(semester.getUpdatedAt())
                .build();
    }
}