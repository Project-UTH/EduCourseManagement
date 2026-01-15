import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentHomeworkApi from '../../../services/api/studentHomeworkApi';

/**
 * AssignmentsTab - Tab bài tập trong ClassDetail
 * 
 * Hiển thị danh sách bài tập của lớp
 * Click vào bài tập → Chi tiết bài tập
 * ✅ NEW: Hiển thị loại bài tập (THƯỜNG XUYÊN / GIỮA KỲ / CUỐI KỲ)
 */

interface Homework {
  homeworkId: number;
  title: string;
  description?: string;
  homeworkType: 'REGULAR' | 'MIDTERM' | 'FINAL'; // ✅ NEW
  deadline: string;
  hasSubmitted: boolean;
  isOverdue: boolean;
  submittedAt?: string;
  grade?: number;
}

interface AssignmentsTabProps {
  classId: number;
}

const AssignmentsTab = ({ classId }: AssignmentsTabProps) => {
  const navigate = useNavigate();
  
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeworks();
  }, [classId]);

  const loadHomeworks = async () => {
    setLoading(true);
    
    try {
      console.log('[AssignmentsTab] Loading homeworks for class:', classId);
      
      const data = await studentHomeworkApi.getClassHomeworks(classId);
      setHomeworks(data);
      
      console.log('[AssignmentsTab] ✅ Loaded', data.length, 'homeworks');
      
    } catch (err) {
      console.error('[AssignmentsTab] ❌ Failed to load homeworks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHomeworks = homeworks.filter(hw => {
    if (filter === 'pending') return !hw.hasSubmitted;
    if (filter === 'submitted') return hw.hasSubmitted;
    return true;
  });

  // ✅ NEW: Get homework type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'REGULAR':
        return <span className="badge type-regular">THƯỜNG XUYÊN</span>;
      case 'MIDTERM':
        return <span className="badge type-midterm">GIỮA KỲ</span>;
      case 'FINAL':
        return <span className="badge type-final">CUỐI KỲ</span>;
      default:
        return null;
    }
  };

  const getStatusBadge = (hw: Homework) => {
    if (hw.hasSubmitted) {
      return <span className="badge submitted">✓ Đã nộp</span>;
    }
    if (hw.isOverdue) {
      return <span className="badge overdue">⚠️ Quá hạn</span>;
    }
    return <span className="badge pending">⏳ Chưa nộp</span>;
  };

  const getTimeLeft = (deadline: string) => {
    const now = new Date();
    const due = new Date(deadline);
    const diff = due.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'Đã quá hạn';
    if (days === 0) return 'Hôm nay';
    if (days === 1) return 'Ngày mai';
    return `Còn ${days} ngày`;
  };

  if (loading) {
    return (
      <div className="tab-loading">
        <div className="spinner"></div>
        <p>Đang tải bài tập...</p>
      </div>
    );
  }

  return (
    <div className="assignments-tab">
      {/* Filters */}
      <div className="tab-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất cả ({homeworks.length})
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Chưa nộp ({homeworks.filter(hw => !hw.hasSubmitted).length})
        </button>
        <button
          className={`filter-btn ${filter === 'submitted' ? 'active' : ''}`}
          onClick={() => setFilter('submitted')}
        >
          Đã nộp ({homeworks.filter(hw => hw.hasSubmitted).length})
        </button>
      </div>

      {/* Homeworks List */}
      {filteredHomeworks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>Chưa có bài tập nào</h3>
          <p>
            {filter === 'all' && 'Giảng viên chưa giao bài tập cho lớp này'}
            {filter === 'pending' && 'Bạn đã hoàn thành tất cả bài tập'}
            {filter === 'submitted' && 'Bạn chưa nộp bài tập nào'}
          </p>
        </div>
      ) : (
        <div className="homeworks-list">
          {filteredHomeworks.map(homework => (
            <div
              key={homework.homeworkId}
              className={`homework-card ${homework.isOverdue ? 'overdue' : ''} ${homework.hasSubmitted ? 'submitted' : ''}`}
              onClick={() => navigate(`/student/homeworks/${homework.homeworkId}`)}
            >
              <div className="homework-header">
                <div className="homework-icon">
                  {homework.hasSubmitted ? '✓' : '📄'}
                </div>
                <div className="homework-title-section">
                  <h3>{homework.title}</h3>
                  <div className="homework-badges">
                    {getTypeBadge(homework.homeworkType)}
                    {getStatusBadge(homework)}
                  </div>
                </div>
              </div>

              <p className="homework-description">
                {homework.description || 'Không có mô tả'}
              </p>

              <div className="homework-footer">
                <div className="homework-deadline">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Hạn nộp: {new Date(homework.deadline).toLocaleString('vi-VN')}</span>
                </div>

                <div className={`time-left ${homework.isOverdue ? 'overdue' : ''}`}>
                  {getTimeLeft(homework.deadline)}
                </div>
              </div>

              {homework.hasSubmitted && (
                <div className="submission-info">
                  <span>Đã nộp: {homework.submittedAt ? new Date(homework.submittedAt).toLocaleString('vi-VN') : 'N/A'}</span>
                  {homework.grade !== undefined && homework.grade !== null && (
                    <span className="grade">Điểm: {homework.grade}/10</span>
                  )}
                </div>
              )}

              <div className="homework-actions">
                <button className="btn-view">
                  Xem chi tiết →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentsTab;