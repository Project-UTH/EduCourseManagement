import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import homeworkApi, { HomeworkResponse } from '../../../services/api/homeworkApi';
import classApi from '../../../services/api/classApi';
import { StatCard, LoadingSpinner } from '../../../components/common';
import './HomeworkList.css';

/**
 * HomeworkList Component - Fixed Version
 * 
 * ✅ Better error handling - NO auto redirect
 * ✅ Shows detailed error messages
 * ✅ Tab-specific empty state messages
 * ✅ Token refresh support
 */

const HomeworkList = () => {
  const navigate = useNavigate();
  
  // State
  const [homework, setHomework] = useState<HomeworkResponse[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
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
  
  /**
   * Load teacher's classes - IMPROVED ERROR HANDLING
   */
  const loadTeacherClasses = async () => {
    setLoading(true);
    setClassLoadError(null);
    
    try {
      console.log('[HomeworkList] 🔄 Loading my classes...');
      
      const response = await classApi.getMyClasses();
      
      console.log('[HomeworkList] ✅ My classes loaded:', response.length);
      setClasses(response);
      
      if (response.length > 0 && !selectedClass) {
        setSelectedClass(response[0].classId);
      }
      
      setClassLoadError(null);
    } catch (err: any) {
      console.error('[HomeworkList] ❌ Failed to load classes:', err);
      
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;
      
      let errorMessage = '';
      
      // Detailed error messages based on status code
      if (status === 401) {
        errorMessage = '🔒 Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        console.error('[HomeworkList] 401 Unauthorized - Token expired or invalid');
      } else if (status === 403) {
        errorMessage = '🚫 Bạn không có quyền truy cập. Vui lòng kiểm tra tài khoản.';
        console.error('[HomeworkList] 403 Forbidden - Insufficient permissions');
      } else if (status === 404) {
        errorMessage = '❓ Không tìm thấy endpoint API. Backend có thể chưa được cập nhật.';
        console.error('[HomeworkList] 404 Not Found - Endpoint does not exist');
      } else if (status === 500) {
        errorMessage = '💥 Lỗi server. Vui lòng thử lại sau.';
        console.error('[HomeworkList] 500 Server Error');
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = '🌐 Không thể kết nối tới server. Kiểm tra backend đang chạy?';
        console.error('[HomeworkList] Network Error - Backend offline?');
      } else {
        errorMessage = `⚠️ ${message}`;
      }
      
      setClassLoadError(errorMessage);
      setClasses([]);
      
      // ⚠️ DO NOT REDIRECT - Let user see the error!
      console.log('[HomeworkList] Continuing with fallback mode (no classes)');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Load homework - IMPROVED ERROR HANDLING
   */
  const loadHomework = async () => {
    setError(null);
    
    try {
      console.log('[HomeworkList] 🔄 Loading homework...');
      
      let data: HomeworkResponse[];
      
      if (selectedClass && classes.length > 0) {
        data = await homeworkApi.getHomeworkByClass(selectedClass);
        console.log('[HomeworkList] ✅ Homework loaded for class:', selectedClass);
      } else {
        data = await homeworkApi.getMyHomework();
        console.log('[HomeworkList] ✅ All homework loaded');
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
      console.log('[HomeworkList] 📊 Homework displayed:', filtered.length);
      setError(null);
      
    } catch (err: any) {
      console.error('[HomeworkList] ❌ Failed to load homework:', err);
      
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;
      
      let errorMessage = '';
      
      if (status === 401) {
        errorMessage = '🔒 Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (status === 403) {
        errorMessage = '🚫 Bạn không có quyền truy cập bài tập.';
      } else {
        errorMessage = `⚠️ Không thể tải danh sách bài tập: ${message}`;
      }
      
      setError(errorMessage);
      setHomework([]);
      
      // ⚠️ DO NOT REDIRECT - Show error in UI
    }
  };
  
  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bài tập "${title}"?\n\nLưu ý: Không thể khôi phục sau khi xóa!`)) {
      return;
    }
    
    try {
      await homeworkApi.deleteHomework(id);
      alert('✅ Xóa bài tập thành công!');
      loadHomework();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Không thể xóa bài tập này!';
      alert('❌ ' + message);
    }
  };
  
  const handleRetry = () => {
    console.log('[HomeworkList] 🔄 Retrying...');
    setError(null);
    setClassLoadError(null);
    loadTeacherClasses();
  };
  
  const handleLogout = () => {
    // Clear token and redirect to login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };
  
  /**
   * ✅ Get tab-specific empty state message
   */
  const getEmptyStateMessage = (): { title: string; description: string } => {
    if (searchKeyword.trim()) {
      return {
        title: 'Không tìm thấy bài tập',
        description: 'Không có bài tập nào phù hợp với từ khóa tìm kiếm của bạn'
      };
    }
    
    switch (selectedType) {
      case 'REGULAR':
        return {
          title: 'Chưa có bài tập thường xuyên nào',
          description: 'Nhấn nút "Tạo bài tập mới" để thêm bài tập thường xuyên cho lớp học này'
        };
      case 'MIDTERM':
        return {
          title: 'Chưa có bài tập giữa kỳ nào',
          description: 'Nhấn nút "Tạo bài tập mới" để thêm bài tập giữa kỳ cho lớp học này'
        };
      case 'FINAL':
        return {
          title: 'Chưa có bài tập cuối kỳ nào',
          description: 'Nhấn nút "Tạo bài tập mới" để thêm bài tập cuối kỳ cho lớp học này'
        };
      default:
        return {
          title: 'Chưa có bài tập nào',
          description: 'Hãy tạo bài tập đầu tiên cho lớp học của bạn'
        };
    }
  };
  
  const getDeadlineStatus = (deadline: string, isOverdue: boolean) => {
    if (isOverdue) {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));
      return { 
        text: `⚠️ Quá hạn ${diffDays} ngày`, 
        color: '#ef4444',
        className: 'deadline-overdue'
      };
    }
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 3) {
      return { 
        text: `⚡ Còn ${diffDays} ngày`, 
        color: '#f59e0b',
        className: 'deadline-urgent'
      };
    }
    
    return { 
      text: `📅 Còn ${diffDays} ngày`, 
      color: '#10b981',
      className: 'deadline-normal'
    };
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'REGULAR': return '#3b82f6';
      case 'MIDTERM': return '#f59e0b';
      case 'FINAL': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  // Calculate statistics
  const stats = {
    total: homework.length,
    completed: homework.filter(hw => (hw.gradedCount || 0) === (hw.submissionCount || 0) && hw.submissionCount! > 0).length,
    needsGrading: homework.filter(hw => (hw.ungradedCount || 0) > 0).length,
    overdue: homework.filter(hw => hw.isOverdue).length,
  };
  
  // Show loading spinner during initial load
  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <LoadingSpinner size={60} message="Đang tải dữ liệu..." />
      </div>
    );
  }
  
  return (
    <div className="homework-list-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>📝 Quản lý Bài tập</h1>
          <p>Tạo, chỉnh sửa và theo dõi bài tập của sinh viên</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => navigate('/teacher/assignments/create')}
        >
          + Tạo bài tập mới
        </button>
      </div>
      
      {/* ⭐ CLASS LOAD ERROR - Prominent Display */}
      {classLoadError && (
        <div style={{
          background: classLoadError.includes('401') || classLoadError.includes('hết hạn') 
            ? '#fee2e2' 
            : '#fef3c7',
          border: `2px solid ${classLoadError.includes('401') ? '#ef4444' : '#f59e0b'}`,
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>
              {classLoadError.includes('401') || classLoadError.includes('hết hạn') ? '🔒' : '⚠️'}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                color: classLoadError.includes('401') ? '#991b1b' : '#92400e',
                fontSize: '1.1rem'
              }}>
                Lỗi tải danh sách lớp học
              </h3>
              <p style={{ 
                margin: '0 0 1rem 0', 
                color: classLoadError.includes('401') ? '#991b1b' : '#92400e' 
              }}>
                {classLoadError}
              </p>
              
              {/* Debug Info */}
              <details style={{ 
                marginBottom: '1rem', 
                padding: '0.75rem', 
                background: 'rgba(0,0,0,0.05)', 
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  🔍 Thông tin Debug
                </summary>
                <div style={{ marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  <p>• Endpoint: GET /api/teacher/classes/my</p>
                  <p>• Token: {localStorage.getItem('access_token') ? '✅ Có' : '❌ Không có'}</p>
                  <p>• Backend: {classLoadError.includes('Network') ? '❌ Offline?' : '✅ Online'}</p>
                  <p>• Time: {new Date().toLocaleTimeString()}</p>
                </div>
              </details>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleRetry}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🔄 Thử lại
                </button>
                
                {classLoadError.includes('401') && (
                  <button 
                    onClick={handleLogout}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    🚪 Đăng nhập lại
                  </button>
                )}
                
                <button 
                  onClick={() => navigate('/teacher')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  🏠 Về trang chủ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* HOMEWORK LOAD ERROR */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <strong style={{ color: '#991b1b' }}>❌ Lỗi:</strong> {error}
          <button 
            onClick={handleRetry}
            style={{
              marginLeft: '1rem',
              padding: '0.25rem 0.75rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            🔄 Thử lại
          </button>
        </div>
      )}
      
      {/* Filters */}
      <div className="filters">
        <select 
          value={selectedClass || ''}
          onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : null)}
          className="filter-select"
          disabled={classes.length === 0}
        >
          <option value="">
            {classes.length === 0 ? '⚠️ Không có lớp học' : `Tất cả lớp (${classes.length})`}
          </option>
          {classes.map(cls => (
            <option key={cls.classId} value={cls.classId}>
              {cls.classCode} - {cls.subjectName}
            </option>
          ))}
        </select>
        
        <input
          type="text"
          placeholder="🔍 Tìm kiếm bài tập..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="search-input"
        />
      </div>
      
      {/* Type Tabs */}
      <div className="tabs">
        {(['ALL', 'REGULAR', 'MIDTERM', 'FINAL'] as const).map(type => (
          <button
            key={type}
            className={`tab ${selectedType === type ? 'active' : ''}`}
            onClick={() => setSelectedType(type)}
          >
            {type === 'ALL' ? '📚 Tất cả' : 
             type === 'REGULAR' ? '📝 Thường xuyên' :
             type === 'MIDTERM' ? '📊 Giữa kỳ' : '🎯 Cuối kỳ'}
          </button>
        ))}
      </div>
      
      {/* Statistics Cards */}
      <div className="stats-grid">
        <StatCard icon="📝" label="Tổng bài tập" value={stats.total} color="#10b981" />
        <StatCard icon="✅" label="Đã chấm hoàn tất" value={stats.completed} color="#3b82f6" />
        <StatCard icon="⏳" label="Chờ chấm" value={stats.needsGrading} color="#f59e0b" />
        <StatCard icon="⚠️" label="Quá hạn" value={stats.overdue} color="#ef4444" />
      </div>
      
      {/* ✅ Homework List or Empty State with Tab-Specific Messages */}
      {homework.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>{getEmptyStateMessage().title}</h3>
          <p>{getEmptyStateMessage().description}</p>
          {!searchKeyword && (
            <button 
              className="btn-primary"
              onClick={() => navigate('/teacher/assignments/create')}
            >
              + Tạo bài tập mới
            </button>
          )}
        </div>
      ) : (
        <div className="homework-list">
          {homework.map(hw => {
            const deadlineStatus = getDeadlineStatus(hw.deadline, hw.isOverdue);
            const submissionRate = hw.submissionCount && hw.submissionCount > 0 
              ? ((hw.submissionCount || 0) / hw.submissionCount * 100) 
              : 0;
            const gradingRate = hw.submissionCount && hw.submissionCount > 0
              ? ((hw.gradedCount || 0) / hw.submissionCount * 100)
              : 0;
            
            return (
              <div key={hw.homeworkId} className="homework-card">
                <div className="card-header">
                  <div className="title-section">
                    <h3>{hw.title}</h3>
                    <span 
                      className="type-badge"
                      style={{ 
                        background: `${getTypeColor(hw.homeworkType)}20`,
                        color: getTypeColor(hw.homeworkType)
                      }}
                    >
                      {hw.homeworkTypeDisplay}
                    </span>
                  </div>
                  <div className={`deadline-status ${deadlineStatus.className}`}>
                    {deadlineStatus.text}
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="info-row">
                    <span>🏫 {hw.classCode}</span>
                    <span>📚 {hw.subjectName}</span>
                    <span>💯 Điểm tối đa: {hw.maxScore}</span>
                  </div>
                  
                  {hw.description && (
                    <div className="description">
                      {hw.description.length > 100 
                        ? hw.description.substring(0, 100) + '...' 
                        : hw.description}
                    </div>
                  )}
                  
                  <div className="stats-row">
                    <div className="stat">
                      <span className="label">Đã nộp:</span>
                      <span className="value">
                        {hw.submissionCount || 0} 
                        {submissionRate > 0 && ` (${submissionRate.toFixed(0)}%)`}
                      </span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${submissionRate}%`,
                            background: submissionRate > 80 ? '#10b981' : submissionRate > 50 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="stat">
                      <span className="label">Đã chấm:</span>
                      <span className="value">
                        {hw.gradedCount || 0}/{hw.submissionCount || 0}
                        {gradingRate > 0 && ` (${gradingRate.toFixed(0)}%)`}
                      </span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${gradingRate}%`,
                            background: gradingRate === 100 ? '#10b981' : gradingRate > 50 ? '#3b82f6' : '#f59e0b'
                          }}
                        />
                      </div>
                    </div>
                    
                    {hw.averageScore !== undefined && hw.averageScore !== null && (
                      <div className="stat">
                        <span className="label">Điểm TB:</span>
                        <span className="value score">
                          {hw.averageScore.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="card-footer">
                  <button 
                    className="btn-action btn-view"
                    onClick={() => navigate(`/teacher/assignments/${hw.homeworkId}`)}
                  >
                    👁️ Xem chi tiết
                  </button>
                  <button 
                    className="btn-action btn-edit"
                    onClick={() => navigate(`/teacher/assignments/edit/${hw.homeworkId}`)}
                  >
                    ✏️ Sửa
                  </button>
                  <button 
                    className="btn-action btn-stats"
                    onClick={() => navigate(`/teacher/assignments/${hw.homeworkId}/stats`)}
                  >
                    📊 Thống kê
                  </button>
                  <button 
                    className="btn-action btn-delete"
                    onClick={() => handleDelete(hw.homeworkId, hw.title)}
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HomeworkList;