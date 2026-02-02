import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import roomApi, { RoomResponse} from '../../../services/api/roomApi';
import './RoomDetail.css'; // Standalone CSS file

const RoomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  const SEMESTER_ID = 1; // Get from Context or Config

  useEffect(() => {
    if (id) {
      fetchRoomDetail(); // Uncomment to load schedule immediately
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
      console.error(' Error fetching room:', error);
      // Handle error gracefully
      navigate('/admin/rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/rooms');
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
        <h2 className="section-title"> Thông tin chung</h2>
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
        <h2 className="section-title"> Trạng thái hiện tại</h2>
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
        <h2 className="section-title"> Thống kê kỳ này</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-value">{room.totalSessionsInSemester}</div>
              <div className="stat-label">Tổng buổi học</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-value">{room.completedSessions}</div>
              <div className="stat-label">Đã hoàn thành</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-value">{room.upcomingSessions}</div>
              <div className="stat-label">Sắp tới</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-value">{room.utilizationPercentage?.toFixed(1) || 0}%</div>
              <div className="stat-label">Tỷ lệ sử dụng</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;