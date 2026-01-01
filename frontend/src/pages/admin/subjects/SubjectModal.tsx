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
 * Subject Modal V4 - FINAL
 * ⭐ HIDDEN totalSessions field (auto-calculated)
 * User chỉ nhập: E-learning + Trực tiếp
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

  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    credits: 3,
    elearningSessions: 0,   // User nhập
    inpersonSessions: 15,   // User nhập
    departmentId: departments.length > 0 ? departments[0].departmentId : 0,
    majorId: 0,
    description: '',
  });

  const [majors, setMajors] = useState<Major[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // ⭐ AUTO-CALCULATE totalSessions
  const totalSessions = formData.elearningSessions + formData.inpersonSessions;

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
   * ⭐ AUTO-CALCULATE sessions khi thay đổi credits
   */
  const autoCalculateSessions = (credits: number) => {
    let elearning: number, inperson: number;
    
    switch (credits) {
      case 2:
        elearning = 0;
        inperson = 10;
        break;
      case 3:
        elearning = 0;
        inperson = 15;
        break;
      case 4:
        elearning = 0;
        inperson = 20;
        break;
      default:
        { const total = credits * 5;
        elearning = 0;
        inperson = total; }
    }
    
    return { elearning, inperson };
  };

  /**
   * Handle input change
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const numericFields = ['credits', 'elearningSessions', 'inpersonSessions', 'departmentId', 'majorId'];
    const processedValue = numericFields.includes(name) ? Number(value) : value;
    
    // Auto-calculate sessions khi thay đổi credits
    if (name === 'credits') {
      const credits = Number(value);
      const sessions = autoCalculateSessions(credits);
      setFormData(prev => ({
        ...prev,
        credits,
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

    // E-learning Sessions
    if (formData.elearningSessions === null || formData.elearningSessions === undefined) {
      newErrors.elearningSessions = 'Số buổi E-Learning là bắt buộc (có thể nhập 0)';
    } else if (formData.elearningSessions < 0) {
      newErrors.elearningSessions = 'Số buổi E-Learning không được âm';
    }

    // In-person Sessions
    if (formData.inpersonSessions === null || formData.inpersonSessions === undefined) {
      newErrors.inpersonSessions = 'Số buổi trực tiếp là bắt buộc';
    } else if (formData.inpersonSessions < 1) {
      newErrors.inpersonSessions = 'Số buổi trực tiếp phải ít nhất là 1';
    }

    // Total validation
    if (totalSessions < 1) {
      newErrors.inpersonSessions = 'Tổng số buổi phải ít nhất là 1';
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

      // ⭐ Include totalSessions in submit data (auto-calculated)
      const submitData = {
        subjectCode: formData.subjectCode,
        subjectName: formData.subjectName,
        credits: formData.credits,
        totalSessions: totalSessions,  // ⭐ AUTO-CALCULATED
        elearningSessions: formData.elearningSessions,
        inpersonSessions: formData.inpersonSessions,
        departmentId: formData.departmentId,
        majorId: formData.majorId > 0 ? formData.majorId : undefined,
        description: formData.description,
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

  const getDepartmentName = (id: number): string => {
    const dept = departments.find(d => d.departmentId === id);
    return dept ? `${dept.departmentCode} - ${dept.departmentName}` : '';
  };

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

          {/* Credits */}
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
          </div>

          {/* ⭐ SESSIONS - 2 FIELDS ONLY */}
          <div className="form-row-sessions">
            <div className="form-group">
              <label htmlFor="elearningSessions">
                Buổi E-Learning <span className="optional">(Có thể 0)</span>
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
                min={1}
                className={errors.inpersonSessions ? 'error' : ''}
                disabled={loading}
              />
              {errors.inpersonSessions && (
                <span className="error-text">{errors.inpersonSessions}</span>
              )}
            </div>

            {/* ⭐ TOTAL DISPLAY (READ-ONLY) */}
            <div className="form-group">
              <label>Tổng số buổi</label>
              <div className="total-sessions-display">
                {totalSessions} buổi
              </div>
              <span className="helper-text">Tự động tính = E-learning + Trực tiếp</span>
            </div>
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