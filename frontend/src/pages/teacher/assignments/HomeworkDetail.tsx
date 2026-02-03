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
  
  // Load homework detail
  useEffect(() => {
    if (id) {
      loadHomeworkDetail();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  
  const loadHomeworkDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await homeworkApi.getHomeworkById(Number(id));
      setHomework(data);
      
      //  Load submissions from API
      // For demo, keeping empty or you can mock data here
      setSubmissions([]);
      
      console.log('[HomeworkDetail]  Loaded:', data);
    } catch (err: unknown) {
  console.error('[HomeworkDetail]  Failed:', err);

  let message = 'Không thể tải thông tin bài tập!';

  if (err instanceof Error) {
    message = err.message;
  }

  setError(message);
}
 finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa bài tập này? Hành động này không thể hoàn tác!')) {
      return;
    }
    
    try {
      await homeworkApi.deleteHomework(Number(id));
      alert(' Xóa bài tập thành công!');
      navigate('/teacher/assignments');
    } catch (err: unknown) {
      let message = 'Không thể xóa bài tập này!';
      if (err instanceof Error) {
        message = err.message;
      }
      alert(message);
    }
  };
  
  const getDeadlineStatus = () => {
    if (!homework) return null;
    
    const now = new Date();
    const deadline = new Date(homework.deadline);
    const diff = deadline.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diff < 0) {
      return { text: `Quá hạn ${Math.abs(days)} ngày`, color: '#ef4444' };
    } else if (days === 0) {
      return { text: 'Hạn hôm nay', color: '#f59e0b' };
    } else if (days <= 3) {
      return { text: `Còn ${days} ngày`, color: '#f59e0b' };
    } else {
      return { text: `Còn ${days} ngày`, color: '#10b981' };
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
  
  
  const user = useAuthStore((state) => state.user);

  
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
             Sửa
          </button>
          <button onClick={handleDelete} className="thd-btn-delete">
             Xóa
          </button>
        </div>
      </div>
      
      {/* Title Section */}
      <div className="thd-title-section">
        <h1>{homework.title}</h1>
        <p className="thd-subtitle">
          <span> {homework.subjectName}</span>
          <span>•</span>
          <span>Lớp {homework.classCode}</span>
        </p>
      </div>
      
      {/* Info Section */}
      <div className="thd-section">
        <h2>Thông tin chi tiết</h2>
        
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
                Tải xuống tài liệu
              </a>
            </div>
          )}
        </div>
        {homework.description && (
          <div className="thd-description-box">
            <div className="thd-desc-title">Nội dung yêu cầu</div>
            <p className="thd-desc-text">{homework.description}</p>
          </div>
        )}
        {submissions.map((s) => (
  <div key={s.submissionId}>
    {s.studentName} – {s.status}
  </div>
))}

      </div>
      <ChatList currentUsername={user?.username || 'teacher'} currentRole="TEACHER" />
    </div>
  );
};

export default HomeworkDetail;