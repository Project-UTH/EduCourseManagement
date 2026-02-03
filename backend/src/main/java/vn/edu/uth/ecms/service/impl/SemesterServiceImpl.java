package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.SemesterCreateRequest;
import vn.edu.uth.ecms.dto.request.SemesterUpdateRequest;
import vn.edu.uth.ecms.dto.response.SemesterResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.entity.enums.SemesterStatus;
import vn.edu.uth.ecms.exception.BadRequestException;
import vn.edu.uth.ecms.exception.DuplicateException;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.*;
import vn.edu.uth.ecms.service.ExtraSessionScheduler;
import vn.edu.uth.ecms.service.SemesterService;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Arrays;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SemesterServiceImpl implements SemesterService {

    private final SemesterRepository semesterRepository;
    private final ClassSessionRepository sessionRepository;
    private final ExtraSessionScheduler extraSessionScheduler;

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

    @Override
    public SemesterResponse createSemester(SemesterCreateRequest request) {
        log.info("Creating semester: {}", request.getSemesterCode());

        if (semesterRepository.existsBySemesterCode(request.getSemesterCode())) {
            throw new DuplicateException("Semester code already exists: " + request.getSemesterCode());
        }

        LocalDate startDate = LocalDate.parse(request.getStartDate());
        LocalDate endDate = LocalDate.parse(request.getEndDate());

        validateSemesterDates(startDate, endDate);

        if (hasDateOverlap(startDate, endDate, null)) {
            log.warn("Semester dates overlap with existing semester: {} to {}", startDate, endDate);
        }

        LocalDate regStartDate = null;
        LocalDate regEndDate = null;

        if (request.getRegistrationStartDate() != null && !request.getRegistrationStartDate().isBlank()) {
            regStartDate = LocalDate.parse(request.getRegistrationStartDate());
        }

        if (request.getRegistrationEndDate() != null && !request.getRegistrationEndDate().isBlank()) {
            regEndDate = LocalDate.parse(request.getRegistrationEndDate());
        }

        if (regStartDate != null && regEndDate != null) {
            validateRegistrationPeriod(startDate, regStartDate, regEndDate);
        }

        Semester semester = Semester.builder()
                .semesterCode(request.getSemesterCode())
                .semesterName(request.getSemesterName())
                .startDate(startDate)
                .endDate(endDate)
                .status(request.getStatus())
                .registrationEnabled(false)
                .registrationStartDate(regStartDate)
                .registrationEndDate(regEndDate)
                .description(request.getDescription())
                .build();

        Semester saved = semesterRepository.save(semester);

        log.info("Semester created successfully: {}", saved.getSemesterCode());

        return mapToResponse(saved);
    }

    @Override
    public SemesterResponse updateSemester(Long id, SemesterUpdateRequest request) {
        log.info("Updating semester ID: {}", id);

        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + id));

        if (semester.getStatus() == SemesterStatus.COMPLETED) {
            throw new BadRequestException("Cannot edit COMPLETED semester");
        }

        LocalDate startDate = LocalDate.parse(request.getStartDate());
        LocalDate endDate = LocalDate.parse(request.getEndDate());

        validateSemesterDates(startDate, endDate);

        LocalDate regStartDate = null;
        LocalDate regEndDate = null;

        if (request.getRegistrationStartDate() != null && !request.getRegistrationStartDate().isBlank()) {
            regStartDate = LocalDate.parse(request.getRegistrationStartDate());
        }

        if (request.getRegistrationEndDate() != null && !request.getRegistrationEndDate().isBlank()) {
            regEndDate = LocalDate.parse(request.getRegistrationEndDate());
        }

        if (regStartDate != null && regEndDate != null) {
            validateRegistrationPeriod(startDate, regStartDate, regEndDate);
        }

        semester.setSemesterName(request.getSemesterName());
        semester.setStartDate(startDate);
        semester.setEndDate(endDate);
        semester.setRegistrationStartDate(regStartDate);
        semester.setRegistrationEndDate(regEndDate);
        semester.setDescription(request.getDescription());

        Semester updated = semesterRepository.save(semester);

        log.info("Semester updated successfully: {}", updated.getSemesterCode());

        return mapToResponse(updated);
    }

    @Override
    public void deleteSemester(Long id) {
        log.info("Deleting semester ID: {}", id);

        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + id));

        if (semester.getStatus() == SemesterStatus.ACTIVE) {
            throw new BadRequestException("Cannot delete ACTIVE semester. Complete it first.");
        }

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

    @Override
    public SemesterResponse activateSemester(Long id) {
        log.info(" Activating semester ID: {}", id);

        Semester semesterToActivate = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + id));

        if (semesterToActivate.getStatus() == SemesterStatus.ACTIVE) {
            log.warn(" Semester {} is already ACTIVE. Skipping re-activation and scheduling.",
                    semesterToActivate.getSemesterCode());
            return mapToResponse(semesterToActivate);
        }

        if (semesterToActivate.getStatus() == SemesterStatus.COMPLETED) {
            throw new BadRequestException("Cannot activate COMPLETED semester");
        }

        // Find current ACTIVE semester
        Optional<Semester> currentActiveOpt = semesterRepository.findByStatus(SemesterStatus.ACTIVE);

        if (currentActiveOpt.isPresent()) {
            Semester currentActive = currentActiveOpt.get();

            // Complete previous active semester
            currentActive.setStatus(SemesterStatus.COMPLETED);
            currentActive.setRegistrationEnabled(false);
            semesterRepository.save(currentActive);

            log.info("Completed previous ACTIVE semester: {}", currentActive.getSemesterCode());
        }

        // Activate new semester
        semesterToActivate.setStatus(SemesterStatus.ACTIVE);
        Semester saved = semesterRepository.save(semesterToActivate);

        log.info(" Activated semester: {}", saved.getSemesterCode());

        try {
            schedulePendingExtraSessions(id);
        } catch (Exception e) {
            log.error(" Failed to auto-schedule extra sessions: {}", e.getMessage(), e);
        }

        return mapToResponse(saved);
    }

    private void schedulePendingExtraSessions(Long semesterId) {
        log.info(" Scheduling all pending extra sessions for semester {}", semesterId);

        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new NotFoundException("Semester not found"));

        List<ClassSession> pendingSessions = sessionRepository.findPendingSessionsBySemester(semesterId);

        if (pendingSessions.isEmpty()) {
            log.info(" No pending extra sessions to schedule");
            return;
        }

        log.info("Found {} pending extra sessions to schedule", pendingSessions.size());

        int successCount = 0;
        int failCount = 0;

        for (ClassSession session : pendingSessions) {
            try {
                boolean scheduled = extraSessionScheduler.scheduleExtraSession(session, semester);

                if (scheduled) {
                    sessionRepository.save(session);
                    successCount++;

                    log.debug(" Scheduled session {}: {} {} {} {}",
                            session.getSessionNumber(),
                            session.getOriginalDate(),
                            session.getOriginalDayOfWeek(),
                            session.getOriginalTimeSlot(),
                            session.getOriginalRoom().getRoomCode());
                } else {
                    log.error(" Failed to schedule session {} for class {}",
                            session.getSessionNumber(),
                            session.getClassEntity().getClassCode());
                    failCount++;
                }
            } catch (Exception e) {
                log.error(" Error scheduling session {} for class {}: {}",
                        session.getSessionNumber(),
                        session.getClassEntity().getClassCode(),
                        e.getMessage(), e);
                failCount++;
            }
        }

        log.info(" Extra session scheduling complete: {} success, {} failed",
                successCount, failCount);

        if (failCount > 0) {
            log.warn(" {} sessions could not be scheduled automatically", failCount);
        }
    }

    @Override
    public SemesterResponse completeSemester(Long id) {
        log.info("Completing semester ID: {}", id);

        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + id));

        if (semester.getStatus() != SemesterStatus.ACTIVE) {
            throw new BadRequestException("Only ACTIVE semesters can be completed");
        }

        semester.setStatus(SemesterStatus.COMPLETED);
        semester.setRegistrationEnabled(false);

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
        log.info(" Registration OPEN for semester: {} (until {})",
                response.getSemesterCode(),
                response.getRegistrationEndDate());

        return response;
    }

    @Override
    public SemesterResponse enableRegistration(Long id) {
        log.info("Enabling registration for semester ID: {}", id);

        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + id));

        if (semester.getStatus() != SemesterStatus.UPCOMING) {
            throw new BadRequestException("Can only enable registration for UPCOMING semester");
        }

        if (semester.getRegistrationStartDate() == null || semester.getRegistrationEndDate() == null) {
            throw new BadRequestException("Registration period must be set first");
        }

        validateRegistrationPeriod(
                semester.getStartDate(),
                semester.getRegistrationStartDate(),
                semester.getRegistrationEndDate());

        semester.setRegistrationEnabled(true);
        Semester saved = semesterRepository.save(semester);

        log.info(" Registration ENABLED for semester: {} (until {})",
                saved.getSemesterCode(),
                saved.getRegistrationEndDate());

        return mapToResponse(saved);
    }

    @Override
    public SemesterResponse disableRegistration(Long id) {
        log.info("Disabling registration for semester ID: {}", id);

        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Semester not found with ID: " + id));

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

        validateRegistrationPeriod(semester.getStartDate(), registrationStartDate, registrationEndDate);

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

    @Override
    public void validateSemesterDates(LocalDate startDate, LocalDate endDate) {
        if (!endDate.isAfter(startDate)) {
            throw new BadRequestException("End date must be after start date");
        }

        long days = ChronoUnit.DAYS.between(startDate, endDate);

        if (days < 60 || days > 80) {
            log.warn("Semester duration is {} days (recommended: 70 days for 10 weeks)", days);
        }
    }

    @Override
    public void validateRegistrationPeriod(
            LocalDate semesterStart,
            LocalDate registrationStart,
            LocalDate registrationEnd) {

        if (!registrationStart.isBefore(registrationEnd)) {
            throw new BadRequestException("Registration start date must be before end date");
        }

        if (registrationEnd.isAfter(semesterStart)) {
            throw new BadRequestException(
                    "Registration must end before or on semester start date (" + semesterStart + ")");
        }

        long days = ChronoUnit.DAYS.between(registrationStart, registrationEnd);
        if (days < 7 || days > 30) {
            log.warn("Registration period is {} days (recommended: 7-30 days)", days);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasDateOverlap(LocalDate startDate, LocalDate endDate, Long excludeSemesterId) {
        List<Semester> overlapping = semesterRepository.findOverlappingSemesters(startDate, endDate);

        if (excludeSemesterId != null) {
            overlapping.removeIf(s -> s.getSemesterId().equals(excludeSemesterId));
        }

        return !overlapping.isEmpty();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SemesterResponse> getActiveSemesters() {
        List<Semester> semesters = semesterRepository.findByStatusIn(
                Arrays.asList(SemesterStatus.ACTIVE, SemesterStatus.UPCOMING));

        return semesters.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SemesterResponse> getAllSemesters() {
        List<Semester> semesters = semesterRepository.findAll(
                Sort.by(Sort.Direction.DESC, "startDate"));

        return semesters.stream()
                .map(this::mapToResponse)
                .toList();
    }
}