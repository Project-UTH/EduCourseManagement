import React, { useState, useEffect } from 'react';
import './GradeModal.css';
import submissionApi from '../../../services/api/submissionApi';

/**
 * GradeModal Component - Namespaced (tgm-)
 * * Modal for grading student homework submissions
 */

interface GradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: {
    submissionId: number;
    studentInfo: {
      fullName: string;
      studentCode: string;
    };
    submissionText?: string;
    submissionFileUrl?: string;
    score?: number;
    teacherFeedback?: string;
  } | null;
  onSuccess: () => void;
}

const GradeModal: React.FC<GradeModalProps> = ({ 
  isOpen, 
  onClose, 
  submission,
  onSuccess 
}) => {
  const [score, setScore] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Reset form when submission changes
  useEffect(() => {
    if (submission) {
      setScore(submission.score?.toString() || '');
      setFeedback(submission.teacherFeedback || '');
      setError('');
    }
  }, [submission]);

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

  // Prevent body scroll
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    const scoreNum = parseFloat(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      setError('Điểm phải từ 0 đến 10');
      return;
    }

    if (!feedback.trim()) {
      setError('Vui lòng nhập nhận xét');
      return;
    }

    if (!submission) return;

    setLoading(true);
    try {
      await submissionApi.gradeSubmission(
        submission.submissionId,
        scoreNum,
        feedback.trim()
      );
      
      // Success
      onSuccess();
      onClose();
    }  catch (err: unknown) {
  if (err instanceof Error) {
    setError(err.message || 'Có lỗi xảy ra khi chấm điểm');
  } else {
    setError('Có lỗi xảy ra khi chấm điểm');
  }
}
     finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty, numbers, and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setScore(value);
      setError('');
    }
  };

  if (!isOpen || !submission) return null;

  return (
    <div className="tgm-overlay" onClick={onClose}>
      <div className="tgm-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="tgm-header">
          <div className="tgm-title-wrapper">
            <h2>Chấm điểm bài nộp</h2>
          </div>
          <button 
            className="tgm-btn-close" 
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Student Info */}
        <div className="tgm-student-info">
          <div className="tgm-student-details">
            <h3>{submission.studentInfo.fullName}</h3>
            <p className="tgm-student-code">{submission.studentInfo.studentCode}</p>
          </div>
        </div>

        {/* Submission Preview */}
        {(submission.submissionText || submission.submissionFileUrl) && (
          <div className="tgm-preview-section">
            <h4 className="tgm-preview-title">Nội dung bài nộp:</h4>
            {submission.submissionText && (
              <div className="tgm-text-preview">
                {submission.submissionText}
              </div>
            )}
            {submission.submissionFileUrl && (
              <a 
                href={submission.submissionFileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="tgm-file-link"
              >
                 Tải xuống file đính kèm
              </a>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="tgm-form">
          {/* Score Input */}
          <div className="tgm-form-group">
            <label htmlFor="score" className="tgm-label">
              Điểm <span className="tgm-required">*</span>
            </label>
            <div className="tgm-score-wrapper">
              <input
                id="score"
                type="text"
                value={score}
                onChange={handleScoreChange}
                placeholder="0.0"
                className="tgm-score-input"
                disabled={loading}
                required
              />
              <span className="tgm-score-suffix">/ 10</span>
            </div>
            <p className="tgm-hint">Nhập điểm từ 0 đến 10 (VD: 8.5)</p>
          </div>

          {/* Feedback Textarea */}
          <div className="tgm-form-group">
            <label htmlFor="feedback" className="tgm-label">
              Nhận xét <span className="tgm-required">*</span>
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                setError('');
              }}
              placeholder="Nhập nhận xét, góp ý cho sinh viên..."
              className="tgm-textarea"
              rows={5}
              disabled={loading}
              required
            />
            <p className="tgm-hint">
              {feedback.length} / 500 ký tự
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="tgm-error">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="tgm-actions">
            <button
              type="button"
              className="tgm-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="tgm-btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="tgm-spinner"></span>
                  Đang lưu...
                </>
              ) : (
                <>
                  <span className="tgm-submit-icon">✓</span>
                  Lưu điểm
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradeModal;