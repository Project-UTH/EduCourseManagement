import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import classApi, { ClassResponse } from '../../../services/api/classApi';
import homeworkApi, { HomeworkRequest, HomeworkResponse } from '../../../services/api/homeworkApi';
import apiClient from '../../../services/api/apiClient';
import './CreateHomework.css'; // Sử dụng chung file CSS đã Namespaced (tch-)
import ChatList from '../../../components/chat/ChatList';
import { useAuthStore } from '@/store/authStore';


/**
 * EditHomework Page
 * ✅ FIXED: Added file upload support like CreateHomework
 * * Form to edit existing homework assignment
 * Uses 'tch-' namespaced classes from CreateHomework.css
 */
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const isApiError = (err: unknown): err is ApiError => {
  return typeof err === 'object' && err !== null;
};


type HomeworkType = 'REGULAR' | 'MIDTERM' | 'FINAL';

const EditHomework = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalHomework, setOriginalHomework] = useState<HomeworkResponse | null>(null);
  
  // ✅ NEW: File upload state
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const [keepExistingFile, setKeepExistingFile] = useState(true);
  
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
  
  // Load classes and homework data
  useEffect(() => {
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load classes
      const classData = await classApi.getMyClasses();
      setClasses(classData);
      
      // Load homework
      if (id) {
        const homework = await homeworkApi.getHomeworkById(Number(id));
        setOriginalHomework(homework);
        
        // Pre-fill form
        setFormData({
          classId: homework.classId,
          title: homework.title,
          description: homework.description || '',
          homeworkType: homework.homeworkType,
          deadline: formatDateTimeForInput(homework.deadline),
          maxScore: homework.maxScore,
          attachmentUrl: homework.attachmentUrl || '',
        });
        
        // If homework has existing file, mark to keep it
        setKeepExistingFile(!!homework.attachmentUrl);
        
        console.log('[EditHomework] Loaded homework:', homework);
      }
    } catch (err: unknown) {
      console.error('[EditHomework] Failed to load:', err);

      const message = isApiError(err)
        ? err.response?.data?.message ?? 'Không thể tải thông tin bài tập!'
        : 'Không thể tải thông tin bài tập!';

      setError(message);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Format datetime for input field
   * Backend: "2026-01-22T03:52:00"
   * Input needs: "2026-01-22T03:52"
   */
  const formatDateTimeForInput = (dateStr: string): string => {
    if (!dateStr) return '';
    // Remove seconds if present
    return dateStr.substring(0, 16); // "2026-01-22T03:52"
  };
  
  // ✅ NEW: File upload handlers (copied from CreateHomework)
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
    
    // Set file and mark to NOT keep existing file
    setAttachmentFile(file);
    setFileError('');
    setKeepExistingFile(false);
  };
  
  const handleRemoveFile = () => {
    setAttachmentFile(null);
    setFileError('');
    const fileInput = document.getElementById('homework-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  const handleRemoveExistingFile = () => {
    setKeepExistingFile(false);
    setFormData(prev => ({ ...prev, attachmentUrl: '' }));
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  const getFileNameFromUrl = (url: string): string => {
    if (!url) return '';
    const parts = url.split('/');
    return decodeURIComponent(parts[parts.length - 1]);
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Class
    if (!formData.classId || formData.classId === 0) {
      newErrors.classId = 'Vui lòng chọn lớp học';
    }
    
    // Title
    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Tiêu đề không được vượt quá 200 ký tự';
    }
    
    // Deadline
    if (!formData.deadline) {
      newErrors.deadline = 'Vui lòng chọn deadline';
    }
    
    // Max score
    if (formData.maxScore === undefined || formData.maxScore === null) {
      newErrors.maxScore = 'Vui lòng nhập điểm tối đa';
    } else if (formData.maxScore < 0 || formData.maxScore > 10) {
      newErrors.maxScore = 'Điểm phải từ 0 đến 10';
    }
    
    // Description (optional but validate length if provided)
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
      
      // Ensure deadline is defined
      if (!formData.deadline) {
        setError('Vui lòng chọn deadline');
        setSubmitting(false);
        return;
      }
      
      // Format deadline: "2026-02-12T02:02" -> "2026-02-12T02:02:00"
      let deadline = formData.deadline;
      if (!deadline.includes(':00', deadline.lastIndexOf(':'))) {
        deadline = deadline + ':00';
      }
      
      console.log('[EditHomework] Formatted deadline:', deadline);
      
      // Handle file upload if user selected a new file
      let finalAttachmentUrl = formData.attachmentUrl || '';
      
      if (attachmentFile) {
        // User wants to upload a new file
        console.log('[EditHomework] Uploading new file:', attachmentFile.name);
        
        try {
          // Use a valid deadline for temporary homework (far future)
          const tempDeadline = '2099-12-31T23:59:00';
          
          // Upload file using temporary homework creation
          const tempFormData = new FormData();
          tempFormData.append('classId', formData.classId.toString());
          tempFormData.append('title', 'TEMP_FILE_UPLOAD_' + Date.now());
          tempFormData.append('description', 'Temporary upload for file');
          tempFormData.append('homeworkType', 'REGULAR');
          tempFormData.append('deadline', tempDeadline);
          tempFormData.append('maxScore', '10');
          tempFormData.append('file', attachmentFile);
          
          console.log('[EditHomework] Creating temp homework with deadline:', tempDeadline);
          
          // Create temporary homework to upload file
          const tempResponse = await apiClient.post('/api/teacher/homework', tempFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          const tempHomework = tempResponse.data.data || tempResponse.data;
          finalAttachmentUrl = tempHomework.attachmentUrl || '';
          
          console.log('[EditHomework] Temp homework created:', tempHomework.homeworkId);
          
          // Delete the temporary homework immediately
          if (tempHomework.homeworkId) {
            await apiClient.delete(`/api/teacher/homework/${tempHomework.homeworkId}`);
            console.log('[EditHomework] Temp homework deleted');
          }
          
          console.log('[EditHomework] File uploaded successfully, URL:', finalAttachmentUrl);
          
        } catch (uploadErr) {
          console.error('[EditHomework] File upload failed:', uploadErr);
          setError('Không thể upload file mới. Vui lòng thử lại!');
          setSubmitting(false);
          return;
        }
      } else if (!keepExistingFile) {
        // User removed the file
        finalAttachmentUrl = '';
      }
      
      // Update homework with all data
      const updateRequest: HomeworkRequest = {
        classId: formData.classId,
        title: formData.title,
        description: formData.description || '',
        homeworkType: formData.homeworkType,
        deadline: deadline,
        maxScore: formData.maxScore ?? 10,
        attachmentUrl: finalAttachmentUrl
      };
      
      console.log('[EditHomework] Update request:', updateRequest);
      
      const result = await homeworkApi.updateHomework(Number(id), updateRequest);
      
      console.log('[EditHomework] Updated successfully:', result.homeworkId);
      alert('Cập nhật bài tập thành công!');
      navigate(`/teacher/assignments/${result.homeworkId}`);
      
    } catch (err: unknown) {
      console.error('[EditHomework] Failed:', err);

      const message = isApiError(err)
        ? err.response?.data?.message ?? err.message ?? 'Có lỗi xảy ra khi cập nhật bài tập!'
        : 'Có lỗi xảy ra khi cập nhật bài tập!';

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
  
  const handleInputChange = <K extends keyof HomeworkRequest>(
    field: K,
    value: HomeworkRequest[K]
  ) => {
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
    // Only show warning if type changed
    if (originalHomework && formData.homeworkType !== originalHomework.homeworkType) {
      if (formData.homeworkType === 'MIDTERM') {
        return 'Lưu ý: Mỗi lớp chỉ có 1 bài Giữa kỳ';
      } else if (formData.homeworkType === 'FINAL') {
        return 'Lưu ý: Mỗi lớp chỉ có 1 bài Cuối kỳ';
      }
    }
    return null;
  };
  
  const user = useAuthStore((state) => state.user);

  
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
  
  if (error && !originalHomework) {
    return (
      <div className="tch-container">
        <div className="tch-empty">
          <h3>Lỗi</h3>
          <p>{error}</p>
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
        <button onClick={() => navigate(`/teacher/assignments/${id}`)} className="tch-btn-back">
          ← Quay lại
        </button>
        <div>
          <h1>Chỉnh sửa bài tập</h1>
          <p>Cập nhật thông tin bài tập</p>
        </div>
      </div>
      
      {/* Global Error */}
      {error && (
        <div className="tch-error-banner">
          <div>
            <strong>Lỗi:</strong> {error}
          </div>
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="tch-form">
        <div className="tch-section">
          <h2>Thông tin cơ bản</h2>
          
          {/* Class Selection - Disabled (cannot change class) */}
          <div className="tch-group">
            <label htmlFor="classId" className="tch-label">
              Lớp học <span className="tch-required">*</span>
            </label>
            <select
              id="classId"
              value={formData.classId}
              onChange={(e) => handleInputChange('classId', Number(e.target.value))}
              className={`tch-select ${errors.classId ? 'error' : ''}`}
              disabled
              style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
            >
              <option value={0}>Chọn lớp học</option>
              {classes.map(cls => (
                <option key={cls.classId} value={cls.classId}>
                  {cls.classCode} - {cls.subjectName}
                </option>
              ))}
            </select>
            {errors.classId && <span className="tch-error-msg">{errors.classId}</span>}
            <span className="tch-helper-text">Không thể thay đổi lớp học</span>
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
            <span className="tch-helper-text">Chọn ngày và giờ deadline (có thể gia hạn)</span>
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
          
          {/* ✅ File Upload Section - Now supports file replacement */}
          <div className="tch-group">
            <label className="tch-label">Tệp đính kèm (tùy chọn)</label>
            
            {/* Show existing file if present and not uploading new one */}
            {keepExistingFile && originalHomework?.attachmentUrl && !attachmentFile && (
              <div className="tch-file-preview" style={{ marginBottom: '12px' }}>
                <div className="tch-file-content">
                  <div className="tch-file-info">
                    <span className="tch-file-icon">file</span>
                    <div className="tch-file-details">
                      <div className="tch-file-name">
                        File hiện tại: {getFileNameFromUrl(originalHomework.attachmentUrl)}
                      </div>
                      <a 
                        href={originalHomework.attachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="tch-file-size"
                        style={{ color: '#10b981', textDecoration: 'underline' }}
                      >
                        Xem file
                      </a>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleRemoveExistingFile}
                    className="tch-btn-remove-file"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            )}
            
            {/* File upload input */}
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
                {keepExistingFile && originalHomework?.attachmentUrl ? 'Thay đổi file' : 'Chọn file'}
              </label>
              <span className="tch-file-hint">
                Tối đa 10MB
              </span>
            </div>
            
            {fileError && (
              <div className="tch-file-error">
                {fileError}
              </div>
            )}
            
            {/* Show new file preview if uploading */}
            {attachmentFile && (
              <div className="tch-file-preview">
                <div className="tch-file-content">
                  <div className="tch-file-info">
                    <span className="tch-file-icon">
                      {attachmentFile.name.endsWith('.pdf') ? 'pdf' :
                       attachmentFile.name.endsWith('.doc') || attachmentFile.name.endsWith('.docx') ? 'docx' :
                       attachmentFile.name.endsWith('.xls') || attachmentFile.name.endsWith('.xlsx') ? 'xlsx' :
                       attachmentFile.name.endsWith('.ppt') || attachmentFile.name.endsWith('.pptx') ? 'pptx' :
                       attachmentFile.name.endsWith('.zip') || attachmentFile.name.endsWith('.rar') ? 'zip' : 'file'}
                    </span>
                    <div className="tch-file-details">
                      <div className="tch-file-name">
                        File mới: {attachmentFile.name}
                      </div>
                      <div className="tch-file-size">{formatFileSize(attachmentFile.size)}</div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="tch-btn-remove-file"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            )}
            
            <small className="tch-helper-text">
              Hỗ trợ: PDF, Word, Excel, PowerPoint, ZIP. File mới sẽ thay thế file cũ.
            </small>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="tch-actions">
          <button
            type="button"
            onClick={() => navigate(`/teacher/assignments/${id}`)}
            className="tch-btn-cancel"
            disabled={submitting}
          >
            Hủy
          </button>
          
          <button
            type="submit"
            className="tch-btn-submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="tch-spinner-small"></span>
                Đang lưu...
              </>
            ) : (
              <>Lưu thay đổi</>
            )}
          </button>
        </div>
      </form>
      <ChatList currentUsername={user?.username || 'teacher'} currentRole="TEACHER" />
    </div>
  );
};

export default EditHomework;