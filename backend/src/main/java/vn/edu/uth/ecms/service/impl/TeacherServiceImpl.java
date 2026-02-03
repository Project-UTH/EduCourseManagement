package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.uth.ecms.dto.request.ChangePasswordRequest;
import vn.edu.uth.ecms.dto.request.TeacherCreateRequest;
import vn.edu.uth.ecms.dto.request.TeacherUpdateRequest;
import vn.edu.uth.ecms.dto.request.UpdateTeacherProfileRequest;
import vn.edu.uth.ecms.dto.response.ImportError;
import vn.edu.uth.ecms.dto.response.ImportResult;
import vn.edu.uth.ecms.dto.response.TeacherResponse;
import vn.edu.uth.ecms.dto.response.TeacherSubjectResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.entity.enums.Gender;
import vn.edu.uth.ecms.exception.BadRequestException;
import vn.edu.uth.ecms.exception.DuplicateException;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.DepartmentRepository;
import vn.edu.uth.ecms.repository.MajorRepository;
import vn.edu.uth.ecms.repository.TeacherRepository;
import vn.edu.uth.ecms.repository.TeacherSubjectRepository;
import vn.edu.uth.ecms.service.TeacherService;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of TeacherService
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository teacherRepository;
    private final DepartmentRepository departmentRepository;
    private final MajorRepository majorRepository;
    private final PasswordEncoder passwordEncoder;
    private final TeacherSubjectRepository teacherSubjectRepository;
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
     * Map Teacher entity to TeacherResponse DTO
     */
    private TeacherResponse mapToResponse(Teacher teacher) {
        TeacherResponse.TeacherResponseBuilder builder = TeacherResponse.builder()
                .teacherId(teacher.getTeacherId())
                .citizenId(teacher.getCitizenId())
                .fullName(teacher.getFullName())
                .gender(teacher.getGender())
                .dateOfBirth(teacher.getDateOfBirth())
                .email(teacher.getEmail())
                .phone(teacher.getPhone())
                .departmentId(teacher.getDepartment().getDepartmentId())
                .departmentCode(teacher.getDepartment().getDepartmentCode())
                .departmentName(teacher.getDepartment().getDepartmentName())
                .degree(teacher.getDegree())
                .address(teacher.getAddress())
                .isFirstLogin(teacher.getIsFirstLogin())
                .isActive(teacher.getIsActive())
                .createdAt(teacher.getCreatedAt())
                .updatedAt(teacher.getUpdatedAt());

        // Add major info if exists
        if (teacher.getMajor() != null) {
            builder.majorId(teacher.getMajor().getMajorId())
                    .majorCode(teacher.getMajor().getMajorCode())
                    .majorName(teacher.getMajor().getMajorName());
        }

        // Add subjects list
        if (teacher.getTeacherSubjects() != null && !teacher.getTeacherSubjects().isEmpty()) {
            List<TeacherSubjectResponse> subjects = teacher.getTeacherSubjects().stream()
                    .map(this::mapTeacherSubjectToResponse)
                    .collect(Collectors.toList());
            builder.subjects(subjects);
        }

        return builder.build();
    }

    /**
     * Map TeacherSubject entity to TeacherSubjectResponse DTO
     */
    private TeacherSubjectResponse mapTeacherSubjectToResponse(TeacherSubject teacherSubject) {
        return TeacherSubjectResponse.builder()
                .teacherSubjectId(teacherSubject.getTeacherSubjectId())
                .teacherId(teacherSubject.getTeacher().getTeacherId())
                .teacherName(teacherSubject.getTeacher().getFullName())
                .teacherCitizenId(teacherSubject.getTeacher().getCitizenId())
                .subjectId(teacherSubject.getSubject().getSubjectId())
                .subjectCode(teacherSubject.getSubject().getSubjectCode())
                .subjectName(teacherSubject.getSubject().getSubjectName())
                .credits(teacherSubject.getSubject().getCredits())
                .isPrimary(teacherSubject.getIsPrimary())
                .notes(teacherSubject.getNotes())
                .build();
    }

    /**
     * Validate that major belongs to department
     */
    private void validateMajorBelongsToDepartment(Major major, Department department) {
        if (!major.getDepartment().getDepartmentId().equals(department.getDepartmentId())) {
            throw new BadRequestException(
                    String.format("Major '%s' does not belong to department '%s'",
                            major.getMajorName(), department.getDepartmentName()));
        }
    }

    @Override
    public TeacherResponse createTeacher(TeacherCreateRequest request) {
        log.info("Creating teacher with citizen ID: {}", request.getCitizenId());

        usernameValidationService.validateUsernameUnique(request.getCitizenId());

        // 1. Validate citizen ID is unique
        if (teacherRepository.existsByCitizenId(request.getCitizenId())) {
            throw new DuplicateException("Citizen ID already exists: " + request.getCitizenId());
        }

        // 2. Find and validate department
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new NotFoundException("Department not found with ID: " + request.getDepartmentId()));

        // 3. Find and validate major (if provided)
        Major major = null;
        if (request.getMajorId() != null) {
            major = majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new NotFoundException("Major not found with ID: " + request.getMajorId()));

            // Validate major belongs to department
            validateMajorBelongsToDepartment(major, department);
        }

        // 4. Generate default password (ddMMyyyy from date of birth)
        String defaultPassword = generateDefaultPassword(request.getDateOfBirth());
        String hashedPassword = passwordEncoder.encode(defaultPassword);

        // 5. Build teacher entity
        Teacher teacher = Teacher.builder()
                .citizenId(request.getCitizenId())
                .password(hashedPassword)
                .fullName(request.getFullName())
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .email(request.getEmail())
                .phone(request.getPhone())
                .department(department)
                .major(major)
                .degree(request.getDegree())
                .address(request.getAddress())
                .isFirstLogin(true)
                .isActive(true)
                .build();

        // 6. Save and return
        Teacher savedTeacher = teacherRepository.save(teacher);
        log.info("Teacher created successfully with ID: {}", savedTeacher.getTeacherId());

        return mapToResponse(savedTeacher);
    }

    @Override
    public TeacherResponse updateTeacher(Long id, TeacherUpdateRequest request) {
        log.info("Updating teacher with ID: {}", id);

        // 1. Find existing teacher
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Teacher not found with ID: " + id));

        // 2. Update department (validate if changed)
        Department newDepartment = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new NotFoundException("Department not found with ID: " + request.getDepartmentId()));

        // If department changed, reset major to null
        if (!teacher.getDepartment().getDepartmentId().equals(newDepartment.getDepartmentId())) {
            log.info("Department changed, resetting major to null");
            teacher.setDepartment(newDepartment);
            teacher.setMajor(null);
        }

        // 3. Update major (validate cascade)
        if (request.getMajorId() != null) {
            Major major = majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new NotFoundException("Major not found with ID: " + request.getMajorId()));

            // Validate major belongs to current department
            validateMajorBelongsToDepartment(major, teacher.getDepartment());
            teacher.setMajor(major);
        } else {
            teacher.setMajor(null);
        }

        // 4. Update other fields
        teacher.setFullName(request.getFullName());
        teacher.setGender(request.getGender());
        teacher.setDateOfBirth(request.getDateOfBirth());
        teacher.setEmail(request.getEmail());
        teacher.setPhone(request.getPhone());
        teacher.setDegree(request.getDegree());
        teacher.setAddress(request.getAddress());

        // 5. Save and return
        Teacher updatedTeacher = teacherRepository.save(teacher);
        log.info("Teacher updated successfully with ID: {}", updatedTeacher.getTeacherId());

        return mapToResponse(updatedTeacher);
    }

    @Override
    public void deleteTeacher(Long id) {
        log.info("Deleting teacher with ID: {}", id);

        // 1. Find teacher
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Teacher not found with ID: " + id));

        // 2. Soft delete (set isActive = false)
        teacher.setIsActive(false);
        teacherRepository.save(teacher);

        log.info("Teacher soft deleted successfully with ID: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherResponse getTeacherById(Long id) {
        log.info("Getting teacher with ID: {}", id);

        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Teacher not found with ID: " + id));

        return mapToResponse(teacher);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TeacherResponse> getAllTeachers(Pageable pageable) {
        log.info("Getting all teachers with pagination: page={}, size={}",
                pageable.getPageNumber(), pageable.getPageSize());

        return teacherRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherResponse> getTeachersByDepartment(Long departmentId) {
        log.info("Getting teachers by department ID: {}", departmentId);

        // Validate department exists
        if (!departmentRepository.existsById(departmentId)) {
            throw new NotFoundException("Department not found with ID: " + departmentId);
        }

        return teacherRepository.findByDepartmentDepartmentId(departmentId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherResponse> getTeachersByMajor(Long majorId) {
        log.info("Getting teachers by major ID: {}", majorId);

        // Validate major exists
        if (!majorRepository.existsById(majorId)) {
            throw new NotFoundException("Major not found with ID: " + majorId);
        }

        return teacherRepository.findByMajorMajorId(majorId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TeacherResponse> searchTeachers(String keyword, Pageable pageable) {
        log.info("Searching teachers with keyword: {}", keyword);

        return teacherRepository.searchTeachers(keyword, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TeacherResponse> getActiveTeachers() {
        log.info("Getting all active teachers");

        return teacherRepository.findByIsActiveTrue()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TeacherResponse getByCitizenId(String citizenId) {
        log.info(" [TeacherService] Getting teacher by citizenId: {}", citizenId);

        Teacher teacher = teacherRepository.findByCitizenId(citizenId)
                .orElseThrow(() -> new NotFoundException("Teacher not found with citizenId: " + citizenId));

        return mapToResponse(teacher);
    }

    @Override
    @Transactional
    public TeacherResponse updateProfile(String citizenId, UpdateTeacherProfileRequest request) {
        log.info(" [TeacherService] Updating profile for citizenId: {}", citizenId);

        Teacher teacher = teacherRepository.findByCitizenId(citizenId)
                .orElseThrow(() -> new NotFoundException("Teacher not found with citizenId: " + citizenId));

        // Update only allowed fields (email, phone, address)
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            teacher.setEmail(request.getEmail().trim());
        }
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            teacher.setPhone(request.getPhone().trim());
        }
        if (request.getAddress() != null) {
            teacher.setAddress(request.getAddress().trim());
        }

        Teacher updated = teacherRepository.save(teacher);
        log.info(" [TeacherService] Profile updated for: {}", updated.getFullName());

        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void changePassword(String citizenId, ChangePasswordRequest request) {
        log.info(" [TeacherService] Changing password for citizenId: {}", citizenId);

        Teacher teacher = teacherRepository.findByCitizenId(citizenId)
                .orElseThrow(() -> new NotFoundException("Teacher not found with citizenId: " + citizenId));

        // Verify old password matches
        if (!passwordEncoder.matches(request.getOldPassword(), teacher.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không đúng");
        }

        // Verify new password matches confirm password
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        // Update password
        teacher.setPassword(passwordEncoder.encode(request.getNewPassword()));
        teacher.setIsFirstLogin(false); // Mark as not first login anymore

        teacherRepository.save(teacher);
        log.info(" [TeacherService] Password changed successfully for: {}", teacher.getFullName());
    }

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
                if (row == null)
                    continue;

                try {
                    // Parse row data
                    String citizenId = getCellValueAsString(row.getCell(1));
                    String fullName = getCellValueAsString(row.getCell(2));
                    String genderStr = getCellValueAsString(row.getCell(3));
                    String dateOfBirthStr = getCellValueAsString(row.getCell(4));
                    String departmentCode = getCellValueAsString(row.getCell(5));
                    String majorCode = getCellValueAsString(row.getCell(6));
                    String degree = getCellValueAsString(row.getCell(7));
                    String email = getCellValueAsString(row.getCell(8));
                    String phone = getCellValueAsString(row.getCell(9));
                    String address = getCellValueAsString(row.getCell(10));

                    // Validate required fields
                    if (citizenId.isEmpty()) {
                        throw new IllegalArgumentException("CCCD không được để trống");
                    }
                    try {
                        usernameValidationService.validateUsernameUnique(citizenId);
                    } catch (DuplicateException e) {
                        throw new IllegalArgumentException("CCCD đã tồn tại trong hệ thống");
                    }
                    if (citizenId.length() != 12) {
                        throw new IllegalArgumentException("CCCD phải có đúng 12 ký tự");
                    }
                    if (fullName.isEmpty()) {
                        throw new IllegalArgumentException("Họ và tên không được để trống");
                    }

                    // Check if teacher already exists
                    if (teacherRepository.existsByCitizenId(citizenId)) {
                        throw new IllegalArgumentException("CCCD đã tồn tại");
                    }

                    // Find department
                    Department department = departmentRepository.findByDepartmentCode(departmentCode)
                            .orElseThrow(() -> new IllegalArgumentException(
                                    "Không tìm thấy khoa với mã: " + departmentCode));

                    // Find major (optional)
                    Major major = null;
                    if (!majorCode.isEmpty()) {
                        major = majorRepository.findByMajorCode(majorCode)
                                .orElseThrow(() -> new IllegalArgumentException(
                                        "Không tìm thấy chuyên ngành với mã: " + majorCode));
                    }

                    // Parse date
                    LocalDate dateOfBirth = LocalDate.parse(dateOfBirthStr, DATE_FORMATTER);

                    // Parse gender
                    Gender gender = Gender.valueOf(genderStr.toUpperCase());

                    String defaultPassword = generateDefaultPassword(dateOfBirth); // ddMMyyyy format
                    String hashedPassword = passwordEncoder.encode(defaultPassword);

                    // Create teacher
                    Teacher teacher = Teacher.builder()
                            .citizenId(citizenId)
                            .fullName(fullName)
                            .gender(gender)
                            .dateOfBirth(dateOfBirth)
                            .department(department)
                            .major(major)
                            .degree(degree.isEmpty() ? null : degree)
                            .email(email.isEmpty() ? null : email)
                            .phone(phone.isEmpty() ? null : phone)
                            .address(address.isEmpty() ? null : address)
                            .password(hashedPassword)
                            .isActive(true)
                            .isFirstLogin(true)
                            .build();

                    teacherRepository.save(teacher);
                    successCount++;

                } catch (Exception e) {
                    failureCount++;
                    String citizenId = getCellValueAsString(row.getCell(1));

                    errors.add(ImportError.builder()
                            .row(i + 1)
                            .identifier(citizenId.isEmpty() ? "N/A" : citizenId)
                            .message(e.getMessage())
                            .build());

                    log.warn("Error importing teacher at row {}: {}", i + 1, e.getMessage());
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
        Sheet sheet = workbook.createSheet("Teachers");

        // Create header style
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setFontHeightInPoints((short) 12);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);

        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {
                "STT", "CCCD*", "Họ và tên*", "Giới tính*",
                "Ngày sinh*", "Mã khoa*", "Mã chuyên ngành", "Học vị",
                "Email", "Số điện thoại", "Địa chỉ"
        };

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 4000);
        }

        // Add example rows with realistic Vietnamese teacher data
        addExampleRow(sheet, 1, 1, "054205002349", "Nguyễn Văn Nam", "MALE",
                "15/05/1985", "CNTT", "7480201", "Thạc sĩ",
                "nguyenvannam@uth.edu.vn", "0912345678", "123 Đường Lý Thường Kiệt, Q.10, TP.HCM");

        addExampleRow(sheet, 2, 2, "054205002350", "Trần Thị Lan", "FEMALE",
                "22/09/1980", "CNTT", "7480104", "Tiến sĩ",
                "tranthilan@uth.edu.vn", "0923456789", "456 Đường Nguyễn Thị Minh Khai, Q.3, TP.HCM");

        addExampleRow(sheet, 3, 3, "054205002351", "Lê Hoàng Minh", "MALE",
                "10/03/1988", "NN", "7220201", "Thạc sĩ",
                "lehoangminh@uth.edu.vn", "0934567890", "789 Đường Điện Biên Phủ, Q.Bình Thạnh, TP.HCM");

        addExampleRow(sheet, 4, 4, "054205002352", "Phạm Thị Hương", "FEMALE",
                "28/11/1983", "CNTT", "7480201", "Tiến sĩ",
                "phamthihuong@uth.edu.vn", "0945678901", "321 Đường Võ Văn Tần, Q.3, TP.HCM");

        addExampleRow(sheet, 5, 5, "054205002353", "Đặng Quốc Tuấn", "MALE",
                "05/07/1990", "NN", "", "Thạc sĩ",
                "dangquoctuan@uth.edu.vn", "0956789012", "654 Đường Hai Bà Trưng, Q.1, TP.HCM");

        // Add instruction sheet
        Sheet instructionSheet = workbook.createSheet("Hướng dẫn");
        addInstructions(instructionSheet);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();

        return outputStream;
    }

    @Override
    public long countAll() {
        return teacherRepository.count();
    }

    @Override
    public long countActive() {
        return teacherRepository.countByIsActive(true);
    }

    private void addExampleRow(Sheet sheet, int rowNum, int stt, String citizenId,
            String fullName, String gender, String dob, String deptCode,
            String majorCode, String degree, String email,
            String phone, String address) {
        Row row = sheet.createRow(rowNum);
        row.createCell(0).setCellValue(stt);
        row.createCell(1).setCellValue(citizenId);
        row.createCell(2).setCellValue(fullName);
        row.createCell(3).setCellValue(gender);
        row.createCell(4).setCellValue(dob);
        row.createCell(5).setCellValue(deptCode);
        row.createCell(6).setCellValue(majorCode);
        row.createCell(7).setCellValue(degree);
        row.createCell(8).setCellValue(email);
        row.createCell(9).setCellValue(phone);
        row.createCell(10).setCellValue(address);
    }

    private void addInstructions(Sheet sheet) {
        String[] instructions = {
                "HƯỚNG DẪN IMPORT GIẢNG VIÊN",
                "",
                "1. CÁC CỘT BẮT BUỘC (đánh dấu *):",
                "   - CCCD: Đúng 12 ký tự, không trùng lặp",
                "   - Họ và tên: Tối đa 100 ký tự",
                "   - Giới tính: MALE, FEMALE, hoặc OTHER",
                "   - Ngày sinh: Định dạng DD/MM/YYYY (ví dụ: 15/05/1985)",
                "   - Mã khoa: Phải tồn tại trong hệ thống (ví dụ: CNTT, NN)",
                "",
                "2. CÁC CỘT TÙY CHỌN:",
                "   - Mã chuyên ngành: Phải tồn tại trong hệ thống nếu có",
                "   - Học vị: Ví dụ: Thạc sĩ, Tiến sĩ, Giáo sư, ...",
                "   - Email: Địa chỉ email hợp lệ",
                "   - Số điện thoại: Tối đa 15 ký tự",
                "   - Địa chỉ: Địa chỉ liên hệ",
                "",
                "3. VÍ DỤ MÃ KHOA:",
                "   - CNTT: Khoa Công Nghệ Thông Tin",
                "   - NN: Khoa Ngoại Ngữ",
                "   - KT: Khoa Kinh Tế",
                "   - (Xem danh sách đầy đủ trong hệ thống)",
                "",
                "4. VÍ DỤ MÃ CHUYÊN NGÀNH:",
                "   - 7480201: Công Nghệ Thông Tin",
                "   - 7480104: Hệ Thống Thông Tin",
                "   - 7220201: Ngôn Ngữ Anh",
                "   - (Xem danh sách đầy đủ trong hệ thống)",
                "",
                "5. LƯU Ý:",
                "   - Không chỉnh sửa tên cột trong dòng header",
                "   - Xóa các dòng ví dụ trước khi import dữ liệu thật",
                "   - Mật khẩu mặc định sẽ là số CCCD",
                "   - Giảng viên phải đổi mật khẩu khi đăng nhập lần đầu",
                "   - Nếu không có chuyên ngành, để trống cột 'Mã chuyên ngành'"
        };

        for (int i = 0; i < instructions.length; i++) {
            Row row = sheet.createRow(i);
            Cell cell = row.createCell(0);
            cell.setCellValue(instructions[i]);
        }

        sheet.setColumnWidth(0, 18000);
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null)
            return "";

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
}