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
import vn.edu.uth.ecms.service.GradeService;
import vn.edu.uth.ecms.service.SubmissionService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * SubmissionServiceImpl
 * 
 * Implementation of homework submission business logic
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SubmissionServiceImpl implements SubmissionService {
    
    private final HomeworkSubmissionRepository submissionRepository;
    private final HomeworkRepository homeworkRepository;
    private final StudentRepository studentRepository;
    private final GradeService gradeService;
    
    // ==================== STUDENT SUBMIT ====================
    
    @Override
    public SubmissionResponse submitHomework(SubmissionRequest request, Long studentId) {
        log.info("Student {} submitting homework {}", studentId, request.getHomeworkId());
        
        // Validate and sanitize
        request.sanitize();
        request.validateContent();
        
        // Find homework
        Homework homework = homeworkRepository.findById(request.getHomeworkId())
            .orElseThrow(() -> new NotFoundException("Homework not found"));
        
        // Find student
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new NotFoundException("Student not found"));
        
        // Check duplicate
        if (submissionRepository.existsByHomework_HomeworkIdAndStudent_StudentId(
            request.getHomeworkId(), studentId)) {
            throw new ConflictException("You have already submitted this homework");
        }
        
        // Create submission
        HomeworkSubmission submission = new HomeworkSubmission();
        submission.setHomework(homework);
        submission.setStudent(student);
        submission.setSubmissionFileUrl(request.getSubmissionFileUrl());
        submission.setSubmissionText(request.getSubmissionText());
        submission.setSubmissionDate(LocalDateTime.now());
        
        // Status will be auto-set by @PrePersist (LATE if after deadline)
        
        HomeworkSubmission saved = submissionRepository.save(submission);
        log.info("Submission created: ID={}, Status={}", saved.getSubmissionId(), saved.getStatus());
        
        return SubmissionResponse.fromEntity(saved);
    }
    
    // ==================== STUDENT UPDATE ====================
    
    @Override
    public SubmissionResponse updateSubmission(Long submissionId, SubmissionRequest request, Long studentId) {
        log.info("Student {} updating submission {}", studentId, submissionId);
        
        request.sanitize();
        request.validateContent();
        
        // Find submission
        HomeworkSubmission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new NotFoundException("Submission not found"));
        
        // Validate ownership
        if (!submission.getStudent().getStudentId().equals(studentId)) {
            throw new UnauthorizedException("You can only update your own submission");
        }
        
        // Check if can edit (not graded)
        if (!submission.canEdit()) {
            throw new ConflictException("Cannot edit graded submission");
        }
        
        // Update
        submission.setSubmissionFileUrl(request.getSubmissionFileUrl());
        submission.setSubmissionText(request.getSubmissionText());
        
        HomeworkSubmission updated = submissionRepository.save(submission);
        return SubmissionResponse.fromEntity(updated);
    }
    
    // ==================== STUDENT DELETE ====================
    
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
    
    // ==================== TEACHER GRADE ====================
    
    @Override
    public SubmissionResponse gradeSubmission(Long submissionId, GradeSubmissionRequest request, Long teacherId) {
        log.info("Teacher {} grading submission {}", teacherId, submissionId);
        
        request.sanitize();
        
        // Find submission with homework
        HomeworkSubmission submission = submissionRepository.findById(submissionId)
            .orElseThrow(() -> new NotFoundException("Submission not found"));
        
        // Validate teacher owns homework
        if (!submission.getHomework().getClassEntity().getTeacher().getTeacherId().equals(teacherId)) {
            throw new UnauthorizedException("You can only grade submissions from your classes");
        }
        
        // Validate score range
        if (!request.isScoreValid(submission.getHomework().getMaxScore())) {
            throw new BadRequestException("Score must be between 0 and " + 
                submission.getHomework().getMaxScore());
        }
        
        // Grade submission
        submission.grade(request.getScore(), request.getTeacherFeedback());
        HomeworkSubmission graded = submissionRepository.save(submission);
        
        // Update grade table if REGULAR, MIDTERM, or FINAL
        updateGradeAfterGrading(submission);
        
        log.info("Graded submission {}: score={}", submissionId, request.getScore());
        return SubmissionResponse.fromEntity(graded);
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
        
        // Update grade table
        updateGradeAfterGrading(submission);
        
        return SubmissionResponse.fromEntity(ungraded);
    }
    
    // ==================== TEACHER GET SUBMISSIONS ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsForGrading(Long homeworkId, Long teacherId) {
        // Validate teacher owns homework
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
    
    // ==================== BULK GRADE ====================
    
    @Override
    public List<SubmissionResponse> bulkGrade(List<GradeSubmissionRequest> requests, Long teacherId) {
        log.info("Teacher {} bulk grading {} submissions", teacherId, requests.size());
        
        return requests.stream()
            .map(req -> gradeSubmission(req.getSubmissionId(), req, teacherId))
            .collect(Collectors.toList());
    }
    
    // ==================== STUDENT QUERIES ====================
    
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
    
    // ==================== STATISTICS ====================
    
    @Override
    @Transactional(readOnly = true)
    public SubmissionStatsResponse getSubmissionStats(Long homeworkId) {
        // TODO: Implement full statistics
        // For now, return basic stats
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
        // Check if already submitted
        if (submissionRepository.existsByHomework_HomeworkIdAndStudent_StudentId(homeworkId, studentId)) {
            return false;
        }
        
        // Check homework exists and not overdue (or allow late)
        Homework homework = homeworkRepository.findById(homeworkId).orElse(null);
        if (homework == null) return false;
        
        // You can decide: allow late submissions or not
        return true; // Allow late submissions
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean canEdit(Long submissionId, Long studentId) {
        HomeworkSubmission submission = submissionRepository.findById(submissionId).orElse(null);
        if (submission == null) return false;
        if (!submission.getStudent().getStudentId().equals(studentId)) return false;
        
        return submission.canEdit();
    }
    
    // ==================== HELPER METHODS ====================
    
    /**
     * Update grade table after grading submission
     * - REGULAR: Calculate average of all REGULAR homework
     * - MIDTERM: Set midterm score
     * - FINAL: Set final score
     */
    private void updateGradeAfterGrading(HomeworkSubmission submission) {
        try {
            Long studentId = submission.getStudent().getStudentId();
            Long classId = submission.getHomework().getClassEntity().getClassId();
            HomeworkType type = submission.getHomework().getHomeworkType();
            
            if (type == HomeworkType.REGULAR) {
                gradeService.calculateRegularScore(studentId, classId);
            } else if (type == HomeworkType.MIDTERM) {
                // Set midterm score directly
                gradeService.updateComponentScore(studentId, classId, "midterm", submission.getScore());
            } else if (type == HomeworkType.FINAL) {
                // Set final score directly
                gradeService.updateComponentScore(studentId, classId, "final", submission.getScore());
            }
        } catch (Exception e) {
            log.warn("Failed to update grade after grading submission {}: {}", 
                submission.getSubmissionId(), e.getMessage());
        }
    }
}