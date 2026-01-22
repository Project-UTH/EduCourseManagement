package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStatisticsResponse {

    private long totalStudents;
    private long activeStudents;
    private long totalTeachers;
    private long activeTeachers;

    private long totalDepartments;
    private long totalMajors;
    private long totalSubjects;
    private long totalRooms;
    private long totalClasses;

    private Object currentSemester;

    private long totalEnrollments;
    private double utilizationRate;
}

