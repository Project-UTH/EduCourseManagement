import React, { useState, useEffect } from 'react';
import './GradeModal.css';
import submissionApi from '../../../services/api/submissionApi';

/**
 * GradeModal Component
 * 
 * Modal for grading student homework submissions
 * Features:
 * - Score input (0-10 with validation)
 * - Teacher feedback textarea
 * - Submit/Cancel actions
 * - Loading states
 * - Error handling
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi chấm điểm');
    } finally {
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
    <div className="grade-modal-overlay" onClick={onClose}>
      <div className="grade-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="grade-modal-header">
          <div className="grade-modal-title">
            <span className="grade-icon">✏️</span>
            <h2>Chấm điểm bài nộp</h2>
          </div>
          <button 
            className="grade-modal-close" 
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Student Info */}
        <div className="grade-student-info">
          <div className="student-avatar">👤</div>
          <div className="student-details">
            <h3>{submission.studentInfo.fullName}</h3>
            <p className="student-code">{submission.studentInfo.studentCode}</p>
          </div>
        </div>

        {/* Submission Preview */}
        {(submission.submissionText || submission.submissionFileUrl) && (
          <div className="grade-submission-preview">
            <h4>Bài nộp:</h4>
            {submission.submissionText && (
              <p className="submission-text-preview">
                {submission.submissionText.substring(0, 200)}
                {submission.submissionText.length > 200 && '...'}
              </p>
            )}
            {submission.submissionFileUrl && (
              <a 
                href={submission.submissionFileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="submission-file-link"
              >
                📎 Tải xuống file đính kèm
              </a>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="grade-form">
          {/* Score Input */}
          <div className="form-group">
            <label htmlFor="score">
              Điểm <span className="required">*</span>
            </label>
            <div className="score-input-wrapper">
              <input
                id="score"
                type="text"
                value={score}
                onChange={handleScoreChange}
                placeholder="0.0"
                className="score-input"
                disabled={loading}
                required
              />
              <span className="score-suffix">/ 10</span>
            </div>
            <p className="input-hint">Nhập điểm từ 0 đến 10 (VD: 8.5)</p>
          </div>

          {/* Feedback Textarea */}
          <div className="form-group">
            <label htmlFor="feedback">
              Nhận xét <span className="required">*</span>
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                setError('');
              }}
              placeholder="Nhập nhận xét, góp ý cho sinh viên..."
              className="feedback-textarea"
              rows={5}
              disabled={loading}
              required
            />
            <p className="input-hint">
              {feedback.length} / 500 ký tự
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="grade-modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Đang lưu...
                </>
              ) : (
                <>
                  <span className="submit-icon">✓</span>
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