package vn.edu.uth.ecms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ClassSessionResponse DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassSessionResponse {

    private Long sessionId;
    private Long classId;
    private String classCode;
    private Integer sessionNumber;
    private String sessionType;  // IN_PERSON, E_LEARNING
    private String category;
    private Boolean isPending;
    private LocalDate originalDate;
    private String originalDayOfWeek;
    private String originalDayOfWeekDisplay;
    private String originalTimeSlot;
    private String originalTimeSlotDisplay;
    private String originalRoom;  // Room code: "A201"
    private String originalRoomName;
    private LocalDate actualDate;
    private String actualDayOfWeek;
    private String actualDayOfWeekDisplay;
    private String actualTimeSlot;
    private String actualTimeSlotDisplay;
    private String actualRoom;  // Room code: "B105"
    private String actualRoomName;
    private LocalDate effectiveDate;
    private String effectiveDayOfWeek;
    private String effectiveDayOfWeekDisplay;
    private String effectiveTimeSlot;
    private String effectiveTimeSlotDisplay;
    private String effectiveRoom;  // Room code
    private String effectiveRoomName;
    private Boolean isRescheduled;
    private String rescheduleReason;
    private String status;  // SCHEDULED, COMPLETED, CANCELLED
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}