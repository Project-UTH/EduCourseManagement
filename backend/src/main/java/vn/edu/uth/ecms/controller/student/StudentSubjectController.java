package vn.edu.uth.ecms.controller.student;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.PrerequisiteInfo;
import vn.edu.uth.ecms.dto.response.SubjectResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.*;
import vn.edu.uth.ecms.service.SubjectService;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Student Subject Controller - Updated with Prerequisites
 * 
 * LOGIC LỌC MÔN HỌC:
 * 1. ĐẠI CƯƠNG (GENERAL): Tất cả sinh viên đều thấy
 * 2. CHUYÊN NGÀNH (SPECIALIZED): Chỉ sinh viên cùng KHOA mới thấy
 *    - So sánh: student.major.department_id = subject.department_id
 * 
 * ✅ NEW: Hiển thị môn tiên quyết và trạng thái hoàn thành
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
    private final SubjectPrerequisiteRepository subjectPrerequisiteRepository;
    private final GradeRepository gradeRepository;

    /**
     * Get available subjects for student - WITH PREREQUISITES
     * 
     * ✅ NEW: Returns prerequisites with completion status
     */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> getAvailableSubjects(
            @RequestParam(required = false) Long semesterId) {
        
        log.info("=== FETCHING AVAILABLE SUBJECTS WITH PREREQUISITES ===");
        if (semesterId != null) {
            log.info("📅 Filter by semester ID: {}", semesterId);
        }
        
        // 1. Get current student
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Student student = studentRepository.findByStudentCode(username)
                .orElseThrow(() -> new NotFoundException("Student not found"));

        log.info("👤 Student: {} ({})", student.getFullName(), student.getStudentCode());
        log.info("   Department: {}", 
                student.getMajor() != null && student.getMajor().getDepartment() != null 
                ? student.getMajor().getDepartment().getDepartmentName() 
                : "NULL");

        // 2. Get all subjects
        List<SubjectResponse> allSubjects = subjectService.getAllSubjects();
        log.info("📖 Total subjects in database: {}", allSubjects.size());
        
        // 3. Filter subjects based on knowledge type and semester
        List<SubjectResponse> filteredSubjects = allSubjects.stream()
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

        log.info("✅ Filtered to {} subjects, now adding prerequisites...", filteredSubjects.size());
        
        // 4. ✅ ADD PREREQUISITES TO EACH SUBJECT
        List<SubjectResponse> subjectsWithPrerequisites = enrichSubjectsWithPrerequisites(
                filteredSubjects, 
                student.getStudentId()
        );
        
        log.info("✅ Final result: {} subjects with prerequisites", subjectsWithPrerequisites.size());
        subjectsWithPrerequisites.forEach(s -> {
            log.info("  ✓ {} - {} (Prerequisites: {})", 
                    s.getSubjectCode(), 
                    s.getSubjectName(),
                    s.getPrerequisites() != null ? s.getPrerequisites().size() : 0);
        });
        
        return ResponseEntity.ok(
                ApiResponse.success("Found " + subjectsWithPrerequisites.size() + " subjects", 
                        subjectsWithPrerequisites)
        );
    }

    /**
     * ✅ NEW METHOD: Enrich subjects with prerequisite information
     * 
     * For each subject:
     * 1. Get its prerequisites from subject_prerequisite table
     * 2. Check if student has completed each prerequisite (from grade table)
     * 3. Add PrerequisiteInfo with completion status
     */
    private List<SubjectResponse> enrichSubjectsWithPrerequisites(
            List<SubjectResponse> subjects,
            Long studentId) {
        
        if (subjects.isEmpty()) {
            return subjects;
        }
        
        // 1. Get all subject IDs
        List<Long> subjectIds = subjects.stream()
                .map(SubjectResponse::getSubjectId)
                .collect(Collectors.toList());
        
        // 2. Get all prerequisites for these subjects (BATCH QUERY - efficient!)
        List<SubjectPrerequisite> allPrerequisites = 
                subjectPrerequisiteRepository.findAll().stream()
                .filter(sp -> subjectIds.contains(sp.getSubject().getSubjectId()))
                .collect(Collectors.toList());
        
        // 3. Group prerequisites by subject ID
        Map<Long, List<SubjectPrerequisite>> prerequisitesMap = allPrerequisites.stream()
                .collect(Collectors.groupingBy(sp -> sp.getSubject().getSubjectId()));
        
        log.info("📚 Found prerequisites for {} subjects", prerequisitesMap.size());
        
        // 4. Get student's grades (to check completion)
        List<Grade> studentGrades = gradeRepository.findByStudent_StudentId(studentId);
        
        // Map: subjectId -> Grade (keep highest score if retaken)
        Map<Long, Grade> gradesMap = studentGrades.stream()
                .collect(Collectors.toMap(
                        g -> g.getClassEntity().getSubject().getSubjectId(),
                        g -> g,
                        (existing, replacement) -> 
                                existing.getTotalScore().compareTo(replacement.getTotalScore()) >= 0 
                                ? existing : replacement
                ));
        
        log.info("📊 Student has {} completed subjects", gradesMap.size());
        
        // 5. Enrich each subject with prerequisites
        subjects.forEach(subject -> {
            Long subjectId = subject.getSubjectId();
            List<SubjectPrerequisite> prerequisites = prerequisitesMap.getOrDefault(subjectId, Collections.emptyList());
            
            if (!prerequisites.isEmpty()) {
                List<PrerequisiteInfo> prerequisiteInfos = prerequisites.stream()
                        .map(sp -> buildPrerequisiteInfo(sp.getPrerequisiteSubject(), gradesMap))
                        .collect(Collectors.toList());
                
                subject.setPrerequisites(prerequisiteInfos);
                
                log.info("  → {} has {} prerequisites", subject.getSubjectCode(), prerequisiteInfos.size());
            } else {
                subject.setPrerequisites(Collections.emptyList());
            }
        });
        
        return subjects;
    }
    
    /**
     * ✅ Build PrerequisiteInfo for a subject
     */
    private PrerequisiteInfo buildPrerequisiteInfo(Subject prerequisiteSubject, Map<Long, Grade> gradesMap) {
        Long prereqId = prerequisiteSubject.getSubjectId();
        Grade grade = gradesMap.get(prereqId);
        
        boolean isCompleted = false;
        BigDecimal totalScore = null;
        BigDecimal minPassGrade = BigDecimal.valueOf(4.0); // Default
        
        if (grade != null) {
            totalScore = grade.getTotalScore();
            if (totalScore != null) {
                isCompleted = totalScore.compareTo(minPassGrade) >= 0;
            }
        }
        
        return PrerequisiteInfo.builder()
                .subjectId(prereqId)
                .subjectCode(prerequisiteSubject.getSubjectCode())
                .subjectName(prerequisiteSubject.getSubjectName())
                .credits(prerequisiteSubject.getCredits())
                .isCompleted(isCompleted)
                .totalScore(totalScore)
                .minPassGrade(minPassGrade)
                .build();
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