import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import homeworkApi, { HomeworkResponse } from '../../../services/api/homeworkApi';
import './HomeworkDetail.css';
import ChatList from '../../../components/chat/ChatList';
import { useAuthStore } from '@/store/authStore';

/**
 * HomeworkDetail Page - Namespaced (thd-)
 * * Features:
 * - Detailed homework info
 * - Submission statistics
 * - Filterable student list
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
      
      // TODO: Load submissions from API
      // For demo, keeping empty or you can mock data here
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
      return { icon: '🔴', text: `Quá hạn ${Math.abs(days)} ngày`, color: '#ef4444' };
    } else if (days === 0) {
      return { icon: '⚡', text: 'Hạn hôm nay', color: '#f59e0b' };
    } else if (days <= 3) {
      return { icon: '⚠️', text: `Còn ${days} ngày`, color: '#f59e0b' };
    } else {
      return { icon: '🟢', text: `Còn ${days} ngày`, color: '#10b981' };
    }
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'REGULAR': return 'Thường xuyên';
      case 'MIDTERM': return 'Giữa kỳ';
      case 'FINAL': return 'Cuối kỳ';
      default: return type;
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'REGULAR': return '#3b82f6';
      case 'MIDTERM': return '#f59e0b';
      case 'FINAL': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };
  
  const filteredSubmissions = submissions.filter(sub => {
    if (filterStatus !== 'ALL' && sub.status !== filterStatus) return false;
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      return (
        sub.studentName?.toLowerCase().includes(keyword) ||
        sub.studentCode?.toLowerCase().includes(keyword)
      );
    }
    return true;
  });
  const user = useAuthStore((state: any) => state.user);

  
  if (loading) {
    return (
      <div className="thd-container">
        <div className="thd-loading">
          <div className="thd-spinner"></div>
          <p>Đang tải thông tin bài tập...</p>
        </div>
      </div>
    );
  }

  
  if (error || !homework) {
    return (
      <div className="thd-container">
        <div className="thd-error">
          <span className="thd-error-icon">❌</span>
          <h3>Lỗi</h3>
          <p>{error || 'Không tìm thấy bài tập'}</p>
          <button onClick={() => navigate('/teacher/assignments')} className="thd-btn-back">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }
  
  const deadlineStatus = getDeadlineStatus();
  const submittedCount = submissions.length;
  const totalStudents = 40; // Mock total
  const submissionRate = totalStudents > 0 ? (submittedCount / totalStudents * 100).toFixed(1) : 0;
  
  const gradedSubmissions = submissions.filter(s => s.status === 'GRADED');
  const gradedCount = gradedSubmissions.length;
  const gradedRate = submittedCount > 0 ? (gradedCount / submittedCount * 100).toFixed(1) : 0;
  
  const averageScore = gradedSubmissions.length > 0
    ? (gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length).toFixed(2)
    : '--';
  
  const maxScore = gradedSubmissions.length > 0 ? Math.max(...gradedSubmissions.map(s => s.score || 0)).toFixed(2) : '--';
  const minScore = gradedSubmissions.length > 0 ? Math.min(...gradedSubmissions.map(s => s.score || 0)).toFixed(2) : '--';
  
  return (
    <div className="thd-container">
      {/* Header */}
      <div className="thd-header">
        <button onClick={() => navigate('/teacher/assignments')} className="thd-btn-back">
          ← Quay lại
        </button>
        <div className="thd-header-actions">
          <button
            onClick={() => navigate(`/teacher/assignments/edit/${homework.homeworkId}`)}
            className="thd-btn-edit"
          >
            ✏️ Sửa
          </button>
          <button onClick={handleDelete} className="thd-btn-delete">
            🗑️ Xóa
          </button>
        </div>
      </div>
      
      {/* Title Section */}
      <div className="thd-title-section">
        <h1>{homework.title}</h1>
        <p className="thd-subtitle">
          <span>📚 {homework.subjectName}</span>
          <span>•</span>
          <span>🏫 Lớp {homework.classCode}</span>
        </p>
      </div>
      
      {/* Info Section */}
      <div className="thd-section">
        <h2>📋 Thông tin chi tiết</h2>
        
        <div className="thd-info-grid">
          <div className="thd-info-item">
            <span className="thd-label">Loại bài tập</span>
            <span className="thd-value" style={{ color: getTypeColor(homework.homeworkType) }}>
              {getTypeLabel(homework.homeworkType)}
            </span>
          </div>
          
          <div className="thd-info-item">
            <span className="thd-label">Hạn nộp</span>
            <span className="thd-value">{formatDateTime(homework.deadline)}</span>
          </div>
          
          <div className="thd-info-item">
            <span className="thd-label">Trạng thái</span>
            <span className="thd-value" style={{ color: deadlineStatus?.color }}>
              {deadlineStatus?.icon} {deadlineStatus?.text}
            </span>
          </div>
          
          <div className="thd-info-item">
            <span className="thd-label">Điểm tối đa</span>
            <span className="thd-value">{homework.maxScore} điểm</span>
          </div>
          
          {homework.attachmentUrl && (
            <div className="thd-info-item full-width">
              <span className="thd-label">File đính kèm</span>
              <a
                href={homework.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="thd-attachment-link"
              >
                📎 Tải xuống tài liệu
              </a>
            </div>
          )}
        </div>
        
        {homework.description && (
          <div className="thd-description-box">
            <div className="thd-desc-title">📄 Nội dung yêu cầu</div>
            <p className="thd-desc-text">{homework.description}</p>
          </div>
        )}
      </div>
      
      {/* Stats Section */}
      <div className="thd-section">
        <h2>📊 Thống kê nộp bài</h2>
        
        <div className="thd-stats-grid">
          <div className="thd-stat-card" style={{ borderLeftColor: '#3b82f6' }}>
            <div className="thd-stat-icon">📝</div>
            <div className="thd-stat-content">
              <span className="thd-stat-label">Đã nộp</span>
              <span className="thd-stat-value">{submittedCount}/{totalStudents}</span>
              <span className="thd-stat-subtext">Tỷ lệ: {submissionRate}%</span>
            </div>
          </div>
          
          <div className="thd-stat-card" style={{ borderLeftColor: '#f59e0b' }}>
            <div className="thd-stat-icon">⏳</div>
            <div className="thd-stat-content">
              <span className="thd-stat-label">Chờ chấm</span>
              <span className="thd-stat-value">{submittedCount - gradedCount}</span>
              <span className="thd-stat-subtext">Cần xử lý</span>
            </div>
          </div>
          
          <div className="thd-stat-card" style={{ borderLeftColor: '#10b981' }}>
            <div className="thd-stat-icon">✅</div>
            <div className="thd-stat-content">
              <span className="thd-stat-label">Đã chấm</span>
              <span className="thd-stat-value">{gradedCount}</span>
              <span className="thd-stat-subtext">Hoàn thành: {gradedRate}%</span>
            </div>
          </div>
        </div>
        
        {gradedSubmissions.length > 0 && (
          <div className="thd-score-stats">
            <h3>Phân tích điểm số</h3>
            <div className="thd-score-grid">
              <div className="thd-score-item">
                <span className="thd-score-label">Trung bình</span>
                <span className="thd-score-value">{averageScore}</span>
              </div>
              <div className="thd-score-item">
                <span className="thd-score-label">Cao nhất</span>
                <span className="thd-score-value" style={{ color: '#10b981' }}>{maxScore}</span>
              </div>
              <div className="thd-score-item">
                <span className="thd-score-label">Thấp nhất</span>
                <span className="thd-score-value" style={{ color: '#ef4444' }}>{minScore}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Submissions List Section */}
      <div className="thd-section">
        <h2>📥 Danh sách sinh viên ({submittedCount})</h2>
        
        <div className="thd-filters">
          <input
            type="text"
            placeholder="🔍 Tìm theo tên hoặc mã sinh viên..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="thd-search-input"
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="thd-filter-select"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUBMITTED">Đã nộp (Chưa chấm)</option>
            <option value="GRADED">Đã chấm điểm</option>
            <option value="LATE">Nộp muộn</option>
          </select>
        </div>
        
        {filteredSubmissions.length === 0 ? (
          <div className="thd-empty">
            <span style={{ fontSize: '40px', display: 'block', marginBottom: '16px' }}>📭</span>
            <p>
              {searchKeyword.trim() 
                ? 'Không tìm thấy sinh viên nào phù hợp' 
                : 'Chưa có sinh viên nào nộp bài cho bài tập này'}
            </p>
          </div>
        ) : (
          <div className="thd-sub-list">
            {filteredSubmissions.map((submission) => (
              <div key={submission.submissionId} className="thd-sub-card">
                <div className="thd-sub-info-group">
                  <div className="thd-student-icon">👤</div>
                  <div className="thd-student-details">
                    <div className="thd-student-name">{submission.studentName}</div>
                    <div className="thd-student-code">{submission.studentCode}</div>
                  </div>
                  
                  <div className="thd-sub-status">
                    {submission.status === 'GRADED' && <span className="thd-badge graded">✅ Đã chấm</span>}
                    {submission.status === 'SUBMITTED' && <span className="thd-badge submitted">📝 Đã nộp</span>}
                    {submission.status === 'LATE' && <span className="thd-badge late">⚠️ Nộp muộn</span>}
                    
                    <span className="thd-sub-date">{formatDateTime(submission.submissionDate)}</span>
                  </div>
                  
                  {submission.score !== undefined && (
                    <div className="thd-sub-score">{submission.score} điểm</div>
                  )}
                </div>
                
                <div className="thd-sub-actions">
                  <button className="thd-btn-action">👁️ Xem bài</button>
                  {submission.status !== 'GRADED' ? (
                    <button className="thd-btn-action primary">✏️ Chấm điểm</button>
                  ) : (
                    <button className="thd-btn-action">🔄 Chấm lại</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ChatList currentUsername={user?.username || 'teacher'} currentRole="TEACHER" />
    </div>
  );
};

export default HomeworkDetail;