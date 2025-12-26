import React, { useState, useEffect } from 'react';
import studentApi, { StudentCreateRequest, StudentUpdateRequest, StudentResponse } from '../../../services/api/studentApi';
import majorApi from '../../../services/api/majorApi';
import departmentApi from '../../../services/api/departmentApi';
import './StudentModal.css';

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

  // Dropdown data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Initialize form data for edit mode
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
    }
  }, [student]);

  // Cascade: Load majors when department changes
  useEffect(() => {
    if (formData.departmentId) {
      loadMajors(Number(formData.departmentId));
    } else {
      setMajors([]);
      setFormData(prev => ({ ...prev, majorId: '' }));
    }
  }, [formData.departmentId]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAll(0, 100);
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      alert('Lỗi tải danh sách khoa');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Student code (only for create mode)
    if (!isEditMode) {
      if (!formData.studentCode.trim()) {
        newErrors.studentCode = 'MSSV không được để trống';
      } else if (!/^\d{12}$/.test(formData.studentCode)) {
        newErrors.studentCode = 'MSSV phải có đúng 12 chữ số';
      }
    }

    // Full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên không được để trống';
    } else if (formData.fullName.length > 100) {
      newErrors.fullName = 'Họ tên không quá 100 ký tự';
    }

    // Date of birth
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Ngày sinh không được để trống';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 15 || age > 100) {
        newErrors.dateOfBirth = 'Tuổi phải từ 15 đến 100';
      }
    }

    // Academic year
    if (!formData.academicYear) {
      newErrors.academicYear = 'Khóa học không được để trống';
    } else if (formData.academicYear < 2000 || formData.academicYear > 2100) {
      newErrors.academicYear = 'Khóa học không hợp lệ';
    }

    // Major
    if (!formData.majorId) {
      newErrors.majorId = 'Chuyên ngành không được để trống';
    }

    // Email (optional but must be valid)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Phone (optional but must be valid)
    if (formData.phone && !/^[0-9+\-\s()]*$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
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
        // Update student
        const updateData: StudentUpdateRequest = {
          fullName: formData.fullName,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          academicYear: formData.academicYear,
          educationLevel: formData.educationLevel,
          trainingType: formData.trainingType,
          majorId: Number(formData.majorId),
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          placeOfBirth: formData.placeOfBirth || undefined
        };

        await studentApi.update(student.studentId, updateData);
        alert('Cập nhật sinh viên thành công!');
      } else {
        // Create student
        const createData: StudentCreateRequest = {
          studentCode: formData.studentCode,
          fullName: formData.fullName,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          academicYear: formData.academicYear,
          educationLevel: formData.educationLevel,
          trainingType: formData.trainingType,
          majorId: Number(formData.majorId),
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          placeOfBirth: formData.placeOfBirth || undefined
        };

        await studentApi.create(createData);
        alert('Thêm sinh viên thành công!\nMật khẩu mặc định: ddMMyyyy (từ ngày sinh)');
      }

      onSuccess();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error saving student:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert('Lỗi: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <h2>{isEditMode ? 'Sửa thông tin Sinh viên' : 'Thêm Sinh viên mới'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Row 1: Student Code (only for create) + Full Name */}
          <div className="form-row">
            {!isEditMode && (
              <div className="form-group">
                <label>
                  MSSV <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="studentCode"
                  value={formData.studentCode}
                  onChange={handleChange}
                  placeholder="12 chữ số"
                  maxLength={12}
                  disabled={isEditMode}
                />
                {errors.studentCode && <span className="error-text">{errors.studentCode}</span>}
                {!isEditMode && (
                  <span className="help-text">VD: 210101234567</span>
                )}
              </div>
            )}
            <div className="form-group">
              <label>
                Họ và tên <span className="required">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
              />
              {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            </div>
          </div>

          {/* Row 2: Gender + Date of Birth */}
          <div className="form-row">
            <div className="form-group">
              <label>
                Giới tính <span className="required">*</span>
              </label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                Ngày sinh <span className="required">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
            </div>
          </div>

          {/* Row 3: Academic Year + Education Level + Training Type */}
          <div className="form-row-3">
            <div className="form-group">
              <label>
                Khóa học <span className="required">*</span>
              </label>
              <input
                type="number"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                placeholder="2024"
                min="2000"
                max="2100"
              />
              {errors.academicYear && <span className="error-text">{errors.academicYear}</span>}
            </div>
            <div className="form-group">
              <label>
                Trình độ <span className="required">*</span>
              </label>
              <select name="educationLevel" value={formData.educationLevel} onChange={handleChange}>
                <option value="ASSOCIATE">Cao đẳng</option>
                <option value="BACHELOR">Đại học</option>
                <option value="MASTER">Thạc sĩ</option>
                <option value="DOCTOR">Tiến sĩ</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                Hình thức <span className="required">*</span>
              </label>
              <select name="trainingType" value={formData.trainingType} onChange={handleChange}>
                <option value="REGULAR">Chính quy</option>
                <option value="DISTANCE">Từ xa</option>
                <option value="PART_TIME">Vừa làm vừa học</option>
              </select>
            </div>
          </div>

          {/* Row 4: Department + Major (Cascade) */}
          <div className="form-row">
            <div className="form-group">
              <label>
                Khoa <span className="required">*</span>
              </label>
              <select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
              >
                <option value="">-- Chọn khoa --</option>
                {departments.map(dept => (
                  <option key={dept.departmentId} value={dept.departmentId}>
                    {dept.departmentCode} - {dept.departmentName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Chuyên ngành <span className="required">*</span>
              </label>
              <select
                name="majorId"
                value={formData.majorId}
                onChange={handleChange}
                disabled={!formData.departmentId || loadingMajors}
              >
                <option value="">
                  {loadingMajors ? 'Đang tải...' : '-- Chọn chuyên ngành --'}
                </option>
                {majors.map(major => (
                  <option key={major.majorId} value={major.majorId}>
                    {major.majorCode} - {major.majorName}
                  </option>
                ))}
              </select>
              {errors.majorId && <span className="error-text">{errors.majorId}</span>}
              {!formData.departmentId && (
                <span className="help-text">Chọn khoa trước</span>
              )}
            </div>
          </div>

          {/* Row 5: Email + Phone */}
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@example.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0901234567"
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>
          </div>

          {/* Row 6: Place of Birth */}
          <div className="form-group">
            <label>Nơi sinh</label>
            <input
              type="text"
              name="placeOfBirth"
              value={formData.placeOfBirth}
              onChange={handleChange}
              placeholder="TP. Hồ Chí Minh"
            />
          </div>

          {/* Info text */}
          {!isEditMode && (
            <div className="info-text">
              <strong>Lưu ý:</strong> Mật khẩu mặc định sẽ được tạo từ ngày sinh (định dạng ddMMyyyy).
              Sinh viên cần đổi mật khẩu sau lần đăng nhập đầu tiên.
            </div>
          )}

          {/* FOOTER */}
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : isEditMode ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;