package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.response.StudentResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.entity.enums.KnowledgeType;
import vn.edu.uth.ecms.entity.enums.RegistrationStatus;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.*;
import vn.edu.uth.ecms.service.EligibleStudentService;

import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class EligibleStudentServiceImpl implements EligibleStudentService {

    private final ClassRepository classRepository;
    private final StudentRepository studentRepository;
    private final CourseRegistrationRepository registrationRepository;

 
    @Override
    public List<StudentResponse> getEligibleStudentsForClass(Long classId) {
        log.info(" Finding eligible students for class ID: {}", classId);

        // 1. Find class and subject
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found with ID: " + classId));

        Subject subject = classEntity.getSubject();
        Department department = subject.getDepartment();

        log.info(" Class: {} - Subject: {} ({})",
                classEntity.getClassCode(),
                subject.getSubjectName(),
                subject.getSubjectCode());
        log.info(" Department: {} - Knowledge Type: {}",
                department.getDepartmentName(),
                department.getKnowledgeType());

        // 2. Get eligible students based on knowledge type
        List<Student> eligibleStudents = getEligibleStudentsByKnowledgeType(subject, department);

        log.info(" Found {} eligible students (before filtering enrolled)",
                eligibleStudents.size());

        // 3. Filter out already enrolled students
        List<Long> enrolledStudentIds = registrationRepository
                .findByClassEntityClassIdAndStatus(classId, RegistrationStatus.REGISTERED)
                .stream()
                .map(reg -> reg.getStudent().getStudentId())
                .collect(Collectors.toList());

        List<Student> availableStudents = eligibleStudents.stream()
                .filter(student -> !enrolledStudentIds.contains(student.getStudentId()))
                .collect(Collectors.toList());

        log.info(" {} students already enrolled, {} students available to add",
                enrolledStudentIds.size(),
                availableStudents.size());

        // 4. Map to response DTOs
        return availableStudents.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

   
    @Override
    public boolean isStudentEligible(Long studentId, Long classId) {
        log.info(" Checking eligibility: Student {} for Class {}", studentId, classId);

        // 1. Find student
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Student not found"));

        // 2. Find class
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found"));

        Subject subject = classEntity.getSubject();
        Department department = subject.getDepartment();

        // 3. Check already enrolled
        if (registrationRepository.existsByStudentStudentIdAndClassEntityClassId(studentId, classId)) {
            log.info(" Student already enrolled");
            return false;
        }

        // 4. Apply knowledge type logic
        boolean eligible = checkEligibility(student, subject, department);

        log.info(eligible ? " Student is eligible" : "❌ Student is NOT eligible");

        return eligible;
    }

  
    @Override
    public String getEligibilityInfo(Long classId) {
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found"));

        Subject subject = classEntity.getSubject();
        Department department = subject.getDepartment();

        if (department.getKnowledgeType() == KnowledgeType.GENERAL) {
            return "Môn đại cương - Tất cả sinh viên có thể đăng ký";
        }

        if (subject.getMajor() == null) {
            return "Môn chuyên ngành - Sinh viên khoa " + department.getDepartmentName();
        }

        return "Môn chuyên ngành - Chỉ sinh viên ngành " + subject.getMajor().getMajorName();
    }

   
    private List<Student> getEligibleStudentsByKnowledgeType(Subject subject, Department department) {

        if (department.getKnowledgeType() == KnowledgeType.GENERAL) {
            log.info(" GENERAL knowledge subject - All students eligible");
            return studentRepository.findAll();
        }

        
        if (subject.getMajor() == null) {
            log.info(" SPECIALIZED subject (no major) - Students from department {} eligible",
                    department.getDepartmentName());
            return studentRepository.findByMajorDepartmentDepartmentId(department.getDepartmentId());
        }

        
        log.info(" SPECIALIZED subject (major: {}) - Only students from this major eligible",
                subject.getMajor().getMajorName());
        return studentRepository.findByMajorMajorId(subject.getMajor().getMajorId());
    }

   
    private boolean checkEligibility(Student student, Subject subject, Department department) {

        // CASE 1: GENERAL - Always eligible
        if (department.getKnowledgeType() == KnowledgeType.GENERAL) {
            log.info(" GENERAL subject - Student eligible");
            return true;
        }

        // CASE 2: SPECIALIZED without major - Check department
        if (subject.getMajor() == null) {
            boolean eligible = student.getMajor().getDepartment().getDepartmentId()
                    .equals(department.getDepartmentId());

            if (eligible) {
                log.info(" Same department ({}) - Student eligible",
                        department.getDepartmentName());
            } else {
                log.info(" Different department (Student: {}, Subject: {}) - NOT eligible",
                        student.getMajor().getDepartment().getDepartmentName(),
                        department.getDepartmentName());
            }

            return eligible;
        }

        // CASE 3: SPECIALIZED with major - Check major
        boolean eligible = student.getMajor().getMajorId()
                .equals(subject.getMajor().getMajorId());

        if (eligible) {
            log.info(" Same major ({}) - Student eligible",
                    subject.getMajor().getMajorName());
        } else {
            log.info(" Different major (Student: {}, Subject: {}) - NOT eligible",
                    student.getMajor().getMajorName(),
                    subject.getMajor().getMajorName());
        }

        return eligible;
    }

    /**
     * Map Student entity to StudentResponse DTO
     */
    private StudentResponse mapToResponse(Student student) {
        Major major = student.getMajor();
        Department department = major.getDepartment();

        return StudentResponse.builder()
                .studentId(student.getStudentId())
                .studentCode(student.getStudentCode())
                .fullName(student.getFullName())
                .email(student.getEmail())
                .phone(student.getPhone())
                .dateOfBirth(student.getDateOfBirth())
                .academicYear(student.getAcademicYear())
                .majorId(major.getMajorId())
                .majorCode(major.getMajorCode())
                .majorName(major.getMajorName())
                .departmentId(department.getDepartmentId())
                .departmentCode(department.getDepartmentCode())
                .departmentName(department.getDepartmentName())
                .isActive(student.getIsActive())
                .createdAt(student.getCreatedAt())
                .build();
    }
}