package vn.edu.uth.ecms.controller.student;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.ScheduleItemResponse;
import vn.edu.uth.ecms.entity.Student;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.StudentRepository;
import vn.edu.uth.ecms.service.ScheduleService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/student/schedule")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('STUDENT')")
public class StudentScheduleController {

    private final ScheduleService scheduleService;
    private final StudentRepository studentRepository;

    /**
     * Get student's weekly schedule
     * @param weekStartDate 
     */
    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<List<ScheduleItemResponse>>> getWeeklySchedule(
            @RequestParam(required = false) String weekStartDate) {
        
        log.info(" Student requesting weekly schedule");
        
        
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Student student = studentRepository.findByStudentCode(username)
                .orElseThrow(() -> new NotFoundException("Student not found"));
        
        log.info(" Student: {} ({})", student.getFullName(), student.getStudentCode());
        
        
        LocalDate startDate;
        if (weekStartDate != null && !weekStartDate.isEmpty()) {
            startDate = LocalDate.parse(weekStartDate);
        } else {
            startDate = getThisWeekMonday();
        }
        
        log.info(" Week start: {}", startDate);
        
        // Get schedule for the week
        List<ScheduleItemResponse> schedule = scheduleService.getStudentWeeklySchedule(
                student.getStudentId(), startDate);
        
        log.info(" Found {} schedule items", schedule.size());
        
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