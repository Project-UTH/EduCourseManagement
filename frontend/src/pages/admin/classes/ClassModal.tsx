import React, { useState, useEffect } from 'react';
import './ClassModal.css';
import { 
  DAYS_OF_WEEK, 
  TIME_SLOTS,
  requiresExtraSchedule,
  requiresElearningSchedule,
  getScheduleValidationErrors,
  calculateExtraSessions
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
  room: string;
  
  // Extra schedule (if exists)
  extraDayOfWeek?: string | null;
  extraTimeSlot?: string | null;
  extraRoom?: string | null;
  
  // E-learning schedule (if exists)
  elearningDayOfWeek?: string | null;
  elearningTimeSlot?: string | null;
  
  // Session counts
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
    
    // Fixed schedule
    dayOfWeek: '',
    timeSlot: '',
    room: '',
    
    // Extra schedule
    extraDayOfWeek: '',
    extraTimeSlot: '',
    extraRoom: '',
    
    // E-learning schedule
    elearningDayOfWeek: '',
    elearningTimeSlot: '',
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showExtra, setShowExtra] = useState(false);
  const [showElearning, setShowElearning] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const isEdit = !!classData;
  const token = localStorage.getItem('token') || '';

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
          room: classData.room,
          extraDayOfWeek: classData.extraDayOfWeek || '',
          extraTimeSlot: classData.extraTimeSlot || '',
          extraRoom: classData.extraRoom || '',
          elearningDayOfWeek: classData.elearningDayOfWeek || '',
          elearningTimeSlot: classData.elearningTimeSlot || '',
        });
        
        // Check if need extra/elearning when editing
        if (classData.inPersonSessions) {
          setShowExtra(requiresExtraSchedule(classData.inPersonSessions));
        }
        if (classData.eLearningSessions) {
          setShowElearning(requiresElearningSchedule(classData.eLearningSessions));
        }
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

      // Load semesters - ONLY UPCOMING (for create) or ACTIVE/UPCOMING (for edit)
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
    
    setForm(prev => ({ ...prev, subjectId, teacherId: 0 }));
    
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
          
          // ⭐ AUTO-DETECT if need extra/elearning schedules
          const needsExtra = requiresExtraSchedule(subject.inpersonSessions);
          const needsElearning = requiresElearningSchedule(subject.elearningSessions);
          
          setShowExtra(needsExtra);
          setShowElearning(needsElearning);
          
          // Show warning if extra schedule needed
          if (needsExtra) {
            const extraCount = calculateExtraSessions(subject.inpersonSessions);
            alert(
              `⚠️ Môn này có ${subject.inpersonSessions} buổi trực tiếp.\n` +
              `Cần thêm ${extraCount} buổi bổ sung ngoài lịch cố định.\n\n` +
              `Vui lòng nhập lịch học bổ sung bên dưới.`
            );
          }
          
          if (needsElearning) {
            console.log(
              `ℹ️ Môn này có ${subject.elearningSessions} buổi E-learning. ` +
              `Vui lòng nhập lịch học trực tuyến.`
            );
          }
        }
      } catch (err) {
        console.error('Load subject details failed:', err);
      }
      
      // Load teachers for this subject
      loadTeachers(subjectId);
    } else {
      setSelectedSubject(null);
      setShowExtra(false);
      setShowElearning(false);
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
    
    // Fixed schedule
    if (!form.dayOfWeek) errs.dayOfWeek = 'Chọn thứ (lịch cố định)';
    if (!form.timeSlot) errs.timeSlot = 'Chọn ca học (lịch cố định)';
    if (!form.room.trim()) errs.room = 'Nhập phòng học (lịch cố định)';

    // ⭐ VALIDATE EXTRA/ELEARNING schedules using helper function
    if (selectedSubject) {
      const scheduleErrors = getScheduleValidationErrors(
        selectedSubject.inpersonSessions,
        selectedSubject.elearningSessions,
        !!form.extraDayOfWeek,
        !!form.extraTimeSlot,
        !!form.extraRoom,
        !!form.elearningDayOfWeek,
        !!form.elearningTimeSlot
      );
      
      if (scheduleErrors.length > 0) {
        errs.general = scheduleErrors.join('\n');
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      // Show general error if exists
      if (errors.general) {
        alert(`❌ Lỗi:\n\n${errors.general}`);
      }
      return;
    }

    setLoading(true);

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // ⭐ BUILD REQUEST DATA
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestData: any = {
        dayOfWeek: form.dayOfWeek,
        timeSlot: form.timeSlot,
        room: form.room,
      };
      
      // Add extra schedule if provided
      if (form.extraDayOfWeek && form.extraTimeSlot && form.extraRoom) {
        requestData.extraDayOfWeek = form.extraDayOfWeek;
        requestData.extraTimeSlot = form.extraTimeSlot;
        requestData.extraRoom = form.extraRoom;
      }
      
      // Add elearning schedule if provided
      if (form.elearningDayOfWeek && form.elearningTimeSlot) {
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
        alert(isEdit ? '✅ Cập nhật thành công!' : '✅ Tạo lớp thành công!');
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
      room: '',
      extraDayOfWeek: '',
      extraTimeSlot: '',
      extraRoom: '',
      elearningDayOfWeek: '',
      elearningTimeSlot: '',
    });
    setErrors({});
    setTeachers([]);
    setSelectedSubject(null);
    setShowExtra(false);
    setShowElearning(false);
  };

  if (!isOpen) return null;

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
          <div className="info-box">
            <strong>ℹ️ Lưu ý:</strong>
            <ul>
              <li>Chọn môn học trước để tải giảng viên</li>
              <li>Lịch học bổ sung & E-learning sẽ tự động hiển thị nếu cần</li>
              <li>Chỉ tạo lớp cho học kỳ <strong>UPCOMING</strong> (sắp diễn ra)</li>
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
            
            {/* SUBJECT INFO BOX */}
            {selectedSubject && (
              <div className="subject-info-box">
                <div className="subject-info-row">
                  <span className="label">📚 Tổng số buổi:</span>
                  <span className="value">{selectedSubject.totalSessions} buổi</span>
                </div>
                <div className="subject-info-row">
                  <span className="label">🏫 Trực tiếp:</span>
                  <span className="value value-tt">{selectedSubject.inpersonSessions} buổi</span>
                  {requiresExtraSchedule(selectedSubject.inpersonSessions) && (
                    <span className="badge badge-warning">
                      +{calculateExtraSessions(selectedSubject.inpersonSessions)} buổi bổ sung
                    </span>
                  )}
                </div>
                <div className="subject-info-row">
                  <span className="label">💻 E-learning:</span>
                  <span className="value value-el">{selectedSubject.elearningSessions} buổi</span>
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

          {/* ⭐ FIXED SCHEDULE - ALWAYS SHOW */}
          <div className="schedule-section schedule-fixed">
            <h3>📅 Lịch học cố định (10 buổi)</h3>
            <p className="schedule-description">
              Lịch học hàng tuần, áp dụng cho 10 tuần đầu học kỳ
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

              {/* ROOM */}
              <div className="form-group">
                <label>Phòng <span className="required">*</span></label>
                <input
                  name="room"
                  value={form.room}
                  onChange={handleChange}
                  placeholder="VD: A201"
                />
                {errors.room && <span className="error-text">{errors.room}</span>}
              </div>
            </div>
          </div>

          {/* ⭐ EXTRA SCHEDULE - CONDITIONAL */}
          {showExtra && selectedSubject && (
            <div className="schedule-section schedule-extra">
              <h3>📚 Lịch học bổ sung ({calculateExtraSessions(selectedSubject.inpersonSessions)} buổi)</h3>
              <p className="schedule-description">
                Môn này có {selectedSubject.inpersonSessions} buổi trực tiếp, 
                cần {calculateExtraSessions(selectedSubject.inpersonSessions)} buổi bổ sung 
                ngoài 10 buổi cố định
              </p>

              <div className="form-row">
                {/* DAY */}
                <div className="form-group">
                  <label>Thứ <span className="required">*</span></label>
                  <select name="extraDayOfWeek" value={form.extraDayOfWeek} onChange={handleChange}>
                    <option value="">-- Chọn --</option>
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* SLOT */}
                <div className="form-group">
                  <label>Ca học <span className="required">*</span></label>
                  <select name="extraTimeSlot" value={form.extraTimeSlot} onChange={handleChange}>
                    <option value="">-- Chọn --</option>
                    {TIME_SLOTS.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label} ({s.time})
                      </option>
                    ))}
                  </select>
                </div>

                {/* ROOM */}
                <div className="form-group">
                  <label>Phòng <span className="required">*</span></label>
                  <input
                    name="extraRoom"
                    value={form.extraRoom}
                    onChange={handleChange}
                    placeholder="VD: B105"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ⭐ E-LEARNING SCHEDULE - CONDITIONAL */}
          {showElearning && selectedSubject && (
            <div className="schedule-section schedule-elearning">
              <h3>💻 Lịch học trực tuyến ({selectedSubject.elearningSessions} buổi)</h3>
              <p className="schedule-description">
                Các buổi E-learning sẽ được lên lịch theo thời gian cố định hàng tuần
              </p>

              <div className="form-row form-row-2col">
                {/* DAY */}
                <div className="form-group">
                  <label>Thứ <span className="required">*</span></label>
                  <select name="elearningDayOfWeek" value={form.elearningDayOfWeek} onChange={handleChange}>
                    <option value="">-- Chọn --</option>
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* SLOT */}
                <div className="form-group">
                  <label>Ca học <span className="required">*</span></label>
                  <select name="elearningTimeSlot" value={form.elearningTimeSlot} onChange={handleChange}>
                    <option value="">-- Chọn --</option>
                    {TIME_SLOTS.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label} ({s.time})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-hint">
                💡 E-learning không cần phòng học (sẽ tự động gán "ONLINE")
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