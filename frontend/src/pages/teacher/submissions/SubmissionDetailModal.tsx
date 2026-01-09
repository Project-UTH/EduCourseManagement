import React, { useEffect } from 'react';
import './SubmissionDetailModal.css';

/**
 * SubmissionDetailModal Component
 * 
 * Modal for viewing complete submission details
 * Features:
 * - Full student information
 * - Complete submission text
 * - File download
 * - Score and feedback display
 * - Quick grade action
 */

interface SubmissionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: {
    submissionId: number;
    homeworkTitle: string;
    studentInfo: {
      fullName: string;
      studentCode: string;
      email: string;
    };
    submissionText?: string;
    submissionFileUrl?: string;
    submissionDate: string;
    submissionTiming?: string;
    status: string;
    statusDisplay?: string;
    score?: number;
    teacherFeedback?: string;
    gradedDate?: string;
    isLate?: boolean;
    isGraded?: boolean;
  } | null;
  onGradeClick?: () => void;
}

const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  submission,
  onGradeClick 
}) => {
  
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
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
        return { text: 'Đã chấm', color: '#10b981', bg: '#d1fae5', icon: '✓' };
      case 'SUBMITTED':
        return { text: 'Đã nộp', color: '#3b82f6', bg: '#dbeafe', icon: '📝' };
      case 'LATE':
        return { text: 'Nộp muộn', color: '#ef4444', bg: '#fee2e2', icon: '⚠️' };
      default:
        return { text: status, color: '#6b7280', bg: '#f3f4f6', icon: '📋' };
    }
  };

  if (!isOpen || !submission) return null;

  const statusBadge = getStatusBadge(submission.status);

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="detail-modal-header">
          <div className="detail-header-content">
            <div className="detail-icon">👁️</div>
            <div className="detail-header-text">
              <h2>Chi tiết bài nộp</h2>
              <p className="homework-title">{submission.homeworkTitle}</p>
            </div>
          </div>
          <button 
            className="detail-modal-close" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="detail-modal-content">
          
          {/* Student Information */}
          <section className="detail-section">
            <h3 className="section-title">
              <span className="section-icon">👤</span>
              Thông tin sinh viên
            </h3>
            <div className="student-info-card">
              <div className="student-avatar-large">
                {submission.studentInfo.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="student-info-details">
                <h4>{submission.studentInfo.fullName}</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-icon">🎓</span>
                    <span className="info-label">Mã SV:</span>
                    <span className="info-value">{submission.studentInfo.studentCode}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">📧</span>
                    <span className="info-label">Email:</span>
                    <span className="info-value">{submission.studentInfo.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Submission Status */}
          <section className="detail-section">
            <h3 className="section-title">
              <span className="section-icon">📊</span>
              Trạng thái
            </h3>
            <div className="status-card">
              <div className="status-info">
                <div 
                  className="status-badge-large"
                  style={{ 
                    background: statusBadge.bg, 
                    color: statusBadge.color 
                  }}
                >
                  <span className="status-icon-large">{statusBadge.icon}</span>
                  {statusBadge.text}
                </div>
                <div className="submission-meta">
                  <div className="meta-item">
                    <span className="meta-label">Ngày nộp:</span>
                    <span className="meta-value">
                      {formatDateTime(submission.submissionDate)}
                    </span>
                  </div>
                  {submission.submissionTiming && (
                    <div className="meta-item">
                      <span className="meta-label">Thời gian:</span>
                      <span 
                        className="meta-value timing"
                        style={{ 
                          color: submission.isLate ? '#ef4444' : '#10b981' 
                        }}
                      >
                        {submission.submissionTiming}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Submission Content */}
          <section className="detail-section">
            <h3 className="section-title">
              <span className="section-icon">📄</span>
              Nội dung bài nộp
            </h3>
            
            {submission.submissionFileUrl && (
              <div className="file-section">
                <a
                  href={submission.submissionFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-download-card"
                >
                  <div className="file-icon">📎</div>
                  <div className="file-info">
                    <span className="file-label">File đính kèm</span>
                    <span className="file-action">Click để tải xuống →</span>
                  </div>
                </a>
              </div>
            )}
            
            {submission.submissionText ? (
              <div className="submission-text-box">
                <pre className="submission-text-content">
                  {submission.submissionText}
                </pre>
              </div>
            ) : (
              !submission.submissionFileUrl && (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p>Không có nội dung văn bản</p>
                </div>
              )
            )}
          </section>

          {/* Score & Feedback (if graded) */}
          {submission.isGraded && (
            <section className="detail-section">
              <h3 className="section-title">
                <span className="section-icon">✏️</span>
                Kết quả chấm điểm
              </h3>
              <div className="grade-result-card">
                <div className="score-display">
                  <div className="score-label">Điểm số</div>
                  <div className="score-value">
                    {submission.score} <span className="score-max">/ 10</span>
                  </div>
                </div>
                {submission.teacherFeedback && (
                  <div className="feedback-display">
                    <div className="feedback-label">Nhận xét của giảng viên:</div>
                    <div className="feedback-content">
                      {submission.teacherFeedback}
                    </div>
                  </div>
                )}
                {submission.gradedDate && (
                  <div className="graded-time">
                    Chấm lúc: {formatDateTime(submission.gradedDate)}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="detail-modal-footer">
          <button 
            className="btn-detail-close"
            onClick={onClose}
          >
            Đóng
          </button>
          {onGradeClick && (
            <button 
              className="btn-detail-grade"
              onClick={() => {
                onClose();
                onGradeClick();
              }}
            >
              {submission.isGraded ? (
                <>
                  <span className="btn-icon">🔄</span>
                  Chấm lại
                </>
              ) : (
                <>
                  <span className="btn-icon">✏️</span>
                  Chấm điểm
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailModal;