package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.uth.ecms.dto.request.StudentCreateRequest;
import vn.edu.uth.ecms.dto.request.StudentUpdateRequest;
import vn.edu.uth.ecms.dto.request.UpdateStudentProfileRequest;
import vn.edu.uth.ecms.dto.response.ClassResponse;
import vn.edu.uth.ecms.dto.response.ImportError;
import vn.edu.uth.ecms.dto.response.ImportResult;
import vn.edu.uth.ecms.dto.response.StudentResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.exception.DuplicateException;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.CourseRegistrationRepository;
import vn.edu.uth.ecms.repository.MajorRepository;
import vn.edu.uth.ecms.repository.SemesterRepository;
import vn.edu.uth.ecms.repository.StudentRepository;
import vn.edu.uth.ecms.service.StudentService;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;

import static javax.management.openmbean.SimpleType.STRING;

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
    private final CourseRegistrationRepository registrationRepository;
    private final SemesterRepository semesterRepository;
    private final ModelMapper modelMapper;
    private final UsernameValidationService usernameValidationService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

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

        usernameValidationService.validateUsernameUnique(request.getStudentCode());

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
        
        // ✅ FIX: Lấy TẤT CẢ registrations (không filter semester)
        List<CourseRegistration> registrations = registrationRepository
                .findByStudentAndStatus(
                        student.getStudentId(), 
                        RegistrationStatus.REGISTERED
                );
        
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
    // FIX: Import method - dùng ngày sinh làm password (nhất quán với createStudent)

    @Override
    @Transactional
    public ImportResult importFromExcel(MultipartFile file) {
        List<ImportError> errors = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;
        int totalRows = 0;

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            totalRows = sheet.getPhysicalNumberOfRows() - 1; // Exclude header

            for (int i = 1; i <= totalRows; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    // Parse row data
                    String studentCode = getCellValueAsString(row.getCell(1));
                    String fullName = getCellValueAsString(row.getCell(2));
                    String genderStr = getCellValueAsString(row.getCell(3));
                    String dateOfBirthStr = getCellValueAsString(row.getCell(4));
                    int academicYear = (int) getCellValueAsNumeric(row.getCell(5));
                    String educationLevelStr = getCellValueAsString(row.getCell(6));
                    String trainingTypeStr = getCellValueAsString(row.getCell(7));
                    String majorCode = getCellValueAsString(row.getCell(8));
                    String email = getCellValueAsString(row.getCell(9));
                    String phone = getCellValueAsString(row.getCell(10));
                    String placeOfBirth = getCellValueAsString(row.getCell(11));

                    // Validate required fields
                    if (studentCode.isEmpty()) {
                        throw new IllegalArgumentException("Mã sinh viên không được để trống");
                    }
                    try {
                        usernameValidationService.validateUsernameUnique(studentCode);
                    } catch (DuplicateException e) {
                        throw new IllegalArgumentException("Mã sinh viên đã tồn tại trong hệ thống");
                    }
                    if (fullName.isEmpty()) {
                        throw new IllegalArgumentException("Họ và tên không được để trống");
                    }

                    // Check if student already exists
                    if (studentRepository.existsByStudentCode(studentCode)) {
                        throw new IllegalArgumentException("Mã sinh viên đã tồn tại");
                    }

                    // Find major
                    Major major = majorRepository.findByMajorCode(majorCode)
                            .orElseThrow(() -> new IllegalArgumentException(
                                    "Không tìm thấy chuyên ngành với mã: " + majorCode));

                    // Parse date
                    LocalDate dateOfBirth = LocalDate.parse(dateOfBirthStr, DATE_FORMATTER);

                    // Parse enums
                    Gender gender = Gender.valueOf(genderStr.toUpperCase());
                    EducationLevel educationLevel = EducationLevel.valueOf(educationLevelStr.toUpperCase());
                    TrainingType trainingType = TrainingType.valueOf(trainingTypeStr.toUpperCase());

                    String defaultPassword = generateDefaultPassword(dateOfBirth); // ddMMyyyy format
                    String hashedPassword = passwordEncoder.encode(defaultPassword);

                    // Create student
                    Student student = Student.builder()
                            .studentCode(studentCode)
                            .fullName(fullName)
                            .gender(gender)
                            .dateOfBirth(dateOfBirth)
                            .academicYear(academicYear)
                            .educationLevel(educationLevel)
                            .trainingType(trainingType)
                            .major(major)
                            .email(email.isEmpty() ? null : email)
                            .phone(phone.isEmpty() ? null : phone)
                            .placeOfBirth(placeOfBirth.isEmpty() ? null : placeOfBirth)
                            .password(hashedPassword)
                            .isActive(true)
                            .isFirstLogin(true)
                            .build();

                    studentRepository.save(student);
                    successCount++;

                    log.info("✅ Imported student: {} - Default password: {}",
                            studentCode, defaultPassword);

                } catch (Exception e) {
                    failureCount++;
                    String studentCode = getCellValueAsString(row.getCell(1));

                    errors.add(ImportError.builder()
                            .row(i + 1)
                            .identifier(studentCode.isEmpty() ? "N/A" : studentCode)
                            .message(e.getMessage())
                            .build());

                    log.warn("Error importing student at row {}: {}", i + 1, e.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Error reading Excel file: {}", e.getMessage());
            throw new RuntimeException("Lỗi đọc file Excel: " + e.getMessage());
        }

        return ImportResult.builder()
                .totalRows(totalRows)
                .successCount(successCount)
                .failureCount(failureCount)
                .errors(errors)
                .build();
    }

    @Override
    public ByteArrayOutputStream generateImportTemplate() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Students");

        // Create header style
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setFontHeightInPoints((short) 12);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);

        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {
                "STT", "Mã sinh viên*", "Họ và tên*", "Giới tính*",
                "Ngày sinh*", "Khóa học*", "Trình độ*", "Hình thức*",
                "Mã chuyên ngành*", "Email", "Số điện thoại", "Nơi sinh"
        };

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 4000);
        }

        // Add example rows
        addExampleRow(sheet, 1, 1, "054205002348", "Nguyễn Văn A", "MALE",
                "17/03/2005", 2024, "BACHELOR", "REGULAR", "7480201",
                "student1@example.com", "0123456789", "TP. HCM");

        addExampleRow(sheet, 2, 2, "054205002349", "Trần Thị B", "FEMALE",
                "25/08/2005", 2024, "BACHELOR", "REGULAR", "7480201",
                "student2@example.com", "0987654321", "Hà Nội");

        addExampleRow(sheet, 3, 3, "054205002350", "Lê Văn C", "MALE",
                "10/12/2004", 2023, "BACHELOR", "DISTANCE", "7480104",
                "", "0369852147", "Đà Nẵng");

        // Add instruction sheet
        Sheet instructionSheet = workbook.createSheet("Hướng dẫn");
        addInstructions(instructionSheet);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();

        return outputStream;
    }

    private void addExampleRow(Sheet sheet, int rowNum, int stt, String studentCode,
                               String fullName, String gender, String dob, int year,
                               String eduLevel, String trainType, String majorCode,
                               String email, String phone, String placeOfBirth) {
        Row row = sheet.createRow(rowNum);
        row.createCell(0).setCellValue(stt);
        row.createCell(1).setCellValue(studentCode);
        row.createCell(2).setCellValue(fullName);
        row.createCell(3).setCellValue(gender);
        row.createCell(4).setCellValue(dob);
        row.createCell(5).setCellValue(year);
        row.createCell(6).setCellValue(eduLevel);
        row.createCell(7).setCellValue(trainType);
        row.createCell(8).setCellValue(majorCode);
        row.createCell(9).setCellValue(email);
        row.createCell(10).setCellValue(phone);
        row.createCell(11).setCellValue(placeOfBirth);
    }

    private void addInstructions(Sheet sheet) {
        String[] instructions = {
                "HƯỚNG DẪN IMPORT SINH VIÊN",
                "",
                "1. CÁC CỘT BẮT BUỘC (đánh dấu *):",
                "   - Mã sinh viên: Tối đa 12 ký tự, không trùng lặp",
                "   - Họ và tên: Tối đa 100 ký tự",
                "   - Giới tính: MALE, FEMALE, hoặc OTHER",
                "   - Ngày sinh: Định dạng DD/MM/YYYY (ví dụ: 17/03/2005)",
                "   - Khóa học: Năm học (ví dụ: 2024)",
                "   - Trình độ: BACHELOR (Đại học), MASTER (Thạc sĩ), DOCTOR (Tiến sĩ), ASSOCIATE (Cao đẳng)",
                "   - Hình thức: REGULAR (Chính quy), DISTANCE (Từ xa), PART_TIME (Vừa làm vừa học)",
                "   - Mã chuyên ngành: Phải tồn tại trong hệ thống",
                "",
                "2. CÁC CỘT TÙY CHỌN:",
                "   - Email: Địa chỉ email hợp lệ",
                "   - Số điện thoại: Tối đa 20 ký tự",
                "   - Nơi sinh: Tối đa 200 ký tự",
                "",
                "3. LƯU Ý:",
                "   - Không chỉnh sửa tên cột trong dòng header",
                "   - Xóa các dòng ví dụ trước khi import dữ liệu thật",
                "   - Mật khẩu mặc định sẽ là mã sinh viên",
                "   - Sinh viên phải đổi mật khẩu khi đăng nhập lần đầu"
        };

        for (int i = 0; i < instructions.length; i++) {
            Row row = sheet.createRow(i);
            Cell cell = row.createCell(0);
            cell.setCellValue(instructions[i]);
        }

        sheet.setColumnWidth(0, 15000);
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";

        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return DATE_FORMATTER.format(cell.getLocalDateTimeCellValue().toLocalDate());
                }
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }

    private double getCellValueAsNumeric(Cell cell) {
        if (cell == null) return 0;

        switch (cell.getCellType()) {
            case NUMERIC:
                return cell.getNumericCellValue();
            case STRING:
                try {
                    return Double.parseDouble(cell.getStringCellValue().trim());
                } catch (NumberFormatException e) {
                    return 0;
                }
            default:
                return 0;
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