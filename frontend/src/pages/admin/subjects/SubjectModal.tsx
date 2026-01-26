import React, { useState, useEffect } from 'react';
import subjectApi, { 
  Subject,
  SubjectCreateRequest, 
  SubjectUpdateRequest
} from '../../../services/api/subjectApi';
import { Department } from '../../../services/api/departmentApi';
import { Major } from '../../../services/api/majorApi';
import majorApi from '../../../services/api/majorApi';
import './SubjectModal.css'; // File CSS độc lập mới

interface SubjectModalProps {
  subject: Subject | null;
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}

interface FormErrors {
  subjectCode?: string;
  subjectName?: string;
  credits?: string;
  elearningSessions?: string;
  inpersonSessions?: string;
  departmentId?: string;
  majorId?: string;
  description?: string;
}

const SubjectModal: React.FC<SubjectModalProps> = ({
  subject,
  departments,
  onClose,
  onSuccess,
}) => {
  const isEditMode = subject !== null;

  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    credits: 3,
    elearningSessions: 0,   // User nhập
    inpersonSessions: 15,   // User nhập
    departmentId: departments.length > 0 ? departments[0].departmentId : 0,
    majorId: 0,
    description: '',
  });

  const [majors, setMajors] = useState<Major[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // ⭐ AUTO-CALCULATE totalSessions
  const totalSessions = formData.elearningSessions + formData.inpersonSessions;

  // --- INITIALIZATION ---
  useEffect(() => {
    const fetchMajors = async () => {
      if (formData.departmentId > 0) {
        try {
          setLoadingMajors(true);
          const response = await majorApi.getByDepartment(formData.departmentId);
          const majorsList = Array.isArray(response.data) ? response.data : [];
          setMajors(majorsList);
          
          if (formData.majorId > 0) {
            const majorExists = majorsList.some(m => m.majorId === formData.majorId);
            if (!majorExists) {
              setFormData(prev => ({ ...prev, majorId: 0 }));
            }
          }
        } catch (err) {
          console.error('[SubjectModal] Lỗi tải chuyên ngành:', err);
          setMajors([]);
        } finally {
          setLoadingMajors(false);
        }
      } else {
        setMajors([]);
      }
    };
    
    fetchMajors();
  }, [formData.departmentId, formData.majorId]);

  useEffect(() => {
    if (subject) {
      setFormData({
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        credits: subject.credits,
        elearningSessions: subject.elearningSessions,
        inpersonSessions: subject.inpersonSessions,
        departmentId: subject.departmentId,
        majorId: subject.majorId || 0,
        description: subject.description || '',
      });
    } else if (departments.length > 0) {
      setFormData(prev => ({
        ...prev,
        departmentId: departments[0].departmentId,
      }));
    }
  }, [subject, departments]);

  // --- LOGIC ---
  const autoCalculateSessions = (credits: number) => {
    let elearning: number, inperson: number;
    switch (credits) {
      case 2: elearning = 0; inperson = 10; break;
      case 3: elearning = 0; inperson = 15; break;
      case 4: elearning = 0; inperson = 20; break;
      default: { const total = credits * 5; elearning = 0; inperson = total; }
    }
    return { elearning, inperson };
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const numericFields = ['credits', 'elearningSessions', 'inpersonSessions', 'departmentId', 'majorId'];
    const processedValue = numericFields.includes(name) ? Number(value) : value;
    
    if (name === 'credits') {
      const credits = Number(value);
      const sessions = autoCalculateSessions(credits);
      setFormData(prev => ({
        ...prev,
        credits,
        elearningSessions: sessions.elearning,
        inpersonSessions: sessions.inperson,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.subjectCode.trim()) newErrors.subjectCode = 'Mã môn học bắt buộc';
    else if (formData.subjectCode.length > 10) newErrors.subjectCode = 'Mã tối đa 10 ký tự';

    if (!formData.subjectName.trim()) newErrors.subjectName = 'Tên môn học bắt buộc';
    
    if (!formData.credits || formData.credits < 1) newErrors.credits = 'Tín chỉ >= 1';
    
    if (formData.elearningSessions < 0) newErrors.elearningSessions = 'Không được âm';
    if (formData.inpersonSessions < 1) newErrors.inpersonSessions = 'Ít nhất 1 buổi';
    
    if (totalSessions < 1) newErrors.inpersonSessions = 'Tổng số buổi >= 1';

    if (!formData.departmentId || formData.departmentId === 0) newErrors.departmentId = 'Vui lòng chọn Khoa';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const submitData = {
        subjectCode: formData.subjectCode,
        subjectName: formData.subjectName,
        credits: formData.credits,
        totalSessions: totalSessions,
        elearningSessions: formData.elearningSessions,
        inpersonSessions: formData.inpersonSessions,
        departmentId: formData.departmentId,
        majorId: formData.majorId > 0 ? formData.majorId : undefined,
        description: formData.description,
      };

      if (isEditMode) {
        await subjectApi.update(subject.subjectId, submitData as SubjectUpdateRequest);
        alert('✅ Cập nhật môn học thành công!');
      } else {
        await subjectApi.create(submitData as SubjectCreateRequest);
        alert('✅ Thêm môn học thành công!');
      }
      onSuccess();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('[SubjectModal] Lỗi:', err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra';
      if (msg.includes('already exists')) setErrors({ subjectCode: 'Mã môn học đã tồn tại' });
      else alert(`❌ Lỗi: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentName = (id: number): string => {
    const dept = departments.find(d => d.departmentId === id);
    return dept ? dept.departmentName : '';
  };

  const getMajorName = (id: number): string => {
    const major = majors.find(m => m.majorId === id);
    return major ? major.majorName : '';
  };

  // --- RENDER ---
  return (
    <div className="subject-modal-wrapper sm-overlay" onClick={onClose}>
      <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="sm-header">
          <h2 className="sm-title">{isEditMode ? '✏️ Sửa Môn học' : '➕ Thêm Môn học Mới'}</h2>
          <button className="sm-close" onClick={onClose}>&times;</button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="sm-body">
          
          {/* 1. Department */}
          <div className="sm-group">
            <label className="sm-label">Khoa / Bộ môn <span className="required">*</span></label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              className={`sm-select ${errors.departmentId ? 'error' : ''}`}
              disabled={loading}
            >
              <option value={0}>-- Chọn khoa --</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentCode} - {dept.departmentName}
                </option>
              ))}
            </select>
            {errors.departmentId && <span className="sm-error-msg">{errors.departmentId}</span>}
            {formData.departmentId > 0 && (
              <span className="sm-helper">Đã chọn: {getDepartmentName(formData.departmentId)}</span>
            )}
          </div>

          {/* 2. Major */}
          <div className="sm-group">
            <label className="sm-label">Chuyên ngành <span className="optional">(Tùy chọn)</span></label>
            <select
              name="majorId"
              value={formData.majorId}
              onChange={handleChange}
              className="sm-select"
              disabled={loading || loadingMajors || majors.length === 0}
            >
              <option value={0}>-- Không chọn chuyên ngành --</option>
              {majors.map((major) => (
                <option key={major.majorId} value={major.majorId}>
                  {major.majorCode} - {major.majorName}
                </option>
              ))}
            </select>
            {loadingMajors && <span className="sm-helper">Đang tải chuyên ngành...</span>}
            {formData.majorId > 0 && (
              <span className="sm-helper">Đã chọn: {getMajorName(formData.majorId)}</span>
            )}
          </div>

          {/* 3. Code */}
          <div className="sm-group">
            <label className="sm-label">Mã Môn học <span className="required">*</span></label>
            <input
              type="text"
              name="subjectCode"
              value={formData.subjectCode}
              onChange={handleChange}
              placeholder="VD: INT1001"
              className={`sm-input ${errors.subjectCode ? 'error' : ''}`}
              maxLength={10}
              disabled={loading || isEditMode}
            />
            {errors.subjectCode && <span className="sm-error-msg">{errors.subjectCode}</span>}
          </div>

          {/* 4. Name */}
          <div className="sm-group">
            <label className="sm-label">Tên Môn học <span className="required">*</span></label>
            <input
              type="text"
              name="subjectName"
              value={formData.subjectName}
              onChange={handleChange}
              placeholder="VD: Nhập môn Lập trình"
              className={`sm-input ${errors.subjectName ? 'error' : ''}`}
              maxLength={100}
              disabled={loading}
            />
            {errors.subjectName && <span className="sm-error-msg">{errors.subjectName}</span>}
          </div>

          {/* 5. Credits */}
          <div className="sm-group">
            <label className="sm-label">Số tín chỉ <span className="required">*</span></label>
            <input
              type="number"
              name="credits"
              value={formData.credits}
              onChange={handleChange}
              min={1} max={10}
              className={`sm-input ${errors.credits ? 'error' : ''}`}
              disabled={loading}
            />
            {errors.credits && <span className="sm-error-msg">{errors.credits}</span>}
          </div>

          {/* 6. Sessions (3 Columns) */}
          <div className="sm-row-sessions">
            <div className="sm-group" style={{marginBottom: 0}}>
              <label className="sm-label">Buổi E-Learning</label>
              <input
                type="number"
                name="elearningSessions"
                value={formData.elearningSessions}
                onChange={handleChange}
                min={0}
                className={`sm-input ${errors.elearningSessions ? 'error' : ''}`}
                disabled={loading}
              />
            </div>

            <div className="sm-group" style={{marginBottom: 0}}>
              <label className="sm-label">Buổi Trực tiếp <span className="required">*</span></label>
              <input
                type="number"
                name="inpersonSessions"
                value={formData.inpersonSessions}
                onChange={handleChange}
                min={1}
                className={`sm-input ${errors.inpersonSessions ? 'error' : ''}`}
                disabled={loading}
              />
            </div>

            <div className="sm-group" style={{marginBottom: 0}}>
              <label className="sm-label">Tổng số buổi</label>
              <div className="sm-total-display">
                {totalSessions}
              </div>
            </div>
          </div>

          {/* 7. Description */}
          <div className="sm-group">
            <label className="sm-label">Mô tả</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Nhập mô tả môn học..."
              rows={3}
              className={`sm-textarea ${errors.description ? 'error' : ''}`}
              maxLength={500}
              disabled={loading}
            />
            <div className="sm-char-count">{formData.description.length}/500</div>
          </div>

          {/* FOOTER */}
          <div className="sm-footer">
            <button
              type="button"
              className="sm-btn btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="sm-btn btn-submit"
              disabled={loading || departments.length === 0}
            >
              {loading ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Thêm mới'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default SubjectModal;