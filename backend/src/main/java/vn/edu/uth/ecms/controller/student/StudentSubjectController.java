package vn.edu.uth.ecms.controller.student;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.SubjectResponse;
import vn.edu.uth.ecms.entity.Student;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.ClassRepository;
import vn.edu.uth.ecms.repository.StudentRepository;
import vn.edu.uth.ecms.service.SubjectService;

import java.util.List;

/**
 * Student Subject Controller
 * 
 * LOGIC LỌC MÔN HỌC:
 * 1. ĐẠI CƯƠNG (GENERAL): Tất cả sinh viên đều thấy
 * 2. CHUYÊN NGÀNH (SPECIALIZED): Chỉ sinh viên cùng KHOA mới thấy
 *    - So sánh: student.major.department_id = subject.department_id
 */
@RestController
@RequestMapping("/api/student/subjects")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('STUDENT')")
public class StudentSubjectController {

    private final SubjectService subjectService;
    private final StudentRepository studentRepository;
    private final ClassRepository classRepository;

    /**
     * Get available subjects for student
     * 
     * DATABASE:
     * - GENERAL (TOÁN CAO CẤP): Tất cả SV thấy
     * - SPECIALIZED (cntt): Chỉ SV cùng khoa
     */
    @GetMapping("/available")
public ResponseEntity<ApiResponse<List<SubjectResponse>>> getAvailableSubjects(
        @RequestParam(required = false) Long semesterId) {  // ← THÊM PARAMETER
    
    log.info("=== FETCHING AVAILABLE SUBJECTS ===");
    if (semesterId != null) {
        log.info("📅 Filter by semester ID: {}", semesterId);
    }
    
    String username = SecurityContextHolder.getContext().getAuthentication().getName();
    Student student = studentRepository.findByStudentCode(username)
            .orElseThrow(() -> new NotFoundException("Student not found"));

    log.info("👤 Student: {} ({})", student.getFullName(), student.getStudentCode());
    log.info("   Department: {}", 
            student.getMajor() != null && student.getMajor().getDepartment() != null 
            ? student.getMajor().getDepartment().getDepartmentName() 
            : "NULL");

    List<SubjectResponse> allSubjects = subjectService.getAllSubjects();
    log.info("📖 Total subjects in database: {}", allSubjects.size());
    
    List<SubjectResponse> availableSubjects = allSubjects.stream()
            .filter(subject -> {
                String knowledgeType = subject.getDepartmentKnowledgeType();
                
                log.info("🔍 Checking: {} - {}", subject.getSubjectCode(), subject.getSubjectName());
                log.info("   Knowledge type: {}", knowledgeType);
                
                // RULE 1: GENERAL → Tất cả sinh viên
                if ("GENERAL".equalsIgnoreCase(knowledgeType)) {
                    log.info("   ✅ GENERAL → Check classes...");
                    
                    // Nếu chọn semester → Check có class trong semester không?
                    if (semesterId != null) {
                        boolean hasClass = classRepository.existsBySubjectIdAndSemesterId(
                                subject.getSubjectId(), semesterId);
                        
                        if (hasClass) {
                            log.info("   ✅ Has class in semester {} → PASS", semesterId);
                            return true;
                        } else {
                            log.info("   ❌ No class in semester {} → FAIL", semesterId);
                            return false;
                        }
                    }
                    
                    // Không chọn semester → Hiện tất cả
                    log.info("   ✅ GENERAL (no semester filter) → PASS");
                    return true;
                }
                
                // RULE 2: SPECIALIZED → Cùng khoa
                if ("SPECIALIZED".equalsIgnoreCase(knowledgeType)) {
                    
                    if (student.getMajor() == null || student.getMajor().getDepartment() == null) {
                        log.info("   ❌ Student no department → FAIL");
                        return false;
                    }
                    
                    Long studentDeptId = student.getMajor().getDepartment().getDepartmentId();
                    Long subjectDeptId = subject.getDepartmentId();
                    
                    if (studentDeptId == null || subjectDeptId == null) {
                        log.info("   ❌ NULL department_id → FAIL");
                        return false;
                    }
                    
                    boolean sameDepart = studentDeptId.equals(subjectDeptId);
                    
                    if (!sameDepart) {
                        log.info("   ❌ Different department → FAIL");
                        return false;
                    }
                    
                    log.info("   ✅ Same department → Check classes...");
                    
                    // Nếu chọn semester → Check có class trong semester không?
                    if (semesterId != null) {
                        boolean hasClass = classRepository.existsBySubjectIdAndSemesterId(
                                subject.getSubjectId(), semesterId);
                        
                        if (hasClass) {
                            log.info("   ✅ Has class in semester {} → PASS", semesterId);
                            return true;
                        } else {
                            log.info("   ❌ No class in semester {} → FAIL", semesterId);
                            return false;
                        }
                    }
                    
                    // Không chọn semester → Hiện nếu cùng khoa
                    log.info("   ✅ SPECIALIZED same dept (no semester filter) → PASS");
                    return true;
                }
                
                if (knowledgeType == null) {
                    log.warn("   ⚠️ Knowledge type NULL → SKIP");
                    return false;
                }
                
                log.info("   ❌ Unknown knowledge type '{}' → FAIL", knowledgeType);
                return false;
            })
            .toList();

    log.info("✅ Final result: {} subjects available", availableSubjects.size());
    availableSubjects.forEach(s -> 
        log.info("  ✓ {} - {}", s.getSubjectCode(), s.getSubjectName())
    );
    
    return ResponseEntity.ok(
            ApiResponse.success("Found " + availableSubjects.size() + " subjects", availableSubjects)
    );
}

    /**
     * Get subject by ID
     */
    @GetMapping("/{subjectId}")
    public ResponseEntity<ApiResponse<SubjectResponse>> getSubjectById(@PathVariable Long subjectId) {
        log.info("📕 Student viewing subject ID: {}", subjectId);
        SubjectResponse subject = subjectService.getSubjectById(subjectId);
        return ResponseEntity.ok(ApiResponse.success(subject));
    }
}