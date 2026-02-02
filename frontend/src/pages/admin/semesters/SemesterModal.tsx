import React, { useState, useEffect } from 'react';
import semesterApi, { SemesterCreateRequest, SemesterUpdateRequest, SemesterResponse } from '../../../services/api/semesterApi';
import './SemesterModal.css';

interface SemesterModalProps {
  semester: SemesterResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SemesterModal: React.FC<SemesterModalProps> = ({ semester, onClose, onSuccess }) => {
  const isEditMode = semester !== null;

  // Form state
  const [formData, setFormData] = useState({
    semesterCode: '',
    semesterName: '',
    startDate: '',
    endDate: '',
    status: 'UPCOMING' as 'UPCOMING' | 'ACTIVE' | 'COMPLETED',
    registrationStartDate: '',
    registrationEndDate: '',
    description: ''
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Initialize form data for edit mode
  useEffect(() => {
    if (semester) {
      setFormData({
        semesterCode: semester.semesterCode,
        semesterName: semester.semesterName,
        startDate: semester.startDate,
        endDate: semester.endDate,
        status: semester.status,
        registrationStartDate: semester.registrationStartDate || '',
        registrationEndDate: semester.registrationEndDate || '',
        description: semester.description || ''
      });
    }
  }, [semester]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Auto-calculate end date (10 weeks = 70 days from start)
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = e.target.value;
    setFormData(prev => ({ ...prev, startDate }));

    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 70);  // 10 weeks
      const endDateStr = end.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, endDate: endDateStr }));
    }

    // Clear error
    if (errors.startDate) {
      setErrors(prev => ({ ...prev, startDate: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Semester code (only for create mode)
    if (!isEditMode) {
      if (!formData.semesterCode.trim()) {
        newErrors.semesterCode = 'Mã học kỳ không được để trống';
      } else if (!/^\d{4}-[123]$/.test(formData.semesterCode)) {
        newErrors.semesterCode = 'Mã học kỳ phải theo định dạng YYYY-S (VD: 2024-1)';
      }
    }

    // Semester name
    if (!formData.semesterName.trim()) {
      newErrors.semesterName = 'Tên học kỳ không được để trống';
    } else if (formData.semesterName.length > 100) {
      newErrors.semesterName = 'Tên học kỳ không quá 100 ký tự';
    }

    // Dates
    if (!formData.startDate) {
      newErrors.startDate = 'Ngày bắt đầu không được để trống';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Ngày kết thúc không được để trống';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end <= start) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
      }

      // Check duration (10 weeks ±10 days)
      const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (days < 60 || days > 80) {
        newErrors.endDate = `Thời lượng ${days} ngày (khuyến nghị: 70 ngày = 10 tuần)`;
      }
    }

    // Registration period validation
    if (formData.registrationStartDate && formData.registrationEndDate) {
      const regStart = new Date(formData.registrationStartDate);
      const regEnd = new Date(formData.registrationEndDate);
      const semStart = new Date(formData.startDate);

      if (regEnd <= regStart) {
        newErrors.registrationEndDate = 'Ngày kết thúc ĐK phải sau ngày bắt đầu ĐK';
      }

      if (regEnd > semStart) {
        newErrors.registrationEndDate = 'Ngày kết thúc ĐK phải trước hoặc bằng ngày bắt đầu học kỳ';
      }
    } else if (formData.registrationStartDate || formData.registrationEndDate) {
      if (!formData.registrationStartDate) {
        newErrors.registrationStartDate = 'Vui lòng nhập cả 2 ngày đăng ký';
      }
      if (!formData.registrationEndDate) {
        newErrors.registrationEndDate = 'Vui lòng nhập cả 2 ngày đăng ký';
      }
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
      setLoading(true);

      if (isEditMode) {
        // Update semester
        const updateData: SemesterUpdateRequest = {
          semesterName: formData.semesterName,
          startDate: formData.startDate,
          endDate: formData.endDate,
          registrationStartDate: formData.registrationStartDate || undefined,
          registrationEndDate: formData.registrationEndDate || undefined,
          description: formData.description || undefined
        };

        await semesterApi.update(semester.semesterId, updateData);
        alert('Cập nhật học kỳ thành công!');
      } else {
        // Create semester
        const createData: SemesterCreateRequest = {
          semesterCode: formData.semesterCode,
          semesterName: formData.semesterName,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          registrationStartDate: formData.registrationStartDate || undefined,
          registrationEndDate: formData.registrationEndDate || undefined,
          description: formData.description || undefined
        };

        await semesterApi.create(createData);
        alert('Thêm học kỳ thành công!');
      }

      onSuccess();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error saving semester:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert('Lỗi: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="semester-modal-overlay" onClick={onClose}>
      <div className="semester-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="semester-modal-header">
          <h2>{isEditMode ? ' Sửa Học kỳ' : ' Thêm Học kỳ'}</h2>
          <button className="semester-btn-close" onClick={onClose}>×</button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="semester-modal-body">
          {/* Row 1: Semester Code + Semester Name */}
          <div className="semester-form-row">
            <div className="semester-form-group">
              <label>
                Mã học kỳ <span className="semester-required">*</span>
              </label>
              <input
                type="text"
                name="semesterCode"
                value={formData.semesterCode}
                onChange={handleChange}
                placeholder="VD: 2024-1, 2024-2"
                disabled={isEditMode}
                className={errors.semesterCode ? 'semester-error' : ''}
              />
              {errors.semesterCode && (
                <span className="semester-error-text">{errors.semesterCode}</span>
              )}
              {!isEditMode && (
                <span className="semester-help-text">Định dạng: YYYY-S (S = 1, 2, 3)</span>
              )}
            </div>

            <div className="semester-form-group">
              <label>
                Tên học kỳ <span className="semester-required">*</span>
              </label>
              <input
                type="text"
                name="semesterName"
                value={formData.semesterName}
                onChange={handleChange}
                placeholder="VD: Học kỳ 1 năm 2024-2025"
                className={errors.semesterName ? 'semester-error' : ''}
              />
              {errors.semesterName && (
                <span className="semester-error-text">{errors.semesterName}</span>
              )}
            </div>
          </div>

          {/* Row 2: Start Date + End Date */}
          <div className="semester-form-row">
            <div className="semester-form-group">
              <label>
                Ngày bắt đầu <span className="semester-required">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleStartDateChange}
                className={errors.startDate ? 'semester-error' : ''}
              />
              {errors.startDate && (
                <span className="semester-error-text">{errors.startDate}</span>
              )}
            </div>

            <div className="semester-form-group">
              <label>
                Ngày kết thúc <span className="semester-required">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={errors.endDate ? 'semester-error' : ''}
              />
              {errors.endDate && (
                <span className="semester-error-text">{errors.endDate}</span>
              )}
              <span className="semester-help-text">
                Tự động: 70 ngày (10 tuần) từ ngày bắt đầu
              </span>
            </div>
          </div>

          {/* Row 3: Status (only for create) */}
          {!isEditMode && (
            <div className="semester-form-group">
              <label>
                Trạng thái ban đầu <span className="semester-required">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="UPCOMING">Sắp diễn ra</option>
                <option value="ACTIVE">Đang diễn ra</option>
              </select>
              <span className="semester-help-text">
                Khuyến nghị: Tạo với trạng thái "Sắp diễn ra"
              </span>
            </div>
          )}

          {/* Registration Period Section */}
          <div className="semester-form-section">
            <h3> Thời gian đăng ký (Tùy chọn)</h3>
            
            <div className="semester-form-row">
              <div className="semester-form-group">
                <label>Ngày bắt đầu đăng ký</label>
                <input
                  type="date"
                  name="registrationStartDate"
                  value={formData.registrationStartDate}
                  onChange={handleChange}
                  className={errors.registrationStartDate ? 'semester-error' : ''}
                />
                {errors.registrationStartDate && (
                  <span className="semester-error-text">{errors.registrationStartDate}</span>
                )}
              </div>

              <div className="semester-form-group">
                <label>Ngày kết thúc đăng ký</label>
                <input
                  type="date"
                  name="registrationEndDate"
                  value={formData.registrationEndDate}
                  onChange={handleChange}
                  className={errors.registrationEndDate ? 'semester-error' : ''}
                />
                {errors.registrationEndDate && (
                  <span className="semester-error-text">{errors.registrationEndDate}</span>
                )}
              </div>
            </div>

            <div className="semester-info-box">
              <strong>Lưu ý:</strong> Ngày kết thúc đăng ký phải trước hoặc bằng ngày bắt đầu học kỳ
            </div>
          </div>

          {/* Description */}
          <div className="semester-form-group">
            <label>Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Mô tả về học kỳ..."
            />
          </div>

          {/* FOOTER */}
          <div className="semester-modal-footer">
            <button type="button" className="semester-btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="semester-btn-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : isEditMode ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SemesterModal;