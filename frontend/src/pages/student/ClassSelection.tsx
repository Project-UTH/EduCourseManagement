import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../services/api/apiClient';
import registrationApi from '../../services/api/registrationApi';
import './ClassSelection.css'; // File CSS đã cập nhật

interface Subject {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  departmentName: string;
  majorName?: string;
}

interface ClassItem {
  classId: number;
  classCode: string;
  teacherName: string;
  dayOfWeek: string;
  dayOfWeekDisplay: string;
  timeSlot: string;
  timeSlotDisplay: string;
  room: string;
  maxStudents: number;
  enrolledCount: number;
  availableSeats: number;
  status: string;
  canRegister: boolean;
  semesterId: number;
  semesterCode: string;
}

const ClassSelection: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [subject, setSubject] = useState<Subject | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  const searchParams = new URLSearchParams(location.search);
  const semesterId = searchParams.get('semesterId');

  useEffect(() => {
    if (subjectId) {
      fetchData(Number(subjectId));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, semesterId]);

  const fetchData = async (id: number) => {
    setLoading(true);
    try {
      const subjectRes = await apiClient.get(`/api/student/subjects/${id}`);
      if (subjectRes.data && subjectRes.data.success) {
        setSubject(subjectRes.data.data);
      }

      const classUrl = semesterId 
        ? `/api/student/classes/by-subject/${id}?semesterId=${semesterId}`
        : `/api/student/classes/by-subject/${id}`;
      
      const classRes = await apiClient.get(classUrl);
      if (classRes.data && classRes.data.success) {
        setClasses(classRes.data.data || []);
      }
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 401) {
        alert('Phiên đăng nhập hết hạn!');
        navigate('/login');
      } else {
        alert('Không thể tải thông tin!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedClassId) {
      alert('⚠️ Vui lòng chọn lớp học!');
      return;
    }

    const selectedClass = classes.find(c => c.classId === selectedClassId);
    if (!selectedClass) return;

    if (!window.confirm(
      `Xác nhận đăng ký lớp "${selectedClass.classCode}"?\n\n` +
      `📌 Môn: ${subject?.subjectName}\n` +
      `👨‍🏫 GV: ${selectedClass.teacherName}\n` +
      `📅 Lịch: ${selectedClass.dayOfWeekDisplay}, ${selectedClass.timeSlotDisplay}`
    )) {
      return;
    }

    try {
      const response = await registrationApi.registerForClass(selectedClassId);
      if (response.data.success) {
        alert('✅ Đăng ký thành công!');
        navigate('/student/registrations');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Đăng ký thất bại!';
      alert('❌ ' + errorMsg);
    }
  };

  const handleBack = () => {
    navigate('/student/subjects');
  };

  if (loading) {
    return (
      <div className="class-selection-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu lớp học...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="class-selection-page">
        <div className="error-container">❌ Không tìm thấy thông tin môn học!</div>
      </div>
    );
  }

  return (
    <div className="class-selection-page">
      {/* Header */}
      <div className="page-header">
        <button onClick={handleBack} className="btn-back">
          <span>←</span> Quay lại danh sách môn
        </button>
        <div className="subject-info">
          <h1>{subject.subjectName}</h1>
          <div className="subject-meta">
            <span>Mã môn: <strong>{subject.subjectCode}</strong></span>
            <span>Tín chỉ: <strong>{subject.credits} TC</strong></span>
            <span>Khoa: <strong>{subject.departmentName}</strong></span>
            {subject.majorName && (
              <span>Ngành: <strong>{subject.majorName}</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* Classes Section */}
      <div className="classes-section">
        <div className="section-title">
          <h2>📚 Danh sách Lớp học phần</h2>
          {semesterId && (
            <div className="semester-info" style={{fontSize: '13px', opacity: 0.9}}>
              🎓 Học kỳ hiện tại
            </div>
          )}
        </div>

        <div className="table-container">
          <table className="classes-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}></th>
                <th style={{ width: '60px' }}>STT</th>
                <th style={{ width: '300px' }}>Lớp học phần</th>
                <th style={{ width: '150px' }}>Mã lớp</th>
                <th style={{ width: '100px', textAlign:'center' }}>Sĩ số</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="no-data">
                    <span className="no-data-icon">📭</span>
                    <p>Chưa có lớp học nào được mở cho môn này.</p>
                  </td>
                </tr>
              ) : (
                classes.map((cls, index) => (
                  <tr
                    key={cls.classId}
                    className={selectedClassId === cls.classId ? 'selected-row' : ''}
                    onClick={() => cls.canRegister && setSelectedClassId(cls.classId)}
                    style={{cursor: cls.canRegister ? 'pointer' : 'default'}}
                  >
                    <td>
                      <input
                        type="radio"
                        name="class"
                        checked={selectedClassId === cls.classId}
                        onChange={() => setSelectedClassId(cls.classId)}
                        disabled={!cls.canRegister}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>{index + 1}</td>
                    <td>
                      <div className="class-name">
                        <strong>{subject.subjectName}</strong>
                        <div className="class-status">
                          Trạng thái: <span className={`status-${cls.status.toLowerCase()}`}>
                            {cls.status === 'OPEN' ? '🟢 Đang mở' : '🔴 Đã đầy'}
                          </span>
                        </div>
                        <div className="class-code-small">
                          HK: {cls.semesterCode}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="class-code-main">{cls.classCode}</div>
                    </td>
                    <td className="text-center">
                      <span style={{fontWeight: 600, color: cls.enrolledCount >= cls.maxStudents ? '#dc2626' : '#16a34a'}}>
                        {cls.enrolledCount}
                      </span>
                      /{cls.maxStudents}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Class Detail */}
        <div className="class-detail-section">
          <h3>ℹ️ Chi tiết lớp đã chọn</h3>
          {selectedClassId ? (
            <div className="detail-content">
              {(() => {
                const selectedClass = classes.find(c => c.classId === selectedClassId);
                if (!selectedClass) return null;
                
                return (
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>👨‍🏫 Giảng viên:</label>
                      <span>{selectedClass.teacherName}</span>
                    </div>
                    <div className="detail-item">
                      <label>⏰ Lịch học:</label>
                      <span>{selectedClass.dayOfWeekDisplay}, {selectedClass.timeSlotDisplay}</span>
                    </div>
                    <div className="detail-item">
                      <label>📍 Phòng học:</label>
                      <span>{selectedClass.room}</span>
                    </div>
                    <div className="detail-item">
                      <label>📊 Sĩ số:</label>
                      <span>
                        {selectedClass.enrolledCount} / {selectedClass.maxStudents} 
                        <span style={{fontSize:'12px', color:'#6b7280', marginLeft:'6px'}}>
                          (Còn {selectedClass.availableSeats} chỗ)
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="detail-content">
              <p className="text-muted">👈 Vui lòng chọn một lớp trong bảng để xem chi tiết</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            onClick={handleRegister} 
            disabled={!selectedClassId} 
            className="btn-register"
          >
            ✅ ĐĂNG KÝ HỌC PHẦN
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassSelection;