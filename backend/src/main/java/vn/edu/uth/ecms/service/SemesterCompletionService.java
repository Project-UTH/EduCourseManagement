package vn.edu.uth.ecms.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.repository.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * ✅ FIXED VERSION - SemesterCompletionService
 * 
 * Service xử lý logic hoàn thành học kỳ
 * - Tính điểm tổng kết từ homework submissions
 * - Tự động sync sang bảng GRADE (không dùng completed_subjects nữa)
 * 
 * CHANGES:
 * 1. Thay vì sync vào completed_subjects → Sync vào bảng grade
 * 2. Grade.status = PASSED (nếu điểm >= 4.0) hoặc FAILED (< 4.0)
 * 3. Dùng Grade entity để kiểm tra prerequisite
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SemesterCompletionService {

    private final CourseRegistrationRepository registrationRepository;
    private final HomeworkSubmissionRepository submissionRepository;
    private final HomeworkRepository homeworkRepository;
    
    // ✅ NEW: Dùng GradeRepository thay vì CompletedSubjectRepository
    private final GradeRepository gradeRepository;

    /**
     * Xử lý hoàn thành học kỳ
     * Được gọi khi admin ấn "Complete Semester"
     */
    @Transactional
    public void processSemesterCompletion(Long semesterId) {
        log.info("🎓 Processing semester completion for semester ID: {}", semesterId);

        // Lấy tất cả đăng ký REGISTERED trong học kỳ này
        List<CourseRegistration> registrations = registrationRepository
                .findBySemesterAndStatus(semesterId, RegistrationStatus.REGISTERED);

        log.info("📊 Found {} active registrations", registrations.size());

        int processedCount = 0;
        int gradedCount = 0;
        int failedCount = 0;

        for (CourseRegistration reg : registrations) {
            try {
                // 1. Tính điểm tổng kết từ homework
                GradeComponents components = calculateGradeComponents(reg);
                
                if (components == null || !components.isComplete()) {
                    log.warn("⚠️ Incomplete grades for registration {} - Student: {}, Class: {}",
                            reg.getRegistrationId(),
                            reg.getStudent().getStudentCode(),
                            reg.getClassEntity().getClassCode());
                    failedCount++;
                    continue;
                }

                // 2. Tính điểm tổng kết
                BigDecimal totalScore = components.calculateTotal();

                // 3. Lưu vào course_registration
                reg.setFinalGrade(totalScore);
                reg.setStatus(RegistrationStatus.COMPLETED);
                registrationRepository.save(reg);
                processedCount++;

                log.info("✅ Calculated final grade for student {} in class {}: {}",
                        reg.getStudent().getStudentCode(),
                        reg.getClassEntity().getClassCode(),
                        totalScore);

                // ✅ 4. SYNC VÀO BẢNG GRADE
                syncToGradeTable(reg, components, totalScore);
                gradedCount++;

            } catch (Exception e) {
                log.error("❌ Error processing registration {}: {}",
                        reg.getRegistrationId(), e.getMessage(), e);
                failedCount++;
            }
        }

        log.info("🎉 Semester completion finished:");
        log.info("   ✅ Processed registrations: {}", processedCount);
        log.info("   ✅ Grades synced to grade table: {}", gradedCount);
        log.info("   ⚠️ Failed/Skipped: {}", failedCount);
    }

    /**
     * Tính các thành phần điểm từ homework submissions
     */
    private GradeComponents calculateGradeComponents(CourseRegistration registration) {
        Long classId = registration.getClassEntity().getClassId();
        Long studentId = registration.getStudent().getStudentId();

        // Lấy tất cả homework của lớp này
        List<Homework> homeworks = homeworkRepository.findByClassEntity_ClassId(classId);

        if (homeworks.isEmpty()) {
            log.warn("⚠️ No homeworks found for class {}", classId);
            return null;
        }

        // Phân loại điểm theo loại bài tập
        List<BigDecimal> regularScores = new ArrayList<>();
        BigDecimal midtermScore = null;
        BigDecimal finalScore = null;

        for (Homework hw : homeworks) {
            // Lấy submission của sinh viên này
            var submissionOpt = submissionRepository
                    .findByHomework_HomeworkIdAndStudent_StudentId(hw.getHomeworkId(), studentId);

            if (submissionOpt.isEmpty() || submissionOpt.get().getScore() == null) {
                log.debug("  No submission/score for homework {} ({})",
                        hw.getHomeworkId(), hw.getTitle());
                continue;
            }

            BigDecimal score = submissionOpt.get().getScore();
            BigDecimal maxScore = hw.getMaxScore();

            // Chuẩn hóa về thang 10
            BigDecimal normalizedScore = score
                    .divide(maxScore, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.TEN);

            // Phân loại theo type
            HomeworkType type = hw.getHomeworkType();
            
            if (type == HomeworkType.REGULAR) {
                regularScores.add(normalizedScore);
                log.debug("  TX: {} (from {}/{})", normalizedScore, score, maxScore);
            } else if (type == HomeworkType.MIDTERM) {
                midtermScore = normalizedScore;
                log.debug("  GK: {} (from {}/{})", normalizedScore, score, maxScore);
            } else if (type == HomeworkType.FINAL) {
                finalScore = normalizedScore;
                log.debug("  CK: {} (from {}/{})", normalizedScore, score, maxScore);
            }
        }

        // Tính điểm TX trung bình
        BigDecimal txAverage = null;
        if (!regularScores.isEmpty()) {
            BigDecimal sum = regularScores.stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            txAverage = sum.divide(
                    BigDecimal.valueOf(regularScores.size()), 
                    2, 
                    RoundingMode.HALF_UP
            );
        }

        return new GradeComponents(txAverage, midtermScore, finalScore);
    }

    /**
     * ✅ NEW: Đồng bộ sang bảng GRADE
     * Thay thế logic sync vào completed_subjects
     */
    private void syncToGradeTable(CourseRegistration registration, 
                                  GradeComponents components, 
                                  BigDecimal totalScore) {
        
        Student student = registration.getStudent();
        ClassEntity classEntity = registration.getClassEntity();

        // Kiểm tra đã có grade chưa
        Grade grade = gradeRepository
                .findByStudent_StudentIdAndClassEntity_ClassId(
                        student.getStudentId(), 
                        classEntity.getClassId())
                .orElse(null);

        if (grade == null) {
            // Tạo mới
            grade = new Grade();
            grade.setStudent(student);
            grade.setClassEntity(classEntity);
        }

        // ✅ CẬP NHẬT CÁC THÀNH PHẦN ĐIỂM
        grade.setRegularScore(components.regularScore);
        grade.setMidtermScore(components.midtermScore);
        grade.setFinalScore(components.finalScore);
        
        // ✅ TỰ ĐỘNG TÍNH TOÁN totalScore, letterGrade, status
        // Grade entity có @PreUpdate hook sẽ tự động recalculate()
        grade.recalculate();

        gradeRepository.save(grade);

        log.info("✅ Synced to grade table: Student {} - Class {} - Total {} - Status {}",
                student.getStudentCode(),
                classEntity.getClassCode(),
                grade.getTotalScore(),
                grade.getStatus());
    }

    /**
     * Helper class để lưu các thành phần điểm
     */
    private static class GradeComponents {
        final BigDecimal regularScore;
        final BigDecimal midtermScore;
        final BigDecimal finalScore;

        GradeComponents(BigDecimal regularScore, BigDecimal midtermScore, BigDecimal finalScore) {
            this.regularScore = regularScore;
            this.midtermScore = midtermScore;
            this.finalScore = finalScore;
        }

        boolean isComplete() {
            return regularScore != null && midtermScore != null && finalScore != null;
        }

        BigDecimal calculateTotal() {
            if (!isComplete()) return null;
            
            // TX×20% + GK×30% + CK×50%
            return regularScore.multiply(BigDecimal.valueOf(0.2))
                    .add(midtermScore.multiply(BigDecimal.valueOf(0.3)))
                    .add(finalScore.multiply(BigDecimal.valueOf(0.5)))
                    .setScale(2, RoundingMode.HALF_UP);
        }
    }
}