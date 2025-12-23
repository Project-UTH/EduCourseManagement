import React, { useState, useEffect } from 'react';
import majorApi, { 
  MajorCreateRequest, 
  MajorUpdateRequest, 
  MajorResponse 
} from '../../../services/api/majorApi';
import { DepartmentResponse } from '../../../services/api/departmentApi';
import './MajorModal.css';

/**
 * Major Modal (Create/Edit)
 * Phase 3 Sprint 3.1
 */

interface MajorModalProps {
  major: MajorResponse | null;
  departments: DepartmentResponse[];
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  majorCode?: string;
  majorName?: string;
  departmentId?: string;
  description?: string;
}

const MajorModal: React.FC<MajorModalProps> = ({
  major,
  departments,
  onClose,
  onSuccess,
}) => {
  const isEditMode = major !== null;

  // Form state
  const [formData, setFormData] = useState({
    majorCode: '',
    majorName: '',
    departmentId: departments.length > 0 ? departments[0].departmentId : 0,
    description: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Initialize form data in edit mode
   */
  useEffect(() => {
    if (major) {
      setFormData({
        majorCode: major.majorCode,
        majorName: major.majorName,
        departmentId: major.departmentId,
        description: major.description || '',
      });
    } else if (departments.length > 0) {
      setFormData(prev => ({
        ...prev,
        departmentId: departments[0].departmentId,
      }));
    }
  }, [major, departments]);

  /**
   * Handle input change
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'departmentId' ? Number(value) : value 
    }));
    
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.majorCode.trim()) {
      newErrors.majorCode = 'Mã chuyên ngành không được để trống';
    } else if (formData.majorCode.length > 10) {
      newErrors.majorCode = 'Mã chuyên ngành không quá 10 ký tự';
    }

    if (!formData.majorName.trim()) {
      newErrors.majorName = 'Tên chuyên ngành không được để trống';
    } else if (formData.majorName.length > 100) {
      newErrors.majorName = 'Tên chuyên ngành không quá 100 ký tự';
    }

    if (!formData.departmentId || formData.departmentId === 0) {
      newErrors.departmentId = 'Vui lòng chọn khoa';
    }

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

      if (isEditMode) {
        // Update existing major
        await majorApi.updateMajor(
          major.majorId,
          formData as MajorUpdateRequest
        );
        alert('Cập nhật chuyên ngành thành công!');
      } else {
        // Create new major
        await majorApi.createMajor(formData as MajorCreateRequest);
        alert('Thêm chuyên ngành thành công!');
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving major:', err);
      
      // Handle specific errors
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { status?: number; data?: { message?: string } } };
        if (error.response?.status === 400) {
          const errorMessage = error.response.data?.message || 'Dữ liệu không hợp lệ';
          
          if (errorMessage.includes('already exists')) {
            setErrors({ majorCode: 'Mã chuyên ngành đã tồn tại' });
          } else if (errorMessage.includes('Department not found')) {
            setErrors({ departmentId: 'Khoa không tồn tại' });
          } else {
            alert(errorMessage);
          }
        } else if (error.response?.status === 404) {
          alert('Không tìm thấy thông tin. Vui lòng thử lại!');
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>{isEditMode ? 'Sửa Chuyên ngành' : 'Thêm Chuyên ngành Mới'}</h2>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Department Selection */}
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

          {/* Major Code */}
          <div className="form-group">
            <label htmlFor="majorCode">
              Mã Chuyên ngành <span className="required">*</span>
            </label>
            <input
              type="text"
              id="majorCode"
              name="majorCode"
              value={formData.majorCode}
              onChange={handleChange}
              placeholder="VD: SE, AI, DS, NS"
              className={errors.majorCode ? 'error' : ''}
              maxLength={10}
              disabled={loading}
            />
            {errors.majorCode && (
              <span className="error-text">{errors.majorCode}</span>
            )}
          </div>

          {/* Major Name */}
          <div className="form-group">
            <label htmlFor="majorName">
              Tên Chuyên ngành <span className="required">*</span>
            </label>
            <input
              type="text"
              id="majorName"
              name="majorName"
              value={formData.majorName}
              onChange={handleChange}
              placeholder="VD: Công nghệ Phần mềm"
              className={errors.majorName ? 'error' : ''}
              maxLength={100}
              disabled={loading}
            />
            {errors.majorName && (
              <span className="error-text">{errors.majorName}</span>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Mô tả</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nhập mô tả về chuyên ngành (tùy chọn)"
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

          {/* Modal Footer */}
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

export default MajorModal;