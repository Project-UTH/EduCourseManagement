package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.edu.uth.ecms.exception.DuplicateException;
import vn.edu.uth.ecms.repository.AdminRepository;
import vn.edu.uth.ecms.repository.StudentRepository;
import vn.edu.uth.ecms.repository.TeacherRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsernameValidationService {

    private final AdminRepository adminRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;

    /**
     * Check if username exists across all user types
     * @param username The username to check
     * @throws DuplicateException if username exists
     */
    public void validateUsernameUnique(String username) {
        log.info(" Validating username uniqueness: {}", username);

        // Check Admin
        if (adminRepository.existsByUsername(username)) {
            log.error(" Username exists as Admin: {}", username);
            throw new DuplicateException(
                    "Username already exists in system: " + username
            );
        }

        // Check Teacher (citizenId)
        if (teacherRepository.existsByCitizenId(username)) {
            log.error(" Username exists as Teacher: {}", username);
            throw new DuplicateException(
                    "Username already exists in system: " + username
            );
        }

        // Check Student (studentCode)
        if (studentRepository.existsByStudentCode(username)) {
            log.error(" Username exists as Student: {}", username);
            throw new DuplicateException(
                    "Username already exists in system: " + username
            );
        }

        log.info(" Username is unique: {}", username);
    }

    /**
     * Check if username exists and return the user type
     * @param username The username to check
     * @return User type if exists, null otherwise
     */
    public String getUserTypeByUsername(String username) {
        if (adminRepository.existsByUsername(username)) {
            return "ADMIN";
        }
        if (teacherRepository.existsByCitizenId(username)) {
            return "TEACHER";
        }
        if (studentRepository.existsByStudentCode(username)) {
            return "STUDENT";
        }
        return null;
    }
}