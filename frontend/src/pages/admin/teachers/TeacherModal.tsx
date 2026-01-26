import React, { useState, useEffect } from 'react';
import teacherApi, { TeacherCreateRequest, TeacherUpdateRequest, TeacherResponse } from '../../../services/api/teacherApi';
import teacherSubjectApi from '../../../services/api/teacherSubjectApi';
import departmentApi from '../../../services/api/departmentApi';
import majorApi from '../../../services/api/majorApi';
import SubjectSelector from './SubjectSelector';
import './TeacherModal.css'; // File CSS độc lập mới

// Interfaces
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
  const [selectedSubjects, setSelectedSubjects] = useState<SelectedSubject[]>([]);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // --- EFFECTS ---

  useEffect(() => {
    fetchDepartments();
  }, []);

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

  // Cascade Load Major
  useEffect(() => {
    if (formData.departmentId) {
      loadMajors(Number(formData.departmentId));
    } else {
      setMajors([]);
      setFormData(prev => ({ ...prev, majorId: '' }));
    }
  }, [formData.departmentId]);

  // --- API CALLS ---

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEditMode) {
      if (!formData.citizenId.trim()) newErrors.citizenId = 'Số CCCD bắt buộc';
      else if (!/^\d{12}$/.test(formData.citizenId)) newErrors.citizenId = 'CCCD phải có 12 số';
    }

    if (!formData.fullName.trim()) newErrors.fullName = 'Họ tên bắt buộc';
    
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Ngày sinh bắt buộc';
    else {
      const dob = new Date(formData.dateOfBirth);
      if (dob >= new Date()) newErrors.dateOfBirth = 'Ngày sinh không hợp lệ';
    }

    if (!formData.departmentId) newErrors.departmentId = 'Vui lòng chọn Khoa';

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if (formData.phone && !/^[0-9+\-\s()]*$/.test(formData.phone)) newErrors.phone = 'SĐT không hợp lệ';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let teacherId: number;
      const commonData = {
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

      if (isEditMode) {
        const response = await teacherApi.update(teacher!.teacherId, commonData as TeacherUpdateRequest);
        teacherId = response.data.teacherId;
        alert('✅ Cập nhật giảng viên thành công!');
      } else {
        const createData = { ...commonData, citizenId: formData.citizenId };
        const response = await teacherApi.create(createData as TeacherCreateRequest);
        teacherId = response.data.teacherId;
        alert('✅ Thêm giảng viên thành công!');
      }

      // Update Subjects
      if (selectedSubjects.length > 0 || isEditMode) {
        const subjectRequests = selectedSubjects.map(s => ({
          subjectId: s.subjectId,
          isPrimary: s.isPrimary,
          yearsOfExperience: s.yearsOfExperience
        }));
        await teacherSubjectApi.replaceSubjects(teacherId, subjectRequests);
      }

      onSuccess();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra';
      alert(`❌ Lỗi: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---

  return (
    <div className="teacher-modal-wrapper tm-overlay" onClick={onClose}>
      <div className="tm-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="tm-header">
          <h2 className="tm-title">
            {isEditMode ? '✏️ Cập nhật Giảng viên' : '➕ Thêm Giảng viên mới'}
          </h2>
          <button className="tm-close" onClick={onClose}>&times;</button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="tm-body">
          
          {/* Row 1: CCCD & Name */}
          <div className="tm-row-2">
            {!isEditMode && (
              <div className="tm-group">
                <label className="tm-label">Số CCCD <span className="required">*</span></label>
                <input
                  className={`tm-input ${errors.citizenId ? 'error' : ''}`}
                  name="citizenId"
                  value={formData.citizenId}
                  onChange={handleChange}
                  placeholder="12 chữ số"
                  maxLength={12}
                />
                {errors.citizenId && <span className="tm-error-msg">{errors.citizenId}</span>}
              </div>
            )}
            
            <div className="tm-group" style={{gridColumn: isEditMode ? '1 / -1' : 'auto'}}>
              <label className="tm-label">Họ và tên <span className="required">*</span></label>
              <input
                className={`tm-input ${errors.fullName ? 'error' : ''}`}
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
              />
              {errors.fullName && <span className="tm-error-msg">{errors.fullName}</span>}
            </div>
          </div>

          {/* Row 2: Gender & DOB */}
          <div className="tm-row-2">
            <div className="tm-group">
              <label className="tm-label">Giới tính <span className="required">*</span></label>
              <select className="tm-select" name="gender" value={formData.gender} onChange={handleChange}>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div className="tm-group">
              <label className="tm-label">Ngày sinh <span className="required">*</span></label>
              <input
                type="date"
                className={`tm-input ${errors.dateOfBirth ? 'error' : ''}`}
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              {errors.dateOfBirth && <span className="tm-error-msg">{errors.dateOfBirth}</span>}
            </div>
          </div>

          {/* Row 3: Department & Major */}
          <div className="tm-row-2">
            <div className="tm-group">
              <label className="tm-label">Khoa / Đơn vị <span className="required">*</span></label>
              <select
                className={`tm-select ${errors.departmentId ? 'error' : ''}`}
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
              >
                <option value="">-- Chọn Khoa --</option>
                {departments.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.departmentCode} - {d.departmentName}
                  </option>
                ))}
              </select>
              {errors.departmentId && <span className="tm-error-msg">{errors.departmentId}</span>}
            </div>

            <div className="tm-group">
              <label className="tm-label">Chuyên ngành chính</label>
              <select
                className="tm-select"
                name="majorId"
                value={formData.majorId}
                onChange={handleChange}
                disabled={!formData.departmentId || loadingMajors}
              >
                <option value="">-- Không chọn (dạy đại cương) --</option>
                {majors.map((m) => (
                  <option key={m.majorId} value={m.majorId}>
                    {m.majorCode} - {m.majorName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Degree & Email & Phone */}
          <div className="tm-row-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
             <div className="tm-group">
              <label className="tm-label">Học vị</label>
              <input
                className="tm-input"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                placeholder="Thạc sĩ, Tiến sĩ..."
              />
            </div>
            <div className="tm-group">
              <label className="tm-label">Email</label>
              <input
                type="email"
                className={`tm-input ${errors.email ? 'error' : ''}`}
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
              />
              {errors.email && <span className="tm-error-msg">{errors.email}</span>}
            </div>
            <div className="tm-group">
              <label className="tm-label">SĐT</label>
              <input
                type="tel"
                className={`tm-input ${errors.phone ? 'error' : ''}`}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="09xx..."
              />
              {errors.phone && <span className="tm-error-msg">{errors.phone}</span>}
            </div>
          </div>

          {/* Address */}
          <div className="tm-group">
            <label className="tm-label">Địa chỉ liên hệ</label>
            <textarea
              className="tm-textarea"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Số nhà, đường, phường/xã..."
              rows={2}
            />
          </div>

          {/* Subject Selector Section */}
          <div className="tm-group">
             <label className="tm-label">Môn học phụ trách</label>
             <SubjectSelector
                departmentId={formData.departmentId ? Number(formData.departmentId) : undefined}
                selectedSubjects={selectedSubjects}
                onChange={setSelectedSubjects}
             />
             <div className="tm-info-box">
                <span>💡</span>
                <span>Chọn các môn mà giảng viên có thể giảng dạy. Đánh dấu "Môn chủ đạo" cho môn chuyên môn sâu.</span>
             </div>
          </div>

          {/* FOOTER */}
          <div className="tm-footer">
            <button type="button" className="tm-btn btn-cancel" onClick={onClose}>
              Hủy bỏ
            </button>
            <button type="submit" className="tm-btn btn-submit" disabled={loading}>
              {loading ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Thêm mới')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TeacherModal;