package vn.edu.uth.ecms.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.response.StudentGradeResponse;
import vn.edu.uth.ecms.dto.response.StudentTranscriptResponse;
import vn.edu.uth.ecms.entity.Grade;
import vn.edu.uth.ecms.entity.enums.GradeStatus;
import vn.edu.uth.ecms.entity.Student;
import vn.edu.uth.ecms.exception.ResourceNotFoundException;
import vn.edu.uth.ecms.repository.GradeRepository;
import vn.edu.uth.ecms.repository.StudentRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Student Grade Service
 * @author
 * @since
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class StudentGradeService {
    
    private final GradeRepository gradeRepository;
    private final StudentRepository studentRepository;
    
    /**
     * Get all grades for a student
     * 
     * @param studentId Student ID
     * @return List of grades
     */
    public List<StudentGradeResponse> getStudentGrades(Long studentId) {
        log.info("[StudentGradeService] Fetching all grades for student {}", studentId);
        
        // Verify student exists
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
        
        // Fetch all grades
        List<Grade> grades = gradeRepository.findByStudent_StudentId(studentId);
        
        log.info("[StudentGradeService] Found {} grades for student {}", grades.size(), studentId);
        
        return grades.stream()
            .map(this::toStudentGradeResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get grade for specific class
     * 
     * @param studentId Student ID
     * @param classId Class ID
     * @return Grade
     */
    public StudentGradeResponse getStudentGradeForClass(Long studentId, Long classId) {
        log.info("[StudentGradeService] Fetching grade for student {} in class {}", 
                 studentId, classId);
        
        Grade grade = gradeRepository
            .findByStudent_StudentIdAndClassEntity_ClassId(studentId, classId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Grade not found for student " + studentId + " in class " + classId));
        
        return toStudentGradeResponse(grade);
    }
    
    /**
     * Get complete transcript for a student
     * 
     * @param studentId Student ID
     * @return Complete transcript
     */
    public StudentTranscriptResponse getStudentTranscript(Long studentId) {
        log.info("[StudentGradeService] Building transcript for student {}", studentId);
        
        // Fetch student
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
        
        // Fetch all grades
        List<Grade> grades = gradeRepository.findByStudent_StudentId(studentId);
        
        // Build transcript
        StudentTranscriptResponse transcript = new StudentTranscriptResponse();
        
        // Student info
        StudentTranscriptResponse.StudentInfo studentInfo = new StudentTranscriptResponse.StudentInfo();
        studentInfo.setStudentCode(student.getStudentCode());
        studentInfo.setFullName(student.getFullName()); // Student has fullName field directly
        studentInfo.setMajor(student.getMajor() != null ? student.getMajor().getMajorName() : "N/A");
        transcript.setStudent(studentInfo);
        
        // Group by semester
        Map<String, List<Grade>> gradesBySemester = grades.stream()
            .collect(Collectors.groupingBy(g -> 
                g.getClassEntity().getSemester() != null ? 
                g.getClassEntity().getSemester().getSemesterName() : "Chưa xác định"
            ));
        
        // Build semester data
        List<StudentTranscriptResponse.SemesterData> semesters = new ArrayList<>();
        for (Map.Entry<String, List<Grade>> entry : gradesBySemester.entrySet()) {
            StudentTranscriptResponse.SemesterData semester = new StudentTranscriptResponse.SemesterData();
            semester.setSemesterName(entry.getKey());
            
            List<StudentTranscriptResponse.ClassGrade> classGrades = entry.getValue().stream()
                .map(this::toClassGrade)
                .collect(Collectors.toList());
            
            semester.setClasses(classGrades);
            semesters.add(semester);
        }
        
        // Sort semesters (newest first)
        semesters.sort((a, b) -> b.getSemesterName().compareTo(a.getSemesterName()));
        transcript.setSemesters(semesters);
        
        // Calculate statistics
        calculateStatistics(transcript, grades);
        
        log.info("[StudentGradeService] Transcript complete: GPA={}, Credits={}", 
                 transcript.getGpa(), transcript.getTotalCredits());
        
        return transcript;
    }
    
    /**
     * Convert Grade entity to StudentGradeResponse
     */
    private StudentGradeResponse toStudentGradeResponse(Grade grade) {
        StudentGradeResponse response = new StudentGradeResponse();
        
        response.setGradeId(grade.getGradeId());
        response.setStudentCode(grade.getStudent().getStudentCode());
        response.setClassCode(grade.getClassEntity().getClassCode());
        response.setSubjectCode(grade.getClassEntity().getSubject().getSubjectCode());
        response.setSubjectName(grade.getClassEntity().getSubject().getSubjectName());
        response.setCredits(grade.getClassEntity().getSubject().getCredits());
        response.setSemesterName(grade.getClassEntity().getSemester() != null ? 
                                  grade.getClassEntity().getSemester().getSemesterName() : null);
        
        response.setRegularScore(grade.getRegularScore());
        response.setMidtermScore(grade.getMidtermScore());
        response.setFinalScore(grade.getFinalScore());
        response.setTotalScore(grade.getTotalScore());
        response.setLetterGrade(grade.getLetterGrade());
        response.setStatus(grade.getStatus());
        
        return response;
    }
    
    /**
     * Convert Grade to ClassGrade for transcript
     */
    private StudentTranscriptResponse.ClassGrade toClassGrade(Grade grade) {
        StudentTranscriptResponse.ClassGrade classGrade = new StudentTranscriptResponse.ClassGrade();
        
        classGrade.setSubjectCode(grade.getClassEntity().getSubject().getSubjectCode());
        classGrade.setSubjectName(grade.getClassEntity().getSubject().getSubjectName());
        classGrade.setCredits(grade.getClassEntity().getSubject().getCredits());
        classGrade.setTotalScore(grade.getTotalScore());
        classGrade.setLetterGrade(grade.getLetterGrade());
        classGrade.setStatus(grade.getStatus());
        
        return classGrade;
    }
    
    /**
     * Calculate GPA and statistics
     */
    private void calculateStatistics(StudentTranscriptResponse transcript, List<Grade> grades) {
        int totalCredits = 0;
        int totalCreditsEarned = 0;
        int passedClasses = 0;
        int failedClasses = 0;
        int inProgressClasses = 0;
        
        BigDecimal totalWeightedScore = BigDecimal.ZERO;
        BigDecimal totalWeightedGradePoint = BigDecimal.ZERO;
        
        for (Grade grade : grades) {
            int credits = grade.getClassEntity().getSubject().getCredits();
            totalCredits += credits;
            
            if (grade.getStatus() == GradeStatus.PASSED) {
                totalCreditsEarned += credits;
                passedClasses++;
                
                // Add to GPA calculation
                if (grade.getTotalScore() != null) {
                    totalWeightedScore = totalWeightedScore.add(
                        grade.getTotalScore().multiply(BigDecimal.valueOf(credits))
                    );
                }
                
                if (grade.getGradePoint() != null) {
                    totalWeightedGradePoint = totalWeightedGradePoint.add(
                        grade.getGradePoint().multiply(BigDecimal.valueOf(credits))
                    );
                }
            } else if (grade.getStatus() == GradeStatus.FAILED) {
                failedClasses++;
            } else {
                inProgressClasses++;
            }
        }
        
        // Calculate GPA (grade point average)
        BigDecimal gpa = BigDecimal.ZERO;
        if (totalCreditsEarned > 0 && totalWeightedGradePoint.compareTo(BigDecimal.ZERO) > 0) {
            gpa = totalWeightedGradePoint
                .divide(BigDecimal.valueOf(totalCreditsEarned), 2, RoundingMode.HALF_UP);
        }
        
        transcript.setGpa(gpa.doubleValue());
        transcript.setTotalCredits(totalCredits);
        transcript.setTotalCreditsEarned(totalCreditsEarned);
        transcript.setPassedClasses(passedClasses);
        transcript.setFailedClasses(failedClasses);
        transcript.setInProgressClasses(inProgressClasses);
    }
}