package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.StudentCreateRequest;
import vn.edu.uth.ecms.dto.request.StudentUpdateRequest;
import vn.edu.uth.ecms.dto.request.UpdateStudentProfileRequest;
import vn.edu.uth.ecms.dto.response.ClassResponse;
import vn.edu.uth.ecms.dto.response.StudentResponse;
import vn.edu.uth.ecms.entity.ClassEntity;
import vn.edu.uth.ecms.entity.CourseRegistration;
import vn.edu.uth.ecms.entity.Major;
import vn.edu.uth.ecms.entity.RegistrationStatus;
import vn.edu.uth.ecms.entity.Semester;
import vn.edu.uth.ecms.entity.SemesterStatus;
import vn.edu.uth.ecms.entity.Student;
import vn.edu.uth.ecms.entity.TimeSlot;
import vn.edu.uth.ecms.exception.DuplicateException;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.CourseRegistrationRepository;
import vn.edu.uth.ecms.repository.MajorRepository;
import vn.edu.uth.ecms.repository.SemesterRepository;
import vn.edu.uth.ecms.repository.StudentRepository;
import vn.edu.uth.ecms.service.StudentService;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;

/**
 * Implementation of StudentService
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final MajorRepository majorRepository;
    private final PasswordEncoder passwordEncoder;
    private final CourseRegistrationRepository registrationRepository;  // ← THÊM
    private final SemesterRepository semesterRepository;                // ← THÊM
    private final ModelMapper modelMapper;  

    /**
     * Generate default password from date of birth
     * Format: ddMMyyyy
     */
    private String generateDefaultPassword(LocalDate dateOfBirth) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("ddMMyyyy");
        return dateOfBirth.format(formatter);
    }

    /**
     * Map Student entity to StudentResponse DTO
     */
    private StudentResponse mapToResponse(Student student) {
        StudentResponse.StudentResponseBuilder builder = StudentResponse.builder()
                .studentId(student.getStudentId())
                .studentCode(student.getStudentCode())
                .fullName(student.getFullName())
                .gender(student.getGender())
                .dateOfBirth(student.getDateOfBirth())
                .academicYear(student.getAcademicYear())
                .educationLevel(student.getEducationLevel())
                .trainingType(student.getTrainingType())
                .email(student.getEmail())
                .phone(student.getPhone())
                .placeOfBirth(student.getPlaceOfBirth())
                .avatarUrl(student.getAvatarUrl())
                .isFirstLogin(student.getIsFirstLogin())
                .isActive(student.getIsActive())
                .createdAt(student.getCreatedAt())
                .updatedAt(student.getUpdatedAt());

        // Add major info (required)
        if (student.getMajor() != null) {
            builder.majorId(student.getMajor().getMajorId())
                    .majorCode(student.getMajor().getMajorCode())
                    .majorName(student.getMajor().getMajorName());

            // Add department info (from major)
            if (student.getMajor().getDepartment() != null) {
                builder.departmentId(student.getMajor().getDepartment().getDepartmentId())
                        .departmentCode(student.getMajor().getDepartment().getDepartmentCode())
                        .departmentName(student.getMajor().getDepartment().getDepartmentName());
            }
        }

        return builder.build();
    }

    @Override
    public StudentResponse createStudent(StudentCreateRequest request) {
        log.info("Creating student with student code: {}", request.getStudentCode());

        // 1. Validate student code is unique
        if (studentRepository.existsByStudentCode(request.getStudentCode())) {
            throw new DuplicateException("Student code already exists: " + request.getStudentCode());
        }

        // 2. Find major
        Major major = majorRepository.findById(request.getMajorId())
                .orElseThrow(() -> new NotFoundException("Major not found with ID: " + request.getMajorId()));

        // 3. Parse date of birth
        LocalDate dateOfBirth = LocalDate.parse(request.getDateOfBirth());

        // 4. Generate default password
        String defaultPassword = generateDefaultPassword(dateOfBirth);
        String hashedPassword = passwordEncoder.encode(defaultPassword);

        // 5. Create student entity
        Student student = Student.builder()
                .studentCode(request.getStudentCode())
                .fullName(request.getFullName())
                .gender(request.getGender())
                .dateOfBirth(dateOfBirth)
                .academicYear(request.getAcademicYear())
                .educationLevel(request.getEducationLevel())
                .trainingType(request.getTrainingType())
                .major(major)
                .email(request.getEmail())
                .phone(request.getPhone())
                .placeOfBirth(request.getPlaceOfBirth())
                .password(hashedPassword)
                .isFirstLogin(true)
                .isActive(true)
                .build();

        // 6. Save student
        Student savedStudent = studentRepository.save(student);

        log.info("Student created successfully with ID: {}", savedStudent.getStudentId());
        log.info("Default password for student {}: {}", savedStudent.getStudentCode(), defaultPassword);

        return mapToResponse(savedStudent);
    }

    @Override
    public StudentResponse updateStudent(Long id, StudentUpdateRequest request) {
        log.info("Updating student with ID: {}", id);

        // 1. Find existing student
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Student not found with ID: " + id));

        // 2. Find major (check if changed)
        Major major = majorRepository.findById(request.getMajorId())
                .orElseThrow(() -> new NotFoundException("Major not found with ID: " + request.getMajorId()));

        // 3. Parse date of birth
        LocalDate dateOfBirth = LocalDate.parse(request.getDateOfBirth());

        // 4. Update student fields
        student.setFullName(request.getFullName());
        student.setGender(request.getGender());
        student.setDateOfBirth(dateOfBirth);
        student.setAcademicYear(request.getAcademicYear());
        student.setEducationLevel(request.getEducationLevel());
        student.setTrainingType(request.getTrainingType());
        student.setMajor(major);
        student.setEmail(request.getEmail());
        student.setPhone(request.getPhone());
        student.setPlaceOfBirth(request.getPlaceOfBirth());

        // 5. Save updated student
        Student updatedStudent = studentRepository.save(student);

        log.info("Student updated successfully: {}", updatedStudent.getStudentCode());

        return mapToResponse(updatedStudent);
    }

    @Override
    public void deleteStudent(Long id) {
        log.info("Soft deleting student with ID: {}", id);

        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Student not found with ID: " + id));

        // Soft delete - set isActive to false
        student.setIsActive(false);
        studentRepository.save(student);

        log.info("Student soft deleted: {}", student.getStudentCode());
    }

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long id) {
        log.info("Fetching student with ID: {}", id);

        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Student not found with ID: " + id));

        return mapToResponse(student);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StudentResponse> getAllStudents(Pageable pageable) {
        log.info("Fetching all students - page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());

        return studentRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StudentResponse> getActiveStudents(Pageable pageable) {
        log.info("Fetching active students - page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());

        return studentRepository.findByIsActiveTrue(pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentResponse> getStudentsByMajor(Long majorId) {
        log.info("Fetching students for major ID: {}", majorId);

        // Verify major exists
        majorRepository.findById(majorId)
                .orElseThrow(() -> new NotFoundException("Major not found with ID: " + majorId));

        return studentRepository.findByMajorMajorId(majorId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StudentResponse> getStudentsByMajor(Long majorId, Pageable pageable) {
        log.info("Fetching students for major ID: {} - page: {}, size: {}",
                majorId, pageable.getPageNumber(), pageable.getPageSize());

        // Verify major exists
        majorRepository.findById(majorId)
                .orElseThrow(() -> new NotFoundException("Major not found with ID: " + majorId));

        return studentRepository.findByMajorMajorId(majorId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentResponse> getStudentsByDepartment(Long departmentId) {
        log.info("Fetching students for department ID: {}", departmentId);

        return studentRepository.findByDepartmentId(departmentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StudentResponse> getStudentsByAcademicYear(Integer academicYear, Pageable pageable) {
        log.info("Fetching students for academic year: {} - page: {}, size: {}",
                academicYear, pageable.getPageNumber(), pageable.getPageSize());

        return studentRepository.findByAcademicYear(academicYear, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StudentResponse> searchStudents(String keyword, Pageable pageable) {
        log.info("Searching students with keyword: '{}' - page: {}, size: {}",
                keyword, pageable.getPageNumber(), pageable.getPageSize());

        return studentRepository.searchStudents(keyword, pageable)
                .map(this::mapToResponse);
    }

    // ==================== PROFILE METHODS (NEW) ====================

    @Override
    @Transactional(readOnly = true)
    public StudentResponse getByStudentCode(String studentCode) {
        log.info("📋 [StudentService] Getting student by code: {}", studentCode);
        
        Student student = studentRepository.findByStudentCode(studentCode)
                .orElseThrow(() -> new NotFoundException("Student not found with code: " + studentCode));
        
        return mapToResponse(student);
    }

    @Override
    @Transactional
    public StudentResponse updateProfile(String studentCode, UpdateStudentProfileRequest request) {
        log.info("✏️ [StudentService] Updating profile for student code: {}", studentCode);
        
        Student student = studentRepository.findByStudentCode(studentCode)
                .orElseThrow(() -> new NotFoundException("Student not found with code: " + studentCode));
        
        // Update only allowed fields (email, phone)
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            student.setEmail(request.getEmail().trim());
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            student.setPhone(request.getPhone().trim());
        }
        
        Student updated = studentRepository.save(student);
        log.info("✅ [StudentService] Profile updated for: {}", updated.getFullName());
        
        return mapToResponse(updated);
    }
     @Override
    @Transactional(readOnly = true)
    public List<ClassResponse> getEnrolledClasses(String studentCode) {
        log.info("[StudentService] Getting enrolled classes for student: {}", studentCode);
        
        try {
            Student student = studentRepository.findByStudentCode(studentCode)
                    .orElseThrow(() -> new RuntimeException("Student not found: " + studentCode));
            
            log.info("[StudentService] Found student ID: {}", student.getStudentId());
            
            Semester activeSemester = semesterRepository.findByStatus(SemesterStatus.ACTIVE)
                    .orElse(null);
            
            if (activeSemester == null) {
                log.warn("[StudentService] No active semester found");
                return List.of();
            }
            
            log.info("[StudentService] Active semester: {} (ID: {})", 
                    activeSemester.getSemesterCode(), activeSemester.getSemesterId());
            
            List<CourseRegistration> registrations = registrationRepository
                    .findByStudentAndStatus(
                            student.getStudentId(), 
                            RegistrationStatus.REGISTERED
                    )
                    .stream()
                    .filter(reg -> reg.getSemester().getSemesterId().equals(activeSemester.getSemesterId()))
                    .toList();
            
            log.info("[StudentService] Found {} registrations", registrations.size());
            
            List<ClassResponse> classes = registrations.stream()
                    .map(registration -> {
                        ClassEntity classEntity = registration.getClassEntity();
                        return mapClassToResponse(classEntity);
                    })
                    .toList();
            
            log.info("[StudentService] ✅ Returning {} classes", classes.size());
            
            return classes;
            
        } catch (Exception e) {
            log.error("[StudentService] ❌ Error getting enrolled classes", e);
            throw new RuntimeException("Failed to get enrolled classes: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ClassResponse getEnrolledClassDetail(String studentCode, Long classId) {
        log.info("[StudentService] Getting class detail: {} for student: {}", classId, studentCode);
        
        try {
            Student student = studentRepository.findByStudentCode(studentCode)
                    .orElseThrow(() -> new RuntimeException("Student not found"));
            
            Optional<CourseRegistration> registration = registrationRepository
                    .findByStudentStudentIdAndClassEntityClassId(
                            student.getStudentId(), 
                            classId
                    );
            
            if (registration.isEmpty() || registration.get().getStatus() != RegistrationStatus.REGISTERED) {
                log.warn("[StudentService] Student not enrolled in class: {}", classId);
                return null;
            }
            
            ClassEntity classEntity = registration.get().getClassEntity();
            ClassResponse response = mapClassToResponse(classEntity);
            
            log.info("[StudentService] ✅ Class detail found: {}", response.getClassCode());
            
            return response;
            
        } catch (Exception e) {
            log.error("[StudentService] ❌ Error getting class detail", e);
            throw new RuntimeException("Failed to get class detail: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassResponse> getCurrentSchedule(String studentCode) {
        log.info("[StudentService] Getting current schedule for: {}", studentCode);
        return getEnrolledClasses(studentCode);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassResponse> getScheduleBySemester(String studentCode, Long semesterId) {
        log.info("[StudentService] Getting schedule for semester: {} student: {}", semesterId, studentCode);
        
        try {
            Student student = studentRepository.findByStudentCode(studentCode)
                    .orElseThrow(() -> new RuntimeException("Student not found"));
            
            List<CourseRegistration> registrations = registrationRepository
                    .findByStudentAndSemester(student.getStudentId(), semesterId)
                    .stream()
                    .filter(reg -> reg.getStatus() == RegistrationStatus.REGISTERED)
                    .toList();
            
            return registrations.stream()
                    .map(reg -> mapClassToResponse(reg.getClassEntity()))
                    .toList();
                    
        } catch (Exception e) {
            log.error("[StudentService] Error getting schedule", e);
            throw new RuntimeException("Failed to get schedule: " + e.getMessage(), e);
        }
    }

    // ==================== HELPER METHODS ====================

    private ClassResponse mapClassToResponse(ClassEntity classEntity) {
        ClassResponse response = modelMapper.map(classEntity, ClassResponse.class);
        
        response.setSubjectId(classEntity.getSubject().getSubjectId());
        response.setSubjectCode(classEntity.getSubject().getSubjectCode());
        response.setSubjectName(classEntity.getSubject().getSubjectName());
        response.setCredits(classEntity.getSubject().getCredits());
        
        response.setTeacherId(classEntity.getTeacher().getTeacherId());
        response.setTeacherName(classEntity.getTeacher().getFullName());
        response.setTeacherEmail(classEntity.getTeacher().getEmail());
        
        response.setSemesterId(classEntity.getSemester().getSemesterId());
        response.setSemesterCode(classEntity.getSemester().getSemesterCode());
       response.setSemesterName(classEntity.getSemester().getSemesterName());
        
        if (classEntity.getFixedRoom() != null) {
            response.setFixedRoom(classEntity.getFixedRoom().getRoomCode());
            response.setFixedRoomName(classEntity.getFixedRoom().getRoomName());
            response.setFixedRoomCapacity(classEntity.getFixedRoom().getCapacity());
        }
        
        response.setDayOfWeek(classEntity.getDayOfWeek().name());
        response.setDayOfWeekDisplay(getDayOfWeekDisplay(classEntity.getDayOfWeek()));
        response.setTimeSlot(classEntity.getTimeSlot().name());
        response.setTimeSlotDisplay(getTimeSlotDisplay(classEntity.getTimeSlot()));
        
        response.setAvailableSeats(classEntity.getAvailableSeats());
        response.setIsFull(classEntity.isFull());
        response.setCanRegister(classEntity.canRegister());
        
        return response;
    }

    private String getDayOfWeekDisplay(java.time.DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> "Thứ 2";
            case TUESDAY -> "Thứ 3";
            case WEDNESDAY -> "Thứ 4";
            case THURSDAY -> "Thứ 5";
            case FRIDAY -> "Thứ 6";
            case SATURDAY -> "Thứ 7";
            case SUNDAY -> "Chủ nhật";
        };
    }

    private String getTimeSlotDisplay(TimeSlot timeSlot) {
        return switch (timeSlot) {
            case CA1 -> "Ca 1 (06:45-09:15)";
            case CA2 -> "Ca 2 (09:25-11:55)";
            case CA3 -> "Ca 3 (12:10-14:40)";
            case CA4 -> "Ca 4 (14:50-17:20)";
            case CA5 -> "Ca 5 (17:30-20:00)";
        };
    }
}