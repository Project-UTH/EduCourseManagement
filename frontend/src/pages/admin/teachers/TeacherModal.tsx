import React, { useState, useEffect } from 'react';
import teacherApi, { TeacherCreateRequest, TeacherUpdateRequest, TeacherResponse } from '../../../services/api/teacherApi';
import teacherSubjectApi from '../../../services/api/teacherSubjectApi';
import departmentApi from '../../../services/api/departmentApi';
import majorApi from '../../../services/api/majorApi';
import SubjectSelector from './SubjectSelector';
import './TeacherModal.css';

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

interface SelectedSubject {
  subjectId: number;
  isPrimary: boolean;
  yearsOfExperience?: number;
}

interface TeacherModalProps {
  teacher: TeacherResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TeacherModal: React.FC<TeacherModalProps> = ({ teacher, onClose, onSuccess }) => {
  const isEditMode = teacher !== null;

  // Form state
  const [formData, setFormData] = useState({
    citizenId: '',
    fullName: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    dateOfBirth: '',
    email: '',
    phone: '',
    departmentId: '',
    majorId: '',
    degree: '',
    address: ''
  });

  // Dropdown data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);

  // Selected subjects
  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubject[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Load departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Initialize form data for edit mode
  useEffect(() => {
    if (teacher) {
      setFormData({
        citizenId: teacher.citizenId,
        fullName: teacher.fullName,
        gender: teacher.gender,
        dateOfBirth: teacher.dateOfBirth,
        email: teacher.email || '',
        phone: teacher.phone || '',
        departmentId: teacher.departmentId.toString(),
        majorId: teacher.majorId?.toString() || '',
        degree: teacher.degree || '',
        address: teacher.address || ''
      });

      // Initialize selected subjects
      if (teacher.subjects && teacher.subjects.length > 0) {
        const subjects = teacher.subjects.map(s => ({
          subjectId: s.subjectId,
          isPrimary: s.isPrimary,
          yearsOfExperience: s.yearsOfExperience
        }));
        setSelectedSubjects(subjects);
      }
    }
  }, [teacher]);

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
      // Backend returns: { success, totalItems, totalPages, data: Department[] }
      setDepartments(response.data || []);
      console.log('✅ [TeacherModal] Departments loaded:', response.data.length);
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
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Reset major when department changes
    if (name === 'departmentId') {
      setFormData(prev => ({ ...prev, majorId: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Citizen ID validation (only for create mode)
    if (!isEditMode) {
      if (!formData.citizenId.trim()) {
        newErrors.citizenId = 'Số CCCD không được để trống';
      } else if (!/^\d{12}$/.test(formData.citizenId)) {
        newErrors.citizenId = 'Số CCCD phải đúng 12 chữ số';
      }
    }

    // Full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên không được để trống';
    } else if (formData.fullName.length > 100) {
      newErrors.fullName = 'Họ và tên không quá 100 ký tự';
    }

    // Date of birth
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Ngày sinh không được để trống';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob >= today) {
        newErrors.dateOfBirth = 'Ngày sinh phải là ngày trong quá khứ';
      }
    }

    // Email (optional but must be valid if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Phone (optional but must be valid if provided)
    if (formData.phone && !/^[0-9+\-\s()]*$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    // Department
    if (!formData.departmentId) {
      newErrors.departmentId = 'Phải chọn khoa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let teacherId: number;

      if (isEditMode) {
        // Update teacher
        const updateData: TeacherUpdateRequest = {
          fullName: formData.fullName,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          departmentId: Number(formData.departmentId),
          majorId: formData.majorId ? Number(formData.majorId) : undefined,
          degree: formData.degree || undefined,
          address: formData.address || undefined
        };

        const response = await teacherApi.update(teacher!.teacherId, updateData);
        teacherId = response.data.teacherId;
        
        // Update subjects
        await updateTeacherSubjects(teacherId);
        
        alert('Cập nhật giảng viên thành công!');
      } else {
        // Create new teacher
        const createData: TeacherCreateRequest = {
          citizenId: formData.citizenId,
          fullName: formData.fullName,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          departmentId: Number(formData.departmentId),
          majorId: formData.majorId ? Number(formData.majorId) : undefined,
          degree: formData.degree || undefined,
          address: formData.address || undefined
        };

        const response = await teacherApi.create(createData);
        teacherId = response.data.teacherId;
        
        // Add subjects
        await updateTeacherSubjects(teacherId);
        
        alert('Thêm giảng viên thành công!');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving teacher:', error);
      
      // Handle validation errors from backend
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { validationErrors?: Record<string, string>; message?: string } } };
        if (apiError.response?.data?.validationErrors) {
          setErrors(apiError.response.data.validationErrors);
        } else {
          alert('Lỗi: ' + (apiError.response?.data?.message || 'Có lỗi xảy ra'));
        }
      } else {
        alert('Lỗi: Có lỗi xảy ra');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateTeacherSubjects = async (teacherId: number) => {
    if (selectedSubjects.length === 0) {
      // Remove all subjects if none selected
      await teacherSubjectApi.replaceSubjects(teacherId, []);
      return;
    }

    // Prepare subject requests
    const subjectRequests = selectedSubjects.map(s => ({
      subjectId: s.subjectId,
      isPrimary: s.isPrimary,
      yearsOfExperience: s.yearsOfExperience
    }));

    // Replace all subjects
    await teacherSubjectApi.replaceSubjects(teacherId, subjectRequests);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <h2>{isEditMode ? 'Sửa thông tin Giảng viên' : 'Thêm Giảng viên mới'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Row 1: Citizen ID (only for create) + Full Name */}
          <div className="form-row">
            {!isEditMode && (
              <div className="form-group">
                <label>
                  Số CCCD <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="citizenId"
                  value={formData.citizenId}
                  onChange={handleChange}
                  placeholder="Nhập 12 số CCCD"
                  maxLength={12}
                  className={errors.citizenId ? 'input-error' : ''}
                />
                {errors.citizenId && <span className="error-text">{errors.citizenId}</span>}
              </div>
            )}

            <div className="form-group" style={{ flex: isEditMode ? 1 : 0.5 }}>
              <label>
                Họ và tên <span className="required">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên"
                className={errors.fullName ? 'input-error' : ''}
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
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
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
                className={errors.dateOfBirth ? 'input-error' : ''}
              />
              {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
            </div>
          </div>

          {/* Row 3: Email + Phone */}
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0123456789"
                className={errors.phone ? 'input-error' : ''}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
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
                className={errors.departmentId ? 'input-error' : ''}
              >
                <option value="">-- Chọn khoa --</option>
                {departments.map((dept) => (
                  <option key={dept.departmentId} value={dept.departmentId}>
                    {dept.departmentCode} - {dept.departmentName}
                  </option>
                ))}
              </select>
              {errors.departmentId && <span className="error-text">{errors.departmentId}</span>}
            </div>

            <div className="form-group">
              <label>Chuyên ngành</label>
              <select
                name="majorId"
                value={formData.majorId}
                onChange={handleChange}
                disabled={!formData.departmentId || loadingMajors}
              >
                <option value="">-- Không chọn (dạy nhiều ngành) --</option>
                {majors.map((major) => (
                  <option key={major.majorId} value={major.majorId}>
                    {major.majorCode} - {major.majorName}
                  </option>
                ))}
              </select>
              {loadingMajors && <span className="text-muted small">Đang tải...</span>}
            </div>
          </div>

          {/* Row 5: Degree */}
          <div className="form-row">
            <div className="form-group">
              <label>Học vị</label>
              <input
                type="text"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                placeholder="VD: Thạc sĩ, Tiến sĩ"
              />
            </div>
          </div>

          {/* Row 6: Address */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Địa chỉ</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Nhập địa chỉ"
                rows={2}
              />
            </div>
          </div>

          {/* Row 7: Subject Selector */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <SubjectSelector
                departmentId={formData.departmentId ? Number(formData.departmentId) : undefined}
                selectedSubjects={selectedSubjects}
                onChange={setSelectedSubjects}
              />
              <div className="info-text">
                Chọn các môn học mà giảng viên có thể dạy. Đánh dấu "Môn chủ đạo" cho môn chuyên môn.
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : (isEditMode ? 'Cập nhật' : 'Thêm mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherModal;