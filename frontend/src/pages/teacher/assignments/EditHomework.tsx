import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import classApi, { ClassResponse } from '../../../services/api/classApi';
import homeworkApi, { HomeworkRequest, HomeworkResponse } from '../../../services/api/homeworkApi';
import './CreateHomework.css'; // Reuse same CSS

/**
 * EditHomework Page
 * 
 * Form to edit existing homework assignment
 * Pre-fills data from existing homework
 * Validates MIDTERM/FINAL uniqueness per class (if type changed)
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
    // Note: Don't validate future date for edit, teacher might want to extend
    
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
      
      // ✅ FIX: Ensure proper datetime format with T and seconds
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
      
      // Show success and navigate back to detail
      alert('✅ Cập nhật bài tập thành công!');
      navigate(`/teacher/assignments/${result.homeworkId}`);
      
    } catch (err: any) {
      console.error('[EditHomework] ❌ Failed:', err);
      
      const message = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi cập nhật bài tập!';
      
      // Check for specific errors
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
  
  if (loading) {
    return (
      <div className="create-homework-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }
  
  if (error && !originalHomework) {
    return (
      <div className="create-homework-container">
        <div className="empty-state">
          <span className="empty-icon">❌</span>
          <h3>Lỗi</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/teacher/assignments')} className="btn-secondary">
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="create-homework-container">
      {/* Header */}
      <div className="page-header">
        <button onClick={() => navigate(`/teacher/assignments/${id}`)} className="btn-back">
          ← Quay lại
        </button>
        <div>
          <h1>✏️ Chỉnh sửa bài tập</h1>
          <p>Cập nhật thông tin bài tập</p>
        </div>
      </div>
      
      {/* Global Error */}
      {error && (
        <div className="error-banner">
          <span>❌</span>
          <div>
            <strong>Lỗi:</strong> {error}
          </div>
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="homework-form">
        <div className="form-section">
          <h2>📋 Thông tin cơ bản</h2>
          
          {/* Class Selection - Disabled (cannot change class) */}
          <div className="form-group">
            <label htmlFor="classId">
              Lớp học <span className="required">*</span>
            </label>
            <select
              id="classId"
              value={formData.classId}
              onChange={(e) => handleInputChange('classId', Number(e.target.value))}
              className={errors.classId ? 'error' : ''}
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
            {errors.classId && <span className="error-message">{errors.classId}</span>}
            <span className="helper-text">⚠️ Không thể thay đổi lớp học</span>
          </div>
          
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">
              Tiêu đề <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="VD: Bài tập tuần 5 - Xây dựng website"
              maxLength={200}
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
            <span className="helper-text">{formData.title.length}/200 ký tự</span>
          </div>
          
          {/* Homework Type */}
          <div className="form-group">
            <label>
              Loại bài tập <span className="required">*</span>
            </label>
            <div className="radio-group">
              {(['REGULAR', 'MIDTERM', 'FINAL'] as HomeworkType[]).map(type => (
                <label key={type} className="radio-label">
                  <input
                    type="radio"
                    name="homeworkType"
                    value={type}
                    checked={formData.homeworkType === type}
                    onChange={(e) => handleInputChange('homeworkType', e.target.value as HomeworkType)}
                  />
                  <span>{getTypeLabel(type)}</span>
                </label>
              ))}
            </div>
            {errors.homeworkType && <span className="error-message">{errors.homeworkType}</span>}
            {getTypeWarning() && (
              <div className="warning-message">{getTypeWarning()}</div>
            )}
          </div>
          
          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Mô tả chi tiết yêu cầu bài tập..."
              rows={5}
              maxLength={2000}
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
            <span className="helper-text">{(formData.description || '').length}/2000 ký tự</span>
          </div>
          
          {/* Deadline */}
          <div className="form-group">
            <label htmlFor="deadline">
              Deadline <span className="required">*</span>
            </label>
            <input
              type="datetime-local"
              id="deadline"
              value={formData.deadline}
              onChange={(e) => handleInputChange('deadline', e.target.value)}
              className={errors.deadline ? 'error' : ''}
            />
            {errors.deadline && <span className="error-message">{errors.deadline}</span>}
            <span className="helper-text">Chọn ngày và giờ deadline (có thể gia hạn)</span>
          </div>
          
          {/* Max Score */}
          <div className="form-group">
            <label htmlFor="maxScore">
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
              className={errors.maxScore ? 'error' : ''}
            />
            {errors.maxScore && <span className="error-message">{errors.maxScore}</span>}
            <span className="helper-text">Mặc định: 10.00 điểm</span>
          </div>
          
          {/* Attachment URL */}
          <div className="form-group">
            <label htmlFor="attachmentUrl">
              File đính kèm (tùy chọn)
            </label>
            <input
              type="url"
              id="attachmentUrl"
              value={formData.attachmentUrl || ''}
              onChange={(e) => handleInputChange('attachmentUrl', e.target.value)}
              placeholder="https://example.com/file.pdf"
            />
            <span className="helper-text">
              Dán URL file đính kèm (PDF, DOC, DOCX, XLS, XLSX, PPT, ZIP)
            </span>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(`/teacher/assignments/${id}`)}
            className="btn-cancel"
            disabled={submitting}
          >
            ❌ Hủy
          </button>
          
          <button
            type="submit"
            className="btn-submit"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-small"></span>
                Đang lưu...
              </>
            ) : (
              <>✅ Lưu thay đổi</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditHomework;