import React, { useState, useEffect } from 'react';
import subjectApi, { 
  Subject,
  SubjectCreateRequest, 
  SubjectUpdateRequest
} from '../../../services/api/subjectApi';
import { Department } from '../../../services/api/departmentApi';
import { Major } from '../../../services/api/majorApi';
import majorApi from '../../../services/api/majorApi';
import './SubjectModal.css';

/**
 * Subject Modal V2 - Vietnamese Version
 * Thêm Chuyên ngành và Số buổi học
 */

interface SubjectModalProps {
  subject: Subject | null;
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  subjectCode?: string;
  subjectName?: string;
  credits?: string;
  totalSessions?: string;
  elearningSessions?: string;
  inpersonSessions?: string;
  departmentId?: string;
  majorId?: string;
  description?: string;
}

const SubjectModal: React.FC<SubjectModalProps> = ({
  subject,
  departments,
  onClose,
  onSuccess,
}) => {
  const isEditMode = subject !== null;

  // Form state với sessions
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    credits: 3,
    totalSessions: 15,
    elearningSessions: 5,
    inpersonSessions: 10,
    departmentId: departments.length > 0 ? departments[0].departmentId : 0,
    majorId: 0,
    description: '',
  });

  const [majors, setMajors] = useState<Major[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Load majors khi chọn department
   */
  useEffect(() => {
    const fetchMajors = async () => {
      if (formData.departmentId > 0) {
        try {
          setLoadingMajors(true);
          const response = await majorApi.getByDepartment(formData.departmentId);
          const majorsList = Array.isArray(response.data) ? response.data : [];
          setMajors(majorsList);
          
          // Reset majorId if not in new list
          if (formData.majorId > 0) {
            const majorExists = majorsList.some(m => m.majorId === formData.majorId);
            if (!majorExists) {
              setFormData(prev => ({ ...prev, majorId: 0 }));
            }
          }
        } catch (err) {
          console.error('[SubjectModal] Lỗi tải chuyên ngành:', err);
          setMajors([]);
        } finally {
          setLoadingMajors(false);
        }
      } else {
        setMajors([]);
      }
    };
    
    fetchMajors();
  }, [formData.departmentId, formData.majorId]);

  /**
   * Initialize form data in edit mode
   */
  useEffect(() => {
    if (subject) {
      setFormData({
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        credits: subject.credits,
        totalSessions: subject.totalSessions,
        elearningSessions: subject.elearningSessions,
        inpersonSessions: subject.inpersonSessions,
        departmentId: subject.departmentId,
        majorId: subject.majorId || 0,
        description: subject.description || '',
      });
    } else if (departments.length > 0) {
      setFormData(prev => ({
        ...prev,
        departmentId: departments[0].departmentId,
      }));
    }
  }, [subject, departments]);

  /**
   * Auto-calculate sessions dựa trên credits
   * LƯU Ý: Backend cũng sẽ tự tính nếu frontend gửi sai
   */
  const autoCalculateSessions = (credits: number) => {
    let total: number, elearning: number, inperson: number;
    
    switch (credits) {
      case 2:
        total = 10;
        elearning = 5;
        inperson = 5;
        break;
      case 3:
        total = 15;
        elearning = 5;
        inperson = 10;
        break;
      case 4:
        total = 20;
        elearning = 5;
        inperson = 15;
        break;
      default:
        total = credits * 5;
        elearning = Math.max(1, Math.floor(total / 3));
        inperson = total - elearning;
    }
    
    return { total, elearning, inperson };
  };

  /**
   * Handle input change
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const numericFields = ['credits', 'totalSessions', 'elearningSessions', 'inpersonSessions', 'departmentId', 'majorId'];
    const processedValue = numericFields.includes(name) ? Number(value) : value;
    
    // Auto-calculate sessions khi thay đổi credits
    if (name === 'credits') {
      const credits = Number(value);
      const sessions = autoCalculateSessions(credits);
      setFormData(prev => ({
        ...prev,
        credits,
        totalSessions: sessions.total,
        elearningSessions: sessions.elearning,
        inpersonSessions: sessions.inperson,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
    
    // Clear error
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Subject Code
    if (!formData.subjectCode.trim()) {
      newErrors.subjectCode = 'Mã môn học không được để trống';
    } else if (formData.subjectCode.length > 10) {
      newErrors.subjectCode = 'Mã môn học không quá 10 ký tự';
    }

    // Subject Name
    if (!formData.subjectName.trim()) {
      newErrors.subjectName = 'Tên môn học không được để trống';
    } else if (formData.subjectName.length > 100) {
      newErrors.subjectName = 'Tên môn học không quá 100 ký tự';
    }

    // Credits
    if (!formData.credits || formData.credits < 1) {
      newErrors.credits = 'Số tín chỉ phải ít nhất là 1';
    } else if (formData.credits > 10) {
      newErrors.credits = 'Số tín chỉ không quá 10';
    }

    // Total Sessions
    if (!formData.totalSessions || formData.totalSessions < 1) {
      newErrors.totalSessions = 'Tổng số buổi phải ít nhất là 1';
    }

    // E-learning Sessions
    if (formData.elearningSessions === null || formData.elearningSessions === undefined) {
      newErrors.elearningSessions = 'Số buổi E-Learning là bắt buộc';
    } else if (formData.elearningSessions < 0) {
      newErrors.elearningSessions = 'Số buổi E-Learning không được âm';
    }

    // In-person Sessions
    if (formData.inpersonSessions === null || formData.inpersonSessions === undefined) {
      newErrors.inpersonSessions = 'Số buổi trực tiếp là bắt buộc';
    } else if (formData.inpersonSessions < 0) {
      newErrors.inpersonSessions = 'Số buổi trực tiếp không được âm';
    }

    // Validate sum (backend sẽ tự fix nếu sai)
    if (formData.totalSessions !== (formData.elearningSessions + formData.inpersonSessions)) {
      console.warn('Tổng buổi không khớp. Backend sẽ tự động tính lại.');
    }

    // Department
    if (!formData.departmentId || formData.departmentId === 0) {
      newErrors.departmentId = 'Vui lòng chọn khoa';
    }

    // Description
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Mô tả không quá 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle submit
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare data (majorId = 0 means no major)
      const submitData = {
        ...formData,
        majorId: formData.majorId > 0 ? formData.majorId : undefined,
      };

      if (isEditMode) {
        await subjectApi.update(subject.subjectId, submitData as SubjectUpdateRequest);
        alert('Cập nhật môn học thành công!');
      } else {
        await subjectApi.create(submitData as SubjectCreateRequest);
        alert('Thêm môn học thành công!');
      }

      onSuccess();
    } catch (err) {
      console.error('[SubjectModal] Lỗi lưu môn học:', err);
      
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { status?: number; data?: { message?: string } } };
        if (error.response?.status === 400) {
          const errorMessage = error.response.data?.message || 'Dữ liệu không hợp lệ';
          
          if (errorMessage.includes('already exists')) {
            setErrors({ subjectCode: 'Mã môn học đã tồn tại' });
          } else if (errorMessage.includes('Department not found')) {
            setErrors({ departmentId: 'Khoa không tồn tại' });
          } else if (errorMessage.includes('Major not found')) {
            setErrors({ majorId: 'Chuyên ngành không tồn tại' });
          } else {
            alert(errorMessage);
          }
        } else if (error.response?.status === 404) {
          alert('Không tìm thấy môn học. Vui lòng thử lại!');
        } else {
          alert('Có lỗi xảy ra. Vui lòng thử lại!');
        }
      } else {
        alert('Có lỗi xảy ra. Vui lòng thử lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get department name by ID
   */
  const getDepartmentName = (id: number): string => {
    const dept = departments.find(d => d.departmentId === id);
    return dept ? `${dept.departmentCode} - ${dept.departmentName}` : '';
  };

  /**
   * Get major name by ID
   */
  const getMajorName = (id: number): string => {
    const major = majors.find(m => m.majorId === id);
    return major ? `${major.majorCode} - ${major.majorName}` : '';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Sửa Môn học' : 'Thêm Môn học Mới'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Department */}
          <div className="form-group">
            <label htmlFor="departmentId">
              Khoa <span className="required">*</span>
            </label>
            <select
              id="departmentId"
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              className={errors.departmentId ? 'error' : ''}
              disabled={loading}
            >
              <option value={0}>-- Chọn khoa --</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentCode} - {dept.departmentName}
                </option>
              ))}
            </select>
            {errors.departmentId && (
              <span className="error-text">{errors.departmentId}</span>
            )}
            {formData.departmentId > 0 && (
              <span className="helper-text">
                Đã chọn: {getDepartmentName(formData.departmentId)}
              </span>
            )}
          </div>

          {/* Major */}
          <div className="form-group">
            <label htmlFor="majorId">
              Chuyên ngành <span className="optional">(Tùy chọn)</span>
            </label>
            <select
              id="majorId"
              name="majorId"
              value={formData.majorId}
              onChange={handleChange}
              className={errors.majorId ? 'error' : ''}
              disabled={loading || loadingMajors || majors.length === 0}
            >
              <option value={0}>-- Không chọn chuyên ngành --</option>
              {majors.map((major) => (
                <option key={major.majorId} value={major.majorId}>
                  {major.majorCode} - {major.majorName}
                </option>
              ))}
            </select>
            {loadingMajors && (
              <span className="helper-text">Đang tải chuyên ngành...</span>
            )}
            {!loadingMajors && majors.length === 0 && formData.departmentId > 0 && (
              <span className="helper-text text-muted">Khoa này chưa có chuyên ngành</span>
            )}
            {!loadingMajors && formData.majorId > 0 && (
              <span className="helper-text">
                Đã chọn: {getMajorName(formData.majorId)}
              </span>
            )}
            {errors.majorId && (
              <span className="error-text">{errors.majorId}</span>
            )}
          </div>

          {/* Subject Code */}
          <div className="form-group">
            <label htmlFor="subjectCode">
              Mã Môn học <span className="required">*</span>
            </label>
            <input
              type="text"
              id="subjectCode"
              name="subjectCode"
              value={formData.subjectCode}
              onChange={handleChange}
              placeholder="VD: IT101, MATH201"
              className={errors.subjectCode ? 'error' : ''}
              maxLength={10}
              disabled={loading || isEditMode}
            />
            {errors.subjectCode && (
              <span className="error-text">{errors.subjectCode}</span>
            )}
            {isEditMode && (
              <span className="helper-text">Mã môn học không thể thay đổi</span>
            )}
          </div>

          {/* Subject Name */}
          <div className="form-group">
            <label htmlFor="subjectName">
              Tên Môn học <span className="required">*</span>
            </label>
            <input
              type="text"
              id="subjectName"
              name="subjectName"
              value={formData.subjectName}
              onChange={handleChange}
              placeholder="VD: Lập trình Web"
              className={errors.subjectName ? 'error' : ''}
              maxLength={100}
              disabled={loading}
            />
            {errors.subjectName && (
              <span className="error-text">{errors.subjectName}</span>
            )}
          </div>

          {/* Credits - Auto-calculate sessions */}
          <div className="form-group">
            <label htmlFor="credits">
              Số tín chỉ <span className="required">*</span>
            </label>
            <input
              type="number"
              id="credits"
              name="credits"
              value={formData.credits}
              onChange={handleChange}
              min={1}
              max={10}
              className={errors.credits ? 'error' : ''}
              disabled={loading}
            />
            {errors.credits && (
              <span className="error-text">{errors.credits}</span>
            )}
            <span className="helper-text">
              Số tín chỉ (1-10). Số buổi học sẽ tự động tính.
            </span>
          </div>

          {/* Sessions - Auto-calculated */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="totalSessions">
                Tổng số buổi <span className="required">*</span>
              </label>
              <input
                type="number"
                id="totalSessions"
                name="totalSessions"
                value={formData.totalSessions}
                onChange={handleChange}
                min={1}
                className={errors.totalSessions ? 'error' : ''}
                disabled={loading}
              />
              {errors.totalSessions && (
                <span className="error-text">{errors.totalSessions}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="elearningSessions">
                Buổi E-Learning <span className="required">*</span>
              </label>
              <input
                type="number"
                id="elearningSessions"
                name="elearningSessions"
                value={formData.elearningSessions}
                onChange={handleChange}
                min={0}
                className={errors.elearningSessions ? 'error' : ''}
                disabled={loading}
              />
              {errors.elearningSessions && (
                <span className="error-text">{errors.elearningSessions}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="inpersonSessions">
                Buổi Trực tiếp <span className="required">*</span>
              </label>
              <input
                type="number"
                id="inpersonSessions"
                name="inpersonSessions"
                value={formData.inpersonSessions}
                onChange={handleChange}
                min={0}
                className={errors.inpersonSessions ? 'error' : ''}
                disabled={loading}
              />
              {errors.inpersonSessions && (
                <span className="error-text">{errors.inpersonSessions}</span>
              )}
            </div>
          </div>

          <div className="info-box">
            <strong>Quy tắc tính buổi:</strong>
            <ul>
              <li>2 tín chỉ = 10 buổi (5 E-Learning + 5 trực tiếp)</li>
              <li>3 tín chỉ = 15 buổi (5 E-Learning + 10 trực tiếp)</li>
              <li>4 tín chỉ = 20 buổi (5 E-Learning + 15 trực tiếp)</li>
              <li>Khác: Backend tự tính theo tỷ lệ</li>
            </ul>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nhập mô tả về môn học (tùy chọn)"
              rows={4}
              className={errors.description ? 'error' : ''}
              maxLength={500}
              disabled={loading}
            />
            <div className="char-count">
              {formData.description.length}/500 ký tự
            </div>
            {errors.description && (
              <span className="error-text">{errors.description}</span>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
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
              disabled={loading || departments.length === 0}
            >
              {loading ? 'Đang xử lý...' : isEditMode ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectModal;