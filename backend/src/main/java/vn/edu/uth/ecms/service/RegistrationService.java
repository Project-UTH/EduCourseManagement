package vn.edu.uth.ecms.service;

import vn.edu.uth.ecms.dto.response.RegistrationResponse;

import java.util.List;

public interface RegistrationService {
    
    RegistrationResponse registerForClass(Long classId);
    
    void dropClass(Long registrationId);
    
    List<RegistrationResponse> getMyRegistrations(Long semesterId);
    
    RegistrationResponse getRegistrationById(Long registrationId);
}