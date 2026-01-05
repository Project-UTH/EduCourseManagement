package vn.edu.uth.ecms.service;

public interface SemesterActivationService {
    
    /**
     * Start semester - Generate schedules for all PENDING sessions
     */
    void startSemester(Long semesterId);
}