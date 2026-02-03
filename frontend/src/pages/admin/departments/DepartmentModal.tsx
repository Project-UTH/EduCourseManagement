import React, { useState, useEffect } from 'react';
import departmentApi, { 
  Department,
  DepartmentCreateRequest, 
  DepartmentUpdateRequest
} from '../../../services/api/departmentApi';
import './DepartmentModal.css'; // File CSS độc lập

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
    knowledgeType: 'SPECIALIZED' as 'GENERAL' | 'SPECIALIZED',
    description: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Initialize Data
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

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.departmentCode.trim()) {
      newErrors.departmentCode = 'Mã khoa bắt buộc';
    } else if (formData.departmentCode.length > 10) {
      newErrors.departmentCode = 'Mã tối đa 10 ký tự';
    } else if (!/^[A-Z0-9]+$/.test(formData.departmentCode)) {
      newErrors.departmentCode = 'Chỉ dùng chữ in hoa và số (VD: IT, MATH)';
    }

    if (!formData.departmentName.trim()) {
      newErrors.departmentName = 'Tên khoa bắt buộc';
    } else if (formData.departmentName.length > 100) {
      newErrors.departmentName = 'Tên tối đa 100 ký tự';
    }

    if (!formData.knowledgeType) {
      newErrors.knowledgeType = 'Vui lòng chọn loại kiến thức';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Mô tả tối đa 500 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      if (isEditMode) {
        await departmentApi.update(
          department.departmentId,
          formData as unknown as DepartmentUpdateRequest
        );
        alert('✅ Cập nhật khoa thành công!');
      } else {
        await departmentApi.create(formData as unknown as DepartmentCreateRequest);
        alert('✅ Thêm khoa thành công!');
      }
      onSuccess();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error saving department:', err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra';
      
      if (msg.includes('already exists')) {
        setErrors({ departmentCode: 'Mã khoa đã tồn tại' });
      } else {
        alert(`❌ Lỗi: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const knowledgeTypes = [
    { value: 'SPECIALIZED', label: 'Chuyên ngành' },
    { value: 'GENERAL', label: 'Đại cương' },
  ];

  // RENDER
  return (
    <div className="department-modal-wrapper dm-overlay" onClick={onClose}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="dm-header">
          <h2 className="dm-title">{isEditMode ? '✏️ Sửa Khoa / Viện' : '➕ Thêm Khoa Mới'}</h2>
          <button className="dm-close" onClick={onClose}>&times;</button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="dm-body">
          
          {/* Code */}
          <div className="dm-group">
            <label className="dm-label">Mã Khoa <span className="required">*</span></label>
            <input
  type="text"
  name="departmentCode"
  value={formData.departmentCode}
  onChange={(e) => {
    const uppercasedValue = e.target.value.toUpperCase();
    const syntheticEvent = {
      target: {
        name: 'departmentCode',
        value: uppercasedValue
      }
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(syntheticEvent);
  }}
  placeholder="VD: IT, MATH, ENG"
  className={`dm-input ${errors.departmentCode ? 'error' : ''}`}
  maxLength={10}
  disabled={loading || isEditMode}
/>
            {errors.departmentCode && <span className="dm-error-msg">{errors.departmentCode}</span>}
          </div>

          {/* Name */}
          <div className="dm-group">
            <label className="dm-label">Tên Khoa <span className="required">*</span></label>
            <input
              type="text"
              name="departmentName"
              value={formData.departmentName}
              onChange={handleChange}
              placeholder="VD: Công nghệ Thông tin"
              className={`dm-input ${errors.departmentName ? 'error' : ''}`}
              maxLength={100}
              disabled={loading}
            />
            {errors.departmentName && <span className="dm-error-msg">{errors.departmentName}</span>}
          </div>

          {/* Type */}
          <div className="dm-group">
            <label className="dm-label">Loại Kiến thức <span className="required">*</span></label>
            <select
              name="knowledgeType"
              value={formData.knowledgeType}
              onChange={handleChange}
              className={`dm-select ${errors.knowledgeType ? 'error' : ''}`}
              disabled={loading}
            >
              {knowledgeTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="dm-group">
            <label className="dm-label">Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nhập mô tả chức năng, nhiệm vụ của khoa..."
              rows={4}
              className={`dm-textarea ${errors.description ? 'error' : ''}`}
              maxLength={500}
              disabled={loading}
            />
            <div className="dm-char-count">
              {formData.description.length}/500
            </div>
          </div>

          {/* FOOTER */}
          <div className="dm-footer">
            <button
              type="button"
              className="dm-btn btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="dm-btn btn-submit"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : isEditMode ? 'Lưu thay đổi' : 'Thêm mới'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default DepartmentModal;