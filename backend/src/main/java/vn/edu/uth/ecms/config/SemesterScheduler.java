package vn.edu.uth.ecms.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.entity.Semester;
import vn.edu.uth.ecms.entity.enums.SemesterStatus;
import vn.edu.uth.ecms.repository.SemesterRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Scheduled job to auto-update semester statuses
 */
//@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class SemesterScheduler {

    private final SemesterRepository semesterRepository;

   
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void updateSemesterStatuses() {
        log.info("═══════════════════════════════════════════════════════");
        log.info(" [SemesterScheduler] Starting auto semester status update...");
        log.info("═══════════════════════════════════════════════════════");

        LocalDate today = LocalDate.now();
        int upcomingToActive = 0;
        int activeToCompleted = 0;

       

        List<Semester> activeSemesters = semesterRepository.findByStatusIn(
                List.of(SemesterStatus.ACTIVE)
        );
        log.info("Found {} ACTIVE semester(s) to check", activeSemesters.size());

        for (Semester semester : activeSemesters) {
            if (today.isAfter(semester.getEndDate())) {
                semester.setStatus(SemesterStatus.COMPLETED);
                semester.setRegistrationEnabled(false);  
                semesterRepository.save(semester);
                activeToCompleted++;

                log.info(" Completed semester: {} ({}) - End date: {}",
                        semester.getSemesterName(),
                        semester.getSemesterCode(),
                        semester.getEndDate());
            }
        }

        
        Optional<Semester> currentActive = semesterRepository.findByStatus(SemesterStatus.ACTIVE);

        if (currentActive.isEmpty()) {
            // No ACTIVE semester, find the first UPCOMING that should start
            List<Semester> upcomingSemesters = semesterRepository.findByStatusIn(
                    List.of(SemesterStatus.UPCOMING)  
            );
            log.info("Found {} UPCOMING semester(s) to check", upcomingSemesters.size());

            // Find first semester that should be activated (earliest start date that has passed)
            Semester toActivate = null;
            for (Semester semester : upcomingSemesters) {
                if (!today.isBefore(semester.getStartDate())) {
                    // Found a semester that should start
                    if (toActivate == null || semester.getStartDate().isBefore(toActivate.getStartDate())) {
                        toActivate = semester;
                    }
                }
            }

            // Activate the selected semester
            if (toActivate != null) {
                toActivate.setStatus(SemesterStatus.ACTIVE);
                semesterRepository.save(toActivate);
                upcomingToActive++;

                log.info(" Activated semester: {} ({}) - Start date: {}",
                        toActivate.getSemesterName(),
                        toActivate.getSemesterCode(),
                        toActivate.getStartDate());
            } else {
                log.info("  No UPCOMING semester ready to activate");
            }
        } else {
            log.info("  Already have ACTIVE semester: {} ({})",
                    currentActive.get().getSemesterName(),
                    currentActive.get().getSemesterCode());
        }

       

        List<Semester> semestersWithRegistration = semesterRepository.findByRegistrationEnabled(true);
        int registrationsDisabled = 0;

        for (Semester semester : semestersWithRegistration) {
            // Disable if registration end date has passed
            if (semester.getRegistrationEndDate() != null
                    && today.isAfter(semester.getRegistrationEndDate())) {

                semester.setRegistrationEnabled(false);  
                semesterRepository.save(semester);
                registrationsDisabled++;

                log.info(" Auto-disabled registration for semester: {} ({}) - Registration ended: {}",
                        semester.getSemesterName(),
                        semester.getSemesterCode(),
                        semester.getRegistrationEndDate());
            }
        }

        log.info("═══════════════════════════════════════════════════════");
        log.info(" [SemesterScheduler] Status update complete:");
        log.info("   • Activated: {} semester(s)", upcomingToActive);
        log.info("   • Completed: {} semester(s)", activeToCompleted);
        log.info("   • Registrations auto-disabled: {} semester(s)", registrationsDisabled);
        log.info("═══════════════════════════════════════════════════════");
    }

    /**
     * Manual trigger for testing
     * Can be called via endpoint: POST /api/admin/scheduler/trigger-semester-update
     */
    public void manualTrigger() {
        log.info(" [SemesterScheduler] Manual trigger activated");
        updateSemesterStatuses();
    }
}