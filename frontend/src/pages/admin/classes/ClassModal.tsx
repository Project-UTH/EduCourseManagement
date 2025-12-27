import React, { useState, useEffect } from 'react';
import './ClassModal.css';

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
  dayOfWeek: string;
  timeSlot: string;
  room: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classData?: ClassData;
}

// ==================== CONSTANTS ====================

const DAYS = [
  { value: 'MONDAY', label: 'Thứ 2' },
  { value: 'TUESDAY', label: 'Thứ 3' },
  { value: 'WEDNESDAY', label: 'Thứ 4' },
  { value: 'THURSDAY', label: 'Thứ 5' },
  { value: 'FRIDAY', label: 'Thứ 6' },
  { value: 'SATURDAY', label: 'Thứ 7' },
];

const SLOTS = [
  { value: 'CA1', label: 'Ca 1 (06:45 - 09:15)' },
  { value: 'CA2', label: 'Ca 2 (09:25 - 11:55)' },
  { value: 'CA3', label: 'Ca 3 (12:10 - 14:40)' },
  { value: 'CA4', label: 'Ca 4 (14:50 - 17:20)' },
  { value: 'CA5', label: 'Ca 5 (17:30 - 20:00)' },
];

// ==================== COMPONENT ====================

const ClassModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, classData }) => {
  
  // ===== STATE =====
  
  const [form, setForm] = useState({
    classCode: '',
    subjectId: 0,
    teacherId: 0,
    semesterId: 0,
    maxStudents: 50,
    dayOfWeek: '',
    timeSlot: '',
    room: '',
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  
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

      // Load semesters
      const semRes = await fetch('/api/admin/semesters?page=0&size=100', { headers });
      const semData = await semRes.json();
      const semList = semData.data?.content || semData.data || [];
      setSemesters(semList.filter((s: Semester) => s.status === 'ACTIVE' || s.status === 'UPCOMING'));

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

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectId = Number(e.target.value);
    
    setForm(prev => ({ ...prev, subjectId, teacherId: 0 }));
    
    if (subjectId) {
      loadTeachers(subjectId);
    } else {
      setTeachers([]);
    }

    if (errors.subjectId) {
      setErrors(prev => ({ ...prev, subjectId: '' }));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.classCode.trim()) errs.classCode = 'Mã lớp không được trống';
    if (form.classCode.length > 20) errs.classCode = 'Mã lớp tối đa 20 ký tự';
    if (!form.subjectId) errs.subjectId = 'Chọn môn học';
    if (!form.teacherId) errs.teacherId = 'Chọn giảng viên';
    if (!form.semesterId) errs.semesterId = 'Chọn học kỳ';
    if (form.maxStudents < 1) errs.maxStudents = 'Sĩ số phải > 0';
    if (form.maxStudents > 200) errs.maxStudents = 'Sĩ số tối đa 200';
    if (!form.dayOfWeek) errs.dayOfWeek = 'Chọn thứ';
    if (!form.timeSlot) errs.timeSlot = 'Chọn ca học';
    if (!form.room.trim()) errs.room = 'Nhập phòng học';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      let res;

      if (isEdit) {
        res = await fetch(`/api/admin/classes/${classData.classId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            teacherId: form.teacherId,
            maxStudents: form.maxStudents,
            dayOfWeek: form.dayOfWeek,
            timeSlot: form.timeSlot,
            room: form.room,
          })
        });
      } else {
        res = await fetch('/api/admin/classes', {
          method: 'POST',
          headers,
          body: JSON.stringify(form)
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
    });
    setErrors({});
    setTeachers([]);
  };

  if (!isOpen) return null;

  const subject = subjects.find(s => s.subjectId === form.subjectId);

  // ===== RENDER =====

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
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
              <li>Chỉ hiển thị GV được phân công dạy môn</li>
              <li>Số SV đăng ký tự động tăng</li>
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
            {subject && (
              <span className="form-hint">
                📚 {subject.totalSessions} buổi ({subject.inpersonSessions} TT + {subject.elearningSessions} EL)
              </span>
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

          {/* SCHEDULE */}
          <div className="schedule-section">
            <h3>📅 Lịch học cố định</h3>

            <div className="form-row">
              {/* DAY */}
              <div className="form-group">
                <label>Thứ <span className="required">*</span></label>
                <select name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange}>
                  <option value="">-- Chọn --</option>
                  {DAYS.map(d => (
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
                  {SLOTS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {errors.timeSlot && <span className="error-text">{errors.timeSlot}</span>}
              </div>
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