import React, { useEffect } from 'react';
import './SubmissionDetailModal.css';

/**
 * SubmissionDetailModal Component - Namespaced (tsdm-)
 * * Modal for viewing complete submission details
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
      email?: string;
    };
    submissionText?: string;
    submissionFileUrl?: string;
    submissionFileName?: string;
    submissionFiles?: Array<{
      fileId: number;
      originalFilename: string;
      fileUrl: string;
      fileSize: number;
      formattedFileSize: string;
      fileExtension: string;
      uploadedAt: string;
    }>;
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
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GRADED': return { text: 'Đã chấm', color: '#166534', bg: '#dcfce7', icon: '✓' };
      case 'SUBMITTED': return { text: 'Đã nộp', color: '#1e40af', bg: '#dbeafe', icon: '📝' };
      case 'LATE': return { text: 'Nộp muộn', color: '#991b1b', bg: '#fee2e2', icon: '⚠️' };
      default: return { text: status, color: '#475569', bg: '#f1f5f9', icon: '📋' };
    }
  };

  const getFileIcon = (extension: string) => {
    const ext = extension.toLowerCase();
    if (['jpg', 'jpeg', 'png'].includes(ext)) return 'png';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (['xls', 'xlsx'].includes(ext)) return 'xls';
    if (['zip', 'rar'].includes(ext)) return 'zip';
    return 'Tải về';
  };

  if (!isOpen || !submission) return null;

  const statusBadge = getStatusBadge(submission.status);
  const hasNewFiles = submission.submissionFiles && submission.submissionFiles.length > 0;
  const hasLegacyFile = !!submission.submissionFileUrl;

  return (
    <div className="tsdm-overlay" onClick={onClose}>
      <div className="tsdm-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tsdm-header">
          <div className="tsdm-header-content">
            <div className="tsdm-header-text">
              <h2>Chi tiết bài nộp</h2>
              <p className="tsdm-homework-title">{submission.homeworkTitle}</p>
            </div>
          </div>
          <button className="tsdm-btn-close" onClick={onClose}>✕</button>
        </div>

        {/* Content */}
        <div className="tsdm-content">
          
          {/* Student Info */}
          <section className="tsdm-section">
            <h3 className="tsdm-section-title"> Thông tin sinh viên</h3>
            <div className="tsdm-student-card">
              <div className="tsdm-avatar">
                {submission.studentInfo.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="tsdm-student-details">
                <h4>{submission.studentInfo.fullName}</h4>
                <div className="tsdm-info-grid">
                  <div className="tsdm-info-item">
                    <span className="tsdm-info-label">Mã SV:</span>
                    <span className="tsdm-info-value">{submission.studentInfo.studentCode}</span>
                  </div>
                  {submission.studentInfo.email && (
                    <div className="tsdm-info-item">
                      <span className="tsdm-info-label">Email:</span>
                      <span className="tsdm-info-value">{submission.studentInfo.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Submission Status */}
          <section className="tsdm-section">
            <h3 className="tsdm-section-title"> Trạng thái</h3>
            <div className="tsdm-status-card">
              <div className="tsdm-status-header">
                <div 
                  className="tsdm-status-badge"
                  style={{ background: statusBadge.bg, color: statusBadge.color }}
                >
                  {statusBadge.icon} {statusBadge.text}
                </div>
              </div>
              <div className="tsdm-meta-grid">
                <div className="tsdm-meta-item">
                  <span className="tsdm-meta-label">Ngày nộp</span>
                  <span className="tsdm-meta-value">
                    {formatDateTime(submission.submissionDate)}
                  </span>
                </div>
                {submission.submissionTiming && (
                  <div className="tsdm-meta-item">
                    <span className="tsdm-meta-label">Thời gian</span>
                    <span className="tsdm-meta-value" style={{ color: submission.isLate ? '#ef4444' : '#10b981' }}>
                      {submission.submissionTiming}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Submission Content */}
          <section className="tsdm-section">
            <h3 className="tsdm-section-title"> Nội dung bài nộp</h3>
            
            {/* Multi-file display */}
            {hasNewFiles && (
              <div className="tsdm-section" style={{ marginBottom: '16px' }}>
                <div className="tsdm-files-grid">
                  {submission.submissionFiles!.map((file) => (
                    <a
                      key={file.fileId}
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tsdm-file-item"
                    >
                      <div className="tsdm-file-top">
                        <span className="tsdm-file-icon">{getFileIcon(file.fileExtension)}</span>
                        <span className="tsdm-file-name" title={file.originalFilename}>{file.originalFilename}</span>
                      </div>
                      <div className="tsdm-file-meta">
                        <span>{file.formattedFileSize}</span>
                        <span className="tsdm-file-ext">{file.fileExtension}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {/* Legacy Single File */}
            {!hasNewFiles && hasLegacyFile && (
              <div style={{ marginBottom: '16px' }}>
                <a
                  href={submission.submissionFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tsdm-file-legacy"
                >
                  <span style={{ fontWeight: 600 }}>{submission.submissionFileName || 'Tải xuống file đính kèm'}</span>
                </a>
              </div>
            )}
            
            {/* Text Content */}
            {submission.submissionText ? (
              <div className="tsdm-text-box">
                <pre className="tsdm-text-content">{submission.submissionText}</pre>
              </div>
            ) : (
              !hasNewFiles && !hasLegacyFile && (
                <div className="tsdm-empty">Không có nội dung văn bản</div>
              )
            )}
          </section>

          {/* Grade Result */}
          {submission.isGraded && (
            <section className="tsdm-section">
              <h3 className="tsdm-section-title"> Kết quả chấm điểm</h3>
              <div className="tsdm-grade-card">
                <div className="tsdm-score-box">
                  <div className="tsdm-score-val">{submission.score}</div>
                  <div className="tsdm-score-max">/ 10</div>
                </div>
                <div className="tsdm-feedback-box">
                  <div className="tsdm-feedback-label">Nhận xét:</div>
                  <div className="tsdm-feedback-text">{submission.teacherFeedback || 'Không có nhận xét'}</div>
                  {submission.gradedDate && (
                    <div className="tsdm-graded-date">
                      Chấm lúc: {formatDateTime(submission.gradedDate)}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="tsdm-footer">
          <button className="tsdm-btn-cancel" onClick={onClose}>Đóng</button>
          {onGradeClick && (
            <button 
              className="tsdm-btn-grade" 
              onClick={() => { onClose(); onGradeClick(); }}
            >
              {submission.isGraded ? ' Chấm lại' : 'Chấm điểm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailModal;