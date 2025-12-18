package vn.edu.uth.ecms.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.repository.*;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);

    private final AdminRepository adminRepository;
    private final DepartmentRepository departmentRepository;
    private final MajorRepository majorRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        logger.info("Starting data seeding...");

        // Seed Admin
        seedAdmin();

        // Seed Department and Major
        Department department = seedDepartment();
        Major major = seedMajor(department);

        // Seed Teacher
        seedTeacher(department, major);

        // Seed Student
        seedStudent(major);

        logger.info("Data seeding completed!");
    }

    private void seedAdmin() {
        if (adminRepository.count() == 0) {
            Admin admin = Admin.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("System Administrator")
                    .email("admin@uth.edu.vn")
                    .build();

            adminRepository.save(admin);
            logger.info("Created admin account: username=admin, password=admin123");
        }
    }

    private Department seedDepartment() {
        if (departmentRepository.count() == 0) {
            Department department = Department.builder()
                    .departmentCode("CNTT")
                    .departmentName("Công nghệ thông tin")
                    .knowledgeType(KnowledgeType.SPECIALIZED)
                    .description("Khoa Công nghệ thông tin")
                    .build();

            department = departmentRepository.save(department);
            logger.info("Created department: {}", department.getDepartmentName());
            return department;
        }
        return departmentRepository.findAll().get(0);
    }

    private Major seedMajor(Department department) {
        if (majorRepository.count() == 0) {
            Major major = Major.builder()
                    .majorCode("CNPM")
                    .majorName("Công nghệ phần mềm")
                    .department(department)
                    .description("Chuyên ngành Công nghệ phần mềm")
                    .build();

            major = majorRepository.save(major);
            logger.info("Created major: {}", major.getMajorName());
            return major;
        }
        return majorRepository.findAll().get(0);
    }

    private void seedTeacher(Department department, Major major) {
        if (teacherRepository.count() == 0) {
            LocalDate dob = LocalDate.of(1985, 5, 15);
            String defaultPassword = "15051985"; // ddMMyyyy format

            Teacher teacher = Teacher.builder()
                    .citizenId("123456789012")
                    .password(passwordEncoder.encode(defaultPassword))
                    .fullName("Nguyễn Văn A")
                    .gender(Gender.MALE)
                    .dateOfBirth(dob)
                    .email("nguyenvana@uth.edu.vn")
                    .phone("0901234567")
                    .department(department)
                    .major(major)
                    .degree("Tiến sĩ")
                    .address("TP. Hồ Chí Minh")
                    .isFirstLogin(true)
                    .isActive(true)
                    .build();

            teacherRepository.save(teacher);
            logger.info("Created teacher: citizenId=123456789012, password={}", defaultPassword);
        }
    }

    private void seedStudent(Major major) {
        if (studentRepository.count() == 0) {
            LocalDate dob = LocalDate.of(2003, 1, 1);
            String defaultPassword = "01012003"; // ddMMyyyy format

            Student student = Student.builder()
                    .studentCode("210101234567")
                    .password(passwordEncoder.encode(defaultPassword))
                    .fullName("Trần Thị B")
                    .gender(Gender.FEMALE)
                    .dateOfBirth(dob)
                    .academicYear("2021-2025")
                    .educationLevel("Đại học")
                    .placeOfBirth("TP. Hồ Chí Minh")
                    .trainingType("Chính quy")
                    .major(major)
                    .isFirstLogin(true)
                    .isActive(true)
                    .build();

            studentRepository.save(student);
            logger.info("Created student: studentCode=210101234567, password={}", defaultPassword);
        }
    }
}