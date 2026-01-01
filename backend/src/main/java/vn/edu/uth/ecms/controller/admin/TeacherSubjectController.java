package vn.edu.uth.ecms.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.uth.ecms.dto.request.TeacherSubjectRequest;
import vn.edu.uth.ecms.dto.response.ApiResponse;
import vn.edu.uth.ecms.dto.response.TeacherSubjectResponse;
import vn.edu.uth.ecms.service.TeacherSubjectService;

import java.util.List;

/**
 * REST Controller for managing teacher-subject relationships
 */
@RestController
@RequestMapping("/api/admin/teachers")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class TeacherSubjectController {

    private final TeacherSubjectService teacherSubjectService;

    /**
     * Get all subjects taught by a teacher
     * GET /api/admin/teachers/{teacherId}/subjects
     */
    @GetMapping("/{teacherId}/subjects")
    public ResponseEntity<ApiResponse<List<TeacherSubjectResponse>>> getTeacherSubjects(
            @PathVariable Long teacherId) {

        log.info("Getting subjects for teacher ID: {}", teacherId);
        List<TeacherSubjectResponse> subjects = teacherSubjectService.getSubjectsByTeacher(teacherId);

        return ResponseEntity.ok(ApiResponse.success(subjects));
    }

    /**
     * Add a subject to a teacher
     * POST /api/admin/teachers/{teacherId}/subjects
     */
    @PostMapping("/{teacherId}/subjects")
    public ResponseEntity<ApiResponse<TeacherSubjectResponse>> addSubjectToTeacher(
            @PathVariable Long teacherId,
            @Valid @RequestBody TeacherSubjectRequest request) {

        log.info("Adding subject {} to teacher {}", request.getSubjectId(), teacherId);
        TeacherSubjectResponse response = teacherSubjectService.addSubjectToTeacher(teacherId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    /**
     * Add multiple subjects to a teacher
     * POST /api/admin/teachers/{teacherId}/subjects/batch
     */
    @PostMapping("/{teacherId}/subjects/batch")
    public ResponseEntity<ApiResponse<List<TeacherSubjectResponse>>> addSubjectsToTeacher(
            @PathVariable Long teacherId,
            @Valid @RequestBody List<TeacherSubjectRequest> requests) {

        log.info("Adding {} subjects to teacher {}", requests.size(), teacherId);
        List<TeacherSubjectResponse> responses = teacherSubjectService.addSubjectsToTeacher(teacherId, requests);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(responses));
    }

    /**
     * Replace all subjects for a teacher
     * PUT /api/admin/teachers/{teacherId}/subjects
     */
    @PutMapping("/{teacherId}/subjects")
    public ResponseEntity<ApiResponse<List<TeacherSubjectResponse>>> replaceTeacherSubjects(
            @PathVariable Long teacherId,
            @Valid @RequestBody List<TeacherSubjectRequest> requests) {

        log.info("Replacing all subjects for teacher {}", teacherId);
        List<TeacherSubjectResponse> responses = teacherSubjectService.replaceTeacherSubjects(teacherId, requests);

        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Update teacher-subject relationship
     * PUT /api/admin/teachers/{teacherId}/subjects/{subjectId}
     */
    @PutMapping("/{teacherId}/subjects/{subjectId}")
    public ResponseEntity<ApiResponse<TeacherSubjectResponse>> updateTeacherSubject(
            @PathVariable Long teacherId,
            @PathVariable Long subjectId,
            @Valid @RequestBody TeacherSubjectRequest request) {

        log.info("Updating teacher-subject relationship: teacher={}, subject={}", teacherId, subjectId);
        TeacherSubjectResponse response = teacherSubjectService.updateTeacherSubject(teacherId, subjectId, request);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Remove a subject from a teacher
     * DELETE /api/admin/teachers/{teacherId}/subjects/{subjectId}
     */
    @DeleteMapping("/{teacherId}/subjects/{subjectId}")
    public ResponseEntity<ApiResponse<Void>> removeSubjectFromTeacher(
            @PathVariable Long teacherId,
            @PathVariable Long subjectId) {

        log.info("Removing subject {} from teacher {}", subjectId, teacherId);
        teacherSubjectService.removeSubjectFromTeacher(teacherId, subjectId);

        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Get all teachers who can teach a subject
     * GET /api/admin/subjects/{subjectId}/teachers
     */
    @GetMapping("/by-subject/{subjectId}")
    public ResponseEntity<ApiResponse<List<TeacherSubjectResponse>>> getTeachersBySubject(
            @PathVariable Long subjectId) {

        log.info("Getting teachers for subject ID: {}", subjectId);
        List<TeacherSubjectResponse> teachers = teacherSubjectService.getTeachersBySubject(subjectId);

        return ResponseEntity.ok(ApiResponse.success(teachers));
    }

    /**
     * Get qualified teachers for a subject (sorted by priority)
     * GET /api/admin/subjects/{subjectId}/qualified-teachers
     */
    @GetMapping("/by-subject/{subjectId}/qualified")
    public ResponseEntity<ApiResponse<List<TeacherSubjectResponse>>> getQualifiedTeachers(
            @PathVariable Long subjectId) {

        log.info("Getting qualified teachers for subject ID: {}", subjectId);
        List<TeacherSubjectResponse> teachers = teacherSubjectService.getQualifiedTeachers(subjectId);

        return ResponseEntity.ok(ApiResponse.success(teachers));
    }
}