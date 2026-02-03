package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.GradeSubmissionRequest;
import vn.edu.uth.ecms.dto.request.SubmissionRequest;
import vn.edu.uth.ecms.dto.response.SubmissionResponse;
import vn.edu.uth.ecms.dto.response.SubmissionStatsResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.exception.*;
import vn.edu.uth.ecms.repository.*;
import vn.edu.uth.ecms.service.FileStorageService;
import vn.edu.uth.ecms.service.GradeService;
import vn.edu.uth.ecms.service.SubmissionService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.multipart.MultipartFile;
import java.util.Optional;

/**

 * @author 
 * @since 
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SubmissionServiceImpl implements SubmissionService {
    
    private final FileStorageService fileStorageService;
    private final HomeworkSubmissionRepository submissionRepository;
    private final HomeworkRepository homeworkRepository;
    private final StudentRepository studentRepository;
    private final SubmissionFileRepository submissionFileRepository;
    private final GradeService gradeService;
    
   
    
    @Override
    @Transactional
    public SubmissionResponse submitHomework(
            Long homeworkId, 
            String studentCode, 
            String submissionText, 
            MultipartFile file
    ) {
        log.info("[SubmissionService] Submitting homework: {} by student: {}", homeworkId, studentCode);
        
        // Find homework
        Homework homework = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new RuntimeException("Homework not found"));
        
        // Find student by code
        Student student = studentRepository.findByStudentCode(studentCode)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        
        // Check if already submitted
        Optional<HomeworkSubmission> existing = submissionRepository
                .findByHomework_HomeworkIdAndStudent_StudentCode(homeworkId, studentCode);
        
        if (existing.isPresent()) {
            throw new RuntimeException("Đã nộp bài tập này rồi!");
        }
        
        // Validate content
        if ((submissionText == null || submissionText.trim().isEmpty()) && 
            (file == null || file.isEmpty())) {
            throw new RuntimeException("Vui lòng nhập nội dung hoặc đính kèm file!");
        }
        
        // Create submission
        HomeworkSubmission submission = new HomeworkSubmission();
        submission.setHomework(homework);
        submission.setStudent(student);
        submission.setSubmissionText(submissionText);
        submission.setSubmissionDate(LocalDateTime.now());
        
        // Set status (LATE if after deadline)
        boolean isLateSub = LocalDateTime.now().isAfter(homework.getDeadline());
        if (isLateSub) { 
            submission.setStatus(SubmissionStatus.LATE);
            log.warn(" Student {} submitting LATE homework {}", studentCode, homeworkId);
        } else {
            submission.setStatus(SubmissionStatus.SUBMITTED);
            log.info(" Student {} submitting ON TIME homework {}", studentCode, homeworkId);
        }
        
        // Save submission first to get ID
        submission = submissionRepository.save(submission);
        
        //  Handle file upload (multi-file support)
        if (file != null && !file.isEmpty()) {
            addFileToSubmission(submission, file, homework.getHomeworkId(), studentCode);
        }
        
        log.info(" Submission created: ID={}", submission.getSubmissionId());
        
        return SubmissionResponse.fromEntity(submission);
    }
    
    
    
    @Override
    @Transactional
    public SubmissionResponse updateSubmissionByStudent(
            Long homeworkId,
            String studentCode,
            String submissionText,
            MultipartFile file
    ) {
        log.info("[SubmissionService] Updating submission for homework: {} by student: {}", homeworkId, studentCode);
        
        // Find existing submission
        HomeworkSubmission submission = submissionRepository
                .findByHomework_HomeworkIdAndStudent_StudentCode(homeworkId, studentCode)
                .orElseThrow(() -> new RuntimeException("Chưa có bài nộp để chỉnh sửa!"));
        
        // Check if already graded
        if (submission.getScore() != null) {
            throw new RuntimeException("Không thể chỉnh sửa bài đã được chấm điểm!");
        }
        
        // Check deadline
        boolean isLate = LocalDateTime.now().isAfter(submission.getHomework().getDeadline());
        if (isLate) {
            throw new RuntimeException("Đã quá hạn! Không thể chỉnh sửa bài nộp.");
        }
        
        // Validate content
        boolean hasNewText = submissionText != null && !submissionText.trim().isEmpty();
        boolean hasNewFile = file != null && !file.isEmpty();
        boolean hasExistingFiles = submission.getFileCount() > 0;
        boolean hasExistingText = submission.getSubmissionText() != null && !submission.getSubmissionText().trim().isEmpty();
        
        if (!hasNewText && !hasNewFile && !hasExistingFiles && !hasExistingText) {
            throw new RuntimeException("Vui lòng nhập nội dung hoặc đính kèm file!");
        }
        
        // Update text content
        if (hasNewText) {
            submission.setSubmissionText(submissionText);
        }
        
       
        if (hasNewFile) {
            addFileToSubmission(submission, file, homeworkId, studentCode);
        }
        
        // Update submission date
        submission.setSubmissionDate(LocalDateTime.now());
        
        submission = submissionRepository.save(submission);
        
        log.info(" Submission updated: ID={}, Total files: {}", 
                submission.getSubmissionId(), submission.getFileCount());
        
        return SubmissionResponse.fromEntity(submission);
    }
    
  
    
    @Override
    @Transactional
    public void deleteSubmissionFile(Long homeworkId, String studentCode) {
        log.info("[SubmissionService] Deleting file for homework: {} by student: {}", homeworkId, studentCode);
        
        // Find submission
        HomeworkSubmission submission = submissionRepository
                .findByHomework_HomeworkIdAndStudent_StudentCode(homeworkId, studentCode)
                .orElseThrow(() -> new RuntimeException("Chưa có bài nộp!"));
        
        // Check if already graded
        if (submission.getScore() != null) {
            throw new RuntimeException("Không thể xóa file của bài đã được chấm điểm!");
        }
        
        // Check deadline
        boolean isLate = LocalDateTime.now().isAfter(submission.getHomework().getDeadline());
        if (isLate) {
            throw new RuntimeException("Đã quá hạn! Không thể xóa file.");
        }
        
        //  Delete ALL files
        List<SubmissionFile> files = submission.getSubmissionFiles();
        if (files == null || files.isEmpty()) {
            throw new RuntimeException("Không có file để xóa!");
        }
        
        // Delete physical files and database records
        for (SubmissionFile file : files) {
            deletePhysicalFile(file);
        }
        
        submission.getSubmissionFiles().clear();
        submissionRepository.save(submission);
        
        log.info(" All files deleted from submission: ID={}", submission.getSubmissionId());
    }
   
    @Transactional
    public void deleteSubmissionFileById(Long homeworkId, String studentCode, Long fileId) {
        log.info("[SubmissionService] Deleting specific file {} for homework: {} by student: {}", 
                fileId, homeworkId, studentCode);
        
        // Find submission
        HomeworkSubmission submission = submissionRepository
                .findByHomework_HomeworkIdAndStudent_StudentCode(homeworkId, studentCode)
                .orElseThrow(() -> new RuntimeException("Chưa có bài nộp!"));
        
        // Check if already graded
        if (submission.getScore() != null) {
            throw new RuntimeException("Không thể xóa file của bài đã được chấm điểm!");
        }
        
        // Check deadline
        boolean isLate = LocalDateTime.now().isAfter(submission.getHomework().getDeadline());
        if (isLate) {
            throw new RuntimeException("Đã quá hạn! Không thể xóa file.");
        }
        
        // Find file
        SubmissionFile fileToDelete = submissionFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File không tồn tại!"));
        
        // Verify file belongs to this submission
        if (!fileToDelete.getSubmission().getSubmissionId().equals(submission.getSubmissionId())) {
            throw new RuntimeException("File không thuộc bài nộp này!");
        }
        
        // Delete physical file
        deletePhysicalFile(fileToDelete);
        
        // Remove from database
        submission.removeFile(fileToDelete);
        submissionFileRepository.delete(fileToDelete);
        
        log.info(" File deleted: {} from submission: {}", fileId, submission.getSubmissionId());
    }
    
  
    private void addFileToSubmission(HomeworkSubmission submission, MultipartFile file, Long homeworkId, String studentCode) {
        try {
            // Store file using FileStorageService
            String directory = "submissions/homework-" + homeworkId + "/" + studentCode;
            String storedFilename = fileStorageService.storeFile(file, directory);
            
            // Build download URL
            String fileUrl = "/api/files/submissions/" + homeworkId + "/" + studentCode + "/" + storedFilename;
            
            // Create SubmissionFile entity
            SubmissionFile submissionFile = SubmissionFile.builder()
                    .originalFilename(file.getOriginalFilename())
                    .storedFilename(storedFilename)
                    .fileUrl(fileUrl)
                    .fileSize(file.getSize())
                    .mimeType(file.getContentType())
                    .build();
            
            // Add to submission
            submission.addFile(submissionFile);
            
            log.info(" File added: {} -> {} (Size: {} bytes)", 
                    file.getOriginalFilename(), storedFilename, file.getSize());
            
        } catch (Exception e) {
            log.error(" Failed to upload file", e);
            throw new RuntimeException("Không thể upload file: " + e.getMessage());
        }
    }
    
    
    private void deletePhysicalFile(SubmissionFile file) {
        try {
            String fileUrl = file.getFileUrl();
            String[] parts = fileUrl.split("/");
            if (parts.length > 0) {
                String filename = parts[parts.length - 1];
                // Extract directory from URL
                // Example: /api/files/submissions/2/054205009974/filename.pdf
                // Directory: submissions/homework-2/054205009974
                String homeworkId = parts[parts.length - 3];
                String studentCode = parts[parts.length - 2];
                String directory = "submissions/homework-" + homeworkId + "/" + studentCode;
                
                fileStorageService.deleteFile(filename, directory);
                log.info(" Physical file deleted: {}", filename);
            }
        } catch (Exception e) {
            log.warn(" Failed to delete physical file: {}", e.getMessage());
        }
    }
    
   
    
    @Override
    public SubmissionResponse gradeSubmission(Long submissionId, GradeSubmissionRequest request, Long teacherId) {
        log.info("Teacher {} grading submission {}", teacherId, submissionId);
        
        request.sanitize();
        
        HomeworkSubmission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new NotFoundException("Submission not found"));
        
        if (!submission.getHomework().getClassEntity().getTeacher().getTeacherId().equals(teacherId)) {
            throw new UnauthorizedException("You can only grade submissions from your classes");
        }
        
        if (!request.isScoreValid(submission.getHomework().getMaxScore())) {
            throw new BadRequestException("Score must be between 0 and " + 
                submission.getHomework().getMaxScore());
        }
        
        submission.grade(request.getScore(), request.getTeacherFeedback());
        HomeworkSubmission graded = submissionRepository.save(submission);
        
        updateGradeAfterGrading(submission);
        
        log.info("Graded submission {}: score={}", submissionId, request.getScore());
        return SubmissionResponse.fromEntity(graded);
    }
    
    
    
    @Override
    public SubmissionResponse submitHomework(SubmissionRequest request, Long studentId) {
        // Legacy method - delegate to new multi-file version
        log.warn("Using legacy submitHomework method - consider using multi-file version");
        
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new NotFoundException("Student not found"));
        
        return submitHomework(
                request.getHomeworkId(),
                student.getStudentCode(),
                request.getSubmissionText(),
                null 
        );
    }
    
    @Override
    public SubmissionResponse updateSubmission(Long submissionId, SubmissionRequest request, Long studentId) {
    
        log.warn("Using legacy updateSubmission method");
        throw new RuntimeException("Use updateSubmissionByStudent instead");
    }
    
    @Override
    public void deleteSubmission(Long submissionId, Long studentId) {
        log.info("Student {} deleting submission {}", studentId, submissionId);
        
        HomeworkSubmission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new NotFoundException("Submission not found"));
        
        if (!submission.getStudent().getStudentId().equals(studentId)) {
            throw new UnauthorizedException("You can only delete your own submission");
        }
        
        if (!submission.canEdit()) {
            throw new ConflictException("Cannot delete graded submission");
        }
        
        submissionRepository.delete(submission);
    }
    
    @Override
    public SubmissionResponse ungradeSubmission(Long submissionId, Long teacherId) {
        log.info("Teacher {} ungrading submission {}", teacherId, submissionId);
        
        HomeworkSubmission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new NotFoundException("Submission not found"));
        
        if (!submission.getHomework().getClassEntity().getTeacher().getTeacherId().equals(teacherId)) {
            throw new UnauthorizedException("Unauthorized");
        }
        
        submission.ungrade();
        HomeworkSubmission ungraded = submissionRepository.save(submission);
        
        updateGradeAfterGrading(submission);
        
        return SubmissionResponse.fromEntity(ungraded);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsForGrading(Long homeworkId, Long teacherId) {
        Homework homework = homeworkRepository.findById(homeworkId)
            .orElseThrow(() -> new NotFoundException("Homework not found"));
        
        if (!homework.getClassEntity().getTeacher().getTeacherId().equals(teacherId)) {
            throw new UnauthorizedException("Unauthorized");
        }
        
        List<HomeworkSubmission> submissions = submissionRepository.findNeedingGrading(homeworkId);
        return submissions.stream()
            .map(SubmissionResponse::fromEntity)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsByHomework(Long homeworkId, Long teacherId) {
        Homework homework = homeworkRepository.findById(homeworkId)
            .orElseThrow(() -> new NotFoundException("Homework not found"));
        
        if (!homework.getClassEntity().getTeacher().getTeacherId().equals(teacherId)) {
            throw new UnauthorizedException("Unauthorized");
        }
        
        List<HomeworkSubmission> submissions = submissionRepository.findByHomework_HomeworkId(homeworkId);
        return submissions.stream()
            .map(SubmissionResponse::fromEntity)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<SubmissionResponse> getSubmissionsByHomework(Long homeworkId, Long teacherId, Pageable pageable) {
        Homework homework = homeworkRepository.findById(homeworkId)
            .orElseThrow(() -> new NotFoundException("Homework not found"));
        
        if (!homework.getClassEntity().getTeacher().getTeacherId().equals(teacherId)) {
            throw new UnauthorizedException("Unauthorized");
        }
        
        Page<HomeworkSubmission> submissions = submissionRepository.findByHomework_HomeworkId(homeworkId, pageable);
        return submissions.map(SubmissionResponse::fromEntity);
    }
    
    @Override
    public List<SubmissionResponse> bulkGrade(List<GradeSubmissionRequest> requests, Long teacherId) {
        log.info("Teacher {} bulk grading {} submissions", teacherId, requests.size());
        
        return requests.stream()
            .map(req -> gradeSubmission(req.getSubmissionId(), req, teacherId))
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public SubmissionResponse getMySubmission(Long homeworkId, Long studentId) {
        HomeworkSubmission submission = submissionRepository
            .findByHomework_HomeworkIdAndStudent_StudentId(homeworkId, studentId)
            .orElseThrow(() -> new NotFoundException("Submission not found"));
        
        return SubmissionResponse.fromEntity(submission);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<SubmissionResponse> getMySubmissions(Long studentId) {
        List<HomeworkSubmission> submissions = submissionRepository.findByStudent_StudentId(studentId);
        return submissions.stream()
            .map(SubmissionResponse::fromEntity)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public SubmissionStatsResponse getSubmissionStats(Long homeworkId) {
        long totalSubmissions = submissionRepository.countByHomework_HomeworkId(homeworkId);
        long gradedCount = submissionRepository.countGraded(homeworkId);
        
        return SubmissionStatsResponse.builder()
            .overall(SubmissionStatsResponse.OverallStats.builder()
                .totalSubmissions((int) totalSubmissions)
                .build())
            .grading(SubmissionStatsResponse.GradingProgress.builder()
                .gradedCount((int) gradedCount)
                .ungradedCount((int) (totalSubmissions - gradedCount))
                .build())
            .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean canSubmit(Long homeworkId, Long studentId) {
        if (submissionRepository.existsByHomework_HomeworkIdAndStudent_StudentId(homeworkId, studentId)) {
            return false;
        }
        
        Homework homework = homeworkRepository.findById(homeworkId).orElse(null);
        if (homework == null) return false;
        
        return true;
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean canEdit(Long submissionId, Long studentId) {
        HomeworkSubmission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) return false;
        if (!submission.getStudent().getStudentId().equals(studentId)) return false;
        
        return submission.canEdit();
    }
    
    private void updateGradeAfterGrading(HomeworkSubmission submission) {
        try {
            Long studentId = submission.getStudent().getStudentId();
            Long classId = submission.getHomework().getClassEntity().getClassId();
            HomeworkType type = submission.getHomework().getHomeworkType();
            
            if (type == HomeworkType.REGULAR) {
                gradeService.calculateRegularScore(studentId, classId);
            } else if (type == HomeworkType.MIDTERM) {
                gradeService.updateComponentScore(studentId, classId, "midterm", submission.getScore());
            } else if (type == HomeworkType.FINAL) {
                gradeService.updateComponentScore(studentId, classId, "final", submission.getScore());
            }
        } catch (Exception e) {
            log.warn("Failed to update grade after grading submission {}: {}", 
                submission.getSubmissionId(), e.getMessage());
        }
    }
}