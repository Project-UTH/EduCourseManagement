package vn.edu.uth.ecms.controller.teacher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.ScheduleItemResponse;
import vn.edu.uth.ecms.entity.Teacher;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.TeacherRepository;
import vn.edu.uth.ecms.service.ScheduleService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/teacher/schedule")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('TEACHER')")
public class TeacherScheduleController {

    private final ScheduleService scheduleService;
    private final TeacherRepository teacherRepository;

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<List<ScheduleItemResponse>>> getWeeklySchedule(
            @RequestParam(required = false) String weekStartDate) {
        
        log.info("📅 Teacher requesting weekly schedule");
        
        // Get username (citizenId) from authentication
        String citizenId = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // Find teacher by citizenId
        Teacher teacher = teacherRepository.findByCitizenId(citizenId)
                .orElseThrow(() -> new NotFoundException("Teacher not found with citizenId: " + citizenId));
        
        log.info("👤 Teacher: {} ({})", teacher.getFullName(), citizenId);
        
        LocalDate startDate;
        if (weekStartDate != null && !weekStartDate.isEmpty()) {
            startDate = LocalDate.parse(weekStartDate);
        } else {
            startDate = getThisWeekMonday();
        }
        
        log.info("📆 Week start: {}", startDate);
        
        List<ScheduleItemResponse> schedule = scheduleService.getTeacherWeeklySchedule(
                teacher.getTeacherId(), startDate);
        
        log.info("✅ Found {} schedule items", schedule.size());
        
        return ResponseEntity.ok(
                ApiResponse.success("Schedule retrieved", schedule)
        );
    }
    
    private LocalDate getThisWeekMonday() {
        LocalDate today = LocalDate.now();
        int dayOfWeek = today.getDayOfWeek().getValue();
        return today.minusDays(dayOfWeek - 1);
    }
}