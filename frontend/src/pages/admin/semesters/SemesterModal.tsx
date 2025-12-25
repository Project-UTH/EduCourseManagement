import React, { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import semesterApi, { 
  Semester,
  SemesterCreateRequest, 
  SemesterUpdateRequest
} from '../../../services/api/semesterApi';

/**
 * Semester Modal Component - Create/Edit
 */

interface SemesterModalProps {
  semester: Semester | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  semesterCode?: string;
  semesterName?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

const SemesterModal: React.FC<SemesterModalProps> = ({
  semester,
  onClose,
  onSuccess,
}) => {
  const isEditMode = semester !== null;

  const [formData, setFormData] = useState({
    semesterCode: '',
    semesterName: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (semester) {
      setFormData({
        semesterCode: semester.semesterCode,
        semesterName: semester.semesterName,
        startDate: semester.startDate,
        endDate: semester.endDate,
        description: semester.description || '',
      });
    }
  }, [semester]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!isEditMode) {
      if (!formData.semesterCode.trim()) {
        newErrors.semesterCode = 'Mã học kỳ không được để trống';
      } else if (formData.semesterCode.length > 20) {
        newErrors.semesterCode = 'Mã học kỳ không quá 20 ký tự';
      }
    }

    if (!formData.semesterName.trim()) {
      newErrors.semesterName = 'Tên học kỳ không được để trống';
    } else if (formData.semesterName.length > 100) {
      newErrors.semesterName = 'Tên học kỳ không quá 100 ký tự';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Ngày kết thúc là bắt buộc';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Mô tả không quá 500 ký tự';
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
        const updateData: SemesterUpdateRequest = {
          semesterName: formData.semesterName,
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description || undefined,
        };
        await semesterApi.update(semester.semesterId, updateData);
        alert('Cập nhật học kỳ thành công!');
      } else {
        const createData: SemesterCreateRequest = {
          semesterCode: formData.semesterCode,
          semesterName: formData.semesterName,
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description || undefined,
        };
        await semesterApi.create(createData);
        alert('Thêm học kỳ thành công!');
      }

      onSuccess();
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      console.error('[SemesterModal] Lỗi lưu học kỳ:', error);
      
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Dữ liệu không hợp lệ';
        
        if (errorMessage.includes('already exists')) {
          setErrors({ semesterCode: 'Mã học kỳ đã tồn tại' });
        } else {
          alert(errorMessage);
        }
      } else {
        alert('Có lỗi xảy ra. Vui lòng thử lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Sửa Học kỳ' : 'Thêm Học kỳ Mới'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Semester Code */}
          <div className="form-group">
            <label htmlFor="semesterCode">
              Mã Học kỳ <span className="required">*</span>
            </label>
            <input
              type="text"
              id="semesterCode"
              name="semesterCode"
              value={formData.semesterCode}
              onChange={handleChange}
              placeholder="VD: 2024-1, 2025-2"
              className={errors.semesterCode ? 'error' : ''}
              maxLength={20}
              disabled={loading || isEditMode}
            />
            {errors.semesterCode && (
              <span className="error-text">{errors.semesterCode}</span>
            )}
            {isEditMode && (
              <span className="helper-text">Mã học kỳ không thể thay đổi</span>
            )}
          </div>

          {/* Semester Name */}
          <div className="form-group">
            <label htmlFor="semesterName">
              Tên Học kỳ <span className="required">*</span>
            </label>
            <input
              type="text"
              id="semesterName"
              name="semesterName"
              value={formData.semesterName}
              onChange={handleChange}
              placeholder="VD: Học kỳ 1 năm 2024-2025"
              className={errors.semesterName ? 'error' : ''}
              maxLength={100}
              disabled={loading}
            />
            {errors.semesterName && (
              <span className="error-text">{errors.semesterName}</span>
            )}
          </div>

          {/* Dates */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">
                Ngày bắt đầu <span className="required">*</span>
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={errors.startDate ? 'error' : ''}
                disabled={loading}
              />
              {errors.startDate && (
                <span className="error-text">{errors.startDate}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="endDate">
                Ngày kết thúc <span className="required">*</span>
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={errors.endDate ? 'error' : ''}
                disabled={loading}
              />
              {errors.endDate && (
                <span className="error-text">{errors.endDate}</span>
              )}
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
              placeholder="Nhập mô tả về học kỳ (tùy chọn)"
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
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : isEditMode ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SemesterModal;