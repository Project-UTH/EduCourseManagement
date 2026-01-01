import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import roomApi, { RoomResponse, RoomScheduleResponse } from '../../../services/api/roomApi';
import './RoomDetail.css';

const RoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [schedule, setSchedule] = useState<RoomScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  
  const SEMESTER_ID = 1; // TODO: Get from context

  useEffect(() => {
    if (id) {
      fetchRoomDetail();
      fetchSchedule();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRoomDetail = async () => {
    try {
      setLoading(true);
      const data = await roomApi.getRoomById(Number(id), SEMESTER_ID);
      setRoom(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error fetching room:', error);
      alert(error.message || 'Lỗi khi tải thông tin phòng');
      navigate('/admin/rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      setScheduleLoading(true);
      const data = await roomApi.getRoomSchedule(Number(id), SEMESTER_ID);
      setSchedule(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error fetching schedule:', error);
      // Don't alert, just log - schedule might be empty
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/rooms');
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'Đã lên lịch';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  if (loading || !room) {
    return (
      <div className="room-detail-loading">
        <div className="loading-spinner"></div>
        <span>Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="room-detail-page">
      {/* HEADER */}
      <div className="detail-header">
        <button className="back-button" onClick={handleBack}>
          ← Quay lại
        </button>
        <h1 className="detail-title">
          Chi tiết phòng: {room.roomCode}
        </h1>
      </div>

      {/* ROOM INFO */}
      <div className="info-section">
        <h2 className="section-title">📋 Thông tin phòng</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Mã phòng:</span>
            <span className="info-value">{room.roomCode}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Tên phòng:</span>
            <span className="info-value">{room.roomName || '—'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Vị trí:</span>
            <span className="info-value">{room.fullLocation}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Loại phòng:</span>
            <span className="info-value">{room.roomTypeDisplay}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Sức chứa:</span>
            <span className="info-value">{room.capacityInfo}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Trạng thái:</span>
            <span className={`status-badge ${room.isActive ? 'active' : 'inactive'}`}>
              {room.adminStatusDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* REAL-TIME STATUS */}
      <div className="status-section">
        <h2 className="section-title">⭐ Trạng thái hiện tại</h2>
        <div className="status-card">
          <div className="status-main">
            <span className={`current-status status-${room.currentStatus.toLowerCase()}`}>
              {room.currentStatusDisplay}
            </span>
          </div>
          {room.currentSession && (
            <div className="current-session-detail">
              <h3>Đang sử dụng:</h3>
              <p><strong>Lớp:</strong> {room.currentSession.classCode}</p>
              <p><strong>Môn:</strong> {room.currentSession.subjectName}</p>
              <p><strong>Giảng viên:</strong> {room.currentSession.teacherName}</p>
              <p><strong>Thời gian:</strong> {room.currentSession.timeSlotDisplay}</p>
              <p><strong>Còn lại:</strong> {room.currentSession.minutesRemaining} phút</p>
            </div>
          )}
        </div>
      </div>

      {/* STATISTICS */}
      <div className="stats-section">
        <h2 className="section-title">📊 Thống kê sử dụng</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{room.totalSessionsInSemester}</div>
              <div className="stat-label">Tổng buổi học</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{room.completedSessions}</div>
              <div className="stat-label">Đã hoàn thành</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <div className="stat-value">{room.upcomingSessions}</div>
              <div className="stat-label">Sắp tới</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-value">{room.utilizationPercentage.toFixed(1)}%</div>
              <div className="stat-label">Tỷ lệ sử dụng</div>
            </div>
          </div>
        </div>
      </div>

      {/* SCHEDULE */}
      <div className="schedule-section">
        <h2 className="section-title">📅 Lịch học trong học kỳ</h2>
        {scheduleLoading ? (
          <div className="schedule-loading">Đang tải lịch...</div>
        ) : schedule.length === 0 ? (
          <div className="no-schedule">Không có lịch học</div>
        ) : (
          <div className="schedule-table-wrapper">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Buổi</th>
                  <th>Ngày</th>
                  <th>Thứ</th>
                  <th>Ca học</th>
                  <th>Lớp</th>
                  <th>Môn học</th>
                  <th>Giảng viên</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((session, index) => (
                  <tr key={session.sessionId}>
                    <td>{index + 1}</td>
                    <td>{session.sessionDate}</td>
                    <td>{session.dayOfWeekDisplay}</td>
                    <td>{session.timeSlotDisplay}</td>
                    <td><strong>{session.classCode}</strong></td>
                    <td>{session.subjectName}</td>
                    <td>{session.teacherName}</td>
                    <td>
                      <span className={`session-status ${session.status.toLowerCase()}`}>
                        {getStatusDisplay(session.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomDetail;