package vn.edu.uth.ecms.controller.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.DashboardStatisticsResponse;
import vn.edu.uth.ecms.dto.response.StudentResponse;
import vn.edu.uth.ecms.service.*;


@RestController
@RequestMapping("/api/admin/statistics/dashboard")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class StatisticsDashboardController {

    private final StudentService studentService;
    private final ClassService classService;
    private final TeacherService teacherService;
    private final RoomService roomService;
    private final DepartmentService departmentService;
    private final SubjectService subjectService;
    private final MajorService majorService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardStatisticsResponse>> getDashboardStatistics() {

        log.info("Fetching dashboard statistics");

        DashboardStatisticsResponse data = DashboardStatisticsResponse.builder()
                .totalStudents(studentService.countAll())

                .totalTeachers(teacherService.countAll())

                .totalRooms(roomService.countAll())
                .totalClasses(classService.countAll())

                .totalDepartments(departmentService.countAll())
                .totalSubjects(subjectService.countAll())
                .totalMajors(majorService.countAll())
                .build();

        return ResponseEntity.ok(
                ApiResponse.success(data)
        );
    }

}
