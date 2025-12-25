package vn.edu.uth.ecms.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.entity.Semester;
import vn.edu.uth.ecms.entity.SemesterStatus;
import vn.edu.uth.ecms.repository.SemesterRepository;

import java.time.LocalDate;
import java.util.List;

@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class SemesterScheduler {

    private final SemesterRepository semesterRepository;

    @Scheduled(cron = "0 0 0 * * ?")  // Every day at 00:00
    @Transactional
    public void updateSemesterStatuses() {
        log.info("[SemesterScheduler] Starting auto semester status update...");

        LocalDate today = LocalDate.now();
        int upcomingToActive = 0;
        int activeToCompleted = 0;

        // UPCOMING → ACTIVE
        List<Semester> upcomingSemesters = semesterRepository.findByStatus(SemesterStatus.UPCOMING);
        for (Semester semester : upcomingSemesters) {
            if (!today.isBefore(semester.getStartDate())) {
                semester.setStatus(SemesterStatus.ACTIVE);
                semesterRepository.save(semester);
                upcomingToActive++;
                log.info("[SemesterScheduler] Activated semester: {} ({})",
                        semester.getSemesterName(), semester.getSemesterCode());
            }
        }

        // ACTIVE → COMPLETED
        List<Semester> activeSemesters = semesterRepository.findByStatus(SemesterStatus.ACTIVE);
        for (Semester semester : activeSemesters) {
            if (today.isAfter(semester.getEndDate())) {
                semester.setStatus(SemesterStatus.COMPLETED);
                semester.setIsRegistrationEnabled(false);
                semesterRepository.save(semester);
                activeToCompleted++;
                log.info("[SemesterScheduler] Completed semester: {} ({})",
                        semester.getSemesterName(), semester.getSemesterCode());
            }
        }

        log.info("[SemesterScheduler] Status update complete. " +
                "Activated: {}, Completed: {}", upcomingToActive, activeToCompleted);
    }
}