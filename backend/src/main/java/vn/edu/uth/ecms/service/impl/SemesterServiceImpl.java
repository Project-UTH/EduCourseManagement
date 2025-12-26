package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.SemesterCreateRequest;
import vn.edu.uth.ecms.dto.request.SemesterUpdateRequest;
import vn.edu.uth.ecms.dto.response.SemesterResponse;
import vn.edu.uth.ecms.entity.Semester;
import vn.edu.uth.ecms.entity.SemesterStatus;
import vn.edu.uth.ecms.exception.BadRequestException;
import vn.edu.uth.ecms.exception.DuplicateException;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.SemesterRepository;
import vn.edu.uth.ecms.service.SemesterService;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

/**
 * Implementation of SemesterService
 *
 * CRITICAL BUSINESS LOGIC IMPLEMENTED:
 * 1. Only ONE ACTIVE semester at any time
 * 2. Auto-complete previous ACTIVE when activating new one
 * 3. Registration period validation
 * 4. Cannot edit COMPLETED semesters
 * 5. Registration control only for UPCOMING semesters
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SemesterServiceImpl implements SemesterService {

    private final SemesterRepository semesterRepository;

    // ==================== HELPER METHODS ====================

    /**
     * Map Semester entity to SemesterResponse DTO
     */
    private SemesterResponse mapToResponse(Semester semester) {
        return SemesterResponse.builder()
                .semesterId(semester.getSemesterId())
                .semesterCode(semester.getSemesterCode())
                .semesterName(semester.getSemesterName())
                .startDate(semester.getStartDate())
                .endDate(semester.getEndDate())
                .registrationStartDate(semester.getRegistrationStartDate())
                .registrationEndDate(semester.getRegistrationEndDate())
                .status(semester.getStatus())
                .registrationEnabled(semester.getRegistrationEnabled())
                .isRegistrationOpen(semester.isRegistrationOpen())
                .durationInDays(semester.getDurationInDays())
                .durationInWeeks(semester.getDurationInWeeks())
                .isRegistrationPeriodValid(semester.isRegistrationPeriodValid())
                .description(semester.getDescription())
                .createdAt(semester.getCreatedAt())
                .updatedAt(semester.getUpdatedAt())
                .build();
    }

    // ==================== CRUD OPERATIONS ====================

    @Override
    public SemesterResponse createSemester(SemesterCreateRequest request) {
        log.info("Creating semester: {}", request.getSemesterCode());

        // 1. Validate semester code is unique
        if (semesterRepository.existsBySemesterCode(request.getSemesterCode())) {
            throw new DuplicateException("Semester code already exists: " + request.getSemesterCode());
        }

        // 2. Parse dates
        LocalDate startDate = LocalDate.parse(request.getStartDate());
        LocalDate endDate = LocalDate.parse(request.getEndDate());

        // 3. Validate semester dates
        validateSemesterDates(startDate, endDate);

        // 4. Check for overlaps (warning, not blocking)
        if (hasDateOverlap(startDate, endDate, null)) {
            log.warn("Semester dates overlap with existing semester: {} to {}", startDate, endDate);
        }

        // 5. Parse registration dates (optional)
        LocalDate regStartDate = null;
        LocalDate regEndDate = null;

        if (request.getRegistrationStartDate() != null && !request.getRegistrationStartDate().isBlank()) {
            regStartDate = LocalDate.parse(request.getRegistrationStartDate());
        }

        if (request.getRegistrationEndDate() != null && !request.getRegistrationEndDate().isBlank()) {
            regEndDate = LocalDate.parse(request.getRegistrationEndDate());
        }

        // 6. Validate registration period if provided
        if (regStartDate != null && regEndDate != null) {
            validateRegistrationPeriod(startDate, regStartDate, regEndDate);
        }

        // 7. Build semester entity
        Semester semester = Semester.builder()
                .semesterCode(request.getSemesterCode())
                .semesterName(request.getSemesterName())
                .startDate(startDate)
                .endDate(endDate)
                .status(request.getStatus())
                .registrationEnabled(false)  // Default: disabled
                .registrationStartDate(regStartDate)
                .registrationEndDate(regEndDate)
                .description(request.getDescription())
                .build();

        // 8. Save semester
        Semester saved = semesterRepository.save(semester);

        log.info("Semester created successfully: {}", saved.getSemesterCode());

        return mapToResponse(saved);
    }

    @Override
    public SemesterResponse updateSemester(Long id, SemesterUpdateRequest request) {
        log.info("Updating semester ID: {}", id);

        // 1. Find semester
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + id));

        // 2. Cannot edit COMPLETED semesters
        if (semester.getStatus() == SemesterStatus.COMPLETED) {
            throw new BadRequestException("Cannot edit COMPLETED semester");
        }

        // 3. Parse dates
        LocalDate startDate = LocalDate.parse(request.getStartDate());
        LocalDate endDate = LocalDate.parse(request.getEndDate());

        // 4. Validate dates
        validateSemesterDates(startDate, endDate);

        // 5. Parse registration dates
        LocalDate regStartDate = null;
        LocalDate regEndDate = null;

        if (request.getRegistrationStartDate() != null && !request.getRegistrationStartDate().isBlank()) {
            regStartDate = LocalDate.parse(request.getRegistrationStartDate());
        }

        if (request.getRegistrationEndDate() != null && !request.getRegistrationEndDate().isBlank()) {
            regEndDate = LocalDate.parse(request.getRegistrationEndDate());
        }

        // 6. Validate registration period
        if (regStartDate != null && regEndDate != null) {
            validateRegistrationPeriod(startDate, regStartDate, regEndDate);
        }

        // 7. Update semester
        semester.setSemesterName(request.getSemesterName());
        semester.setStartDate(startDate);
        semester.setEndDate(endDate);
        semester.setRegistrationStartDate(regStartDate);
        semester.setRegistrationEndDate(regEndDate);
        semester.setDescription(request.getDescription());

        // 8. Save
        Semester updated = semesterRepository.save(semester);

        log.info("Semester updated successfully: {}", updated.getSemesterCode());

        return mapToResponse(updated);
    }

    @Override
    public void deleteSemester(Long id) {
        log.info("Deleting semester ID: {}", id);

        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + id));

        // Cannot delete ACTIVE semester
        if (semester.getStatus() == SemesterStatus.ACTIVE) {
            throw new BadRequestException("Cannot delete ACTIVE semester. Complete it first.");
        }

        // TODO: Check if semester has classes (Phase 3 Sprint 3.6)
        // if (classRepository.existsBySemester(semester)) {
        //     throw new BadRequestException("Cannot delete semester with classes");
        // }

        semesterRepository.delete(semester);

        log.info("Semester deleted: {}", semester.getSemesterCode());
    }

    @Override
    @Transactional(readOnly = true)
    public SemesterResponse getSemesterById(Long id) {
        log.info("Fetching semester ID: {}", id);

        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + id));

        return mapToResponse(semester);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SemesterResponse> getAllSemesters(Pageable pageable) {
        log.info("Fetching all semesters - page: {}, size: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        return semesterRepository.findAllByOrderByStartDateDesc(pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SemesterResponse> searchSemesters(String keyword, Pageable pageable) {
        log.info("Searching semesters with keyword: '{}'", keyword);

        return semesterRepository.searchSemesters(keyword, pageable)
                .map(this::mapToResponse);
    }

    // ==================== STATUS MANAGEMENT ====================

    @Override
    public SemesterResponse activateSemester(Long id) {
        log.info("Activating semester ID: {}", id);

        // 1. Find semester to activate
        Semester semesterToActivate = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + id));

        // 2. Cannot activate if already COMPLETED
        if (semesterToActivate.getStatus() == SemesterStatus.COMPLETED) {
            throw new BadRequestException("Cannot activate COMPLETED semester");
        }

        // 3. Find current ACTIVE semester (if exists)
        Optional<Semester> currentActiveOpt = semesterRepository.findByStatus(SemesterStatus.ACTIVE);

        // 4. Complete current ACTIVE semester
        if (currentActiveOpt.isPresent()) {
            Semester currentActive = currentActiveOpt.get();

            // Don't activate if already active
            if (currentActive.getSemesterId().equals(id)) {
                log.info("Semester is already ACTIVE: {}", currentActive.getSemesterCode());
                return mapToResponse(currentActive);
            }

            // Complete previous active semester
            currentActive.setStatus(SemesterStatus.COMPLETED);
            currentActive.setRegistrationEnabled(false);
            semesterRepository.save(currentActive);

            log.info("Completed previous ACTIVE semester: {}", currentActive.getSemesterCode());
        }

        // 5. Activate new semester
        semesterToActivate.setStatus(SemesterStatus.ACTIVE);
        Semester saved = semesterRepository.save(semesterToActivate);

        log.info("✅ Activated semester: {}", saved.getSemesterCode());

        return mapToResponse(saved);
    }

    @Override
    public SemesterResponse completeSemester(Long id) {
        log.info("Completing semester ID: {}", id);

        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + id));

        // Only ACTIVE semesters can be completed
        if (semester.getStatus() != SemesterStatus.ACTIVE) {
            throw new BadRequestException("Only ACTIVE semesters can be completed");
        }

        // Complete semester
        semester.setStatus(SemesterStatus.COMPLETED);
        semester.setRegistrationEnabled(false);  // Auto-disable registration

        Semester saved = semesterRepository.save(semester);

        log.info("Semester completed: {}", saved.getSemesterCode());

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SemesterResponse getCurrentSemester() {
        log.info("Getting current ACTIVE semester");

        Optional<Semester> activeSemester = semesterRepository.findByStatus(SemesterStatus.ACTIVE);

        if (activeSemester.isEmpty()) {
            log.warn("No ACTIVE semester found");
            return null;
        }

        return mapToResponse(activeSemester.get());
    }

    @Override
    @Transactional(readOnly = true)
    public SemesterResponse getRegistrationOpenSemester() {
        log.info("Getting semester with OPEN registration");

        Optional<Semester> semester = semesterRepository.findActiveWithOpenRegistration();

        if (semester.isEmpty()) {
            log.info("No semester accepting registrations");
            return null;
        }

        SemesterResponse response = mapToResponse(semester.get());
        log.info("✅ Registration OPEN for semester: {} (until {})",
                response.getSemesterCode(),
                response.getRegistrationEndDate());

        return response;
    }

    // ==================== REGISTRATION CONTROL ====================

    @Override
    public SemesterResponse enableRegistration(Long id) {
        log.info("Enabling registration for semester ID: {}", id);

        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + id));

        // ✅ FIXED: Must be UPCOMING (not ACTIVE)
        if (semester.getStatus() != SemesterStatus.UPCOMING) {
            throw new BadRequestException("Can only enable registration for UPCOMING semester");
        }

        // Registration period must be set
        if (semester.getRegistrationStartDate() == null || semester.getRegistrationEndDate() == null) {
            throw new BadRequestException("Registration period must be set first");
        }

        // Validate registration period
        validateRegistrationPeriod(
                semester.getStartDate(),
                semester.getRegistrationStartDate(),
                semester.getRegistrationEndDate()
        );

        // Enable registration
        semester.setRegistrationEnabled(true);
        Semester saved = semesterRepository.save(semester);

        log.info("✅ Registration ENABLED for semester: {} (until {})",
                saved.getSemesterCode(),
                saved.getRegistrationEndDate());

        return mapToResponse(saved);
    }

    @Override
    public SemesterResponse disableRegistration(Long id) {
        log.info("Disabling registration for semester ID: {}", id);

        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + id));

        // ✅ FIXED: Check if UPCOMING (optional validation)
        if (semester.getStatus() != SemesterStatus.UPCOMING) {
            throw new BadRequestException("Can only disable registration for UPCOMING semester");
        }

        semester.setRegistrationEnabled(false);
        Semester saved = semesterRepository.save(semester);

        log.info("Registration DISABLED for semester: {}", saved.getSemesterCode());

        return mapToResponse(saved);
    }

    @Override
    public SemesterResponse updateRegistrationPeriod(
            Long id,
            LocalDate registrationStartDate,
            LocalDate registrationEndDate) {

        log.info("Updating registration period for semester ID: {}", id);

        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + id));

        // Validate
        validateRegistrationPeriod(semester.getStartDate(), registrationStartDate, registrationEndDate);

        // Update
        semester.setRegistrationStartDate(registrationStartDate);
        semester.setRegistrationEndDate(registrationEndDate);

        Semester saved = semesterRepository.save(semester);

        log.info("Registration period updated: {} to {}", registrationStartDate, registrationEndDate);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isRegistrationOpen(Long semesterId) {
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + semesterId));

        return semester.isRegistrationOpen();
    }

    // ==================== VALIDATION ====================

    @Override
    public void validateSemesterDates(LocalDate startDate, LocalDate endDate) {
        // End date must be after start date
        if (!endDate.isAfter(startDate)) {
            throw new BadRequestException("End date must be after start date");
        }

        // Calculate duration
        long days = ChronoUnit.DAYS.between(startDate, endDate);

        // Recommended: 10 weeks = 70 days (±10 days acceptable)
        if (days < 60 || days > 80) {
            log.warn("Semester duration is {} days (recommended: 70 days for 10 weeks)", days);
        }
    }

    @Override
    public void validateRegistrationPeriod(
            LocalDate semesterStart,
            LocalDate registrationStart,
            LocalDate registrationEnd) {

        // Registration start must be before registration end
        if (!registrationStart.isBefore(registrationEnd)) {
            throw new BadRequestException("Registration start date must be before end date");
        }

        // Registration must end before or on semester start
        if (registrationEnd.isAfter(semesterStart)) {
            throw new BadRequestException(
                    "Registration must end before or on semester start date (" + semesterStart + ")"
            );
        }

        // Registration period should be reasonable (1-4 weeks recommended)
        long days = ChronoUnit.DAYS.between(registrationStart, registrationEnd);
        if (days < 7 || days > 30) {
            log.warn("Registration period is {} days (recommended: 7-30 days)", days);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasDateOverlap(LocalDate startDate, LocalDate endDate, Long excludeSemesterId) {
        List<Semester> overlapping = semesterRepository.findOverlappingSemesters(startDate, endDate);

        // Remove excluded semester from results
        if (excludeSemesterId != null) {
            overlapping.removeIf(s -> s.getSemesterId().equals(excludeSemesterId));
        }

        return !overlapping.isEmpty();
    }
}