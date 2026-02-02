import React, { useState, useEffect } from 'react';
import majorApi, { Major, MajorCreateRequest, MajorUpdateRequest } from '../../../services/api/majorApi';
import { Department } from '../../../services/api/departmentApi';
import './MajorModal.css'; // File CSS độc lập mới

interface MajorModalProps {
  major: Major | null;
  departments: Department[];
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

  // --- INITIALIZATION ---
  useEffect(() => {
    if (major) {
      setFormData({
        majorCode: major.majorCode,
        majorName: major.majorName,
        departmentId: major.departmentId,
        description: major.description || '',
      });
    } else if (departments.length > 0) {
      // Mặc định chọn khoa đầu tiên nếu tạo mới
      setFormData(prev => ({
        ...prev,
        departmentId: departments[0].departmentId,
      }));
    }
  }, [major, departments]);

  // --- HANDLERS ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'departmentId' ? Number(value) : value
    }));

    // Clear error
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.departmentId || formData.departmentId === 0) {
      newErrors.departmentId = 'Vui lòng chọn Khoa quản lý';
    }

    if (!formData.majorCode.trim()) {
      newErrors.majorCode = 'Mã chuyên ngành bắt buộc';
    } else if (formData.majorCode.length > 10) {
      newErrors.majorCode = 'Mã tối đa 10 ký tự';
    } else if (!/^[A-Z0-9]+$/.test(formData.majorCode)) {
      newErrors.majorCode = 'Chỉ chứa chữ in hoa và số (VD: SE, AI)';
    }

    if (!formData.majorName.trim()) {
      newErrors.majorName = 'Tên chuyên ngành bắt buộc';
    } else if (formData.majorName.length > 100) {
      newErrors.majorName = 'Tên tối đa 100 ký tự';
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
        await majorApi.update(major.majorId, formData as MajorUpdateRequest);
        alert(' Cập nhật chuyên ngành thành công!');
      } else {
        await majorApi.create(formData as MajorCreateRequest);
        alert(' Thêm chuyên ngành thành công!');
      }
      onSuccess();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error saving major:', err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra';
      
      if (msg.includes('already exists')) {
        setErrors({ majorCode: 'Mã chuyên ngành đã tồn tại' });
      } else {
        alert(` Lỗi: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentName = (id: number): string => {
    const dept = departments.find(d => d.departmentId === id);
    return dept ? dept.departmentName : '';
  };

  // --- RENDER ---
  return (
    <div className="major-modal-wrapper mm-overlay" onClick={onClose}>
      <div className="mm-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="mm-header">
          <h2 className="mm-title">
            {isEditMode ? ' Sửa Chuyên ngành' : 'Thêm Chuyên ngành'}
          </h2>
          <button className="mm-close" onClick={onClose}>&times;</button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="mm-body">
          
          {/* 1. Department Select */}
          <div className="mm-group">
            <label className="mm-label">Khoa quản lý <span className="required">*</span></label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              className={`mm-select ${errors.departmentId ? 'error' : ''}`}
              disabled={loading}
            >
              <option value={0}>-- Chọn khoa --</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentCode} - {dept.departmentName}
                </option>
              ))}
            </select>
            {errors.departmentId && <span className="mm-error-msg">{errors.departmentId}</span>}
            
            {/* Department Info Box */}
            {formData.departmentId > 0 && (
              <div className="mm-info-box">
                <strong> Khoa trực thuộc:</strong>
                <span>{getDepartmentName(formData.departmentId)}</span>
              </div>
            )}
          </div>

          {/* 2. Major Code */}
          <div className="mm-group">
            <label className="mm-label">Mã Chuyên ngành <span className="required">*</span></label>
            <input
              type="text"
              name="majorCode"
              value={formData.majorCode}
                          onChange={(e) => {
  const val = e.target.value.toUpperCase();
  setFormData(prev => ({ ...prev, majorCode: val }));
  // Xóa lỗi nếu có
  if (errors.majorCode) setErrors(prev => ({ ...prev, majorCode: '' }));
}}
              placeholder="VD: SE, AI, IA"
              className={`mm-input ${errors.majorCode ? 'error' : ''}`}
              maxLength={10}
              disabled={loading}
            />
            <div className="mm-helper">
              {errors.majorCode ? <span className="mm-error-msg">{errors.majorCode}</span> : <span>Viết tắt in hoa, không dấu</span>}
              <span className="mm-char-count">{formData.majorCode.length}/10</span>
            </div>
          </div>

          {/* 3. Major Name */}
          <div className="mm-group">
            <label className="mm-label">Tên Chuyên ngành <span className="required">*</span></label>
            <input
              type="text"
              name="majorName"
              value={formData.majorName}
              onChange={handleChange}
              placeholder="VD: Kỹ thuật Phần mềm"
              className={`mm-input ${errors.majorName ? 'error' : ''}`}
              maxLength={100}
              disabled={loading}
            />
            {errors.majorName && <span className="mm-error-msg">{errors.majorName}</span>}
          </div>

          {/* 4. Description */}
          <div className="mm-group">
            <label className="mm-label">Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nhập mô tả chi tiết về chuyên ngành..."
              className={`mm-textarea ${errors.description ? 'error' : ''}`}
              maxLength={500}
              disabled={loading}
            />
            <div className="mm-char-count">
              {formData.description.length}/500
            </div>
          </div>

          {/* FOOTER */}
          <div className="mm-footer">
            <button
              type="button"
              className="mm-btn btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="mm-btn btn-submit"
              disabled={loading || departments.length === 0}
            >
              {loading ? 'Đang xử lý...' : (isEditMode ? 'Lưu thay đổi' : 'Thêm mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MajorModal;