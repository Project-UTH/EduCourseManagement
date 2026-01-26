import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import studentHomeworkApi, { HomeworkDetailResponse, SubmissionFileResponse } from '../../../services/api/studentHomeworkApi';

// IMPORT FILE CSS ĐỘC LẬP
import './HomeworkDetail.css';

/**
 * HomeworkDetail - MULTI-FILE SUPPORT (UPDATED)
 */

const HomeworkDetail = () => {
  const { homeworkId } = useParams<{ homeworkId: string }>();
  const navigate = useNavigate();

  // ... (Phần logic giữ nguyên 100% như code của bạn)
  const [homework, setHomework] = useState<HomeworkDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedFileDetail, setSelectedFileDetail] = useState<SubmissionFileResponse | null>(null);
  const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB

  useEffect(() => {
    loadHomeworkDetail();
  }, [homeworkId]);

  const loadHomeworkDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentHomeworkApi.getHomeworkDetail(Number(homeworkId));
      setHomework(data);
      if (data.submission) {
        setTextContent(data.submission.submissionText || '');
      }
    } catch (err: any) {
      console.error('[HomeworkDetail] ❌ Failed to load:', err);
      setError('Không thể tải thông tin bài tập');
    } finally {
      setLoading(false);
    }
  };

  const handleNewFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFilesSize = files.reduce((sum, f) => sum + f.size, 0);
    const existingSize = newFiles.reduce((sum, f) => sum + f.size, 0);
    const totalSize = newFilesSize + existingSize;
    
    if (totalSize > MAX_TOTAL_SIZE) {
      setSubmitError(`Tổng dung lượng vượt quá 100MB! (${(totalSize / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }
    setNewFiles([...newFiles, ...files]);
    setSubmitError(null);
  };

  const removeNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent && newFiles.length === 0) {
      setSubmitError('Vui lòng nhập nội dung hoặc chọn file!');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (isEditing) {
        for (const file of newFiles) {
          await studentHomeworkApi.updateHomework(Number(homeworkId), {
            submissionText: textContent || undefined,
            file: file
          });
        }
      } else {
        for (let i = 0; i < newFiles.length; i++) {
          if (i === 0) {
            await studentHomeworkApi.submitHomework(Number(homeworkId), {
              submissionText: textContent || undefined,
              file: newFiles[i]
            });
          } else {
            await studentHomeworkApi.updateHomework(Number(homeworkId), {
              file: newFiles[i]
            });
          }
        }
      }
      await loadHomeworkDetail();
      setTextContent('');
      setNewFiles([]);
      setIsEditing(false);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Không thể nộp bài. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    if (homework?.submission) {
      setTextContent(homework.submission.submissionText || '');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTextContent(homework?.submission?.submissionText || '');
    setNewFiles([]);
    setSubmitError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getTotalNewFilesSize = () => {
    return newFiles.reduce((sum, f) => sum + f.size, 0);
  };

  const getTimeLeft = () => {
    if (!homework) return '';
    const now = new Date();
    const deadline = new Date(homework.deadline);
    const diff = deadline.getTime() - now.getTime();
    
    if (diff < 0) {
      const days = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));
      return days > 0 ? `Quá hạn ${days} ngày` : `Quá hạn ${Math.floor(Math.abs(diff) / (1000 * 60 * 60))} giờ`;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
    if (hours > 0) return `Còn ${hours} giờ`;
    return `Còn ${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))} phút`;
  };

  const hasSubmitted = !!homework?.submission;
  const isGraded = homework?.submission?.score !== undefined && homework?.submission?.score !== null;
  const canEdit = hasSubmitted && !isGraded && !homework?.isOverdue;

  const openFileDetail = (file: SubmissionFileResponse) => setSelectedFileDetail(file);
  const closeFileDetail = () => setSelectedFileDetail(null);

  const handleDeleteFile = async (fileId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa file này?')) return;
    try {
      await studentHomeworkApi.deleteSubmissionFileById(Number(homeworkId), fileId);
      closeFileDetail();
      await loadHomeworkDetail();
      alert('Đã xóa file thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa file!');
    }
  };

  if (loading) {
    return (
      <div className="homework-detail">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải bài tập...</p>
        </div>
      </div>
    );
  }

  if (error || !homework) {
    return (
      <div className="homework-detail">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>{error || 'Không tìm thấy bài tập'}</h3>
          <button className="btn-back" onClick={() => navigate(-1)}>← Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="homework-detail">
      {/* File Detail Modal */}
      {selectedFileDetail && (
        <div className="file-modal-overlay" onClick={closeFileDetail}>
          <div className="file-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="file-modal-header">
              <h3>Chi tiết file</h3>
              <button className="btn-close-modal" onClick={closeFileDetail}>✕</button>
            </div>
            <div className="file-modal-body">
              <div className="file-modal-icon">📄</div>
              <h4>{selectedFileDetail.originalFilename}</h4>
              <p className="file-modal-date">
                Tải lên: {new Date(selectedFileDetail.uploadedAt).toLocaleString('vi-VN')}
              </p>
              <p className="file-modal-size">Kích thước: {selectedFileDetail.formattedFileSize}</p>
              
              <div className="file-modal-actions">
                <a 
                  href={selectedFileDetail.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-modal-download"
                  onClick={closeFileDetail}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Tải xuống
                </a>
                <button 
                  className="btn-modal-delete" 
                  onClick={() => handleDeleteFile(selectedFileDetail.fileId)}
                  disabled={!canEdit}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {canEdit ? 'Xóa file' : 'Không thể xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="homework-header">
        <button className="btn-back" onClick={() => navigate(-1)}>← Quay lại</button>
        <div className="header-title">
          <h1>{homework.title}</h1>
          <div className="header-meta">
            <span className="class-info">{homework.className}</span>
            <span className="separator">•</span>
            <span className="max-score">Điểm tối đa: {homework.maxScore}</span>
          </div>
        </div>
        <div className="homework-status">
          {homework.submission?.status === 'LATE' ? (
            <span className="badge late">⚠️ Nộp trễ</span>
          ) : hasSubmitted ? (
            <span className="badge submitted">✓ Đã nộp</span>
          ) : homework.isOverdue ? (
            <span className="badge overdue">⚠️ Quá hạn</span>
          ) : (
            <span className="badge pending">⏳ Chưa nộp</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="homework-content">
        <div className="content-left">
          {/* Deadline Card */}
          <div className="info-card">
            <h3>⏰ Thời hạn nộp bài</h3>
            <div className="deadline-info">
              <div className="deadline-date">
                {new Date(homework.deadline).toLocaleString('vi-VN', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
              <div className={`time-left ${homework.isOverdue ? 'overdue' : ''}`}>{getTimeLeft()}</div>
            </div>
          </div>

          {/* Description Card */}
          <div className="info-card">
            <h3>📋 Yêu cầu</h3>
            <div className="description-content">{homework.description || 'Không có mô tả'}</div>
          </div>

          {/* Attachment Card */}
          {homework.attachmentUrl && (
            <div className="info-card">
              <h3>📎 Tài liệu đính kèm</h3>
              <a href={homework.attachmentUrl} target="_blank" rel="noopener noreferrer" className="attachment-link">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {homework.attachmentName || 'Tải xuống tài liệu'}
              </a>
            </div>
          )}

          {/* Submission Status Card */}
          <div className="info-card submission-status-card">
            <h3>📤 Trạng thái nộp bài</h3>
            
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">Submission status:</span>
                <span className={`status-value ${hasSubmitted ? 'submitted' : 'not-submitted'}`}>
                  {hasSubmitted ? (homework.submission?.status === 'LATE' ? 'Nộp trễ' : 'Đã nộp') : 'Chưa nộp'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Grading status:</span>
                <span className={`status-value ${isGraded ? 'graded' : 'not-graded'}`}>
                  {isGraded ? 'Đã chấm điểm' : 'Chưa chấm điểm'}
                </span>
              </div>
            </div>

            {hasSubmitted && homework.submission && (
              <div className="submitted-info">
                <div className="submitted-time">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Nộp lúc: {new Date(homework.submission.submissionDate).toLocaleString('vi-VN')}</span>
                  {homework.submission.isLate && <span className="late-badge">⚠️ Nộp trễ</span>}
                </div>

                {homework.submission.submissionText && (
                  <div className="submitted-text">
                    <strong>Nội dung đã nộp:</strong>
                    <p>{homework.submission.submissionText}</p>
                  </div>
                )}

                {/* File Submissions */}
                {homework.submission.submissionFiles && homework.submission.submissionFiles.length > 0 && (
                  <div className="file-submissions-section">
                    <h4>📁 File submissions ({homework.submission.submissionFiles.length})</h4>
                    <div className="file-list-moodle">
                      {homework.submission.submissionFiles.map((file) => (
                        <div 
                          key={file.fileId}
                          className="file-item-moodle-clickable"
                          onClick={() => openFileDetail(file)}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div className="file-info-moodle">
                            <strong>{file.originalFilename}</strong>
                            <span className="file-date">
                              {new Date(file.uploadedAt).toLocaleString('vi-VN', {
                                day: 'numeric', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })} • {file.formattedFileSize}
                            </span>
                          </div>
                          <span className="file-click-hint">Click để xem</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grade Display */}
                {isGraded && (
                  <div className="grade-display">
                    <div className="grade-score">
                      <span className="grade-label">Điểm:</span>
                      <span className="grade-number">{homework.submission.score} / {homework.maxScore}</span>
                    </div>
                    {homework.submission.teacherFeedback && (
                      <div className="teacher-feedback">
                        <strong>Nhận xét của giảng viên:</strong>
                        <p>{homework.submission.teacherFeedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {canEdit && !isEditing && (
                  <button className="btn-edit" onClick={handleEdit}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Thêm file hoặc chỉnh sửa
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Submission Form */}
        <div className="content-right">
          {(!hasSubmitted || isEditing) ? (
            <div className="submission-form-card">
              <h3>{isEditing ? 'Thêm file mới' : 'Nộp bài tập'}</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nội dung văn bản (tùy chọn)</label>
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Nhập nội dung bài làm..."
                    rows={6}
                  />
                </div>

                <div className="form-group">
                  <label>Thêm file (tùy chọn)</label>
                  
                  <div className="file-upload-moodle">
                    <input
                      type="file"
                      id="file-input"
                      onChange={handleNewFilesSelect}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar"
                      multiple
                    />
                    <label htmlFor="file-input" className="file-upload-btn">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Chọn files...
                    </label>
                  </div>

                  {newFiles.length > 0 && (
                    <div className="selected-files-box">
                      <div className="selected-files-header">
                        <strong>Files mới ({newFiles.length}):</strong>
                        <span className="total-size">Tổng: {formatFileSize(getTotalNewFilesSize())} / 100MB</span>
                      </div>
                      <div className="selected-files-list">
                        {newFiles.map((file, index) => (
                          <div key={index} className="selected-file-item">
                            <div className="file-info-row">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <div className="file-details">
                                <span className="file-name">{file.name}</span>
                                <span className="file-size">{formatFileSize(file.size)}</span>
                              </div>
                            </div>
                            <button type="button" className="btn-remove-file-small" onClick={() => removeNewFile(index)}>
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <small>PDF, DOC, DOCX, PPT, PPTX, ZIP, RAR (Max 100MB tổng)</small>
                </div>

                {submitError && <div className="error-message">{submitError}</div>}

                <div className="form-actions">
                  {isEditing && (
                    <button type="button" className="btn-cancel" onClick={handleCancelEdit}>Hủy</button>
                  )}
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={submitting || (!textContent && newFiles.length === 0)}
                  >
                    {submitting ? (
                      <><div className="spinner-small"></div>{isEditing ? 'Đang thêm...' : 'Đang nộp...'}</>
                    ) : (
                      <><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>{isEditing ? 'Thêm file' : 'Nộp bài'}</>
                    )}
                  </button>
                </div>
              </form>

              <div className="submission-note">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{isEditing ? 'Files mới sẽ được THÊM vào, không thay thế file cũ' : 'Có thể nộp nhiều files (max 100MB)'}</span>
              </div>
            </div>
          ) : (
            <div className="submitted-message">
              <div className="submitted-icon">✅</div>
              <h3>Đã nộp bài thành công</h3>
              <p>Bài tập đã được gửi tới giảng viên.</p>
              {!isGraded && <p className="waiting-grade">Đang chờ giảng viên chấm điểm...</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeworkDetail;