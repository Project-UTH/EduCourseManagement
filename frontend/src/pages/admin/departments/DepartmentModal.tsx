import React, { useState, useEffect } from 'react';
import departmentApi, { 
  Department,
  DepartmentCreateRequest, 
  DepartmentUpdateRequest
} from '../../../services/api/departmentApi';
import './DepartmentModal.css';

/**
 * Department Modal (Create/Edit)
 * Phase 3 Sprint 3.1 - Fixed Version
 */

interface DepartmentModalProps {
  department: Department | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  departmentCode?: string;
  departmentName?: string;
  knowledgeType?: string;
  description?: string;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({
  department,
  onClose,
  onSuccess,
}) => {
  const isEditMode = department !== null;

  // Form state
  const [formData, setFormData] = useState({
    departmentCode: '',
    departmentName: '',
    knowledgeType: 'GENERAL' as 'GENERAL' | 'SPECIALIZED',
    description: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Initialize form data in edit mode
   */
  useEffect(() => {
    if (department) {
      setFormData({
        departmentCode: department.departmentCode,
        departmentName: department.departmentName,
        knowledgeType: department.knowledgeType,
        description: department.description || '',
      });
    }
  }, [department]);

  /**
   * Handle input change
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
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

    if (!formData.departmentCode.trim()) {
      newErrors.departmentCode = 'Mã khoa không được để trống';
    } else if (formData.departmentCode.length > 10) {
      newErrors.departmentCode = 'Mã khoa không quá 10 ký tự';
    }

    if (!formData.departmentName.trim()) {
      newErrors.departmentName = 'Tên khoa không được để trống';
    } else if (formData.departmentName.length > 100) {
      newErrors.departmentName = 'Tên khoa không quá 100 ký tự';
    }

    if (!formData.knowledgeType) {
      newErrors.knowledgeType = 'Vui lòng chọn loại kiến thức';
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
        // ✅ FIX: Use update() method
        await departmentApi.update(
          department.departmentId,
          formData as unknown as DepartmentUpdateRequest
        );
        alert('Cập nhật khoa thành công!');
      } else {
        // ✅ FIX: Use create() method
        await departmentApi.create(formData as unknown as DepartmentCreateRequest);
        alert('Thêm khoa thành công!');
      }

      onSuccess();
    } catch (err) {
      console.error('❌ [DepartmentModal] Error saving department:', err);
      
      // Handle specific errors
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { status?: number; data?: { message?: string } } };
        if (error.response?.status === 400) {
          const errorMessage = error.response.data?.message || 'Dữ liệu không hợp lệ';
          
          if (errorMessage.includes('already exists')) {
            setErrors({ departmentCode: 'Mã khoa đã tồn tại' });
          } else {
            alert(errorMessage);
          }
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
   * Knowledge type options (only 2 types from backend)
   */
  const knowledgeTypes = [
    { value: 'GENERAL', label: 'Đại cương' },
    { value: 'SPECIALIZED', label: 'Chuyên ngành' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2>{isEditMode ? 'Sửa Khoa' : 'Thêm Khoa Mới'}</h2>
          <button className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Department Code */}
          <div className="form-group">
            <label htmlFor="departmentCode">
              Mã Khoa <span className="required">*</span>
            </label>
            <input
              type="text"
              id="departmentCode"
              name="departmentCode"
              value={formData.departmentCode}
              onChange={handleChange}
              placeholder="VD: IT, BUS, ENG"
              className={errors.departmentCode ? 'error' : ''}
              maxLength={10}
              disabled={loading || isEditMode}
            />
            {errors.departmentCode && (
              <span className="error-text">{errors.departmentCode}</span>
            )}
          </div>

          {/* Department Name */}
          <div className="form-group">
            <label htmlFor="departmentName">
              Tên Khoa <span className="required">*</span>
            </label>
            <input
              type="text"
              id="departmentName"
              name="departmentName"
              value={formData.departmentName}
              onChange={handleChange}
              placeholder="VD: Công nghệ Thông tin"
              className={errors.departmentName ? 'error' : ''}
              maxLength={100}
              disabled={loading}
            />
            {errors.departmentName && (
              <span className="error-text">{errors.departmentName}</span>
            )}
          </div>

          {/* Knowledge Type */}
          <div className="form-group">
            <label htmlFor="knowledgeType">
              Loại Kiến thức <span className="required">*</span>
            </label>
            <select
              id="knowledgeType"
              name="knowledgeType"
              value={formData.knowledgeType}
              onChange={handleChange}
              className={errors.knowledgeType ? 'error' : ''}
              disabled={loading}
            >
              {knowledgeTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.knowledgeType && (
              <span className="error-text">{errors.knowledgeType}</span>
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
              placeholder="Nhập mô tả về khoa (tùy chọn)"
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

export default DepartmentModal;