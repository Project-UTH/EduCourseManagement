import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classApi, { ClassResponse } from '../../../services/api/classApi';
import homeworkApi, { HomeworkRequest } from '../../../services/api/homeworkApi';
import './CreateHomework.css';
import ChatList from '../../../components/chat/ChatList';
import { useAuthStore } from '@/store/authStore';


/**
 * CreateHomework Page - Namespaced (tch-)
 */

type HomeworkType = 'REGULAR' | 'MIDTERM' | 'FINAL';

const CreateHomework = () => {
  const navigate = useNavigate();
  
  // State
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // File upload state
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');
  
  // Form data
  const [formData, setFormData] = useState<HomeworkRequest>({
    classId: 0,
    title: '',
    description: '',
    homeworkType: 'REGULAR',
    deadline: '',
    maxScore: 10,
    attachmentUrl: '',
  });
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Load teacher's classes
  useEffect(() => {
    loadClasses();
  }, []);
  
  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await classApi.getMyClasses();
      setClasses(data);
      
      // Auto-select first class
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, classId: data[0].classId }));
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
      setError('Không thể tải danh sách lớp học!');
    } finally {
      setLoading(false);
    }
  };
  
  // File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) {
      setAttachmentFile(null);
      setFileError('');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileError(`File "${file.name}" vượt quá 10MB!`);
      setAttachmentFile(null);
      e.target.value = '';
      return;
    }
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setFileError('Chỉ chấp nhận file PDF, Word, Excel, PowerPoint, ZIP');
      setAttachmentFile(null);
      e.target.value = '';
      return;
    }
    
    // Set file
    setAttachmentFile(file);
    setFileError('');
  };
  
  const handleRemoveFile = () => {
    setAttachmentFile(null);
    setFileError('');
    const fileInput = document.getElementById('homework-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.classId || formData.classId === 0) {
      newErrors.classId = 'Vui lòng chọn lớp học';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Tiêu đề không được vượt quá 200 ký tự';
    }
    
    if (!formData.deadline) {
      newErrors.deadline = 'Vui lòng chọn deadline';
    } else {
      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      if (deadlineDate <= now) {
        newErrors.deadline = 'Deadline phải là thời điểm trong tương lai';
      }
    }
    
    if (formData.maxScore === undefined || formData.maxScore === null) {
      newErrors.maxScore = 'Vui lòng nhập điểm tối đa';
    } else if (formData.maxScore < 0 || formData.maxScore > 10) {
      newErrors.maxScore = 'Điểm phải từ 0 đến 10';
    }
    
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Mô tả không được vượt quá 2000 ký tự';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      let deadline = formData.deadline;
      if (deadline && !deadline.includes(':00', deadline.lastIndexOf(':'))) {
        deadline = deadline + ':00';
      }
      
      const formDataToSend = new FormData();
      formDataToSend.append('classId', formData.classId.toString());
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('homeworkType', formData.homeworkType);
      formDataToSend.append('deadline', deadline);
      formDataToSend.append('maxScore', (formData.maxScore ?? 10).toString());
      
      if (attachmentFile) {
        formDataToSend.append('file', attachmentFile);
      }
      
      const result = await homeworkApi.createHomework(formDataToSend as any);
      
      alert('✅ Tạo bài tập thành công!');
      navigate(`/teacher/assignments/${result.homeworkId}`);
      
    } catch (err: any) {
      console.error('Failed to create homework:', err);
      
      const message = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tạo bài tập!';
      
      if (message.includes('MIDTERM') || message.includes('giữa kỳ')) {
        setErrors(prev => ({
          ...prev,
          homeworkType: 'Lớp này đã có bài tập giữa kỳ!'
        }));
      } else if (message.includes('FINAL') || message.includes('cuối kỳ')) {
        setErrors(prev => ({
          ...prev,
          homeworkType: 'Lớp này đã có bài tập cuối kỳ!'
        }));
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleInputChange = (field: keyof HomeworkRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  const getTypeLabel = (type: HomeworkType): string => {
    switch (type) {
      case 'REGULAR': return 'Thường xuyên';
      case 'MIDTERM': return 'Giữa kỳ';
      case 'FINAL': return 'Cuối kỳ';
    }
  };
  
  const getTypeWarning = (): string | null => {
    if (formData.homeworkType === 'MIDTERM') {
      return '⚠️ Lưu ý: Mỗi lớp chỉ có 1 bài Giữa kỳ';
    } else if (formData.homeworkType === 'FINAL') {
      return '⚠️ Lưu ý: Mỗi lớp chỉ có 1 bài Cuối kỳ';
    }
    return null;
  };
  const user = useAuthStore((state: any) => state.user);

  
  if (loading) {
    return (
      <div className="tch-container">
        <div className="tch-loading">
          <div className="tch-spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }
  
  if (classes.length === 0 && !loading) {
    return (
      <div className="tch-container">
        <div className="tch-empty">
          <span className="tch-empty-icon">⚠️</span>
          <h3>Không có lớp học</h3>
          <p>Bạn chưa được phân công giảng dạy lớp học nào.</p>
          <button onClick={() => navigate('/teacher/assignments')} className="tch-btn-secondary">
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="tch-container">
      {/* Header */}
      <div className="tch-header">
        <button onClick={() => navigate('/teacher/assignments')} className="tch-btn-back">
          ← Quay lại
        </button>
        <div>
          <h1>✨ Tạo bài tập mới</h1>
          <p>Điền thông tin để tạo bài tập cho sinh viên</p>
        </div>
      </div>
      
      {/* Global Error */}
      {error && (
        <div className="tch-error-banner">
          <span className="tch-error-icon">❌</span>
          <div>
            <strong>Lỗi:</strong> {error}
          </div>
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="tch-form">
        <div className="tch-section">
          <h2>📋 Thông tin cơ bản</h2>
          
          {/* Class Selection */}
          <div className="tch-group">
            <label htmlFor="classId" className="tch-label">
              Lớp học <span className="tch-required">*</span>
            </label>
            <select
              id="classId"
              value={formData.classId}
              onChange={(e) => handleInputChange('classId', Number(e.target.value))}
              className={`tch-select ${errors.classId ? 'error' : ''}`}
            >
              <option value={0}>Chọn lớp học</option>
              {classes.map(cls => (
                <option key={cls.classId} value={cls.classId}>
                  {cls.classCode} - {cls.subjectName}
                </option>
              ))}
            </select>
            {errors.classId && <span className="tch-error-msg">{errors.classId}</span>}
          </div>
          
          {/* Title */}
          <div className="tch-group">
            <label htmlFor="title" className="tch-label">
              Tiêu đề <span className="tch-required">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="VD: Bài tập tuần 5 - Xây dựng website"
              maxLength={200}
              className={`tch-input ${errors.title ? 'error' : ''}`}
            />
            {errors.title && <span className="tch-error-msg">{errors.title}</span>}
            <span className="tch-helper-text">{formData.title.length}/200 ký tự</span>
          </div>
          
          {/* Homework Type */}
          <div className="tch-group">
            <label className="tch-label">
              Loại bài tập <span className="tch-required">*</span>
            </label>
            <div className="tch-radio-group">
              {(['REGULAR', 'MIDTERM', 'FINAL'] as HomeworkType[]).map(type => (
                <label key={type} className="tch-radio-label">
                  <input
                    type="radio"
                    name="homeworkType"
                    value={type}
                    checked={formData.homeworkType === type}
                    onChange={(e) => handleInputChange('homeworkType', e.target.value as HomeworkType)}
                    className="tch-radio-input"
                  />
                  <span>{getTypeLabel(type)}</span>
                </label>
              ))}
            </div>
            {errors.homeworkType && <span className="tch-error-msg">{errors.homeworkType}</span>}
            {getTypeWarning() && (
              <div className="tch-warning-msg">{getTypeWarning()}</div>
            )}
          </div>
          
          {/* Description */}
          <div className="tch-group">
            <label htmlFor="description" className="tch-label">Mô tả</label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Mô tả chi tiết yêu cầu bài tập..."
              rows={5}
              maxLength={2000}
              className={`tch-textarea ${errors.description ? 'error' : ''}`}
            />
            {errors.description && <span className="tch-error-msg">{errors.description}</span>}
            <span className="tch-helper-text">{(formData.description || '').length}/2000 ký tự</span>
          </div>
          
          {/* Deadline */}
          <div className="tch-group">
            <label htmlFor="deadline" className="tch-label">
              Deadline <span className="tch-required">*</span>
            </label>
            <input
              type="datetime-local"
              id="deadline"
              value={formData.deadline}
              onChange={(e) => handleInputChange('deadline', e.target.value)}
              className={`tch-input ${errors.deadline ? 'error' : ''}`}
            />
            {errors.deadline && <span className="tch-error-msg">{errors.deadline}</span>}
            <span className="tch-helper-text">Chọn ngày và giờ deadline (giây sẽ được tự động thêm)</span>
          </div>
          
          {/* Max Score */}
          <div className="tch-group">
            <label htmlFor="maxScore" className="tch-label">
              Điểm tối đa
            </label>
            <input
              type="number"
              id="maxScore"
              value={formData.maxScore}
              onChange={(e) => handleInputChange('maxScore', Number(e.target.value))}
              min={0}
              max={10}
              step={0.25}
              className={`tch-input ${errors.maxScore ? 'error' : ''}`}
            />
            {errors.maxScore && <span className="tch-error-msg">{errors.maxScore}</span>}
            <span className="tch-helper-text">Mặc định: 10.00 điểm</span>
          </div>
          
          {/* File Upload Section */}
          <div className="tch-group">
            <label className="tch-label">Tệp đính kèm (tùy chọn)</label>
            
            <div className="tch-file-area">
              <input
                type="file"
                id="homework-file-input"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <label 
                htmlFor="homework-file-input" 
                className="tch-file-btn"
              >
                📎 Chọn file
              </label>
              <span className="tch-file-hint">
                Tối đa 10MB
              </span>
            </div>
            
            {fileError && (
              <div className="tch-file-error">
                ⚠️ {fileError}
              </div>
            )}
            
            {attachmentFile && (
              <div className="tch-file-preview">
                <div className="tch-file-content">
                  <div className="tch-file-info">
                    <span className="tch-file-icon">
                      {attachmentFile.name.endsWith('.pdf') ? '📄' :
                       attachmentFile.name.endsWith('.doc') || attachmentFile.name.endsWith('.docx') ? '📝' :
                       attachmentFile.name.endsWith('.xls') || attachmentFile.name.endsWith('.xlsx') ? '📊' :
                       attachmentFile.name.endsWith('.ppt') || attachmentFile.name.endsWith('.pptx') ? '📊' :
                       attachmentFile.name.endsWith('.zip') || attachmentFile.name.endsWith('.rar') ? '🗜️' : '📎'}
                    </span>
                    <div className="tch-file-details">
                      <div className="tch-file-name">{attachmentFile.name}</div>
                      <div className="tch-file-size">{formatFileSize(attachmentFile.size)}</div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="tch-btn-remove-file"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            )}
            
            <small className="tch-helper-text">
              Hỗ trợ: PDF, Word, Excel, PowerPoint, ZIP
            </small>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="tch-actions">
          <button
            type="button"
            onClick={() => navigate('/teacher/assignments')}
            className="tch-btn-cancel"
            disabled={submitting}
          >
            ❌ Hủy
          </button>
          
          <button
            type="submit"
            className="tch-btn-submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="tch-spinner-small"></span>
                Đang tạo...
              </>
            ) : (
              <>✅ Tạo bài tập</>
            )}
          </button>
        </div>
      </form>
      <ChatList currentUsername={user?.username || 'teacher'} currentRole="TEACHER" />
    </div>
  );
};

export default CreateHomework;