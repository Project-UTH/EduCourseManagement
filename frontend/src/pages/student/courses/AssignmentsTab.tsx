import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentHomeworkApi from '../../../services/api/studentHomeworkApi';
// Đảm bảo import CSS tổng
import './ClassDetail.css';

interface Homework {
  homeworkId: number;
  title: string;
  description?: string;
  homeworkType: 'REGULAR' | 'MIDTERM' | 'FINAL';
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
      const data = await studentHomeworkApi.getClassHomeworks(classId);
      setHomeworks(data);
    } catch (err) {
      console.error('[AssignmentsTab] Failed to load homeworks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHomeworks = homeworks.filter(hw => {
    if (filter === 'pending') return !hw.hasSubmitted;
    if (filter === 'submitted') return hw.hasSubmitted;
    return true;
  });

  // Helper: Badge loại bài tập (Sử dụng class .type-badge của CSS mới)
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'REGULAR': return <span className="type-badge regular">Thường xuyên</span>;
      case 'MIDTERM': return <span className="type-badge midterm">Giữa kỳ</span>;
      case 'FINAL':   return <span className="type-badge final">Cuối kỳ</span>;
      default:        return <span className="type-badge regular">Khác</span>;
    }
  };

  // Helper: Badge trạng thái (Sử dụng class .badge của CSS mới)
  const getStatusBadge = (hw: Homework, isReallyOverdue: boolean) => {
    if (hw.hasSubmitted) return <span className="badge submitted" style={{background: '#dcfce7', color: '#166534'}}>✓ Đã nộp</span>;
    if (isReallyOverdue) return <span className="badge overdue" style={{background: '#fee2e2', color: '#991b1b'}}>⚠️ Quá hạn</span>;
    return <span className="badge pending" style={{background: '#fef9c3', color: '#854d0e'}}>⏳ Chưa nộp</span>;
  };

  // Helper: Tính thời gian còn lại
  const getTimeLeft = (deadline: string) => {
    const now = new Date();
    const due = new Date(deadline);
    const diff = due.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return { text: 'Đã quá hạn', isLate: true };
    if (days === 0) return { text: 'Hôm nay', isLate: false };
    if (days === 1) return { text: 'Ngày mai', isLate: false };
    return { text: `Còn ${days} ngày`, isLate: false };
  };

  if (loading) {
    return (
      <div className="assignments-tab">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải danh sách bài tập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="assignments-tab">
      {/* 1. Bộ lọc (Tab Filters) */}
      <div className="tab-filters" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: filter === 'all' ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
            background: filter === 'all' ? '#0ea5e9' : 'white',
            color: filter === 'all' ? 'white' : '#64748b',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Tất cả ({homeworks.length})
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: filter === 'pending' ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
            background: filter === 'pending' ? '#0ea5e9' : 'white',
            color: filter === 'pending' ? 'white' : '#64748b',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Chưa nộp ({homeworks.filter(hw => !hw.hasSubmitted).length})
        </button>
        <button
          className={`filter-btn ${filter === 'submitted' ? 'active' : ''}`}
          onClick={() => setFilter('submitted')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: filter === 'submitted' ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
            background: filter === 'submitted' ? '#0ea5e9' : 'white',
            color: filter === 'submitted' ? 'white' : '#64748b',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Đã nộp ({homeworks.filter(hw => hw.hasSubmitted).length})
        </button>
      </div>

      {/* 2. Danh sách bài tập */}
      {filteredHomeworks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>Không có bài tập nào</h3>
          <p>
            {filter === 'all' ? 'Giảng viên chưa giao bài tập nào.' : 
             filter === 'pending' ? 'Bạn đã hoàn thành hết bài tập!' : 
             'Bạn chưa nộp bài tập nào.'}
          </p>
        </div>
      ) : (
        <div className="homeworks-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredHomeworks.map(homework => {
            const timeStatus = getTimeLeft(homework.deadline);
            // Logic quá hạn thực tế
            const isReallyOverdue = homework.isOverdue || (timeStatus.isLate && !homework.hasSubmitted);

            return (
              <div
                key={homework.homeworkId}
                className={`homework-card ${isReallyOverdue ? 'overdue' : ''} ${homework.hasSubmitted ? 'submitted' : ''}`}
                onClick={() => navigate(`/student/homeworks/${homework.homeworkId}`)}
                // Style inline để hỗ trợ thêm cho ClassDetail.css
                style={{
                  borderLeft: isReallyOverdue ? '4px solid #ef4444' : homework.hasSubmitted ? '4px solid #10b981' : '1px solid #e2e8f0'
                }}
              >
                <div className="homework-header">
                  <div className="homework-icon">
                    {homework.hasSubmitted ? '✓' : '📄'}
                  </div>
                  <div className="homework-title-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3>{homework.title}</h3>
                      <div className="homework-badges" style={{ display: 'flex', gap: '0.5rem' }}>
                        {getTypeBadge(homework.homeworkType)}
                        {getStatusBadge(homework, isReallyOverdue)}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="homework-description">
                  {homework.description ? 
                    (homework.description.length > 150 ? homework.description.substring(0, 150) + '...' : homework.description) 
                    : 'Không có mô tả chi tiết'}
                </p>

                <div className="homework-footer">
                  <div className="homework-deadline">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Hạn nộp: {new Date(homework.deadline).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day:'numeric', month:'numeric', year:'numeric' })}</span>
                  </div>

                  <div 
                    className="time-left"
                    style={{ 
                      color: isReallyOverdue ? '#ef4444' : '#0ea5e9',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                  >
                    {timeStatus.text}
                  </div>
                </div>

                {homework.hasSubmitted && (
                  <div className="submission-info" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748b' }}>Đã nộp: {homework.submittedAt ? new Date(homework.submittedAt).toLocaleString('vi-VN') : 'N/A'}</span>
                    {homework.grade !== undefined && homework.grade !== null ? (
                      <span className="grade" style={{ color: '#10b981', fontWeight: 'bold' }}>Điểm: {homework.grade}/10</span>
                    ) : (
                      <span className="grade" style={{ color: '#94a3b8', fontStyle: 'italic' }}>Đang chấm điểm...</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AssignmentsTab;