package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.HomeworkRequest;
import vn.edu.uth.ecms.dto.response.HomeworkDetailResponse;
import vn.edu.uth.ecms.dto.response.HomeworkResponse;
import vn.edu.uth.ecms.dto.response.HomeworkStatsResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.exception.*;
import vn.edu.uth.ecms.repository.*;
import vn.edu.uth.ecms.service.HomeworkService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * HomeworkServiceImpl
 * 
 * Implementation of homework management business logic
 * 
 * @author Phase 4 - Teacher Features
 * @since 2026-01-06
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class HomeworkServiceImpl implements HomeworkService {
    
    private final HomeworkRepository homeworkRepository;
    private final HomeworkSubmissionRepository submissionRepository;
    private final ClassRepository classRepository;
    private final TeacherRepository teacherRepository;
    
    // ==================== CREATE HOMEWORK ====================
    
    @Override
    public HomeworkResponse createHomework(HomeworkRequest request, Long teacherId) {
        log.info("Creating homework for class {} by teacher {}", request.getClassId(), teacherId);
        
        // Validate and sanitize request
        request.sanitize();
        
        // Validate class exists
        ClassEntity classEntity = classRepository.findById(request.getClassId())
            .orElseThrow(() -> new NotFoundException("Class not found with ID: " + request.getClassId()));
        
        // Validate teacher owns class
        if (!classEntity.getTeacher().getTeacherId().equals(teacherId)) {
            throw new UnauthorizedException("You are not authorized to create homework for this class");
        }
        
        // Validate homework type constraints
        validateHomeworkType(request.getClassId(), request.getHomeworkType());
        
        // Validate deadline
        if (!request.isDeadlineReasonable()) {
            throw new BadRequestException("Deadline must be at least 1 hour in the future");
        }
        
        // Create homework entity
        Homework homework = new Homework();
        homework.setClassEntity(classEntity);
        homework.setTitle(request.getTitle());
        homework.setDescription(request.getDescription());
        homework.setHomeworkType(request.getHomeworkType());
        homework.setMaxScore(request.getMaxScore());
        homework.setDeadline(request.getDeadline());
        homework.setAttachmentUrl(request.getAttachmentUrl());
        
        // Save homework
        Homework savedHomework = homeworkRepository.save(homework);
        log.info("Created homework ID: {} for class: {}", savedHomework.getHomeworkId(), request.getClassId());
        
        return HomeworkResponse.fromEntity(savedHomework);
    }
    
    // ==================== UPDATE HOMEWORK ====================
    
    @Override
    public HomeworkResponse updateHomework(Long homeworkId, HomeworkRequest request, Long teacherId) {
        log.info("Updating homework {} by teacher {}", homeworkId, teacherId);
        
        // Validate and sanitize request
        request.sanitize();
        
        // Find homework
        Homework homework = homeworkRepository.findById(homeworkId)
            .orElseThrow(() -> new NotFoundException("Homework not found with ID: " + homeworkId));
        
        // Validate teacher owns class
        if (!homework.getClassEntity().getTeacher().getTeacherId().equals(teacherId)) {
            throw new UnauthorizedException("You are not authorized to update this homework");
        }
        
        // Check if type is being changed
        if (request.getHomeworkType() != homework.getHomeworkType()) {
            // Validate new type constraints
            validateHomeworkTypeForUpdate(homework.getClassEntity().getClassId(), 
                                         request.getHomeworkType(), homeworkId);
        }
        
        // Update fields
        homework.setTitle(request.getTitle());
        homework.setDescription(request.getDescription());
        homework.setHomeworkType(request.getHomeworkType());
        homework.setMaxScore(request.getMaxScore());
        homework.setDeadline(request.getDeadline());
        homework.setAttachmentUrl(request.getAttachmentUrl());
        
        // Save
        Homework updatedHomework = homeworkRepository.save(homework);
        log.info("Updated homework ID: {}", homeworkId);
        
        return HomeworkResponse.fromEntity(updatedHomework);
    }
    
    // ==================== DELETE HOMEWORK ====================
    
    @Override
    public void deleteHomework(Long homeworkId, Long teacherId) {
        log.info("Deleting homework {} by teacher {}", homeworkId, teacherId);
        
        // Find homework
        Homework homework = homeworkRepository.findById(homeworkId)
            .orElseThrow(() -> new NotFoundException("Homework not found with ID: " + homeworkId));
        
        // Validate teacher owns class
        if (!homework.getClassEntity().getTeacher().getTeacherId().equals(teacherId)) {
            throw new UnauthorizedException("You are not authorized to delete this homework");
        }
        
        // Check if has graded submissions
        long gradedCount = submissionRepository.countGraded(homeworkId);
        if (gradedCount > 0) {
            throw new ConflictException("Cannot delete homework with " + gradedCount + " graded submissions");
        }
        
        // Delete
        homeworkRepository.delete(homework);
        log.info("Deleted homework ID: {}", homeworkId);
    }
    
    // ==================== GET HOMEWORK ====================
    
    @Override
    @Transactional(readOnly = true)
    public HomeworkResponse getHomeworkById(Long homeworkId) {
        Homework homework = homeworkRepository.findById(homeworkId)
            .orElseThrow(() -> new NotFoundException("Homework not found with ID: " + homeworkId));
        
        return HomeworkResponse.fromEntityWithStats(homework);
    }
    
    @Override
    @Transactional(readOnly = true)
    public HomeworkDetailResponse getHomeworkDetail(Long homeworkId, Long teacherId) {
        // Find with submissions
        Homework homework = homeworkRepository.findWithSubmissions(homeworkId)
            .orElseThrow(() -> new NotFoundException("Homework not found with ID: " + homeworkId));
        
        // Validate teacher owns class
        if (!homework.getClassEntity().getTeacher().getTeacherId().equals(teacherId)) {
            throw new UnauthorizedException("You are not authorized to view this homework");
        }
        
        return HomeworkDetailResponse.fromEntity(homework);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<HomeworkResponse> getHomeworkByClass(Long classId) {
        // Validate class exists
        if (!classRepository.existsById(classId)) {
            throw new NotFoundException("Class not found with ID: " + classId);
        }
        
        List<Homework> homeworks = homeworkRepository.findByClassEntity_ClassId(classId);
        return homeworks.stream()
            .map(HomeworkResponse::fromEntityWithStats)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<HomeworkResponse> getHomeworkByClass(Long classId, Pageable pageable) {
        // Validate class exists
        if (!classRepository.existsById(classId)) {
            throw new NotFoundException("Class not found with ID: " + classId);
        }
        
        Page<Homework> homeworks = homeworkRepository.findByClassEntity_ClassId(classId, pageable);
        return homeworks.map(HomeworkResponse::fromEntityWithStats);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<HomeworkResponse> getHomeworkByTeacher(Long teacherId) {
        // Validate teacher exists
        if (!teacherRepository.existsById(teacherId)) {
            throw new NotFoundException("Teacher not found with ID: " + teacherId);
        }
        
        List<Homework> homeworks = homeworkRepository.findByTeacherId(teacherId);
        return homeworks.stream()
            .map(HomeworkResponse::fromEntityWithStats)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<HomeworkResponse> getHomeworkByTeacher(Long teacherId, Pageable pageable) {
        // Validate teacher exists
        if (!teacherRepository.existsById(teacherId)) {
            throw new NotFoundException("Teacher not found with ID: " + teacherId);
        }
        
        Page<Homework> homeworks = homeworkRepository.findByTeacherId(teacherId, pageable);
        return homeworks.map(HomeworkResponse::fromEntityWithStats);
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<HomeworkResponse> filterHomework(Long classId, HomeworkType type, 
                                                 LocalDateTime startDate, LocalDateTime endDate,
                                                 Pageable pageable) {
        // Validate class exists
        if (!classRepository.existsById(classId)) {
            throw new NotFoundException("Class not found with ID: " + classId);
        }
        
        Page<Homework> homeworks = homeworkRepository.filterHomework(classId, type, startDate, endDate, pageable);
        return homeworks.map(HomeworkResponse::fromEntityWithStats);
    }
    
    // ==================== GET STATISTICS ====================
    
    @Override
    @Transactional(readOnly = true)
    public HomeworkStatsResponse getHomeworkStats(Long homeworkId) {
        // Find homework with submissions
        Homework homework = homeworkRepository.findWithSubmissions(homeworkId)
            .orElseThrow(() -> new NotFoundException("Homework not found with ID: " + homeworkId));
        
        // Get class info
        ClassEntity classEntity = homework.getClassEntity();
        int totalStudents = (int) submissionRepository.countByHomework_HomeworkId(homeworkId); // TODO: Get from course_registration
        
        // Get submission counts
        int totalSubmissions = homework.getSubmissionCount();
        int gradedSubmissions = homework.getGradedCount();
        int ungradedSubmissions = homework.getUngradedCount();
        int notSubmitted = Math.max(0, totalStudents - totalSubmissions);
        
        // Build submission stats
        HomeworkStatsResponse.SubmissionStats submissionStats = 
            HomeworkStatsResponse.buildSubmissionStats(
                totalStudents, totalSubmissions, gradedSubmissions, ungradedSubmissions);
        
        // Build score stats
        BigDecimal avgScore = submissionRepository.calculateAverageScore(homeworkId);
        BigDecimal highestScore = submissionRepository.findHighestScore(homeworkId);
        BigDecimal lowestScore = submissionRepository.findLowestScore(homeworkId);
        
        // Count passed (score >= 4.0)
        long passedCount = submissionRepository.countByScoreRange(homeworkId, 
            new BigDecimal("4.0"), new BigDecimal("10.0"));
        
        HomeworkStatsResponse.ScoreStats scoreStats = 
            HomeworkStatsResponse.buildScoreStats(
                avgScore, null, highestScore, lowestScore, null, 
                (int) passedCount, gradedSubmissions);
        
        // Build score distribution
        Map<String, Integer> distribution = calculateScoreDistribution(homeworkId);
        HomeworkStatsResponse.ScoreDistribution scoreDistribution = 
            HomeworkStatsResponse.buildScoreDistribution(distribution);
        
        // Build late stats
        int lateCount = (int) submissionRepository.countLate(homeworkId);
        HomeworkStatsResponse.LateStats lateStats = 
            HomeworkStatsResponse.buildLateStats(
                lateCount, totalSubmissions, null, null, null);
        
        return HomeworkStatsResponse.builder()
            .homeworkId(homeworkId)
            .title(homework.getTitle())
            .classCode(classEntity.getClassCode())
            .totalStudents(totalStudents)
            .submissionStats(submissionStats)
            .scoreStats(scoreStats)
            .scoreDistribution(scoreDistribution)
            .lateStats(lateStats)
            .build();
    }
    
    // ==================== HELPER METHODS ====================
    
    /**
     * Validate homework type constraints for creation
     */
    private void validateHomeworkType(Long classId, HomeworkType type) {
        if (type == HomeworkType.MIDTERM) {
            if (homeworkRepository.hasMidterm(classId)) {
                throw new ConflictException("Class already has a MIDTERM homework");
            }
        } else if (type == HomeworkType.FINAL) {
            if (homeworkRepository.hasFinal(classId)) {
                throw new ConflictException("Class already has a FINAL homework");
            }
        }
    }
    
    /**
     * Validate homework type constraints for update
     */
    private void validateHomeworkTypeForUpdate(Long classId, HomeworkType newType, Long currentHomeworkId) {
        if (newType == HomeworkType.MIDTERM) {
            // Check if another midterm exists (excluding current)
            List<Homework> midterms = homeworkRepository.findByClassEntity_ClassIdAndHomeworkType(classId, HomeworkType.MIDTERM);
            if (midterms.stream().anyMatch(h -> !h.getHomeworkId().equals(currentHomeworkId))) {
                throw new ConflictException("Class already has a MIDTERM homework");
            }
        } else if (newType == HomeworkType.FINAL) {
            // Check if another final exists (excluding current)
            List<Homework> finals = homeworkRepository.findByClassEntity_ClassIdAndHomeworkType(classId, HomeworkType.FINAL);
            if (finals.stream().anyMatch(h -> !h.getHomeworkId().equals(currentHomeworkId))) {
                throw new ConflictException("Class already has a FINAL homework");
            }
        }
    }
    
    /**
     * Calculate score distribution
     */
    private Map<String, Integer> calculateScoreDistribution(Long homeworkId) {
        Map<String, Integer> distribution = new HashMap<>();
        
        distribution.put("0-4", (int) submissionRepository.countByScoreRange(homeworkId, 
            new BigDecimal("0.0"), new BigDecimal("3.99")));
        distribution.put("4-5", (int) submissionRepository.countByScoreRange(homeworkId, 
            new BigDecimal("4.0"), new BigDecimal("4.99")));
        distribution.put("5-6", (int) submissionRepository.countByScoreRange(homeworkId, 
            new BigDecimal("5.0"), new BigDecimal("6.49")));
        distribution.put("6-7", (int) submissionRepository.countByScoreRange(homeworkId, 
            new BigDecimal("6.5"), new BigDecimal("6.99")));
        distribution.put("7-8", (int) submissionRepository.countByScoreRange(homeworkId, 
            new BigDecimal("7.0"), new BigDecimal("7.99")));
        distribution.put("8-9", (int) submissionRepository.countByScoreRange(homeworkId, 
            new BigDecimal("8.0"), new BigDecimal("8.99")));
        distribution.put("9-10", (int) submissionRepository.countByScoreRange(homeworkId, 
            new BigDecimal("9.0"), new BigDecimal("10.0")));
        
        return distribution;
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isTeacherOwner(Long homeworkId, Long teacherId) {
        Homework homework = homeworkRepository.findById(homeworkId)
            .orElse(null);
        
        if (homework == null) return false;
        
        return homework.getClassEntity().getTeacher().getTeacherId().equals(teacherId);
    }
}