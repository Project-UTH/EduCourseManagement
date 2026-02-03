import { useState, useEffect } from 'react';
import classApi, { ClassResponse } from '../../../services/api/classApi';
import homeworkApi, {} from '../../../services/api/homeworkApi';
import submissionApi, { SubmissionResponse } from '../../../services/api/submissionApi';
import GradeModal from './GradeModal';
import SubmissionDetailModal from './SubmissionDetailModal';
import './SubmissionList.css';
import ChatList from '../../../components/chat/ChatList';
import { useAuthStore } from '@/store/authStore';


/**
 * SubmissionList Page - Namespaced (tsl-)
 */

type StatusFilter = 'ALL' | 'SUBMITTED' | 'GRADED' | 'LATE';
type SubmissionWithHomework = SubmissionResponse & {
  homeworkTitle?: string;
  homeworkDeadline?: string;
};


const SubmissionList = () => {
  // State
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionWithHomework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailSubmission, setDetailSubmission] = useState<SubmissionResponse | null>(null);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // Load classes on mount
  useEffect(() => {
    loadClasses();
  }, []);
  
  // Load homework when class changes

  
  // Load submissions when class changes
  useEffect(() => {
    if (selectedClass) {
      loadAllSubmissionsForClass();
    } else {
      setSubmissions([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);
  
  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await classApi.getMyClasses();
      setClasses(data);
      
      if (data.length > 0) {
        setSelectedClass(data[0].classId);
      }
    } catch (err: unknown) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError('Đã xảy ra lỗi');
  }
}
    finally {
      setLoading(false);
    }
  };
  
 
  const loadAllSubmissionsForClass = async () => {
    if (!selectedClass) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const homeworkList = await homeworkApi.getHomeworkByClass(selectedClass);
      
      if (homeworkList.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }
      
      const allSubmissions: SubmissionResponse[] = [];
      
      for (const hw of homeworkList) {
        try {
          const hwSubmissions = await submissionApi.getSubmissionsByHomework(hw.homeworkId);
          const submissionsWithHomework = hwSubmissions.map(sub => ({
            ...sub,
            homeworkTitle: hw.title,
            homeworkDeadline: hw.deadline
          }));
          allSubmissions.push(...submissionsWithHomework);
        } catch (err: unknown) {
          console.warn(`[SubmissionList] No submissions for homework ${hw.homeworkId}:`, err);
        }
      }
      
      setSubmissions(allSubmissions);
      
    } catch (err: unknown) {
      console.error('[SubmissionList] Failed to load submissions:', err);
      setError('Không thể tải danh sách bài nộp!');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GRADED': return { text: 'Đã chấm', color: '#166534', bg: '#dcfce7' };
      case 'SUBMITTED': return { text: 'Đã nộp', color: '#1e40af', bg: '#dbeafe' };
      case 'LATE': return { text: 'Nộp muộn', color: '#991b1b', bg: '#fee2e2' };
      default: return { text: status, color: '#475569', bg: '#f1f5f9' };
    }
  };
  
  const mapStatusToEnum = (status: string): StatusFilter => {
    switch (status) {
      case 'Đã nộp': return 'SUBMITTED';
      case 'Đã chấm': return 'GRADED';
      case 'Nộp muộn': return 'LATE';
      default: return status as StatusFilter;
    }
  };
  
  const handleGradeClick = (submission: SubmissionResponse) => {
    setSelectedSubmission(submission);
    setIsGradeModalOpen(true);
  };
  
  const handleGradeSuccess = () => {
    loadAllSubmissionsForClass();
  };
  
  const handleViewDetail = (submission: SubmissionResponse) => {
    setDetailSubmission(submission);
    setIsDetailModalOpen(true);
  };
  
  const filteredSubmissions = submissions.filter(sub => {
    const enumStatus = mapStatusToEnum(sub.status);
    if (statusFilter !== 'ALL' && enumStatus !== statusFilter) return false;
    
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      return (
        sub.studentInfo.fullName.toLowerCase().includes(keyword) ||
        sub.studentInfo.studentCode.toLowerCase().includes(keyword)
      );
    }
    return true;
  });
  
  // Stats
  const totalSubmissions = submissions.length;
  const gradedCount = submissions.filter(s => s.status === 'GRADED').length;
  const ungradedCount = totalSubmissions - gradedCount;
  const lateCount = submissions.filter(s => s.status === 'LATE').length;
