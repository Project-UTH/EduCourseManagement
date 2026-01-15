package vn.edu.uth.ecms.controller.student;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.HomeworkDetailResponse;
import vn.edu.uth.ecms.dto.response.SubmissionResponse;
import vn.edu.uth.ecms.service.HomeworkService;
import vn.edu.uth.ecms.service.SubmissionService;
/**
 * StudentHomeworkController - MULTI-FILE SUPPORT
 * 
 * Endpoints for student homework operations:
 * - GET /api/student/homeworks/{id} - Get homework detail with submission
 * - POST /api/student/homeworks/{id}/submit - Submit homework (first time)
 * - PUT /api/student/homeworks/{id}/update - Update homework (add more files)
 * - DELETE /api/student/homeworks/{id}/file - Delete all files (legacy)
 * - DELETE /api/student/homeworks/{id}/files/{fileId} - Delete specific file (NEW)
 * 
 * @author Phase 5 - Student Dashboard (Updated 2026-01-13)
 * @since 2026-01-10
 */
@RestController
@RequestMapping("/api/student/homeworks")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('STUDENT')")
public class StudentHomeworkController {

    private final HomeworkService homeworkService;
    private final SubmissionService submissionService;

    /**
     * Get homework detail with submission status
     * 
     * Returns:
     * - Homework information (title, description, deadline, etc.)
     * - Student's submission (if exists)
     * - ALL submitted files (multi-file support)
     * - Teacher information
     * - Status flags (isOverdue, canSubmit)
     * 
     * GET /api/student/homeworks/{homeworkId}
     */
    @GetMapping("/{homeworkId}")
    public ResponseEntity<ApiResponse<HomeworkDetailResponse>> getHomeworkDetail(
            @PathVariable Long homeworkId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("📚 Student {} fetching homework detail: {}", userDetails.getUsername(), homeworkId);
        
        try {
            String studentCode = userDetails.getUsername();
            
            // Get homework detail with student's submission
            HomeworkDetailResponse detail = homeworkService.getHomeworkDetailForStudent(
                    homeworkId, 
                    studentCode
            );
            
            log.info("✅ Homework detail fetched successfully");
            
            return ResponseEntity.ok(
                    ApiResponse.success("Lấy thông tin bài tập thành công", detail)
            );
            
        } catch (Exception e) {
            log.error("❌ Error getting homework detail", e);
            return ResponseEntity.status(500).body(
                    ApiResponse.error("Không thể lấy thông tin bài tập: " + e.getMessage())
            );
        }
    }

    /**
     * Submit homework (first time)
     * 
     * Accepts:
     * - submissionText (optional): Text content of submission
     * - file (optional): File attachment
     * 
     * At least one of text or file must be provided.
     * File will be saved to submission_files table.
     * 
     * POST /api/student/homeworks/{homeworkId}/submit
     */
    @PostMapping("/{homeworkId}/submit")
    public ResponseEntity<ApiResponse<SubmissionResponse>> submitHomework(
            @PathVariable Long homeworkId,
            @RequestParam(required = false) String submissionText,
            @RequestParam(required = false) MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("📤 Student {} submitting homework: {}", userDetails.getUsername(), homeworkId);
        
        try {
            String studentCode = userDetails.getUsername();
            
            // Submit homework with text and/or file
            SubmissionResponse submission = submissionService.submitHomework(
                    homeworkId,
                    studentCode,
                    submissionText,
                    file
            );
            
            log.info("✅ Homework submitted successfully - Submission ID: {}", submission.getSubmissionId());
            
            return ResponseEntity.ok(
                    ApiResponse.success("Nộp bài tập thành công", submission)
            );
            
        } catch (RuntimeException e) {
            // Handle business logic errors
            log.warn("⚠️ Submission failed: {}", e.getMessage());
            return ResponseEntity.status(400).body(
                    ApiResponse.error(e.getMessage())
            );
            
        } catch (Exception e) {
            // Handle unexpected errors
            log.error("❌ Error submitting homework", e);
            return ResponseEntity.status(500).body(
                    ApiResponse.error("Không thể nộp bài tập: " + e.getMessage())
            );
        }
    }

