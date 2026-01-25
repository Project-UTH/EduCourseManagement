import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import classApi, { ClassResponse } from '../../../services/api/classApi';
import homeworkApi, { HomeworkRequest, HomeworkResponse } from '../../../services/api/homeworkApi';
import './CreateHomework.css'; // Sử dụng chung file CSS đã Namespaced (tch-)
import ChatList from '../../../components/chat/ChatList';
import { useAuthStore } from '@/store/authStore';


/**
 * EditHomework Page
 * * Form to edit existing homework assignment
 * Uses 'tch-' namespaced classes from CreateHomework.css
 */

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
        
        console.log('[EditHomework] ✅ Loaded homework:', homework);
      }
    } catch (err: any) {
      console.error('[EditHomework] ❌ Failed to load:', err);
      setError(err.response?.data?.message || 'Không thể tải thông tin bài tập!');
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
      
      // Ensure proper datetime format with T and seconds
      let deadline = formData.deadline;
      if (deadline) {
        // Replace space with T if present
        deadline = deadline.replace(' ', 'T');
        
        // Add seconds if not present
        if (!deadline.includes(':00', deadline.lastIndexOf(':'))) {
          deadline = deadline + ':00';
        }
      }
      
      const updateRequest: HomeworkRequest = {
        ...formData,
        deadline: deadline
      };
      
      console.log('[EditHomework] Updating homework:', updateRequest);
      
      const result = await homeworkApi.updateHomework(Number(id), updateRequest);
      
      console.log('[EditHomework] ✅ Updated:', result.homeworkId);
      
      alert('✅ Cập nhật bài tập thành công!');
      navigate(`/teacher/assignments/${result.homeworkId}`);
      
    } catch (err: any) {
      console.error('[EditHomework] ❌ Failed:', err);
      
      const message = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi cập nhật bài tập!';
      
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
    
    // Clear error for this field
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
        return '⚠️ Lưu ý: Mỗi lớp chỉ có 1 bài Giữa kỳ';
      } else if (formData.homeworkType === 'FINAL') {
        return '⚠️ Lưu ý: Mỗi lớp chỉ có 1 bài Cuối kỳ';
      }
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
  
  if (error && !originalHomework) {
    return (
      <div className="tch-container">
        <div className="tch-empty">
          <span className="tch-empty-icon">❌</span>
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
          <h1>✏️ Chỉnh sửa bài tập</h1>
          <p>Cập nhật thông tin bài tập</p>
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
            <span className="tch-helper-text">⚠️ Không thể thay đổi lớp học</span>
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
          
          {/* Attachment URL (Legacy Mode) */}
          <div className="tch-group">
            <label htmlFor="attachmentUrl" className="tch-label">
              URL file đính kèm (tùy chọn)
            </label>
            <input
              type="url"
              id="attachmentUrl"
              value={formData.attachmentUrl || ''}
              onChange={(e) => handleInputChange('attachmentUrl', e.target.value)}
              placeholder="https://example.com/file.pdf"
              className="tch-input"
            />
            <span className="tch-helper-text">
              Dán URL file đính kèm (PDF, DOC, DOCX, XLS, XLSX, PPT, ZIP)
            </span>
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
                Đang lưu...
              </>
            ) : (
              <>✅ Lưu thay đổi</>
            )}
          </button>
        </div>
      </form>
      <ChatList currentUsername={user?.username || 'teacher'} currentRole="TEACHER" />
    </div>
  );
};

export default EditHomework;