const user = useAuthStore(state => state.user);

 
  if (loading && submissions.length === 0) {
    return (
      <div className="tsl-container">
        <div className="tsl-loading">
          <div className="tsl-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="tsl-container">
      {/* Header */}
      <div className="tsl-header">
        <div>
          <h1> Quản lý Bài nộp</h1>
          <p>Xem và chấm điểm bài tập của sinh viên</p>
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <div className="tsl-error">
          <span> {error}</span>
        </div>
      )}
      
      {/* Filters */}
      <div className="tsl-filters">
        <div className="tsl-filters-row">
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(Number(e.target.value) || null)}
            className="tsl-select"
          >
            <option value="">Chọn lớp học</option>
            {classes.map(cls => (
              <option key={cls.classId} value={cls.classId}>
                {cls.classCode} - {cls.subjectName}
              </option>
            ))}
          </select>
          
          <input
            type="text"
            placeholder=" Tìm theo tên hoặc mã SV..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="tsl-search"
          />
        </div>
      </div>
      
      {!selectedClass ? (
        <div className="tsl-empty">
          <h3>Vui lòng chọn lớp học</h3>
          <p>Chọn một lớp từ danh sách để xem các bài nộp</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="tsl-stats-grid">
            <div className="tsl-stat-card" style={{ borderLeftColor: '#3b82f6' }}>
              <div className="tsl-stat-content">
                <div className="tsl-stat-label">Tổng bài nộp</div>
                <div className="tsl-stat-value">{totalSubmissions}</div>
              </div>
            </div>
            
            <div className="tsl-stat-card" style={{ borderLeftColor: '#f59e0b' }}>
              <div className="tsl-stat-content">
                <div className="tsl-stat-label">Cần chấm</div>
                <div className="tsl-stat-value">{ungradedCount}</div>
              </div>
            </div>
            
            <div className="tsl-stat-card" style={{ borderLeftColor: '#10b981' }}>
              <div className="tsl-stat-content">
                <div className="tsl-stat-label">Đã chấm</div>
                <div className="tsl-stat-value">{gradedCount}</div>
              </div>
            </div>
            
            <div className="tsl-stat-card" style={{ borderLeftColor: '#ef4444' }}>
              <div className="tsl-stat-content">
                <div className="tsl-stat-label">Nộp muộn</div>
                <div className="tsl-stat-value">{lateCount}</div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="tsl-tabs">
            {(['ALL', 'SUBMITTED', 'GRADED', 'LATE'] as StatusFilter[]).map(status => (
              <button
                key={status}
                className={`tsl-tab ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'ALL' && 'Tất cả'}
                {status === 'SUBMITTED' && 'Chưa chấm'}
                {status === 'GRADED' && 'Đã chấm'}
                {status === 'LATE' && 'Nộp muộn'}
              </button>
            ))}
          </div>
          
          {/* Submissions List */}
          {filteredSubmissions.length === 0 ? (
            <div className="tsl-empty">
              <h3>Không tìm thấy bài nộp</h3>
              <p>
                {searchKeyword.trim()
                  ? 'Không có sinh viên nào phù hợp với từ khóa tìm kiếm'
                  : 'Chưa có bài nộp nào trong danh mục này'}
              </p>
            </div>
          ) : (
            <div className="tsl-list">
              {filteredSubmissions.map((submission) => {
                const statusBadge = getStatusBadge(submission.status);
                const fileCount = submission.submissionFiles?.length || 0;
                const hasLegacyFile = !!submission.submissionFileUrl;
                const totalFiles = fileCount + (hasLegacyFile && fileCount === 0 ? 1 : 0);
                
                return (
                  <div key={submission.submissionId} className="tsl-card">
                    {/* Column 1: Student Info */}
                    <div className="tsl-student-col">
                      <div className="tsl-student-details">
                        <h3>{submission.studentInfo.fullName}</h3>
                        <span className="tsl-student-code">{submission.studentInfo.studentCode}</span>
                      </div>
                    </div>
                    
                    {/* Column 2: Submission Info */}
                    <div className="tsl-info-col">
                      <div className="tsl-info-item">
                        <span className="tsl-label">Bài tập</span>
                        <span className="tsl-value highlight">
  {submission.homeworkTitle || 'Unknown'}
</span>

                      </div>
                      
                      <div className="tsl-info-item">
                        <span className="tsl-label">Trạng thái</span>
                        <span 
                          className="tsl-badge" 
                          style={{ color: statusBadge.color, background: statusBadge.bg }}
                        >
                          {statusBadge.text}
                        </span>
                      </div>
                      
                      <div className="tsl-info-item">
                        <span className="tsl-label">Ngày nộp</span>
                        <span className="tsl-value">
                          {formatDateTime(submission.submissionDate)}
                          {submission.submissionTiming && (
                            <span className="tsl-late-tag">{submission.submissionTiming}</span>
                          )}
                        </span>
                      </div>
                      
                      <div className="tsl-info-item">
                        <span className="tsl-label">Điểm số</span>
                        {submission.score !== null && submission.score !== undefined ? (
                          <span className="tsl-value score">{submission.score}/10</span>
                        ) : (
                          <span className="tsl-value">--</span>
                        )}
                      </div>
                      
                      {totalFiles > 0 && (
                        <div className="tsl-info-item">
                          <span className="tsl-label">File đính kèm</span>
                          <span className="tsl-value"> {totalFiles} tệp tin</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Column 3: Actions */}
                    <div className="tsl-actions-col">
                      <button 
                        className="tsl-btn tsl-btn-view"
                        onClick={() => handleViewDetail(submission)}
                      >
                        Xem chi tiết
                      </button>
                      
                      {submission.status !== 'GRADED' ? (
                        <button 
                          className="tsl-btn tsl-btn-grade"
                          onClick={() => handleGradeClick(submission)}
                        >
                          Chấm điểm
                        </button>
                      ) : (
                        <button 
                          className="tsl-btn tsl-btn-regrade"
                          onClick={() => handleGradeClick(submission)}
                        >
                          Chấm lại
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
        submission={detailSubmission}
        onGradeClick={() => {
          if (detailSubmission) {
            handleGradeClick(detailSubmission);
          }
        }}
      />
      <ChatList currentUsername={user?.username || 'teacher'} currentRole="TEACHER" />
    </div>
  );
};

export default SubmissionList;