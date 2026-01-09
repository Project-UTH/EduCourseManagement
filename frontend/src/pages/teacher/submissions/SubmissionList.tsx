import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classApi, { ClassResponse } from '../../../services/api/classApi';
import homeworkApi, { HomeworkResponse } from '../../../services/api/homeworkApi';
import submissionApi, { SubmissionResponse } from '../../../services/api/submissionApi';
import GradeModal from './GradeModal';
import SubmissionDetailModal from './SubmissionDetailModal';
import './SubmissionList.css';

/**
 * SubmissionList Page
 * 
 * View and manage all student submissions
 * Filter by class, homework, status
 * Quick grading actions
 */

type StatusFilter = 'ALL' | 'SUBMITTED' | 'GRADED' | 'LATE';

const SubmissionList = () => {
  const navigate = useNavigate();
  
  // State
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [homework, setHomework] = useState<HomeworkResponse[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Grade Modal State
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionResponse | null>(null);
  
  // Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailSubmission, setDetailSubmission] = useState<SubmissionResponse | null>(null);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedHomework, setSelectedHomework] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // Load classes on mount
  useEffect(() => {
    loadClasses();
  }, []);
  
  // Load homework when class changes
  useEffect(() => {
    if (selectedClass) {
      loadHomeworkForClass();
    } else {
      setHomework([]);
      setSelectedHomework(null);
    }
  }, [selectedClass]);
  
  // Load submissions when homework changes
  useEffect(() => {
    if (selectedHomework) {
      loadSubmissions();
    } else {
      setSubmissions([]);
    }
  }, [selectedHomework]);
  
  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await classApi.getMyClasses();
      setClasses(data);
      
      // Auto-select first class
      if (data.length > 0) {
        setSelectedClass(data[0].classId);
      }
    } catch (err: any) {
      console.error('[SubmissionList] Failed to load classes:', err);
      setError('Không thể tải danh sách lớp học!');
    } finally {
      setLoading(false);
    }
  };
  
  const loadHomeworkForClass = async () => {
    if (!selectedClass) return;
    
    try {
      const data = await homeworkApi.getHomeworkByClass(selectedClass);
      setHomework(data);
      
      // Auto-select first homework
      if (data.length > 0) {
        setSelectedHomework(data[0].homeworkId);
      } else {
        setSelectedHomework(null);
        setSubmissions([]);
      }
    } catch (err: any) {
      console.error('[SubmissionList] Failed to load homework:', err);
      setHomework([]);
      setSelectedHomework(null);
    }
  };
  
  const loadSubmissions = async () => {
    if (!selectedHomework) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await submissionApi.getSubmissionsByHomework(selectedHomework);
      setSubmissions(data);
      
      console.log('[SubmissionList] ✅ Loaded', data.length, 'submissions');
    } catch (err: any) {
      console.error('[SubmissionList] Failed to load submissions:', err);
      
      // If 404, show empty state
      if (err.response?.status === 404) {
        setSubmissions([]);
      } else {
        setError(err.response?.data?.message || 'Không thể tải danh sách bài nộp!');
        setSubmissions([]);
      }
    } finally {
      setLoading(false);
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
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GRADED':
        return { text: 'Đã chấm', color: '#10b981', bg: '#d1fae5' };
      case 'SUBMITTED':
        return { text: 'Đã nộp', color: '#3b82f6', bg: '#dbeafe' };
      case 'LATE':
        return { text: 'Nộp muộn', color: '#ef4444', bg: '#fee2e2' };
      default:
        return { text: status, color: '#6b7280', bg: '#f3f4f6' };
    }
  };
  
  // Map Vietnamese status to English enum
  const mapStatusToEnum = (status: string): StatusFilter => {
    switch (status) {
      case 'Đã nộp':
        return 'SUBMITTED';
      case 'Đã chấm':
        return 'GRADED';
      case 'Nộp muộn':
        return 'LATE';
      default:
        // If already English enum, return as is
        return status as StatusFilter;
    }
  };
  
  // Grade handlers
  const handleGradeClick = (submission: SubmissionResponse) => {
    setSelectedSubmission(submission);
    setIsGradeModalOpen(true);
  };
  
  const handleGradeSuccess = () => {
    // Reload submissions after successful grading
    loadSubmissions();
  };
  
  // View detail handler
  const handleViewDetail = (submission: SubmissionResponse) => {
    setDetailSubmission(submission);
    setIsDetailModalOpen(true);
  };
  
  // Filter submissions
  const filteredSubmissions = submissions.filter(sub => {
    // Map Vietnamese to enum
    const enumStatus = mapStatusToEnum(sub.status);
    
    // Status filter
    if (statusFilter !== 'ALL' && enumStatus !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      return (
        sub.studentInfo.fullName.toLowerCase().includes(keyword) ||
        sub.studentInfo.studentCode.toLowerCase().includes(keyword)
      );
    }
    
    return true;
  });
  
  // Statistics
  const totalSubmissions = submissions.length;
  const gradedCount = submissions.filter(s => s.status === 'GRADED').length;
  const ungradedCount = totalSubmissions - gradedCount;
  const lateCount = submissions.filter(s => s.status === 'LATE').length;
  
  if (loading && submissions.length === 0) {
    return (
      <div className="submission-list-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="submission-list-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>📥 Bài nộp của sinh viên</h1>
          <p>Xem và quản lý bài nộp</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(Number(e.target.value) || null)}
            className="filter-select"
          >
            <option value="">Chọn lớp học</option>
            {classes.map(cls => (
              <option key={cls.classId} value={cls.classId}>
                {cls.classCode} - {cls.subjectName}
              </option>
            ))}
          </select>
          
          <select
            value={selectedHomework || ''}
            onChange={(e) => setSelectedHomework(Number(e.target.value) || null)}
            className="filter-select"
            disabled={!selectedClass || homework.length === 0}
          >
            <option value="">Chọn bài tập</option>
            {homework.map(hw => (
              <option key={hw.homeworkId} value={hw.homeworkId}>
                {hw.title}
              </option>
            ))}
          </select>
          
          <input
            type="text"
            placeholder="🔍 Tìm sinh viên..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      {!selectedClass ? (
        <div className="empty-state">
          <span className="empty-icon">📚</span>
          <h3>Chọn lớp học</h3>
          <p>Vui lòng chọn lớp học để xem bài nộp</p>
        </div>
      ) : !selectedHomework ? (
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <h3>Chọn bài tập</h3>
          <p>Vui lòng chọn bài tập để xem bài nộp</p>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card" style={{ borderLeftColor: '#3b82f6' }}>
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-label">Tổng bài nộp</div>
                <div className="stat-value">{totalSubmissions}</div>
              </div>
            </div>
            
            <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-label">Chờ chấm</div>
                <div className="stat-value">{ungradedCount}</div>
              </div>
            </div>
            
            <div className="stat-card" style={{ borderLeftColor: '#10b981' }}>
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-label">Đã chấm</div>
                <div className="stat-value">{gradedCount}</div>
              </div>
            </div>
            
            <div className="stat-card" style={{ borderLeftColor: '#ef4444' }}>
              <div className="stat-icon">⚠️</div>
              <div className="stat-content">
                <div className="stat-label">Nộp muộn</div>
                <div className="stat-value">{lateCount}</div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="tabs">
            {(['ALL', 'SUBMITTED', 'GRADED', 'LATE'] as StatusFilter[]).map(status => (
              <button
                key={status}
                className={`tab ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'ALL' && 'Tất cả'}
                {status === 'SUBMITTED' && 'Đã nộp'}
                {status === 'GRADED' && 'Đã chấm'}
                {status === 'LATE' && 'Nộp muộn'}
              </button>
            ))}
          </div>
          
          {/* Submissions List */}
          {filteredSubmissions.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <h3>Không có bài nộp</h3>
              <p>
                {searchKeyword.trim()
                  ? 'Không tìm thấy sinh viên phù hợp'
                  : 'Chưa có bài nộp nào'}
              </p>
            </div>
          ) : (
            <div className="submissions-list">
              {filteredSubmissions.map((submission) => {
                const statusBadge = getStatusBadge(submission.status);
                
                return (
                  <div key={submission.submissionId} className="submission-card">
                    <div className="submission-header">
                      <div className="student-info">
                        <span className="student-icon">👤</span>
                        <div>
                          <div className="student-name">{submission.studentInfo.fullName}</div>
                          <div className="student-code">{submission.studentInfo.studentCode}</div>
                        </div>
                      </div>
                      
                      <span
                        className="status-badge"
                        style={{
                          color: statusBadge.color,
                          background: statusBadge.bg
                        }}
                      >
                        {statusBadge.text}
                      </span>
                    </div>
                    
                    <div className="submission-info">
                      <div className="info-row">
                        <span className="info-label">Ngày nộp:</span>
                        <span className="info-value">
                          {formatDateTime(submission.submissionDate)}
                          {submission.submissionTiming && (
                            <span className="late-badge"> ({submission.submissionTiming})</span>
                          )}
                        </span>
                      </div>
                      
                      {submission.score !== null && submission.score !== undefined && (
                        <div className="info-row">
                          <span className="info-label">Điểm:</span>
                          <span className="info-value score">
                            {submission.score} / 10
                          </span>
                        </div>
                      )}
                      
                      {submission.submissionFileUrl && (
                        <div className="info-row">
                          <span className="info-label">File:</span>
                          <a
                            href={submission.submissionFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="file-link"
                          >
                            📎 Tải xuống
                          </a>
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
                      <button 
                        className="btn-view"
                        onClick={() => handleViewDetail(submission)}
                      >
                        👁️ Xem chi tiết
                      </button>
                      {submission.status !== 'GRADED' ? (
                        <button 
                          className="btn-grade"
                          onClick={() => handleGradeClick(submission)}
                        >
                          ✏️ Chấm điểm
                        </button>
                      ) : (
                        <button 
                          className="btn-regrade"
                          onClick={() => handleGradeClick(submission)}
                        >
                          🔄 Chấm lại
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      
      {/* Grade Modal */}
      <GradeModal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        submission={selectedSubmission}
        onSuccess={handleGradeSuccess}
      />
      
      {/* Detail Modal */}
      <SubmissionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        submission={detailSubmission as SubmissionResponse | null}
        onGradeClick={() => {
          if (detailSubmission) {
            handleGradeClick(detailSubmission);
          }
        }}
      />
    </div>
  );
};

export default SubmissionList;