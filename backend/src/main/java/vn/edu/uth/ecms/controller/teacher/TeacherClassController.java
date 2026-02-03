package vn.edu.uth.ecms.controller.teacher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.response.ClassResponse;
import vn.edu.uth.ecms.dto.response.GradeStatsResponse;
import vn.edu.uth.ecms.dto.response.StudentEnrollmentDto;
import vn.edu.uth.ecms.entity.ClassEntity;
import vn.edu.uth.ecms.entity.Grade;
import vn.edu.uth.ecms.exception.ForbiddenException;
import vn.edu.uth.ecms.exception.ResourceNotFoundException;
import vn.edu.uth.ecms.repository.ClassRepository;
import vn.edu.uth.ecms.repository.GradeRepository;
import vn.edu.uth.ecms.security.UserPrincipal;
import vn.edu.uth.ecms.service.ClassService;
import vn.edu.uth.ecms.service.GradeExcelExportService;
import vn.edu.uth.ecms.service.GradeService;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

/**
 * TeacherClassController
 * 
 * REST API endpoints for teacher to access their classes
 * Security handled by SecurityConfig - no need for @PreAuthorize here!
 * 
 * @author 
 * @since 
 * @updated 
 */
@RestController
@RequestMapping("/api/teacher/classes")
@RequiredArgsConstructor
@Slf4j
public class TeacherClassController {
    
    private final ClassService classService;
    private final ClassRepository classRepository;
    private final GradeService gradeService;
    private final GradeRepository gradeRepository;
    private final GradeExcelExportService gradeExcelExportService;
    
    /**
     * Get current teacher's classes
     * GET /api/teacher/classes/my
     * 
     * @param principal Authenticated user (injected by Spring Security)
     * @return List of classes taught by current teacher
     */
    @GetMapping("/my")
    public ResponseEntity<List<ClassResponse>> getMyClasses(
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("====== GET MY CLASSES ======");
        log.info("Teacher ID: {}", principal.getId());
        log.info("Username: {}", principal.getUsername());
        
        try {
            List<ClassResponse> classes = classService.getClassesByTeacher(principal.getId());
            
            log.info(" Teacher {} has {} classes", principal.getId(), classes.size());
            return ResponseEntity.ok(classes);
            
        } catch (Exception e) {
            log.error(" Failed to fetch classes for teacher {}: {}", 
                     principal.getId(), e.getMessage());
            throw e;
        }
    }
    
    /**
     * Get class details by ID (if teacher owns this class)
     * GET /api/teacher/classes/{id}
     * 
     * @param id Class ID
     * @param principal Authenticated user
     * @return Class details
     */
    @GetMapping("/{id}")
    public ResponseEntity<ClassResponse> getClassById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("Teacher {} fetching class {}", principal.getId(), id);
        
        try {
            ClassResponse classResponse = classService.getClassById(id);
            
            // Verify teacher owns this class
            if (!classResponse.getTeacherId().equals(principal.getId())) {
                log.warn(" Teacher {} attempted to access class {} owned by teacher {}", 
                        principal.getId(), id, classResponse.getTeacherId());
                return ResponseEntity.status(403).build();
            }
            
            log.info(" Class {} fetched successfully", id);
            return ResponseEntity.ok(classResponse);
            
        } catch (Exception e) {
            log.error(" Failed to fetch class {}: {}", id, e.getMessage());
            throw e;
        }
    }
    
    
    
    /**
     * Get list of students enrolled in a class
     * GET /api/teacher/classes/{classId}/students
     * @param classId Class ID
     * @param principal Authenticated teacher
     * @return List of enrolled students
     * 
     * @author 
     * @since 
     */
    @GetMapping("/{classId}/students")
    public ResponseEntity<List<StudentEnrollmentDto>> getEnrolledStudents(
            @PathVariable Long classId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        log.info("====== GET ENROLLED STUDENTS ======");
        log.info("Class ID: {}", classId);
        log.info("Teacher ID: {}", principal.getId());
        
        try {
            List<StudentEnrollmentDto> students = classService.getEnrolledStudents(
                    classId, 
                    principal.getId()
            );
            
            log.info(" Found {} students in class {}", students.size(), classId);
            return ResponseEntity.ok(students);
            
        } catch (ForbiddenException e) {
            log.warn(" Teacher {} not authorized for class {}: {}", 
                    principal.getId(), classId, e.getMessage());
            return ResponseEntity.status(403).build();
            
        } catch (ResourceNotFoundException e) {
            log.error(" Class {} not found: {}", classId, e.getMessage());
            return ResponseEntity.status(404).build();
            
        } catch (Exception e) {
            log.error(" Failed to fetch students for class {}: {}", classId, e.getMessage());
            throw e;
        }
    }
    
    /**
     * Export grade statistics to Excel
     * GET /api/teacher/classes/{classId}/grades/export-excel
     * @param classId Class ID
     * @param principal Authenticated teacher
     * @return Excel file download
     * 
     * @author ECMS Team
     * @since 2026-01-28
     */
    @GetMapping("/{classId}/grades/export-excel")
    public ResponseEntity<byte[]> exportGradeStatisticsExcel(
            @PathVariable Long classId,
            @AuthenticationPrincipal UserPrincipal principal) throws IOException {
        
        log.info("====== EXPORT GRADE STATISTICS TO EXCEL ======");
        log.info("Class ID: {}", classId);
        log.info("Teacher ID: {}", principal.getId());
        
        try {
            // 1. Verify class exists and teacher owns it
            ClassEntity classEntity = classRepository.findById(classId)
                    .orElseThrow(() -> new ResourceNotFoundException("Class not found with id: " + classId));
            
            if (!classEntity.getTeacher().getTeacherId().equals(principal.getId())) {
                log.warn(" Teacher {} tried to export statistics for class {} owned by teacher {}", 
                        principal.getId(), classId, classEntity.getTeacher().getTeacherId());
                throw new ForbiddenException("You don't have permission to access this class");
            }
            
            // 2. Get statistics
            log.info(" Fetching statistics for class {}", classId);
            GradeStatsResponse stats = gradeService.getClassStats(classId);
            
            // 3. Get all grades
            log.info(" Fetching grade details for class {}", classId);
            List<Grade> grades = gradeRepository.findByClassEntity_ClassId(classId);
            
            // 4. Generate Excel file
            log.info(" Generating Excel file...");
            byte[] excelFile = gradeExcelExportService.exportGradeStatistics(
                    stats,
                    grades,
                    classEntity.getClassCode() + " - " + classEntity.getSubject().getSubjectName(),
                    classEntity.getSubject().getSubjectName()
            );
            
            // 5. Prepare filename
            String filename = String.format("ThongKeDiem_%s_%s.xlsx",
                    classEntity.getClassCode(),
                    LocalDate.now().toString());
            
            String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8)
                    .replaceAll("\\+", "%20");
            
            // 6. Return file
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", encodedFilename);
            headers.set(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "Content-Disposition");
            
            log.info(" Excel export successful: {} ({} bytes, {} students)", 
                    filename, excelFile.length, grades.size());
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelFile);
                    
        } catch (ForbiddenException e) {
            log.warn(" Teacher {} not authorized for class {}", principal.getId(), classId);
            return ResponseEntity.status(403).build();
            
        } catch (ResourceNotFoundException e) {
            log.error(" Class {} not found", classId);
            return ResponseEntity.status(404).build();
            
        } catch (Exception e) {
            log.error(" Failed to export Excel for class {}: {}", classId, e.getMessage());
            throw e;
        }
    }
}