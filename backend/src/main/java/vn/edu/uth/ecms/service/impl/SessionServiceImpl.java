package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.dto.request.BatchRescheduleRequest;
import vn.edu.uth.ecms.dto.request.RescheduleSessionRequest;
import vn.edu.uth.ecms.dto.response.ClassSessionResponse;
import vn.edu.uth.ecms.entity.*;
import vn.edu.uth.ecms.exception.*;
import vn.edu.uth.ecms.repository.ClassSessionRepository;
import vn.edu.uth.ecms.repository.RoomRepository;
import vn.edu.uth.ecms.service.SessionService;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Implementation of SessionService - CORRECTED
 *
 * KEY CHANGES:
 * ✅ Fixed duplicate rescheduleSession() method
 * ✅ Added missing getDayOfWeekDisplay() method
 * ✅ Updated to use Room entity instead of String
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SessionServiceImpl implements SessionService {

    private final ClassSessionRepository sessionRepository;
    private final RoomRepository roomRepository;

    // ==================== RESCHEDULE SINGLE SESSION ====================

    @Override
    public ClassSessionResponse rescheduleSession(
            Long sessionId,
            RescheduleSessionRequest request) {

        log.info("Rescheduling session ID: {}", sessionId);

        // 1. Find session
        ClassSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        // 2. Can only reschedule IN_PERSON sessions
        if (session.getSessionType() != SessionType.IN_PERSON) {
            throw new BadRequestException("Can only reschedule IN_PERSON sessions");
        }

        // 3. Cannot reschedule PENDING sessions
        if (session.getIsPending()) {
            throw new BadRequestException(
                    "Cannot reschedule PENDING sessions. " +
                            "Wait for semester activation to schedule them first."
            );
        }

        // 4. Parse new schedule
        LocalDate newDate = LocalDate.parse(request.getNewDate());
        DayOfWeek newDay = DayOfWeek.valueOf(request.getNewDayOfWeek());
        TimeSlot newSlot = TimeSlot.valueOf(request.getNewTimeSlot());

        // 5. ✅ FIND NEW ROOM (from request.getNewRoomId() or by code)
        Room newRoom;
        if (request.getNewRoomId() != null) {
            // Option A: Frontend sends room ID
            newRoom = roomRepository.findById(request.getNewRoomId())
                    .orElseThrow(() -> new NotFoundException("Room not found"));
        } else if (request.getNewRoom() != null) {
            // Option B: Frontend sends room code (backward compatibility)
            newRoom = roomRepository.findByRoomCode(request.getNewRoom())
                    .orElseThrow(() -> new NotFoundException("Room not found: " + request.getNewRoom()));
        } else {
            throw new BadRequestException("Room is required for rescheduling");
        }

        // 6. Validate new date within semester
        ClassEntity classEntity = session.getClassEntity();
        Semester semester = classEntity.getSemester();

        if (newDate.isBefore(semester.getStartDate()) ||
                newDate.isAfter(semester.getEndDate())) {
            throw new BadRequestException(
                    "New date must be within semester: " +
                            semester.getStartDate() + " to " + semester.getEndDate()
            );
        }

        // 7. Check conflicts
        if (hasScheduleConflict(
                semester.getSemesterId(),
                classEntity.getTeacher().getTeacherId(),
                newDate,
                newDay,
                newSlot,
                newRoom.getRoomId(),  // ← Room ID, not String
                sessionId)) {
            throw new ConflictException(
                    "Schedule conflict detected at " + newDate + " " +
                            newDay + " " + newSlot.getDisplayName() + " in room " + newRoom.getRoomCode()
            );
        }

        // 8. Update session
        session.setActualDate(newDate);
        session.setActualDayOfWeek(newDay);
        session.setActualTimeSlot(newSlot);
        session.setActualRoom(newRoom);  // ← Room entity
        session.setIsRescheduled(true);
        session.setRescheduleReason(request.getReason());

        ClassSession saved = sessionRepository.save(session);

        log.info("✅ Session {} rescheduled: {} {} {} {} → {} {} {} {}",
                session.getSessionNumber(),
                session.getOriginalDate(),
                session.getOriginalDayOfWeek(),
                session.getOriginalTimeSlot(),
                session.getOriginalRoom() != null ? session.getOriginalRoom().getRoomCode() : "null",
                newDate, newDay, newSlot, newRoom.getRoomCode());

        return mapToResponse(saved);
    }

    // ==================== RESCHEDULE MULTIPLE SESSIONS ====================

    @Override
    public List<ClassSessionResponse> rescheduleSessions(
            BatchRescheduleRequest request) {

        log.info("Batch rescheduling {} sessions", request.getSessionIds().size());

        List<ClassSessionResponse> results = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (Long sessionId : request.getSessionIds()) {
            try {
                ClassSessionResponse response = rescheduleSession(
                        sessionId,
                        request.getRescheduleDetails()
                );
                results.add(response);
            } catch (Exception e) {
                log.error("Failed to reschedule session {}: {}", sessionId, e.getMessage());
                errors.add("Session " + sessionId + ": " + e.getMessage());
            }
        }

        log.info("✅ Batch reschedule completed: {} success, {} failed",
                results.size(), errors.size());

        if (!errors.isEmpty()) {
            log.warn("Errors: {}", errors);
        }

        return results;
    }

    // ==================== RESET TO ORIGINAL ====================

    @Override
    public ClassSessionResponse resetToOriginal(Long sessionId) {
        log.info("Resetting session {} to original schedule", sessionId);

        ClassSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        if (!session.getIsRescheduled()) {
            log.info("Session {} is not rescheduled, nothing to reset", sessionId);
            return mapToResponse(session);
        }

        // Reset to original
        session.resetToOriginal();

        ClassSession saved = sessionRepository.save(session);

        log.info("✅ Session {} reset to original: {} {} {} {}",
                session.getSessionNumber(),
                session.getOriginalDate(),
                session.getOriginalDayOfWeek(),
                session.getOriginalTimeSlot(),
                session.getOriginalRoom() != null ? session.getOriginalRoom().getRoomCode() : "null");

        return mapToResponse(saved);
    }

    @Override
    public List<ClassSessionResponse> resetMultipleToOriginal(List<Long> sessionIds) {
        log.info("Batch resetting {} sessions to original", sessionIds.size());

        List<ClassSessionResponse> results = new ArrayList<>();

        for (Long sessionId : sessionIds) {
            try {
                ClassSessionResponse response = resetToOriginal(sessionId);
                results.add(response);
            } catch (Exception e) {
                log.error("Failed to reset session {}: {}", sessionId, e.getMessage());
            }
        }

        log.info("✅ Batch reset completed: {} sessions", results.size());

        return results;
    }

    // ==================== QUERY METHODS ====================

    @Override
    @Transactional(readOnly = true)
    public List<ClassSessionResponse> getSessionsByClass(Long classId) {
        return sessionRepository.findByClass(classId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassSessionResponse> getInPersonSessions(Long classId) {
        return sessionRepository.findByClassAndType(classId, SessionType.IN_PERSON)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassSessionResponse> getELearningSessions(Long classId) {
        return sessionRepository.findByClassAndType(classId, SessionType.E_LEARNING)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassSessionResponse> getRescheduledSessions(Long classId) {
        return sessionRepository.findRescheduledSessions(classId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ClassSessionResponse getSessionById(Long sessionId) {
        ClassSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));
        return mapToResponse(session);
    }

    // ==================== CONFLICT DETECTION ====================

    /**
     * ✅ UPDATED: Conflict detection with Room ID
     */
    public boolean hasScheduleConflict(
            Long semesterId, Long teacherId,
            LocalDate date, DayOfWeek dayOfWeek,
            TimeSlot timeSlot, Long roomId,  // ← Changed from String room
            Long excludeSessionId) {

        // Check teacher conflict
        boolean teacherConflict = sessionRepository.existsTeacherConflict(
                semesterId, teacherId, date, dayOfWeek, timeSlot.name(), excludeSessionId
        );

        // Check room conflict
        boolean roomConflict = sessionRepository.existsRoomConflict(
                semesterId, roomId, date, dayOfWeek, timeSlot.name(), excludeSessionId
        );

        return teacherConflict || roomConflict;
    }

    // ==================== STATUS MANAGEMENT ====================

    @Override
    public ClassSessionResponse markAsCompleted(Long sessionId) {
        ClassSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        session.setStatus(SessionStatus.COMPLETED);
        ClassSession saved = sessionRepository.save(session);

        log.info("✅ Session {} marked as COMPLETED", sessionId);

        return mapToResponse(saved);
    }

    @Override
    public ClassSessionResponse markAsCancelled(Long sessionId, String reason) {
        ClassSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NotFoundException("Session not found"));

        session.setStatus(SessionStatus.CANCELLED);
        session.setRescheduleReason(reason);
        ClassSession saved = sessionRepository.save(session);

        log.info("✅ Session {} marked as CANCELLED: {}", sessionId, reason);

        return mapToResponse(saved);
    }

    // ==================== STATISTICS ====================

    @Override
    @Transactional(readOnly = true)
    public long countTotalSessions(Long classId) {
        return sessionRepository.countByClass(classId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countRescheduledSessions(Long classId) {
        return sessionRepository.countRescheduledSessions(classId);
    }

    @Override
    @Transactional(readOnly = true)
    public long countCompletedSessions(Long classId) {
        return sessionRepository.countByStatus(classId, SessionStatus.COMPLETED);
    }

    // ==================== MAPPER ====================

    /**
     * ✅ UPDATED: Map Room entity to response
     */
    private ClassSessionResponse mapToResponse(ClassSession entity) {
        return ClassSessionResponse.builder()
                .sessionId(entity.getSessionId())
                .classId(entity.getClassEntity().getClassId())
                .classCode(entity.getClassEntity().getClassCode())
                .sessionNumber(entity.getSessionNumber())
                .sessionType(entity.getSessionType().toString())
                .category(entity.getCategory() != null ? entity.getCategory().toString() : null)  // ← NEW
                .isPending(entity.getIsPending())  // ← NEW
                // Original
                .originalDate(entity.getOriginalDate())
                .originalDayOfWeek(entity.getOriginalDayOfWeek() != null ?
                        entity.getOriginalDayOfWeek().toString() : null)
                .originalDayOfWeekDisplay(entity.getOriginalDayOfWeek() != null ?
                        getDayOfWeekDisplay(entity.getOriginalDayOfWeek()) : null)
                .originalTimeSlot(entity.getOriginalTimeSlot() != null ?
                        entity.getOriginalTimeSlot().toString() : null)
                .originalTimeSlotDisplay(entity.getOriginalTimeSlot() != null ?
                        entity.getOriginalTimeSlot().getFullDisplay() : null)
                .originalRoom(entity.getOriginalRoom() != null ?  // ← Room entity
                        entity.getOriginalRoom().getRoomCode() : null)
                .originalRoomName(entity.getOriginalRoom() != null ?  // ← NEW
                        entity.getOriginalRoom().getDisplayName() : null)
                // Actual
                .actualDate(entity.getActualDate())
                .actualDayOfWeek(entity.getActualDayOfWeek() != null ?
                        entity.getActualDayOfWeek().toString() : null)
                .actualDayOfWeekDisplay(entity.getActualDayOfWeek() != null ?
                        getDayOfWeekDisplay(entity.getActualDayOfWeek()) : null)
                .actualTimeSlot(entity.getActualTimeSlot() != null ?
                        entity.getActualTimeSlot().toString() : null)
                .actualTimeSlotDisplay(entity.getActualTimeSlot() != null ?
                        entity.getActualTimeSlot().getFullDisplay() : null)
                .actualRoom(entity.getActualRoom() != null ?  // ← Room entity
                        entity.getActualRoom().getRoomCode() : null)
                .actualRoomName(entity.getActualRoom() != null ?  // ← NEW
                        entity.getActualRoom().getDisplayName() : null)
                // Effective
                .effectiveDate(entity.getEffectiveDate())
                .effectiveDayOfWeek(entity.getEffectiveDayOfWeek() != null ?
                        entity.getEffectiveDayOfWeek().toString() : null)
                .effectiveDayOfWeekDisplay(entity.getEffectiveDayOfWeek() != null ?
                        getDayOfWeekDisplay(entity.getEffectiveDayOfWeek()) : null)
                .effectiveTimeSlot(entity.getEffectiveTimeSlot() != null ?
                        entity.getEffectiveTimeSlot().toString() : null)
                .effectiveTimeSlotDisplay(entity.getEffectiveTimeSlot() != null ?
                        entity.getEffectiveTimeSlot().getFullDisplay() : null)
                .effectiveRoom(entity.getEffectiveRoom() != null ?  // ← Room entity
                        entity.getEffectiveRoom().getRoomCode() : null)
                .effectiveRoomName(entity.getEffectiveRoom() != null ?  // ← NEW
                        entity.getEffectiveRoom().getDisplayName() : null)
                // Reschedule
                .isRescheduled(entity.getIsRescheduled())
                .rescheduleReason(entity.getRescheduleReason())
                // Status
                .status(entity.getStatus().toString())
                // Metadata
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    /**
     * ✅ NEW: Helper method to convert DayOfWeek to Vietnamese display
     */
    private String getDayOfWeekDisplay(DayOfWeek day) {
        return switch (day) {
            case MONDAY -> "Thứ 2";
            case TUESDAY -> "Thứ 3";
            case WEDNESDAY -> "Thứ 4";
            case THURSDAY -> "Thứ 5";
            case FRIDAY -> "Thứ 6";
            case SATURDAY -> "Thứ 7";
            case SUNDAY -> "Chủ nhật";
        };
    }
}