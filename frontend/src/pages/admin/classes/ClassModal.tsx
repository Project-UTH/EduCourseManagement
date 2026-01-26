import React, { useState, useEffect } from 'react';
import './ClassModal.css'; // File CSS độc lập
import { 
  DAYS_OF_WEEK, 
  TIME_SLOTS,
  getScheduleInfo
} from '../../../utils/constants';

// --- TYPES ---
interface Subject {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  totalSessions: number;
  inpersonSessions: number;
  elearningSessions: number;
  departmentId: number;
}

interface Teacher {
  teacherId: number;
  fullName: string;
  degree?: string;
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
  elearningDayOfWeek?: string;
  elearningTimeSlot?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classData?: ClassData;
}

// --- COMPONENT ---
const ClassModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, classData }) => {
  
  // State
  const [form, setForm] = useState({
    classCode: '',
    subjectId: 0,
    teacherId: 0,
    semesterId: 0,
    maxStudents: 50, // Mặc định 60 cho đại học
    dayOfWeek: '',
    timeSlot: '',
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
  const hasElearning = selectedSubject && selectedSubject.elearningSessions > 0;

  // --- EFFECTS ---
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
        // Note: selectedSubject will be set when subjects are loaded and we find match, 
        // or trigger handleSubjectChange logic manually if needed. 
        // Here we rely on user not changing subject in edit mode mostly.
      }
    } else {
      reset();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Load teachers when subject is set (esp. in Edit mode)
  useEffect(() => {
    if (form.subjectId && subjects.length > 0) {
       const subj = subjects.find(s => s.subjectId === form.subjectId);
       if (subj) {
         setSelectedSubject(subj);
         loadTeachers(subj.subjectId);
       }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.subjectId, subjects]);


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
      
      if (isEdit) {
        setSemesters(semList);
      } else {
        // Create: Only UPCOMING
        setSemesters(semList.filter((s: Semester) => s.status === 'UPCOMING'));
      }

    } catch (err) {
      console.error(err);
      alert('❌ Lỗi kết nối hệ thống');
    }
  };

  const loadTeachers = async (subjectId: number) => {
    setLoadingTeachers(true);
    try {
      const res = await fetch(`/api/admin/subjects/${subjectId}/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeachers(data.data || []);
      }
    } catch (err) { console.error(err); } 
    finally { setLoadingTeachers(false); }
  };

  // --- HANDLERS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numFields = ['subjectId', 'teacherId', 'semesterId', 'maxStudents'];
    
    setForm(prev => ({
      ...prev,
      [name]: numFields.includes(name) ? Number(value) : value
    }));

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectId = Number(e.target.value);
    setForm(prev => ({ 
      ...prev, 
      subjectId, 
      teacherId: 0,
      elearningDayOfWeek: '',
      elearningTimeSlot: ''
    }));
    
    if (subjectId) {
      const subj = subjects.find(s => s.subjectId === subjectId);
      setSelectedSubject(subj || null);
      loadTeachers(subjectId);
    } else {
      setSelectedSubject(null);
      setTeachers([]);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.classCode.trim()) errs.classCode = 'Mã lớp bắt buộc';
    if (!form.subjectId) errs.subjectId = 'Chọn môn học';
    if (!form.teacherId) errs.teacherId = 'Chọn giảng viên';
    if (!form.semesterId) errs.semesterId = 'Chọn học kỳ';
    if (form.maxStudents < 1 || form.maxStudents > 200) errs.maxStudents = 'Sĩ số 1-200';
    
    // Fixed schedule
    if (!form.dayOfWeek) errs.dayOfWeek = 'Chọn thứ';
    if (!form.timeSlot) errs.timeSlot = 'Chọn ca';

    // E-learning schedule
    if (hasElearning) {
      if (!form.elearningDayOfWeek) errs.elearningDayOfWeek = 'Chọn thứ online';
      if (!form.elearningTimeSlot) errs.elearningTimeSlot = 'Chọn ca online';
    }

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestData: any = {
        dayOfWeek: form.dayOfWeek,
        timeSlot: form.timeSlot,
      };

      if (hasElearning) {
        requestData.elearningDayOfWeek = form.elearningDayOfWeek;
        requestData.elearningTimeSlot = form.elearningTimeSlot;
      }

      let res;
      if (isEdit) {
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
        alert(isEdit ? '✅ Cập nhật thành công!' : `✅ Tạo lớp thành công!\nPhòng: ${result.data.fixedRoom || 'Tự động gán'}`);
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        alert(`❌ ${err.message}`);
      }
    } catch (err) {
      alert('❌ Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({
      classCode: '', subjectId: 0, teacherId: 0, semesterId: 0, maxStudents: 60,
      dayOfWeek: '', timeSlot: '', elearningDayOfWeek: '', elearningTimeSlot: '',
    });
    setErrors({});
    setTeachers([]);
    setSelectedSubject(null);
  };

  if (!isOpen) return null;

  // --- RENDER ---
  return (
    <div className="class-modal-wrapper cm-overlay" onClick={onClose}>
      <div className="cm-modal" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="cm-header">
          <h2 className="cm-title">
            {isEdit ? '✏️ Chỉnh sửa Lớp học phần' : '➕ Mở Lớp học phần mới'}
          </h2>
          <button className="cm-close" onClick={onClose}>&times;</button>
        </div>

        {/* BODY */}
        <form onSubmit={submit} className="cm-body">
          
          {/* INFO BOX */}
          <div className="cm-info-main">
            <strong>🚀 Quy trình tự động:</strong>
            <ul>
              <li>Hệ thống tự động gán phòng học phù hợp (theo sức chứa).</li>
              <li>Lịch học (10-15 tuần) sẽ được tạo tự động ngay khi lưu.</li>
              <li>Nếu có E-learning, lịch online sẽ được tạo song song.</li>
            </ul>
          </div>

          {/* ROW 1: CODE & MAX STUDENTS */}
          <div className="cm-row-2">
            <div className="cm-group">
              <label className="cm-label">Mã lớp <span className="required">*</span></label>
              <input
                className="cm-input"
                name="classCode"
                value={form.classCode}
                onChange={handleChange}
                placeholder="VD: INT301-01"
                disabled={isEdit}
              />
              {errors.classCode && <span className="cm-error">{errors.classCode}</span>}
            </div>
            
            <div className="cm-group">
              <label className="cm-label">Sĩ số tối đa <span className="required">*</span></label>
              <input
                type="number"
                className="cm-input"
                name="maxStudents"
                value={form.maxStudents}
                onChange={handleChange}
                min="1" max="200"
              />
              {errors.maxStudents && <span className="cm-error">{errors.maxStudents}</span>}
            </div>
          </div>

          {/* ROW 2: SEMESTER & SUBJECT */}
          <div className="cm-row-2">
            <div className="cm-group">
              <label className="cm-label">Học kỳ <span className="required">*</span></label>
              <select
                className="cm-select"
                name="semesterId"
                value={form.semesterId || ''}
                onChange={handleChange}
                disabled={isEdit}
              >
                <option value="">-- Chọn học kỳ --</option>
                {semesters.map(s => (
                  <option key={s.semesterId} value={s.semesterId}>
                    {s.semesterCode} - {s.semesterName}
                  </option>
                ))}
              </select>
              {errors.semesterId && <span className="cm-error">{errors.semesterId}</span>}
            </div>

            <div className="cm-group">
              <label className="cm-label">Môn học <span className="required">*</span></label>
              <select
                className="cm-select"
                name="subjectId"
                value={form.subjectId || ''}
                onChange={handleSubjectChange}
                disabled={isEdit}
              >
                <option value="">-- Chọn môn học --</option>
                {subjects.map(s => (
                  <option key={s.subjectId} value={s.subjectId}>
                    {s.subjectCode} - {s.subjectName}
                  </option>
                ))}
              </select>
              {errors.subjectId && <span className="cm-error">{errors.subjectId}</span>}
              
              {/* SUBJECT DETAILS */}
              {selectedSubject && (
                <div className="cm-info-subject">
                  <div className="subject-stat-row">
                    <span>📚 Tín chỉ:</span> <strong>{selectedSubject.credits}</strong>
                  </div>
                  <div className="subject-stat-row">
                    <span>🏫 Trực tiếp:</span> <strong>{selectedSubject.inpersonSessions} buổi</strong>
                  </div>
                  <div className="subject-stat-row">
                    <span>💻 E-learning:</span> <strong>{selectedSubject.elearningSessions} buổi</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ROW 3: TEACHER */}
          <div className="cm-group">
            <label className="cm-label">Giảng viên <span className="required">*</span></label>
            <select
              className="cm-select"
              name="teacherId"
              value={form.teacherId || ''}
              onChange={handleChange}
              disabled={!form.subjectId || loadingTeachers}
            >
              <option value="">
                {loadingTeachers ? 'Đang tải danh sách...' : '-- Chọn giảng viên --'}
              </option>
              {teachers.map(t => (
                <option key={t.teacherId} value={t.teacherId}>
                  {t.fullName} {t.degree ? `(${t.degree})` : ''} - {t.majorName}
                </option>
              ))}
            </select>
            {errors.teacherId && <span className="cm-error">{errors.teacherId}</span>}
            {!form.subjectId && <span className="cm-hint">Vui lòng chọn môn học trước</span>}
          </div>

          <hr style={{border: 'none', borderTop: '1px solid #e2e8f0', margin: '20px 0'}} />

          {/* SCHEDULE SECTION 1: FIXED */}
          <div className="cm-schedule-box">
            <div className="cm-box-title title-fixed">
              📅 Lịch học Cố định (Trực tiếp)
            </div>
            <div className="cm-schedule-grid">
              <div className="cm-group" style={{marginBottom:0}}>
                <label className="cm-label">Thứ</label>
                <select className="cm-select" name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange}>
                  <option value="">-- Chọn --</option>
                  {DAYS_OF_WEEK.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                {errors.dayOfWeek && <span className="cm-error">{errors.dayOfWeek}</span>}
              </div>
              <div className="cm-group" style={{marginBottom:0}}>
                <label className="cm-label">Ca học</label>
                <select className="cm-select" name="timeSlot" value={form.timeSlot} onChange={handleChange}>
                  <option value="">-- Chọn --</option>
                  {TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label} ({s.time})</option>)}
                </select>
                {errors.timeSlot && <span className="cm-error">{errors.timeSlot}</span>}
              </div>
            </div>
            <div className="cm-hint" style={{marginTop:'12px', color:'#16a34a'}}>
              ✅ Phòng học sẽ được gán tự động dựa trên sức chứa.
            </div>
          </div>

          {/* SCHEDULE SECTION 2: E-LEARNING (CONDITIONAL) */}
          {hasElearning && (
            <div className="cm-schedule-box elearning">
              <div className="cm-box-title title-elearning">
                💻 Lịch E-learning ({selectedSubject?.elearningSessions} buổi)
              </div>
              <div className="cm-schedule-grid">
                <div className="cm-group" style={{marginBottom:0}}>
                  <label className="cm-label">Thứ (Online)</label>
                  <select className="cm-select" name="elearningDayOfWeek" value={form.elearningDayOfWeek} onChange={handleChange}>
                    <option value="">-- Chọn --</option>
                    {DAYS_OF_WEEK.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                  {errors.elearningDayOfWeek && <span className="cm-error">{errors.elearningDayOfWeek}</span>}
                </div>
                <div className="cm-group" style={{marginBottom:0}}>
                  <label className="cm-label">Ca học (Online)</label>
                  <select className="cm-select" name="elearningTimeSlot" value={form.elearningTimeSlot} onChange={handleChange}>
                    <option value="">-- Chọn --</option>
                    {TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label} ({s.time})</option>)}
                  </select>
                  {errors.elearningTimeSlot && <span className="cm-error">{errors.elearningTimeSlot}</span>}
                </div>
              </div>
              <div className="cm-hint" style={{marginTop:'12px', color:'#b45309'}}>
                🌐 Không kiểm tra trùng lịch phòng học (Room ONLINE).
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="cm-footer">
            <button type="button" className="cm-btn btn-cancel" onClick={onClose}>Hủy bỏ</button>
            <button type="submit" className="cm-btn btn-submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : isEdit ? 'Lưu thay đổi' : 'Tạo lớp mới'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ClassModal;