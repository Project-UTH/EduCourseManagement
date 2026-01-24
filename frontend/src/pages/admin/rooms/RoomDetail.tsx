import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import roomApi, { RoomResponse, RoomScheduleResponse } from '../../../services/api/roomApi';
import './RoomDetail.css'; // File CSS độc lập đã chỉnh sửa

const RoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [schedule, setSchedule] = useState<RoomScheduleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  
  const SEMESTER_ID = 1; // TODO: Lấy từ Context hoặc Config

  useEffect(() => {
    if (id) {
      fetchRoomDetail();
      fetchSchedule(); // Có thể uncomment nếu muốn load lịch luôn
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
      // Xử lý lỗi nhẹ nhàng hơn, có thể dùng Toast
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
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/rooms');
  };

  const getStatusDisplay = (status: string) => {
    const map: Record<string, string> = {
      'SCHEDULED': 'Đã lên lịch',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy',
      'IN_PROGRESS': 'Đang diễn ra'
    };
    return map[status] || status;
  };

  if (loading || !room) {
    return (
      <div className="room-detail-page">
        <div className="room-detail-loading">
          <div className="loading-spinner"></div>
          <span>Đang tải dữ liệu phòng...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="room-detail-page">
      {/* HEADER */}
      <div className="detail-header">
        <button className="back-button" onClick={handleBack}>
          <span>←</span> Quay lại danh sách
        </button>
        <h1 className="detail-title">
          Chi tiết phòng: {room.roomCode}
        </h1>
      </div>

      {/* ROOM INFO */}
      <div className="info-section">
        <h2 className="section-title">📋 Thông tin chung</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Mã phòng</span>
            <span className="info-value">{room.roomCode}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Tên phòng</span>
            <span className="info-value">{room.roomName || '—'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Vị trí</span>
            <span className="info-value">{room.fullLocation}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Loại phòng</span>
            <span className="info-value">{room.roomTypeDisplay}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Sức chứa</span>
            <span className="info-value">{room.capacityInfo}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Trạng thái</span>
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
              <h3>Đang sử dụng</h3>
              <p><strong>Lớp:</strong> <span>{room.currentSession.classCode}</span></p>
              <p><strong>Môn:</strong> <span>{room.currentSession.subjectName}</span></p>
              <p><strong>Giảng viên:</strong> <span>{room.currentSession.teacherName}</span></p>
              <p><strong>Ca học:</strong> <span>{room.currentSession.timeSlotDisplay}</span></p>
            </div>
          )}
        </div>
      </div>

      {/* STATISTICS */}
      <div className="stats-section">
        <h2 className="section-title">📊 Thống kê kỳ này</h2>
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
              <div className="stat-value">{room.utilizationPercentage?.toFixed(1) || 0}%</div>
              <div className="stat-label">Tỷ lệ sử dụng</div>
            </div>
          </div>
        </div>
      </div>

      {/* SCHEDULE SECTION (Uncommented for structure check) */}
      {/* <div className="schedule-section">
        <h2 className="section-title">📅 Lịch sử dụng chi tiết</h2>
        {scheduleLoading ? (
          <div className="schedule-loading">Đang tải lịch...</div>
        ) : schedule.length === 0 ? (
          <div className="no-schedule">Không có lịch sử dụng trong kỳ này</div>
        ) : (
          <div className="schedule-table-wrapper">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Ngày</th>
                  <th>Thứ</th>
                  <th>Ca học</th>
                  <th>Lớp - Môn học</th>
                  <th>Giảng viên</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((session, index) => (
                  <tr key={session.sessionId || index}>
                    <td>{index + 1}</td>
                    <td>{session.sessionDate}</td>
                    <td>{session.dayOfWeekDisplay}</td>
                    <td>{session.timeSlotDisplay}</td>
                    <td>
                      <div><strong>{session.classCode}</strong></div>
                      <div style={{fontSize: '12px', color: '#6b7280'}}>{session.subjectName}</div>
                    </td>
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
      */}
    </div>
  );
};

export default RoomDetail;