    /**
     * Update homework (add more files or edit text)
     * 
     * ✅ MULTI-FILE SUPPORT:
     * - New files will be ADDED to existing files (NOT replace)
     * - Text content will be updated
     * - Cannot update if homework is already graded
     * - Cannot update if deadline has passed
     * 
     * PUT /api/student/homeworks/{homeworkId}/update
     */
    @PutMapping("/{homeworkId}/update")
    public ResponseEntity<ApiResponse<SubmissionResponse>> updateHomework(
            @PathVariable Long homeworkId,
            @RequestParam(required = false) String submissionText,
            @RequestParam(required = false) MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("📝 Student {} updating homework: {}", userDetails.getUsername(), homeworkId);
        
        try {
            String studentCode = userDetails.getUsername();
            
            SubmissionResponse submission = submissionService.updateSubmissionByStudent(
                    homeworkId,
                    studentCode,
                    submissionText,
                    file
            );
            
            log.info("✅ Homework updated successfully - Submission ID: {}", submission.getSubmissionId());
            
            return ResponseEntity.ok(
                    ApiResponse.success("Cập nhật bài tập thành công", submission)
            );
            
        } catch (RuntimeException e) {
            log.warn("⚠️ Update failed: {}", e.getMessage());
            return ResponseEntity.status(400).body(
                    ApiResponse.error(e.getMessage())
            );
            
        } catch (Exception e) {
            log.error("❌ Error updating homework", e);
            return ResponseEntity.status(500).body(
                    ApiResponse.error("Không thể cập nhật bài tập: " + e.getMessage())
            );
        }
    }

    /**
     * Delete ALL submission files (legacy method)
     * 
     * ⚠️ WARNING: This deletes ALL files for the submission
     * For deleting specific files, use DELETE /files/{fileId} instead
     * 
     * DELETE /api/student/homeworks/{homeworkId}/file
     */
    @DeleteMapping("/{homeworkId}/file")
    public ResponseEntity<ApiResponse<Void>> deleteSubmissionFile(
            @PathVariable Long homeworkId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("🗑️ Student {} deleting ALL files for homework: {}", userDetails.getUsername(), homeworkId);
        
        try {
            String studentCode = userDetails.getUsername();
            
            submissionService.deleteSubmissionFile(homeworkId, studentCode);
            
            log.info("✅ All files deleted successfully");
            
            return ResponseEntity.ok(
                    ApiResponse.success("Xóa tất cả files thành công", null)
            );
            
        } catch (RuntimeException e) {
            log.warn("⚠️ Delete failed: {}", e.getMessage());
            return ResponseEntity.status(400).body(
                    ApiResponse.error(e.getMessage())
            );
            
        } catch (Exception e) {
            log.error("❌ Error deleting files", e);
            return ResponseEntity.status(500).body(
                    ApiResponse.error("Không thể xóa files: " + e.getMessage())
            );
        }
    }

    /**
     * ✅ NEW: Delete a specific file by fileId
     * 
     * This allows students to remove individual files from their submission
     * without deleting all files.
     * 
     * Conditions:
     * - Submission must not be graded yet
     * - Deadline must not have passed
     * - File must belong to the student's submission
     * 
     * DELETE /api/student/homeworks/{homeworkId}/files/{fileId}
     */
    @DeleteMapping("/{homeworkId}/files/{fileId}")
    public ResponseEntity<ApiResponse<Void>> deleteSubmissionFileById(
            @PathVariable Long homeworkId,
            @PathVariable Long fileId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("🗑️ Student {} deleting file {} for homework: {}", 
                userDetails.getUsername(), fileId, homeworkId);
        
        try {
            String studentCode = userDetails.getUsername();
            
            // Call the new method in service
            // Cast to implementation to access the new method
            if (submissionService instanceof vn.edu.uth.ecms.service.impl.SubmissionServiceImpl) {
                vn.edu.uth.ecms.service.impl.SubmissionServiceImpl serviceImpl = 
                    (vn.edu.uth.ecms.service.impl.SubmissionServiceImpl) submissionService;
                serviceImpl.deleteSubmissionFileById(homeworkId, studentCode, fileId);
            } else {
                throw new RuntimeException("Service implementation not supported");
            }
            
            log.info("✅ File {} deleted successfully", fileId);
            
            return ResponseEntity.ok(
                    ApiResponse.success("Xóa file thành công", null)
            );
            
        } catch (RuntimeException e) {
            log.warn("⚠️ Delete file failed: {}", e.getMessage());
            return ResponseEntity.status(400).body(
                    ApiResponse.error(e.getMessage())
            );
            
        } catch (Exception e) {
            log.error("❌ Error deleting file", e);
            return ResponseEntity.status(500).body(
                    ApiResponse.error("Không thể xóa file: " + e.getMessage())
            );
        }
    }
}