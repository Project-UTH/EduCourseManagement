package vn.edu.uth.ecms.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.uth.ecms.entity.Room;
import vn.edu.uth.ecms.entity.TimeSlot;
import vn.edu.uth.ecms.exception.NotFoundException;
import vn.edu.uth.ecms.repository.RoomRepository;
import vn.edu.uth.ecms.service.RoomService;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;

    @Override
    @Transactional(readOnly = true)
    public Room findRoomForFixedSchedule(Long semesterId, List<LocalDate> dates, DayOfWeek dayOfWeek, TimeSlot timeSlot, int minCapacity) {
        List<Room> availableRooms = roomRepository.findRoomsAvailableForAllDates(semesterId, dates, timeSlot, minCapacity);
        if (availableRooms.isEmpty()) {
            throw new NotFoundException("Không tìm thấy phòng trống cho lịch cố định.");
        }
        return availableRooms.get(0);
    }

    @Override
    @Transactional(readOnly = true)
    public Room findRoomForSingleSession(Long semesterId, LocalDate date, DayOfWeek dayOfWeek, TimeSlot timeSlot, int minCapacity) {
        List<Room> availableRooms = roomRepository.findAvailableRoomsForSlot(semesterId, date, timeSlot, minCapacity);
        if (availableRooms.isEmpty()) {
            throw new NotFoundException("Không tìm thấy phòng trống cho ngày " + date);
        }
        return availableRooms.get(0);
    }

    @Override
    @Transactional(readOnly = true)
    public Room getOnlineRoom() {
        return roomRepository.findOnlineRoom()
                .orElseThrow(() -> new NotFoundException("Phòng ONLINE chưa được cấu hình."));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasRoomConflict(Long semesterId, Long roomId, LocalDate date, DayOfWeek dayOfWeek, TimeSlot timeSlot, Long excludeSessionId) {
        return roomRepository.existsRoomConflict(semesterId, roomId, date, timeSlot, excludeSessionId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Room> getAllPhysicalRooms() {
        return roomRepository.findAllPhysicalRooms();
    }

    @Override
    @Transactional(readOnly = true)
    public Room getRoomByCode(String roomCode) {
        return roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phòng: " + roomCode));
    }

    @Override
    @Transactional(readOnly = true)
    public Room getRoomById(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new NotFoundException("Phòng không tồn tại: " + roomId));
    }

    @Override
    @Transactional(readOnly = true)
    public Double getRoomUtilization(Long roomId, Long semesterId) {
        Long sessionsInRoom = roomRepository.countSessionsUsingRoom(roomId, semesterId);
        Long totalSessions = roomRepository.countTotalSessionsInSemester(semesterId);

        if (totalSessions == 0) return 0.0;

        // Tính tỷ lệ % sử dụng của phòng này so với tổng số tiết học trong học kỳ
        return (sessionsInRoom.doubleValue() / totalSessions.doubleValue()) * 100.0;
    }
}