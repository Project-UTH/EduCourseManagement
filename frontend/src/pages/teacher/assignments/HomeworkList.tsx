import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import homeworkApi, { HomeworkResponse } from '../../../services/api/homeworkApi';
import classApi from '../../../services/api/classApi';
import { LoadingSpinner } from '../../../components/common';
import './HomeworkList.css';
import ChatList from '../../../components/chat/ChatList';
import { useAuthStore } from '@/store/authStore';


/**
 * HomeworkList Component - Namespaced (thl-)
 */
interface TeacherClass {
  classId: number;
  classCode: string;
  subjectName: string;
}


const HomeworkList = () => {
  const navigate = useNavigate();
  
  // State
  const [homework, setHomework] = useState<HomeworkResponse[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classLoadError, setClassLoadError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<'ALL' | 'REGULAR' | 'MIDTERM' | 'FINAL'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // Load teacher's classes on mount
  useEffect(() => {
    loadTeacherClasses();
  }, []);
  
  // Load homework when filters change
  useEffect(() => {
    if (!loading) {
      loadHomework();
    }
  }, [selectedClass, selectedType, searchKeyword]);
  
  const loadTeacherClasses = async () => {
    setLoading(true);
    setClassLoadError(null);
    
    try {
      const response = await classApi.getMyClasses();
      setClasses(response);
      
      if (response.length > 0 && !selectedClass) {
        setSelectedClass(response[0].classId);
      }
    }catch (err: unknown) {
  console.error(err);

  let message = 'Đã xảy ra lỗi';

  if (err instanceof Error) {
    message = err.message;
  }

  setError(message);
}
 finally {
      setLoading(false);
    }
  };
  
  const loadHomework = async () => {
    setError(null);
    
    try {
      let data: HomeworkResponse[];
      
      if (selectedClass && classes.length > 0) {
        data = await homeworkApi.getHomeworkByClass(selectedClass);
      } else {
        data = await homeworkApi.getMyHomework();
      }
      
      // Filter by type
      let filtered = data;
      if (selectedType !== 'ALL') {
        filtered = data.filter(hw => hw.homeworkType === selectedType);
      }
      
      // Search by keyword
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.toLowerCase();
        filtered = filtered.filter(hw => 
          hw.title.toLowerCase().includes(keyword) ||
          hw.subjectName?.toLowerCase().includes(keyword) ||
          hw.classCode?.toLowerCase().includes(keyword)
        );
      }
      
      setHomework(filtered);
    } catch (err: unknown) {
  console.error('[HomeworkList] Failed to load homework:', err);

  let message = 'Không thể tải danh sách bài tập';

  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err
  ) {
    const axiosErr = err as {
      response?: {
        data?: { message?: string };
      };
      message?: string;
    };

    message =
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      message;
  } else if (err instanceof Error) {
    message = err.message;
  }
      setError(`Không thể tải danh sách bài tập: ${message}`);
      setHomework([]);
    }
  };
  
  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bài tập "${title}"?\n\nLưu ý: Không thể khôi phục sau khi xóa!`)) {
      return;
    }
    
    try {
      await homeworkApi.deleteHomework(id);
      alert('Xóa bài tập thành công!');
      loadHomework();
    } catch (error: unknown) {
  let message = 'Không thể xóa bài tập này!';

  if (error instanceof Error) {
    message = error.message;
  }

  alert(message);
}
  };
  
  const handleRetry = () => {
    setError(null);
    setClassLoadError(null);
    loadTeacherClasses();
  };
  
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };
  
  const getEmptyStateMessage = () => {
    if (searchKeyword.trim()) {
      return { title: 'Không tìm thấy bài tập', description: 'Không có bài tập nào phù hợp với từ khóa tìm kiếm của bạn' };
    }
    
    switch (selectedType) {
      case 'REGULAR': return { title: 'Chưa có bài tập thường xuyên', description: 'Tạo bài tập mới để sinh viên bắt đầu làm bài' };
      case 'MIDTERM': return { title: 'Chưa có bài tập giữa kỳ', description: 'Chuẩn bị bài tập giữa kỳ cho sinh viên' };
      case 'FINAL': return { title: 'Chưa có bài tập cuối kỳ', description: 'Tạo bài thi cuối kỳ cho lớp học' };
      default: return { title: 'Chưa có bài tập nào', description: 'Hãy tạo bài tập đầu tiên cho lớp học của bạn' };
    }
  };
  
  const getDeadlineStatus = (deadline: string, isOverdue: boolean) => {
    if (isOverdue) {
      const diffDays = Math.floor((new Date().getTime() - new Date(deadline).getTime()) / (86400000));
      return { text: `Quá hạn ${diffDays} ngày`, className: 'thl-status-overdue' };
    }
    
    const diffDays = Math.floor((new Date(deadline).getTime() - new Date().getTime()) / (86400000));
    if (diffDays <= 3) return { text: `⚡ Còn ${diffDays} ngày`, className: 'thl-status-urgent' };
    
    return { text: `Còn ${diffDays} ngày`, className: 'thl-status-normal' };
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'REGULAR': return '#3b82f6';
      case 'MIDTERM': return '#f59e0b';
      case 'FINAL': return '#ef4444';
      default: return '#64748b';
    }
  };
  const user = useAuthStore((state) => state.user);

  
  // Calculate statistics
  const stats = {
    total: homework.length,
    completed: homework.filter(hw => (hw.gradedCount || 0) === (hw.submissionCount || 0) && hw.submissionCount! > 0).length,
    needsGrading: homework.filter(hw => (hw.ungradedCount || 0) > 0).length,
    overdue: homework.filter(hw => hw.isOverdue).length,
  };
  
  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <LoadingSpinner size={60} message="Đang tải dữ liệu..." />
      </div>
    );
  }
  
  return (
    <div className="thl-container">
      {/* Header */}
      <div className="thl-header">
        <div className="thl-header-content">
          <h1>Quản lý Bài tập</h1>
          <p>Tạo, chỉnh sửa và theo dõi bài tập của sinh viên</p>
        </div>
        <button 
          className="thl-btn-create"
          onClick={() => navigate('/teacher/assignments/create')}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo bài tập mới
        </button>
      </div>
      
      {/* Class Load Error Banner */}
      {classLoadError && (
        <div className={`thl-error-banner ${classLoadError.includes('401') ? 'auth-error' : 'network-error'}`}>
          <div className="thl-error-icon">
            {classLoadError.includes('401') ? '' : ''}
          </div>
          <div className="thl-error-content">
            <h3 className="thl-error-title">Lỗi tải danh sách lớp học</h3>
            <p className="thl-error-text">{classLoadError}</p>
            
            <details className="thl-debug-info">
              <summary className="thl-debug-summary">Thông tin Debug</summary>
              <div style={{ marginTop: '8px', fontFamily: 'monospace' }}>
                <p>• Token: {localStorage.getItem('access_token') ? ' Có' : 'Không có'}</p>
                <p>• Time: {new Date().toLocaleTimeString()}</p>
              </div>
            </details>
            
            <div className="thl-error-actions">
              <button onClick={handleRetry} className="thl-btn-retry">Thử lại</button>
              {classLoadError.includes('401') && (
                <button onClick={handleLogout} className="thl-btn-logout">Đăng nhập lại</button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Homework Load Error */}
      {error && !classLoadError && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '16px', marginBottom: '24px', color: '#b91c1c' }}>
          <strong>Lỗi:</strong> {error}
          <button 
            onClick={handleRetry}
            style={{ marginLeft: '12px', padding: '4px 12px', background: '#fff', border: '1px solid #b91c1c', borderRadius: '4px', cursor: 'pointer', color: '#b91c1c' }}
          >
            Thử lại
          </button>
        </div>
      )}
      
      {/* Filters */}
      <div className="thl-filters">
        <select 
          value={selectedClass || ''}
          onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : null)}
          className="thl-select"
          disabled={classes.length === 0}
        >
          <option value="">
            {classes.length === 0 ? 'Không có lớp học' : `Tất cả lớp (${classes.length})`}
          </option>
          {classes.map(cls => (
            <option key={cls.classId} value={cls.classId}>
              {cls.classCode} - {cls.subjectName}
            </option>
          ))}
        </select>
        
        <input
          type="text"
          placeholder="Tìm kiếm bài tập (Tên, môn học)..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="thl-search"
        />
      </div>
      
      {/* Tabs */}
      <div className="thl-tabs">
        {(['ALL', 'REGULAR', 'MIDTERM', 'FINAL'] as const).map(type => (
          <button
            key={type}
            className={`thl-tab-btn ${selectedType === type ? 'active' : ''}`}
            onClick={() => setSelectedType(type)}
          >
            {type === 'ALL' ? 'Tất cả' : 
             type === 'REGULAR' ? 'Thường xuyên' :
             type === 'MIDTERM' ? 'Giữa kỳ' : 'Cuối kỳ'}
          </button>
        ))}
      </div>
      
      {/* Stats Grid - Using raw HTML to match CSS */}
      <div className="thl-stats-grid">
        <div className="thl-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="thl-stat-content">
            <div className="thl-stat-value">{stats.total}</div>
            <div className="thl-stat-label">Tổng bài tập</div>
          </div>
        </div>
        
        <div className="thl-stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="thl-stat-content">
            <div className="thl-stat-value">{stats.completed}</div>
            <div className="thl-stat-label">Đã chấm xong</div>
          </div>
        </div>
        
        <div className="thl-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="thl-stat-content">
            <div className="thl-stat-value">{stats.needsGrading}</div>
            <div className="thl-stat-label">Cần chấm</div>
          </div>
        </div>
        
        <div className="thl-stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="thl-stat-content">
            <div className="thl-stat-value">{stats.overdue}</div>
            <div className="thl-stat-label">Quá hạn</div>
          </div>
        </div>
      </div>
      
      {/* Homework List */}
      {homework.length === 0 ? (
        <div className="thl-empty-state">
          <h3>{getEmptyStateMessage().title}</h3>
          <p>{getEmptyStateMessage().description}</p>
          {!searchKeyword && (
            <button 
              className="thl-btn-create" 
              style={{ margin: '0 auto' }}
              onClick={() => navigate('/teacher/assignments/create')}
            >
              + Tạo bài tập ngay
            </button>
          )}
        </div>
      ) : (
        <div className="thl-homework-list">
          {homework.map(hw => {
            const deadlineStatus = getDeadlineStatus(hw.deadline, hw.isOverdue);
            const submissionRate = hw.submissionCount && hw.submissionCount > 0 
              ? ((hw.submissionCount || 0) / hw.submissionCount * 100) 
              : 0;
            const gradingRate = hw.submissionCount && hw.submissionCount > 0
              ? ((hw.gradedCount || 0) / hw.submissionCount * 100)
              : 0;
            
            return (
              <div key={hw.homeworkId} className="thl-card">
                <div className="thl-card-header">
                  <div className="thl-title-section">
                    <div className="thl-title-row">
                      <h3 className="thl-card-title">{hw.title}</h3>
                      <span 
                        className="thl-type-badge"
                        style={{ 
                          background: `${getTypeColor(hw.homeworkType)}15`,
                          color: getTypeColor(hw.homeworkType)
                        }}
                      >
                        {hw.homeworkTypeDisplay}
                      </span>
                    </div>
                  </div>
                  <div className={`thl-deadline-badge ${deadlineStatus.className}`}>
                    {deadlineStatus.text}
                  </div>
                </div>
                
                <div className="thl-card-body">
                  <div className="thl-info-row">
                    <span className="thl-info-item">{hw.classCode}</span>
                    <span className="thl-info-item">{hw.subjectName}</span>
                    <span className="thl-info-item">Tối đa: {hw.maxScore} điểm</span>
                  </div>
                  
                  {hw.description && (
                    <div className="thl-description">
                      {hw.description.length > 120 
                        ? hw.description.substring(0, 120) + '...' 
                        : hw.description}
                    </div>
                  )}
                  
                  <div className="thl-progress-section">
                    <div className="thl-stat-box">
                      <div className="thl-stat-header">
                        <span>Đã nộp</span>
                        <span className="thl-stat-number">{hw.submissionCount || 0} SV</span>
                      </div>
                      <div className="thl-progress-bar">
                        <div 
                          className="thl-progress-fill"
                          style={{ 
                            width: `${submissionRate}%`,
                            background: submissionRate > 80 ? '#10b981' : submissionRate > 50 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="thl-stat-box">
                      <div className="thl-stat-header">
                        <span>Đã chấm</span>
                        <span className="thl-stat-number">{hw.gradedCount || 0}/{hw.submissionCount || 0} bài</span>
                      </div>
                      <div className="thl-progress-bar">
                        <div 
                          className="thl-progress-fill"
                          style={{ 
                            width: `${gradingRate}%`,
                            background: gradingRate === 100 ? '#10b981' : gradingRate > 50 ? '#3b82f6' : '#f59e0b'
                          }}
                        />
                      </div>
                    </div>
                    
                    {hw.averageScore !== undefined && hw.averageScore !== null && (
                      <div className="thl-stat-box">
                        <div className="thl-stat-header">
                          <span>Điểm TB</span>
                          <span className="thl-stat-number" style={{ color: '#10b981' }}>{hw.averageScore.toFixed(2)}</span>
                        </div>
                        <div className="thl-progress-bar">
                          <div 
                            className="thl-progress-fill"
                            style={{ 
                              width: `${(hw.averageScore / hw.maxScore) * 100}%`,
                              background: '#10b981'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="thl-card-footer">
                  <button 
                    className="thl-btn-action thl-btn-view"
                    onClick={() => navigate(`/teacher/assignments/${hw.homeworkId}`)}
                  >
                    Chi tiết
                  </button>
                  <button 
                    className="thl-btn-action thl-btn-edit"
                    onClick={() => navigate(`/teacher/assignments/edit/${hw.homeworkId}`)}
                  >
                    Sửa
                  </button>
                  <button 
                    className="thl-btn-action thl-btn-delete"
                    onClick={() => handleDelete(hw.homeworkId, hw.title)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ChatList currentUsername={user?.username || 'teacher'} currentRole="TEACHER" />
    </div>
  );
};

export default HomeworkList;