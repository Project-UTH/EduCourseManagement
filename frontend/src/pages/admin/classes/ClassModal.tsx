import React, { useState, useEffect } from 'react';
import './ClassModal.css';
import { 
  DAYS_OF_WEEK, 
  TIME_SLOTS,
  getScheduleInfo
} from '../../../utils/constants';

// ==================== TYPE DEFINITIONS ====================

interface Subject {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  totalSessions: number;
  inpersonSessions: number;
  elearningSessions: number;
  departmentId: number;
  departmentName?: string;
  majorId?: number;
  majorName?: string;
}

interface Teacher {
  teacherId: number;
  fullName: string;
  degree?: string;
  email?: string;
  departmentId: number;
  departmentName?: string;
  majorId?: number;
  majorName?: string;
}

interface Semester {
  semesterId: number;
  semesterCode: string;
  semesterName: string;
  status: string;
}

interface ClassData {
  classId: number;
  classCode: string;
  subjectId: number;
  teacherId: number;
  semesterId: number;
  maxStudents: number;
  
  // Fixed schedule
  dayOfWeek: string;
  timeSlot: string;
  
  // E-learning schedule (if any)
  elearningDayOfWeek?: string;
  elearningTimeSlot?: string;
  
  // Session counts (for display)
  totalSessions?: number;
  inPersonSessions?: number;
  eLearningSessions?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classData?: ClassData;
}

// ==================== COMPONENT ====================

const ClassModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, classData }) => {
  
  // ===== STATE =====
  
  const [form, setForm] = useState({
    classCode: '',
    subjectId: 0,
    teacherId: 0,
    semesterId: 0,
    maxStudents: 50,
    
    // Fixed schedule (required)
    dayOfWeek: '',
    timeSlot: '',
    
    // ⭐ E-learning schedule (conditional - only if subject has e-learning)
    elearningDayOfWeek: '', 
    elearningTimeSlot: '',
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const isEdit = !!classData;
  const token = localStorage.getItem('token') || '';

  // ⭐ Check if selected subject has e-learning sessions
  const hasElearning = selectedSubject && selectedSubject.elearningSessions > 0;

  // ===== LOAD DATA =====

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (classData) {
        setForm({
          classCode: classData.classCode,
          subjectId: classData.subjectId,
          teacherId: classData.teacherId,
          semesterId: classData.semesterId,
          maxStudents: classData.maxStudents,
          dayOfWeek: classData.dayOfWeek,
          timeSlot: classData.timeSlot,
          elearningDayOfWeek: classData.elearningDayOfWeek || '',
          elearningTimeSlot: classData.elearningTimeSlot || '',
        });
      }
    } else {
      reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load subjects
      const subRes = await fetch('/api/admin/subjects?page=0&size=1000', { headers });
      const subData = await subRes.json();
      setSubjects(subData.data?.content || subData.data || []);

      // Load semesters - ONLY UPCOMING (for create) or current (for edit)
      const semRes = await fetch('/api/admin/semesters?page=0&size=100', { headers });
      const semData = await semRes.json();
      const semList = semData.data?.content || semData.data || [];
      
      if (isEdit) {
        // Edit: Show current semester + UPCOMING
        setSemesters(semList.filter((s: Semester) => 
          s.semesterId === classData?.semesterId || s.status === 'UPCOMING'
        ));
      } else {
        // Create: Only UPCOMING
        setSemesters(semList.filter((s: Semester) => s.status === 'UPCOMING'));
      }

    } catch (err) {
      console.error('Load failed:', err);
      alert('❌ Không thể tải dữ liệu!');
    }
  };

  const loadTeachers = async (subjectId: number) => {
    setLoadingTeachers(true);
    setTeachers([]);
    
    try {
      const res = await fetch(`/api/admin/subjects/${subjectId}/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.data || []);
      } else {
        alert('❌ Không thể tải giảng viên!');
      }
    } catch (err) {
      console.error('Load teachers failed:', err);
      alert('❌ Lỗi khi tải giảng viên!');
    } finally {
      setLoadingTeachers(false);
    }
  };

  // ===== HANDLERS =====

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numFields = ['subjectId', 'teacherId', 'semesterId', 'maxStudents'];
    
    setForm(prev => ({
      ...prev,
      [name]: numFields.includes(name) ? Number(value) : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectId = Number(e.target.value);
    
    setForm(prev => ({ 
      ...prev, 
      subjectId, 
      teacherId: 0,
      // Reset e-learning schedule when subject changes
      elearningDayOfWeek: '',
      elearningTimeSlot: ''
    }));
    
    if (subjectId) {
      // Load subject details
      try {
        const res = await fetch(`/api/admin/subjects/${subjectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          const subject: Subject = data.data;
          setSelectedSubject(subject);
          
          // ⭐ Show info about what backend will do
          const scheduleInfo = getScheduleInfo(
            subject.inpersonSessions, 
            subject.elearningSessions
          );
          
          if (scheduleInfo.info) {
            console.log('📅 Schedule info:', scheduleInfo.info);
          }
        }
      } catch (err) {
        console.error('Load subject details failed:', err);
      }
      
      // Load teachers for this subject
      loadTeachers(subjectId);
    } else {
      setSelectedSubject(null);
      setTeachers([]);
    }

    if (errors.subjectId) {
      setErrors(prev => ({ ...prev, subjectId: '' }));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    // Basic validation
    if (!form.classCode.trim()) errs.classCode = 'Mã lớp không được trống';
    if (form.classCode.length > 20) errs.classCode = 'Mã lớp tối đa 20 ký tự';
    if (!form.subjectId) errs.subjectId = 'Chọn môn học';
    if (!form.teacherId) errs.teacherId = 'Chọn giảng viên';
    if (!form.semesterId) errs.semesterId = 'Chọn học kỳ';
    if (form.maxStudents < 1) errs.maxStudents = 'Sĩ số phải > 0';
    if (form.maxStudents > 200) errs.maxStudents = 'Sĩ số tối đa 200';
    
    // Fixed schedule validation
    if (!form.dayOfWeek) errs.dayOfWeek = 'Chọn thứ (lịch cố định)';
    if (!form.timeSlot) errs.timeSlot = 'Chọn ca học (lịch cố định)';

    // ⭐ E-learning schedule validation (only if subject has e-learning)
    if (hasElearning) {
      if (!form.elearningDayOfWeek) {
        errs.elearningDayOfWeek = 'Chọn thứ (E-learning)';
      }
      if (!form.elearningTimeSlot) {
        errs.elearningTimeSlot = 'Chọn ca học (E-learning)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // ⭐ REQUEST DATA - Include e-learning schedule if has e-learning
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestData: any = {
        dayOfWeek: form.dayOfWeek,
        timeSlot: form.timeSlot,
      };

      // ⭐ Add e-learning schedule if subject has e-learning sessions
      if (hasElearning) {
        requestData.elearningDayOfWeek = form.elearningDayOfWeek;
        requestData.elearningTimeSlot = form.elearningTimeSlot;
      }

      let res;

      if (isEdit) {
        // UPDATE
        res = await fetch(`/api/admin/classes/${classData.classId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            teacherId: form.teacherId,
            maxStudents: form.maxStudents,
            ...requestData
          })
        });
      } else {
        // CREATE
        res = await fetch('/api/admin/classes', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            classCode: form.classCode,
            subjectId: form.subjectId,
            teacherId: form.teacherId,
            semesterId: form.semesterId,
            maxStudents: form.maxStudents,
            ...requestData
          })
        });
      }

      if (res.ok) {
        const result = await res.json();
        const responseData = result.data;
        
        alert(
          isEdit 
            ? '✅ Cập nhật thành công!' 
            : `✅ Tạo lớp thành công!\n\n` +
              `🏠 Phòng: ${responseData.fixedRoom || 'Đã gán'}\n` +
              `📅 Đã tạo ${responseData.totalSessionsGenerated || 0} buổi học\n` +
              `${hasElearning ? `💻 Bao gồm ${selectedSubject?.elearningSessions} buổi E-learning` : ''}`
        );
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        throw new Error(err.message || 'Failed');
      }
    } catch (err) {
      console.error('Submit failed:', err);
      alert(`❌ ${err instanceof Error ? err.message : 'Có lỗi xảy ra'}`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({
      classCode: '',
      subjectId: 0,
      teacherId: 0,
      semesterId: 0,
      maxStudents: 50,
      dayOfWeek: '',
      timeSlot: '',
      elearningDayOfWeek: '',
      elearningTimeSlot: '',
    });
    setErrors({});
    setTeachers([]);
    setSelectedSubject(null);
  };

  if (!isOpen) return null;

  // Get schedule info for display
  const scheduleInfo = selectedSubject 
    ? getScheduleInfo(selectedSubject.inpersonSessions, selectedSubject.elearningSessions)
    : null;

  // ===== RENDER =====

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="modal-header">
          <h2>{isEdit ? '✏️ Sửa lớp học' : '➕ Tạo lớp học'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {/* BODY */}
        <form onSubmit={submit} className="modal-body">
          
          {/* INFO */}
          <div className="info-box info-box-primary">
            <strong>🎯 Backend tự động xử lý:</strong>
            <ul>
              <li>✅ <strong>Gán phòng học</strong> (4-tier fallback strategy)</li>
              <li>✅ <strong>Tạo 10 buổi cố định</strong> (Thứ + Ca bạn chọn)</li>
              <li>✅ <strong>Tạo buổi bổ sung</strong> (PENDING - lên lịch khi kích hoạt HK)</li>
              <li>✅ <strong>Tạo buổi E-learning</strong> (nếu có - ONLINE room)</li>
            </ul>
          </div>

          {/* CLASS CODE */}
          <div className="form-group">
            <label>Mã lớp <span className="required">*</span></label>
            <input
              name="classCode"
              value={form.classCode}
              onChange={handleChange}
              placeholder="VD: SE301-01"
              disabled={isEdit}
            />
            {errors.classCode && <span className="error-text">{errors.classCode}</span>}
            {isEdit && <span className="form-hint">⚠️ Mã lớp không thể sửa</span>}
          </div>

          {/* SUBJECT */}
          <div className="form-group">
            <label>Môn học <span className="required">*</span></label>
            <select
              name="subjectId"
              value={form.subjectId || ''}
              onChange={handleSubjectChange}
              disabled={isEdit}
            >
              <option value="">-- Chọn môn học --</option>
              {subjects.map(s => (
                <option key={s.subjectId} value={s.subjectId}>
                  {s.subjectCode} - {s.subjectName} ({s.credits} TC)
                </option>
              ))}
            </select>
            {errors.subjectId && <span className="error-text">{errors.subjectId}</span>}
            {isEdit && <span className="form-hint">⚠️ Môn học không thể sửa</span>}
            
            {/* ⭐ SUBJECT INFO BOX */}
            {selectedSubject && scheduleInfo && (
              <div className="subject-info-box">
                <div className="subject-info-title">
                  📚 Thông tin môn học:
                </div>
                
                <div className="subject-info-row">
                  <span className="label">Tổng buổi:</span>
                  <span className="value">{selectedSubject.totalSessions} buổi</span>
                </div>
                
                <div className="subject-info-row">
                  <span className="label">Trực tiếp:</span>
                  <span className="value value-tt">{selectedSubject.inpersonSessions} buổi</span>
                </div>
                
                <div className="subject-info-row">
                  <span className="label">E-learning:</span>
                  <span className="value value-el">{selectedSubject.elearningSessions} buổi</span>
                </div>
                
                {/* ⭐ SCHEDULE BREAKDOWN */}
                <div className="schedule-breakdown">
                  <div className="breakdown-title">🎯 Backend sẽ tự động tạo:</div>
                  <div className="breakdown-item">
                    <span className="breakdown-icon">📌</span>
                    <span className="breakdown-text">
                      <strong>{scheduleInfo.fixedCount} buổi cố định</strong> 
                      {' '}(Thứ + Ca bạn chọn)
                    </span>
                  </div>
                  
                  {scheduleInfo.hasExtra && (
                    <div className="breakdown-item">
                      <span className="breakdown-icon">📅</span>
                      <span className="breakdown-text">
                        <strong>{scheduleInfo.extraCount} buổi bổ sung</strong>
                        {' '}(⏳ PENDING - lên lịch khi kích hoạt HK)
                      </span>
                    </div>
                  )}
                  
                  {scheduleInfo.hasElearning && (
                    <div className="breakdown-item">
                      <span className="breakdown-icon">💻</span>
                      <span className="breakdown-text">
                        <strong>{selectedSubject.elearningSessions} buổi E-learning</strong>
                        {' '}(ONLINE - không kiểm tra xung đột)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* TEACHER */}
          <div className="form-group">
            <label>Giảng viên <span className="required">*</span></label>
            <select
              name="teacherId"
              value={form.teacherId || ''}
              onChange={handleChange}
              disabled={!form.subjectId || loadingTeachers}
            >
              <option value="">
                {!form.subjectId ? '-- Chọn môn trước --' :
                 loadingTeachers ? '-- Đang tải... --' :
                 '-- Chọn giảng viên --'}
              </option>
              {teachers.map(t => (
                <option key={t.teacherId} value={t.teacherId}>
                  {t.degree && `${t.degree} `}{t.fullName}
                  {t.majorName && ` (${t.majorName})`}
                </option>
              ))}
            </select>
            {errors.teacherId && <span className="error-text">{errors.teacherId}</span>}
            
            {!form.subjectId && (
              <span className="form-hint">💡 Chọn môn học trước</span>
            )}
            
            {form.subjectId && !loadingTeachers && teachers.length === 0 && (
              <span className="form-hint" style={{color: '#ef4444'}}>
                ⚠️ Chưa có GV được phân công
              </span>
            )}
            
            {form.subjectId && !loadingTeachers && teachers.length > 0 && (
              <span className="form-hint" style={{color: '#16a34a'}}>
                ✅ {teachers.length} GV có thể dạy
              </span>
            )}
          </div>

          {/* SEMESTER */}
          <div className="form-group">
            <label>Học kỳ <span className="required">*</span></label>
            <select
              name="semesterId"
              value={form.semesterId || ''}
              onChange={handleChange}
              disabled={isEdit}
            >
              <option value="">-- Chọn học kỳ --</option>
              {semesters.map(s => (
                <option key={s.semesterId} value={s.semesterId}>
                  {s.semesterCode} - {s.semesterName} ({s.status})
                </option>
              ))}
            </select>
            {errors.semesterId && <span className="error-text">{errors.semesterId}</span>}
            {isEdit && <span className="form-hint">⚠️ Học kỳ không thể sửa</span>}
            {!isEdit && semesters.length === 0 && (
              <span className="form-hint" style={{color: '#ef4444'}}>
                ⚠️ Không có học kỳ UPCOMING. Vui lòng tạo học kỳ mới!
              </span>
            )}
          </div>

          {/* MAX STUDENTS */}
          <div className="form-group">
            <label>Sĩ số tối đa <span className="required">*</span></label>
            <input
              type="number"
              name="maxStudents"
              value={form.maxStudents}
              onChange={handleChange}
              min="1"
              max="200"
            />
            {errors.maxStudents && <span className="error-text">{errors.maxStudents}</span>}
            <span className="form-hint">💡 Số SV đăng ký tự động cập nhật</span>
          </div>

          {/* ⭐ FIXED SCHEDULE - SIMPLE (NO ROOM!) */}
          <div className="schedule-section schedule-fixed">
            <h3>📅 Lịch học cố định</h3>
            <p className="schedule-description">
              Chỉ cần chọn <strong>Thứ</strong> và <strong>Ca học</strong>. 
              Backend sẽ tự động gán phòng học phù hợp.
            </p>

            <div className="form-row">
              {/* DAY */}
              <div className="form-group">
                <label>Thứ <span className="required">*</span></label>
                <select name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange}>
                  <option value="">-- Chọn --</option>
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                {errors.dayOfWeek && <span className="error-text">{errors.dayOfWeek}</span>}
              </div>

              {/* SLOT */}
              <div className="form-group">
                <label>Ca học <span className="required">*</span></label>
                <select name="timeSlot" value={form.timeSlot} onChange={handleChange}>
                  <option value="">-- Chọn --</option>
                  {TIME_SLOTS.map(s => (
                    <option key={s.value} value={s.value}>
                      {s.label} ({s.time})
                    </option>
                  ))}
                </select>
                {errors.timeSlot && <span className="error-text">{errors.timeSlot}</span>}
              </div>
            </div>
            
            <div className="form-hint form-hint-success">
              🏠 <strong>Phòng học sẽ được gán tự động</strong> (4-tier fallback strategy)
            </div>
          </div>

          {/* ⭐ E-LEARNING SCHEDULE (Show only if has e-learning) */}
          {hasElearning && (
            <div className="schedule-section schedule-elearning">
              <h3>💻 Lịch E-learning</h3>
              <p className="schedule-description">
                Môn học có <strong>{selectedSubject?.elearningSessions} buổi E-learning</strong>. 
                Vui lòng chọn thứ và ca để student biết khi nào học online.
              </p>

              <div className="info-box info-box-info">
                ℹ️ <strong>Lưu ý:</strong> E-learning KHÔNG kiểm tra xung đột với các lớp khác 
                (học online, không cần phòng vật lý). Nhiều lớp có thể cùng giờ E-learning.
              </div>

              <div className="form-row">
                {/* E-LEARNING DAY */}
                <div className="form-group">
                  <label>Thứ (E-learning) <span className="required">*</span></label>
                  <select 
                    name="elearningDayOfWeek" 
                    value={form.elearningDayOfWeek} 
                    onChange={handleChange}
                  >
                    <option value="">-- Chọn --</option>
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                  {errors.elearningDayOfWeek && (
                    <span className="error-text">{errors.elearningDayOfWeek}</span>
                  )}
                </div>

                {/* E-LEARNING SLOT */}
                <div className="form-group">
                  <label>Ca học (E-learning) <span className="required">*</span></label>
                  <select 
                    name="elearningTimeSlot" 
                    value={form.elearningTimeSlot} 
                    onChange={handleChange}
                  >
                    <option value="">-- Chọn --</option>
                    {TIME_SLOTS.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label} ({s.time})
                      </option>
                    ))}
                  </select>
                  {errors.elearningTimeSlot && (
                    <span className="error-text">{errors.elearningTimeSlot}</span>
                  )}
                </div>
              </div>

              <div className="form-hint form-hint-success">
                🌐 <strong>Phòng ONLINE</strong> sẽ được gán tự động (không xung đột)
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              ❌ Hủy
            </button>
            <button type="submit" className="btn-submit" disabled={loading || loadingTeachers}>
              {loading ? '⏳ Đang xử lý...' : isEdit ? '💾 Cập nhật' : '➕ Tạo lớp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassModal;