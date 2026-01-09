import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import homeworkApi, { HomeworkResponse } from '../../../services/api/homeworkApi';
import './HomeworkDetail.css';

/**
 * HomeworkDetail Page
 * 
 * Shows complete homework information with:
 * - Homework info (title, type, deadline, etc.)
 * - Statistics (submitted, graded, average score)
 * - Submission list (students who submitted)
 * 
 * Note: Using HomeworkResponse for now, will add full detail API later
 */

interface SubmissionData {
  submissionId: number;
  studentId: number;
  studentName: string;
  studentCode: string;
  submissionDate: string;
  score?: number;
  teacherFeedback?: string;
  status: 'SUBMITTED' | 'GRADED' | 'LATE';
  submissionFileUrl?: string;
}

const HomeworkDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State
  const [homework, setHomework] = useState<HomeworkResponse | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUBMITTED' | 'GRADED' | 'LATE'>('ALL');
  
  // Load homework detail
  useEffect(() => {
    if (id) {
      loadHomeworkDetail();
    }
  }, [id]);
  
  const loadHomeworkDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await homeworkApi.getHomeworkById(Number(id));
      setHomework(data);
      
      // TODO: Load submissions from submission API when available
      // For now, showing empty state
      setSubmissions([]);
      
      console.log('[HomeworkDetail] ✅ Loaded:', data);
    } catch (err: any) {
      console.error('[HomeworkDetail] ❌ Failed:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin bài tập!');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!window.confirm('⚠️ Bạn có chắc muốn xóa bài tập này? Hành động này không thể hoàn tác!')) {
      return;
    }
    
    try {
      await homeworkApi.deleteHomework(Number(id));
      alert('✅ Xóa bài tập thành công!');
      navigate('/teacher/assignments');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa bài tập này!');
    }
  };
  
  const getDeadlineStatus = () => {
    if (!homework) return null;
    
    const now = new Date();
    const deadline = new Date(homework.deadline);
    const diff = deadline.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diff < 0) {
      return {
        icon: '🔴',
        text: `Đã quá hạn ${Math.abs(days)} ngày`,
        color: '#ef4444',
        status: 'OVERDUE'
      };
    } else if (days === 0) {
      return {
        icon: '⚡',
        text: 'Hôm nay',
        color: '#f59e0b',
        status: 'TODAY'
      };
    } else if (days <= 3) {
      return {
        icon: '⚠️',
        text: `Còn ${days} ngày`,
        color: '#f59e0b',
        status: 'URGENT'
      };
    } else {
      return {
        icon: '🟢',
        text: `Còn ${days} ngày`,
        color: '#10b981',
        status: 'OPEN'
      };
    }
  };
  
  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'REGULAR': return 'Thường xuyên';
      case 'MIDTERM': return 'Giữa kỳ';
      case 'FINAL': return 'Cuối kỳ';
      default: return type;
    }
  };
  
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'REGULAR': return '#3b82f6';
      case 'MIDTERM': return '#f59e0b';
      case 'FINAL': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const filteredSubmissions = submissions.filter(sub => {
    // Filter by status
    if (filterStatus !== 'ALL' && sub.status !== filterStatus) {
      return false;
    }
    
    // Filter by search keyword
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      return (
        sub.studentName?.toLowerCase().includes(keyword) ||
        sub.studentCode?.toLowerCase().includes(keyword)
      );
    }
    
    return true;
  });
  
  if (loading) {
    return (
      <div className="homework-detail-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="homework-detail-container">
        <div className="error-state">
          <span className="error-icon">❌</span>
          <h3>Lỗi</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/teacher/assignments')} className="btn-secondary">
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }
  
  if (!homework) {
    return (
      <div className="homework-detail-container">
        <div className="error-state">
          <span className="error-icon">📭</span>
          <h3>Không tìm thấy bài tập</h3>
          <p>Bài tập không tồn tại hoặc đã bị xóa.</p>
          <button onClick={() => navigate('/teacher/assignments')} className="btn-secondary">
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }
  
  const deadlineStatus = getDeadlineStatus();
  const submittedCount = submissions.length;
  const totalStudents = 40; // TODO: Get from class info when available
  const submissionRate = totalStudents > 0 ? (submittedCount / totalStudents * 100).toFixed(1) : 0;
  
  const gradedSubmissions = submissions.filter(s => s.status === 'GRADED');
  const gradedCount = gradedSubmissions.length;
  const gradedRate = submittedCount > 0 ? (gradedCount / submittedCount * 100).toFixed(1) : 0;
  
  const averageScore = gradedSubmissions.length > 0
    ? (gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length).toFixed(2)
    : '--';
  
  const maxScore = gradedSubmissions.length > 0
    ? Math.max(...gradedSubmissions.map(s => s.score || 0)).toFixed(2)
    : '--';
  
  const minScore = gradedSubmissions.length > 0
    ? Math.min(...gradedSubmissions.map(s => s.score || 0)).toFixed(2)
    : '--';
  
  return (
    <div className="homework-detail-container">
      {/* Header */}
      <div className="page-header">
        <button onClick={() => navigate('/teacher/assignments')} className="btn-back">
          ← Quay lại
        </button>
        <div className="header-actions">
          <button
            onClick={() => navigate(`/teacher/assignments/edit/${homework.homeworkId}`)}
            className="btn-edit"
          >
            ✏️ Sửa
          </button>
          <button onClick={handleDelete} className="btn-delete">
            🗑️ Xóa
          </button>
        </div>
      </div>
      
      {/* Title */}
      <div className="homework-title">
        <h1>📝 {homework.title}</h1>
        <p>
          Lớp: {homework.classCode} - {homework.subjectName}
        </p>
      </div>
      
      {/* Info Section */}
      <div className="info-section">
        <h2>📋 Thông tin</h2>
        
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Loại:</span>
            <span
              className="info-value"
              style={{
                color: getTypeColor(homework.homeworkType),
                fontWeight: '600'
              }}
            >
              {getTypeLabel(homework.homeworkType)}
            </span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Deadline:</span>
            <span className="info-value">
              {formatDateTime(homework.deadline)}
            </span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Trạng thái:</span>
            <span className="info-value" style={{ color: deadlineStatus?.color }}>
              {deadlineStatus?.icon} {deadlineStatus?.text}
            </span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Điểm tối đa:</span>
            <span className="info-value">{homework.maxScore}</span>
          </div>
          
          {homework.attachmentUrl && (
            <div className="info-item full-width">
              <span className="info-label">File đính kèm:</span>
              <a
                href={homework.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="attachment-link"
              >
                📎 Tải xuống
              </a>
            </div>
          )}
        </div>
        
        {homework.description && (
          <div className="description-section">
            <h3>📄 Mô tả</h3>
            <p className="description-text">{homework.description}</p>
          </div>
        )}
      </div>
      
      {/* Statistics Section */}
      <div className="stats-section">
        <h2>📊 Thống kê</h2>
        
        <div className="stats-grid">
          <div className="stat-card" style={{ borderLeftColor: '#3b82f6' }}>
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <div className="stat-label">Đã nộp</div>
              <div className="stat-value">
                {submittedCount}/{totalStudents}
              </div>
              <div className="stat-subtext">({submissionRate}%)</div>
            </div>
          </div>
          
          <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-label">Chờ chấm</div>
              <div className="stat-value">
                {submittedCount - gradedCount}/{submittedCount}
              </div>
              <div className="stat-subtext">
                ({submittedCount > 0 ? (100 - Number(gradedRate)).toFixed(1) : 0}%)
              </div>
            </div>
          </div>
          
          <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-label">Đã chấm</div>
              <div className="stat-value">
                {gradedCount}/{submittedCount}
              </div>
              <div className="stat-subtext">({gradedRate}%)</div>
            </div>
          </div>
        </div>
        
        {gradedSubmissions.length > 0 && (
          <div className="score-stats">
            <h3>Phân tích điểm</h3>
            <div className="score-grid">
              <div className="score-item">
                <span className="score-label">Điểm trung bình:</span>
                <span className="score-value">{averageScore} / {homework.maxScore}</span>
              </div>
              <div className="score-item">
                <span className="score-label">Điểm cao nhất:</span>
                <span className="score-value">{maxScore}</span>
              </div>
              <div className="score-item">
                <span className="score-label">Điểm thấp nhất:</span>
                <span className="score-value">{minScore}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Submissions Section */}
      <div className="submissions-section">
        <h2>📥 Danh sách bài nộp ({submittedCount})</h2>
        
        <div className="submissions-filters">
          <input
            type="text"
            placeholder="🔍 Tìm sinh viên..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="search-input"
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="filter-select"
          >
            <option value="ALL">Tất cả</option>
            <option value="SUBMITTED">Đã nộp</option>
            <option value="GRADED">Đã chấm</option>
            <option value="LATE">Nộp muộn</option>
          </select>
        </div>
        
        {filteredSubmissions.length === 0 ? (
          <div className="empty-submissions">
            <span className="empty-icon">📭</span>
            <h3>Chưa có bài nộp nào</h3>
            <p>
              {searchKeyword.trim()
                ? 'Không tìm thấy sinh viên phù hợp'
                : 'Sinh viên chưa nộp bài tập này'}
            </p>
          </div>
        ) : (
          <div className="submissions-list">
            {filteredSubmissions.map((submission) => (
              <div key={submission.submissionId} className="submission-card">
                <div className="submission-header">
                  <div className="student-info">
                    <span className="student-icon">👤</span>
                    <div>
                      <div className="student-name">{submission.studentName}</div>
                      <div className="student-code">{submission.studentCode}</div>
                    </div>
                  </div>
                  
                  <div className="submission-status">
                    {submission.status === 'GRADED' && (
                      <span className="status-badge graded">✅ Đã chấm</span>
                    )}
                    {submission.status === 'SUBMITTED' && (
                      <span className="status-badge submitted">📝 Đã nộp</span>
                    )}
                    {submission.status === 'LATE' && (
                      <span className="status-badge late">⚠️ Nộp muộn</span>
                    )}
                  </div>
                </div>
                
                <div className="submission-info">
                  <div className="info-row">
                    <span className="info-label">Ngày nộp:</span>
                    <span className="info-value">
                      {formatDateTime(submission.submissionDate)}
                    </span>
                  </div>
                  
                  {submission.score !== null && submission.score !== undefined && (
                    <div className="info-row">
                      <span className="info-label">Điểm:</span>
                      <span className="info-value score">
                        {submission.score} / {homework.maxScore}
                      </span>
                    </div>
                  )}
                  
                  {submission.teacherFeedback && (
                    <div className="info-row full-width">
                      <span className="info-label">Nhận xét:</span>
                      <span className="info-value">{submission.teacherFeedback}</span>
                    </div>
                  )}
                </div>
                
                <div className="submission-actions">
                  <button className="btn-view">👁️ Xem</button>
                  {submission.status !== 'GRADED' ? (
                    <button className="btn-grade">✏️ Chấm điểm</button>
                  ) : (
                    <button className="btn-regrade">🔄 Chấm lại</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkDetail;