import React, { useState, useEffect } from 'react';
import studentApi, { StudentCreateRequest, StudentUpdateRequest, StudentResponse } from '../../../services/api/studentApi';
import majorApi from '../../../services/api/majorApi';
import departmentApi from '../../../services/api/departmentApi';
import './StudentModal.css'; // File CSS độc lập

interface Department {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
}

interface Major {
  majorId: number;
  majorCode: string;
  majorName: string;
  departmentId: number;
}

interface StudentModalProps {
  student: StudentResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

const StudentModal: React.FC<StudentModalProps> = ({ student, onClose, onSuccess }) => {
  const isEditMode = student !== null;

  // Form state
  const [formData, setFormData] = useState({
    studentCode: '',
    fullName: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    dateOfBirth: '',
    academicYear: new Date().getFullYear(),
    educationLevel: 'BACHELOR' as 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'DOCTOR',
    trainingType: 'REGULAR' as 'REGULAR' | 'DISTANCE' | 'PART_TIME',
    departmentId: '',
    majorId: '',
    email: '',
    phone: '',
    placeOfBirth: ''
  });

  // Data & UI State
  const [departments, setDepartments] = useState<Department[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // --- EFFECT: Initial Load ---
  useEffect(() => {
    fetchDepartments();
  }, []);

  // --- EFFECT: Fill Data (Edit Mode) ---
  useEffect(() => {
    if (student) {
      setFormData({
        studentCode: student.studentCode,
        fullName: student.fullName,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth,
        academicYear: student.academicYear,
        educationLevel: student.educationLevel,
        trainingType: student.trainingType,
        departmentId: student.departmentId.toString(),
        majorId: student.majorId.toString(),
        email: student.email || '',
        phone: student.phone || '',
        placeOfBirth: student.placeOfBirth || ''
      });
      // Trigger load majors for the existing department
      loadMajors(student.departmentId);
    }
  }, [student]);

  // --- FETCHING ---
  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAll(0, 100);
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const loadMajors = async (departmentId: number) => {
    try {
      setLoadingMajors(true);
      const response = await majorApi.getByDepartment(departmentId);
      setMajors(response.data || []);
    } catch (error) {
      console.error('Error loading majors:', error);
      setMajors([]);
    } finally {
      setLoadingMajors(false);
    }
  };

  // --- HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Cascading logic for Department -> Major
    if (name === 'departmentId') {
      setFormData(prev => ({ ...prev, majorId: '' })); // Reset major
      if (value) {
        loadMajors(Number(value));
      } else {
        setMajors([]);
      }
    }

    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEditMode) {
      if (!formData.studentCode.trim()) newErrors.studentCode = 'MSSV bắt buộc';
      else if (!/^\d{12}$/.test(formData.studentCode)) newErrors.studentCode = 'MSSV phải có 12 chữ số';
    }

    if (!formData.fullName.trim()) newErrors.fullName = 'Họ tên bắt buộc';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Ngày sinh bắt buộc';
    
    // Validate age (15-100)
    if (formData.dateOfBirth) {
        const year = new Date(formData.dateOfBirth).getFullYear();
        const currentYear = new Date().getFullYear();
        if (currentYear - year < 15 || currentYear - year > 100) {
            newErrors.dateOfBirth = 'Năm sinh không hợp lệ';
        }
    }

    if (!formData.departmentId) newErrors.departmentId = 'Vui lòng chọn Khoa';
    if (!formData.majorId) newErrors.majorId = 'Vui lòng chọn Chuyên ngành';
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (formData.phone && !/^[0-9+\-\s()]{9,15}$/.test(formData.phone)) {
        newErrors.phone = 'SĐT không hợp lệ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const payload = {
        ...formData,
        majorId: Number(formData.majorId),
        // Clean optional fields
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        placeOfBirth: formData.placeOfBirth || undefined
      };

      if (isEditMode) {
        await studentApi.update(student.studentId, payload as StudentUpdateRequest);
        alert('✅ Cập nhật thành công!');
      } else {
        await studentApi.create(payload as StudentCreateRequest);
        alert('✅ Thêm sinh viên thành công!\nMật khẩu mặc định là ngày sinh (ddMMyyyy)');
      }
      onSuccess();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra';
      alert(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="student-modal-wrapper sm-overlay" onClick={onClose}>
      <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="sm-header">
          <h2 className="sm-title">
            {isEditMode ? '✏️ Cập nhật thông tin' : '➕ Thêm sinh viên mới'}
          </h2>
          <button className="sm-close" onClick={onClose}>&times;</button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="sm-body">
          
          {/* Row 1: MSSV & Name */}
          <div className="sm-row-2">
            <div className="sm-group">
              <label className="sm-label">Mã sinh viên <span className="required">*</span></label>
              <input
                className="sm-input"
                name="studentCode"
                value={formData.studentCode}
                onChange={handleChange}
                placeholder="VD: 210001234567"
                disabled={isEditMode}
                maxLength={12}
              />
              {errors.studentCode && <span className="sm-error">{errors.studentCode}</span>}
              {!isEditMode && <span className="sm-hint">Gồm 12 chữ số</span>}
            </div>
            
            <div className="sm-group">
              <label className="sm-label">Họ và tên <span className="required">*</span></label>
              <input
                className="sm-input"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="VD: Nguyễn Văn A"
              />
              {errors.fullName && <span className="sm-error">{errors.fullName}</span>}
            </div>
          </div>

          {/* Row 2: Gender & DOB */}
          <div className="sm-row-2">
            <div className="sm-group">
              <label className="sm-label">Giới tính <span className="required">*</span></label>
              <select className="sm-select" name="gender" value={formData.gender} onChange={handleChange}>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div className="sm-group">
              <label className="sm-label">Ngày sinh <span className="required">*</span></label>
              <input
                type="date"
                className="sm-input"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              {errors.dateOfBirth && <span className="sm-error">{errors.dateOfBirth}</span>}
            </div>
          </div>

          {/* Row 3: Education Info (3 Columns) */}
          <div className="sm-row-3">
            <div className="sm-group">
              <label className="sm-label">Khóa <span className="required">*</span></label>
              <input
                type="number"
                className="sm-input"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                min="2000" max="2100"
              />
            </div>
            <div className="sm-group">
              <label className="sm-label">Trình độ <span className="required">*</span></label>
              <select className="sm-select" name="educationLevel" value={formData.educationLevel} onChange={handleChange}>
                <option value="BACHELOR">Đại học</option>
                <option value="ASSOCIATE">Cao đẳng</option>
                <option value="MASTER">Thạc sĩ</option>
                <option value="DOCTOR">Tiến sĩ</option>
              </select>
            </div>
            <div className="sm-group">
              <label className="sm-label">Hình thức <span className="required">*</span></label>
              <select className="sm-select" name="trainingType" value={formData.trainingType} onChange={handleChange}>
                <option value="REGULAR">Chính quy</option>
                <option value="DISTANCE">Từ xa</option>
                <option value="PART_TIME">Vừa làm vừa học</option>
              </select>
            </div>
          </div>

          {/* Row 4: Dept & Major */}
          <div className="sm-row-2">
            <div className="sm-group">
              <label className="sm-label">Khoa / Viện <span className="required">*</span></label>
              <select 
                className="sm-select" 
                name="departmentId" 
                value={formData.departmentId} 
                onChange={handleChange}
              >
                <option value="">-- Chọn Khoa --</option>
                {departments.map(d => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentCode} - {d.departmentName}
                  </option>
                ))}
              </select>
              {errors.departmentId && <span className="sm-error">{errors.departmentId}</span>}
            </div>
            
            <div className="sm-group">
              <label className="sm-label">Chuyên ngành <span className="required">*</span></label>
              <select 
                className="sm-select" 
                name="majorId" 
                value={formData.majorId} 
                onChange={handleChange}
                disabled={!formData.departmentId || loadingMajors}
              >
                <option value="">
                  {loadingMajors ? 'Đang tải...' : '-- Chọn Ngành --'}
                </option>
                {majors.map(m => (
                  <option key={m.majorId} value={m.majorId}>
                    {m.majorCode} - {m.majorName}
                  </option>
                ))}
              </select>
              {errors.majorId && <span className="sm-error">{errors.majorId}</span>}
            </div>
          </div>

          {/* Row 5: Contact Info */}
          <div className="sm-row-2">
            <div className="sm-group">
              <label className="sm-label">Email</label>
              <input
                type="email"
                className="sm-input"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@school.edu.vn"
              />
              {errors.email && <span className="sm-error">{errors.email}</span>}
            </div>
            <div className="sm-group">
              <label className="sm-label">Số điện thoại</label>
              <input
                type="tel"
                className="sm-input"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="09xx..."
              />
              {errors.phone && <span className="sm-error">{errors.phone}</span>}
            </div>
          </div>

          {/* Row 6: Place of Birth */}
          <div className="sm-group">
            <label className="sm-label">Nơi sinh</label>
            <input
              className="sm-input"
              name="placeOfBirth"
              value={formData.placeOfBirth}
              onChange={handleChange}
              placeholder="Tỉnh / Thành phố"
            />
          </div>

          {/* Info Box */}
          {!isEditMode && (
            <div className="sm-info-box">
              <strong>💡 Lưu ý:</strong> Tài khoản sẽ được tạo tự động với mật khẩu là ngày tháng năm sinh (ddMMyyyy).
            </div>
          )}

          {/* FOOTER */}
          <div className="sm-footer">
            <button type="button" className="sm-btn btn-cancel" onClick={onClose}>
              Hủy bỏ
            </button>
            <button type="submit" className="sm-btn btn-submit" disabled={loading}>
              {loading ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default StudentModal;