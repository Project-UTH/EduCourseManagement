package vn.edu.uth.ecms.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.entity.Admin;
import vn.edu.uth.ecms.entity.Student;
import vn.edu.uth.ecms.entity.Teacher;
import vn.edu.uth.ecms.repository.AdminRepository;
import vn.edu.uth.ecms.repository.StudentRepository;
import vn.edu.uth.ecms.repository.TeacherRepository;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Try Admin
        Admin admin = adminRepository.findByUsername(username).orElse(null);
        if (admin != null) {
            return UserPrincipal.create(
                    admin.getAdminId(),
                    admin.getUsername(),
                    admin.getPassword(),
                    admin.getFullName(),
                    "ADMIN",
                    false, // Admin không có first login
                    true
            );
        }

        // Try Teacher
        Teacher teacher = teacherRepository.findByCitizenId(username).orElse(null);
        if (teacher != null) {
            return UserPrincipal.create(
                    teacher.getTeacherId(),
                    teacher.getCitizenId(),
                    teacher.getPassword(),
                    teacher.getFullName(),
                    "TEACHER",
                    teacher.getIsFirstLogin(),
                    teacher.getIsActive()
            );
        }

        // Try Student
        Student student = studentRepository.findByStudentCode(username).orElse(null);
        if (student != null) {
            return UserPrincipal.create(
                    student.getStudentId(),
                    student.getStudentCode(),
                    student.getPassword(),
                    student.getFullName(),
                    "STUDENT",
                    student.getIsFirstLogin(),
                    student.getIsActive()
            );
        }

        throw new UsernameNotFoundException("User not found with username: " + username);
    }
}