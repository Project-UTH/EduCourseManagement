package vn.edu.uth.ecms.service;

import vn.edu.uth.ecms.dto.response.ScheduleItemResponse;

import java.time.LocalDate;
import java.util.List;

public interface ScheduleService {
    
    /**
     * Get student's weekly schedule
     * @param studentId Student ID
     * @param weekStartDate Start of week (Monday)
     * @return List of schedule items for the week
     */
    List<ScheduleItemResponse> getStudentWeeklySchedule(Long studentId, LocalDate weekStartDate);
}