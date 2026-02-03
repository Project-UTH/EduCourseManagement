    package vn.edu.uth.ecms.service.impl;

    import lombok.RequiredArgsConstructor;
    import lombok.extern.slf4j.Slf4j;
    import org.springframework.data.domain.Page;
    import org.springframework.data.domain.Pageable;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;

    import vn.edu.uth.ecms.dto.SubmissionDto;
    import vn.edu.uth.ecms.dto.TeacherDto;
    import vn.edu.uth.ecms.dto.request.HomeworkRequest;
    import vn.edu.uth.ecms.dto.response.HomeworkDetailResponse;
    import vn.edu.uth.ecms.dto.response.HomeworkResponse;
    import vn.edu.uth.ecms.dto.response.HomeworkStatsResponse;
    import vn.edu.uth.ecms.dto.response.SubmissionFileResponse;
    import vn.edu.uth.ecms.entity.*;
    import vn.edu.uth.ecms.exception.*;
    import vn.edu.uth.ecms.repository.*;
    import vn.edu.uth.ecms.service.HomeworkService;
    import vn.edu.uth.ecms.dto.response.HomeworkWithSubmissionResponse;

    import java.math.BigDecimal;
    import java.time.LocalDateTime;
    import java.util.HashMap;
    import java.util.List;
    import java.util.Map;
    import java.util.Optional;
    import java.util.stream.Collectors;
    


    /**
     * HomeworkServiceImpl
     * @author 
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
        
       
        
        @Override
        @Transactional(readOnly = true)
        public HomeworkStatsResponse getHomeworkStats(Long homeworkId) {
            // Find homework with submissions
            Homework homework = homeworkRepository.findWithSubmissions(homeworkId)
                .orElseThrow(() -> new NotFoundException("Homework not found with ID: " + homeworkId));
            
            // Get class info
            ClassEntity classEntity = homework.getClassEntity();
            int totalStudents = (int) submissionRepository.countByHomework_HomeworkId(homeworkId); 
            
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
        @Override
    @Transactional(readOnly = true)
    public List<HomeworkResponse> getHomeworksByClass(Long classId) {
        log.info("[HomeworkService] Getting homeworks for class: {}", classId);
        
        try {
            // Find all homeworks for this class
            List<Homework> homeworks = homeworkRepository.findByClassEntity_ClassId(classId);
            
            log.info("[HomeworkService] Found {} homeworks", homeworks.size());
            
            // Map to response DTOs
            return homeworks.stream()
                    .map(this::mapToResponse)  
                    .toList();
                    
        } catch (Exception e) {
            log.error("[HomeworkService] Error getting homeworks for class {}", classId, e);
            throw new RuntimeException("Failed to get homeworks: " + e.getMessage(), e);
        }
    }


    private HomeworkResponse mapToResponse(Homework homework) {
        HomeworkResponse response = new HomeworkResponse();
        
        response.setHomeworkId(homework.getHomeworkId());
        response.setTitle(homework.getTitle());
        response.setDescription(homework.getDescription());
        response.setHomeworkType(homework.getHomeworkType());  
        response.setDeadline(homework.getDeadline());
        response.setMaxScore(homework.getMaxScore());
        
        // Class info
        if (homework.getClassEntity() != null) {
            response.setClassId(homework.getClassEntity().getClassId());
            response.setClassCode(homework.getClassEntity().getClassCode());
            
            if (homework.getClassEntity().getSubject() != null) {
                response.setSubjectName(homework.getClassEntity().getSubject().getSubjectName());
            }
        }
        
        // File attachment
        if (homework.getAttachmentUrl() != null) {
            response.setAttachmentUrl(homework.getAttachmentUrl());
        }
        
        // Status
        
        // Metadata
        response.setCreatedAt(homework.getCreatedAt());
        response.setUpdatedAt(homework.getUpdatedAt());
        
        return response;
    }
    @Override
    @Transactional(readOnly = true)
    public HomeworkDetailResponse getHomeworkDetailForStudent(Long homeworkId, String studentCode) {
        log.info("[HomeworkService] Getting homework detail for student: {} - homework: {}", studentCode, homeworkId);
        
        // Find homework
        Homework homework = homeworkRepository.findById(homeworkId)
                .orElseThrow(() -> new RuntimeException("Homework not found"));
        
        // Map to response
        HomeworkDetailResponse response = mapToDetailResponse(homework);
        
        // Check if student has submission
    Optional<HomeworkSubmission> submission = submissionRepository
    .findByHomework_HomeworkIdAndStudent_StudentCode(homeworkId, studentCode);


if (submission.isPresent()) {
    HomeworkSubmission sub = submission.get();
    
    try {
        // Trigger lazy load
        List<SubmissionFile> files = sub.getSubmissionFiles();
        
        if (files != null) {
            int size = files.size(); // Force Hibernate to load
            log.info(" [DEBUG] Loaded {} files for submission {}", size, sub.getSubmissionId());
            
            // Log each file
            for (SubmissionFile f : files) {
                log.info("   - File {}: {} ({})", f.getFileId(), f.getOriginalFilename(), f.getFormattedFileSize());
            }
        } else {
            log.warn(" [DEBUG] submissionFiles is NULL");
        }
    } catch (Exception e) {
        log.error(" [DEBUG] Failed to load files: {}", e.getMessage(), e);
    }
}
       if (submission.isPresent()) {
    // Map submission data
    HomeworkSubmission sub = submission.get();
    
    // Ensure files are loaded before mapping
    if (sub.getSubmissionFiles() != null) {
        sub.getSubmissionFiles().size(); 
    }
    
    response.setSubmission(mapToSubmissionDto(sub));
}
        
        // Check if can submit
        boolean isOverdue = LocalDateTime.now().isAfter(homework.getDeadline());
        response.setOverdue(isOverdue);
        response.setCanSubmit(!isOverdue && !submission.isPresent());
        
        return response;
    }

    // Helper methods
    private HomeworkDetailResponse mapToDetailResponse(Homework homework) {
        HomeworkDetailResponse response = new HomeworkDetailResponse();
        
        response.setHomeworkId(homework.getHomeworkId());
        response.setTitle(homework.getTitle());
        response.setDescription(homework.getDescription());
    response.setHomeworkType(homework.getHomeworkType());
        response.setMaxScore(homework.getMaxScore());
        response.setDeadline(homework.getDeadline());
        response.setAttachmentUrl(homework.getAttachmentUrl());
        
        // Class info
        if (homework.getClassEntity() != null) {
            response.setClassId(homework.getClassEntity().getClassId());
            response.setClassName(homework.getClassEntity().getClassCode() + " - " + 
                                homework.getClassEntity().getSubject().getSubjectName());
            response.setSubjectName(homework.getClassEntity().getSubject().getSubjectName());
        }
        
        // Teacher info
        if (homework.getClassEntity() != null && homework.getClassEntity().getTeacher() != null) {
            Teacher teacher = homework.getClassEntity().getTeacher();
            TeacherDto teacherDto = new TeacherDto();
            teacherDto.setTeacherId(teacher.getTeacherId());
            teacherDto.setFullName(teacher.getFullName());
            teacherDto.setEmail(teacher.getEmail());
            response.setTeacher(teacherDto);
        }
        
        response.setCreatedAt(homework.getCreatedAt());
        
        return response;
    }

   private SubmissionDto mapToSubmissionDto(HomeworkSubmission submission) {
    SubmissionDto dto = new SubmissionDto();
    
    dto.setSubmissionId(submission.getSubmissionId());
    dto.setSubmissionText(submission.getSubmissionText());
    
 
    dto.setSubmissionFileUrl(submission.getSubmissionFileUrl());
    dto.setSubmissionFileName(submission.getSubmissionFileName());
    
 
    if (submission.getSubmissionFiles() != null && !submission.getSubmissionFiles().isEmpty()) {
        List<vn.edu.uth.ecms.dto.response.SubmissionFileResponse> fileResponses = 
            submission.getSubmissionFiles().stream()
                .map(vn.edu.uth.ecms.dto.response.SubmissionFileResponse::fromEntity)
                .collect(Collectors.toList());
        dto.setSubmissionFiles(fileResponses);
        
        log.info(" [DEBUG] Mapped {} files to DTO", fileResponses.size());
    }
    
    dto.setSubmissionDate(submission.getSubmissionDate());
    dto.setScore(submission.getScore());
    dto.setTeacherFeedback(submission.getTeacherFeedback());
    
    // Status
    if (submission.getScore() != null) {
        dto.setStatus("GRADED");
    } else {
        dto.setStatus("SUBMITTED");
    }
    
    // Check if late
    boolean isLate = submission.getSubmissionDate().isAfter(
            submission.getHomework().getDeadline()
    );
    dto.setLate(isLate);
    if (isLate) {
        dto.setStatus("LATE");
    }
    
    return dto;
}
@Override
@Transactional(readOnly = true)
public List<HomeworkWithSubmissionResponse> getHomeworksByClassWithSubmissionStatus(
        Long classId, String studentCode) {
    
    log.info("[HomeworkService] Getting homeworks with submission status for class {} - student {}", 
            classId, studentCode);
    
    // Get all homeworks for class
    List<Homework> homeworks = homeworkRepository.findByClassEntity_ClassId(classId);
    
    // Map each homework with submission status
    return homeworks.stream()
            .map(homework -> {
                // Check if student has submitted
                Optional<HomeworkSubmission> submission = submissionRepository
                        .findByHomework_HomeworkIdAndStudent_StudentCode(
                                homework.getHomeworkId(), 
                                studentCode
                        );
                
                // Force load submission files if present
                if (submission.isPresent()) {
                    HomeworkSubmission sub = submission.get();
                    try {
                        if (sub.getSubmissionFiles() != null) {
                            sub.getSubmissionFiles().size(); 
                        }
                    } catch (Exception e) {
                        log.warn("Failed to load files for submission {}", sub.getSubmissionId());
                    }
                }
                
                return HomeworkWithSubmissionResponse.fromEntity(homework, submission);
            })
            .collect(Collectors.toList());
}
}