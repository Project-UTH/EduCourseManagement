package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.GradeRequest;
import vn.edu.uth.ecms.dto.response.GradeResponse;
import vn.edu.uth.ecms.dto.response.GradeStatsResponse;
import vn.edu.uth.ecms.dto.response.TranscriptResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.exception.*;
import vn.edu.uth.ecms.repository.*;
import vn.edu.uth.ecms.service.GradeService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

/**
 * GradeServiceImpl
 * @author 
 * @since 
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GradeServiceImpl implements GradeService {
    
    private final GradeRepository gradeRepository;
    private final HomeworkSubmissionRepository submissionRepository;
    private final HomeworkRepository homeworkRepository;
    private final StudentRepository studentRepository;
    private final ClassRepository classRepository;
    private final CourseRegistrationRepository courseRegistrationRepository;
    
    
    
    @Override
    public GradeResponse createOrUpdateGrade(GradeRequest request, Long teacherId) {
        log.info("Teacher {} creating/updating grade for student {} in class {}", 
            teacherId, request.getStudentId(), request.getClassId());
        
        request.sanitize();
        
        // Validate class and teacher
        ClassEntity classEntity = classRepository.findById(request.getClassId())
            .orElseThrow(() -> new NotFoundException("Class not found"));
        
        if (!classEntity.getTeacher().getTeacherId().equals(teacherId)) {
            throw new UnauthorizedException("You can only manage grades for your classes");
        }
        
        // Find or create grade
        Grade grade = gradeRepository.findByStudent_StudentIdAndClassEntity_ClassId(
            request.getStudentId(), request.getClassId())
            .orElseGet(() -> {
                Grade newGrade = new Grade();
                newGrade.setStudent(studentRepository.findById(request.getStudentId())
                    .orElseThrow(() -> new NotFoundException("Student not found")));
                newGrade.setClassEntity(classEntity);
                return newGrade;
            });
        
        // Update scores
        if (request.getRegularScore() != null) {
            grade.setRegularScore(request.getRegularScore());
        }
        if (request.getMidtermScore() != null) {
            grade.setMidtermScore(request.getMidtermScore());
        }
        if (request.getFinalScore() != null) {
            grade.setFinalScore(request.getFinalScore());
        }
        if (request.getAttendanceRate() != null) {
            grade.setAttendanceRate(request.getAttendanceRate());
        }
        if (request.getTeacherComment() != null) {
            grade.setTeacherComment(request.getTeacherComment());
        }
        
        // Save (will auto-recalculate via @PreUpdate)
        Grade saved = gradeRepository.save(grade);
        log.info("Grade saved: ID={}, Total={}, Letter={}, Status={}", 
            saved.getGradeId(), saved.getTotalScore(), saved.getLetterGrade(), saved.getStatus());
        
        return GradeResponse.fromEntity(saved);
    }
    
  
    
    @Override
    @Transactional(readOnly = true)
    public GradeResponse getGrade(Long studentId, Long classId) {
        Grade grade = gradeRepository.findByStudent_StudentIdAndClassEntity_ClassId(studentId, classId)
            .orElseThrow(() -> new NotFoundException("Grade not found for this student in this class"));
        
        return GradeResponse.fromEntity(grade);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<GradeResponse> getGradesByClass(Long classId, Long teacherId) {
        // Validate teacher owns class
        ClassEntity classEntity = classRepository.findById(classId)
            .orElseThrow(() -> new NotFoundException("Class not found"));
        
        if (!classEntity.getTeacher().getTeacherId().equals(teacherId)) {
            throw new UnauthorizedException("Unauthorized");
        }
        
        List<Grade> grades = gradeRepository.findByClassEntity_ClassId(classId);
        return grades.stream()
            .map(GradeResponse::fromEntity)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public TranscriptResponse getTranscript(Long studentId) {
        // Validate student exists
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new NotFoundException("Student not found"));
        
        // Get all grades
        List<Grade> grades = gradeRepository.findByStudent_StudentId(studentId);
        
        // Calculate GPA
        BigDecimal gpa = calculateGPA(studentId);
        BigDecimal avgScore = gradeRepository.calculateStudentAverage(studentId);
        
        // Build academic summary
        long completedCourses = gradeRepository.countCompletedCourses(studentId);
        long passedCourses = gradeRepository.countPassedCourses(studentId);
        long failedCourses = gradeRepository.countFailedCourses(studentId);
        
        // Calculate credits
        int totalCredits = grades.stream()
            .map(g -> g.getClassEntity().getSubject().getCredits())
            .reduce(0, Integer::sum);
        
        int passedCredits = grades.stream()
            .filter(Grade::isPassed)
            .map(g -> g.getClassEntity().getSubject().getCredits())
            .reduce(0, Integer::sum);
        
        TranscriptResponse.AcademicSummary summary = TranscriptResponse.AcademicSummary.builder()
            .overallGPA(gpa)
            .averageScore(avgScore)
            .totalCredits(totalCredits)
            .completedCredits((int) completedCourses)
            .passedCredits(passedCredits)
            .failedCredits(totalCredits - passedCredits)
            .totalCourses((int) (completedCourses + failedCourses))
            .passedCourses((int) passedCourses)
            .failedCourses((int) failedCourses)
            .passRate(completedCourses > 0 ? 
                (passedCourses * 100.0 / completedCourses) : 0.0)
            .build();
        
        // Build student info
        TranscriptResponse.StudentInfo studentInfo = TranscriptResponse.StudentInfo.builder()
            .studentId(student.getStudentId())
            .studentCode(student.getStudentCode())
            .fullName(student.getFullName())
            .majorName(student.getMajor() != null ? student.getMajor().getMajorName() : null)
            .currentYear(null)
            .build();
        
       
        List<TranscriptResponse.CourseGrade> courseGrades = grades.stream()
            .map(this::mapToCourseGrade)
            .collect(Collectors.toList());
        
        TranscriptResponse.SemesterGrades semester = TranscriptResponse.SemesterGrades.builder()
            .semesterName("All Courses")
            .courses(courseGrades)
            .build();
        
        return TranscriptResponse.builder()
            .studentInfo(studentInfo)
            .summary(summary)
            .semesters(List.of(semester))
            .build();
    }
    
    
    
    @Override
    public void calculateRegularScore(Long studentId, Long classId) {
        log.info("Calculating regular score for student {} in class {}", studentId, classId);
        
        // Get all REGULAR homework for class
        List<Homework> regularHomeworks = homeworkRepository.findRegularHomeworkByClassId(classId);
        
        if (regularHomeworks.isEmpty()) {
            log.warn("No REGULAR homework found for class {}", classId);
            return;
        }
        
        // Get student's graded submissions for REGULAR homework
        List<BigDecimal> scores = regularHomeworks.stream()
            .map(hw -> submissionRepository.findByHomework_HomeworkIdAndStudent_StudentId(
                hw.getHomeworkId(), studentId))
            .filter(opt -> opt.isPresent() && opt.get().isGraded())
            .map(opt -> opt.get().getScore())
            .filter(score -> score != null)
            .collect(Collectors.toList());
        
        if (scores.isEmpty()) {
            log.warn("No graded REGULAR submissions found for student {} in class {}", studentId, classId);
            return;
        }
        
        // Calculate average
        BigDecimal sum = scores.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal average = sum.divide(new BigDecimal(scores.size()), 2, RoundingMode.HALF_UP);
        
        log.info("Regular score average: {} (from {} submissions)", average, scores.size());
        
        // Update grade
        updateComponentScore(studentId, classId, "regular", average);
    }
    
    @Override
    public void updateComponentScore(Long studentId, Long classId, String component, BigDecimal score) {
        log.info("Updating {} score to {} for student {} in class {}", 
            component, score, studentId, classId);
        
        // Find or create grade
        Grade grade = gradeRepository.findByStudent_StudentIdAndClassEntity_ClassId(studentId, classId)
            .orElseGet(() -> {
                Grade newGrade = new Grade();
                newGrade.setStudent(studentRepository.findById(studentId)
                    .orElseThrow(() -> new NotFoundException("Student not found")));
                newGrade.setClassEntity(classRepository.findById(classId)
                    .orElseThrow(() -> new NotFoundException("Class not found")));
                return newGrade;
            });
        
        // Update component score
        switch (component.toLowerCase()) {
            case "regular":
                grade.setRegularScore(score);
                break;
            case "midterm":
                grade.setMidtermScore(score);
                break;
            case "final":
                grade.setFinalScore(score);
                break;
            default:
                throw new BadRequestException("Invalid component: " + component);
        }
        
        // Save (will auto-recalculate)
        gradeRepository.save(grade);
    }
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateGPA(Long studentId) {
        BigDecimal gpa = gradeRepository.calculateGPA(studentId);
        return gpa != null ? gpa.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
    }
    
    
    @Override
    @Transactional(readOnly = true)
    public GradeStatsResponse getClassStats(Long classId) {
        // Get all grades
        List<Grade> grades = gradeRepository.findByClassEntity_ClassId(classId);
        
        int totalStudents = grades.size();
        int gradedStudents = (int) grades.stream().filter(Grade::isComplete).count();
        int inProgress = totalStudents - gradedStudents;
        
        // Overall stats
        GradeStatsResponse.OverallStats overall = GradeStatsResponse.OverallStats.builder()
            .totalStudents(totalStudents)
            .gradedStudents(gradedStudents)
            .inProgress(inProgress)
            .completionRate(totalStudents > 0 ? (gradedStudents * 100.0 / totalStudents) : 0.0)
            .build();
        
        // Score stats
        BigDecimal avg = gradeRepository.calculateClassAverage(classId);
        BigDecimal high = gradeRepository.findHighestScore(classId);
        BigDecimal low = gradeRepository.findLowestScore(classId);
        
        GradeStatsResponse.ScoreStats scores = GradeStatsResponse.ScoreStats.builder()
            .average(avg)
            .highest(high)
            .lowest(low)
            .build();
        
        // Letter grade distribution
        List<Object[]> distribution = gradeRepository.countByLetterGrade(classId);
        GradeStatsResponse.LetterGradeDistribution dist = buildDistribution(distribution);
        
        // Pass/fail
        long passed = gradeRepository.countPassed(classId);
        long failed = gradeRepository.countFailed(classId);
        BigDecimal passRate = gradeRepository.calculatePassRate(classId);
        
        GradeStatsResponse.PassFailStats passFail = GradeStatsResponse.PassFailStats.builder()
            .passedCount((int) passed)
            .failedCount((int) failed)
            .passRate(passRate != null ? passRate.doubleValue() : 0.0)
            .build();
        
        return GradeStatsResponse.builder()
            .classId(classId)
            .overall(overall)
            .scores(scores)
            .distribution(dist)
            .passFail(passFail)
            .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public Long getStudentRank(Long studentId, Long classId) {
        return gradeRepository.findStudentRank(classId, studentId);
    }
    
   
    
    @Override
    public List<GradeResponse> bulkUpdateGrades(List<GradeRequest> requests, Long teacherId) {
        return requests.stream()
            .map(req -> createOrUpdateGrade(req, teacherId))
            .collect(Collectors.toList());
    }
    
    @Override
    public void initializeGradesForClass(Long classId) {
        log.info("Initializing grades for class {}", classId);
        
        ClassEntity classEntity = classRepository.findById(classId)
            .orElseThrow(() -> new NotFoundException("Class not found"));
        
        // Get all enrolled students (REGISTERED status)
        List<CourseRegistration> registrations = courseRegistrationRepository
            .findByClassEntity_ClassIdAndStatus(classId, RegistrationStatus.REGISTERED);
        
        for (CourseRegistration reg : registrations) {
            // Check if grade exists
            boolean exists = gradeRepository.existsByStudent_StudentIdAndClassEntity_ClassId(
                reg.getStudent().getStudentId(), classId);
            
            if (!exists) {
                // Create empty grade
                Grade grade = new Grade();
                grade.setStudent(reg.getStudent());
                grade.setClassEntity(classEntity);
                gradeRepository.save(grade);
            }
        }
        
        log.info("Initialized grades for {} students", registrations.size());
    }
    
   
    
    private TranscriptResponse.CourseGrade mapToCourseGrade(Grade grade) {
        return TranscriptResponse.CourseGrade.builder()
            .classCode(grade.getClassEntity().getClassCode())
            .subjectCode(grade.getClassEntity().getSubject().getSubjectCode())
            .subjectName(grade.getClassEntity().getSubject().getSubjectName())
            .credits(grade.getClassEntity().getSubject().getCredits())
            .regularScore(grade.getRegularScore())
            .midtermScore(grade.getMidtermScore())
            .finalScore(grade.getFinalScore())
            .totalScore(grade.getTotalScore())
            .letterGrade(grade.getLetterGrade())
            .gradePoint(grade.getGradePoint())
            .status(grade.getStatus() != null ? grade.getStatus().getDisplayName() : null)
            .teacherComment(grade.getTeacherComment())
            .build();
    }
    
    private GradeStatsResponse.LetterGradeDistribution buildDistribution(List<Object[]> data) {
        GradeStatsResponse.LetterGradeDistribution dist = new GradeStatsResponse.LetterGradeDistribution();
        
        for (Object[] row : data) {
            String letter = (String) row[0];
            Long count = (Long) row[1];
            
            switch (letter) {
                case "A": dist.setCountA(count.intValue()); break;
                case "B+": dist.setCountBPlus(count.intValue()); break;
                case "B": dist.setCountB(count.intValue()); break;
                case "C+": dist.setCountCPlus(count.intValue()); break;
                case "C": dist.setCountC(count.intValue()); break;
                case "D+": dist.setCountDPlus(count.intValue()); break;
                case "D": dist.setCountD(count.intValue()); break;
                case "F": dist.setCountF(count.intValue()); break;
            }
        }
        
        return dist;
    }
}