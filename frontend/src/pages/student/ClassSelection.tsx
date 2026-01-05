import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../services/api/apiClient';
import registrationApi from '../../services/api/registrationApi';
import './ClassSelection.css';

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
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  
  // Lấy semesterId từ URL query params
  const searchParams = new URLSearchParams(location.search);
  const semesterId = searchParams.get('semesterId');

  useEffect(() => {
    if (subjectId) {
      fetchData(Number(subjectId));
    }
  }, [subjectId, semesterId]);

  const fetchData = async (id: number) => {
    setLoading(true);
    try {
      console.log('🔍 Fetching subject ID:', id);
      console.log('📅 Semester filter:', semesterId);
      
      // Fetch subject
      const subjectRes = await apiClient.get(`/api/student/subjects/${id}`);
      console.log('📘 Subject response:', subjectRes);
      
      if (subjectRes.data && subjectRes.data.success) {
        setSubject(subjectRes.data.data);
      }

      // Fetch classes với semesterId filter
      const classUrl = semesterId 
        ? `/api/student/classes/by-subject/${id}?semesterId=${semesterId}`
        : `/api/student/classes/by-subject/${id}`;
      
      console.log('🔗 Class URL:', classUrl);
      
      const classRes = await apiClient.get(classUrl);
      console.log('📚 Classes response:', classRes);
      
      if (classRes.data && classRes.data.success) {
        const classList = classRes.data.data || [];
        console.log(`✅ Received ${classList.length} classes`);
        setClasses(classList);
      }
    } catch (error: any) {
      console.error('❌ Error:', error);
      
      if (error.response?.status === 401) {
        alert('❌ Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.');
        navigate('/login');
      } else {
        alert('❌ Không thể tải thông tin!');
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
      `Bạn có chắc muốn đăng ký lớp "${selectedClass.classCode}"?\n\n` +
      `Môn: ${subject?.subjectName}\n` +
      `GV: ${selectedClass.teacherName}\n` +
      `Lịch: ${selectedClass.dayOfWeekDisplay}, ${selectedClass.timeSlotDisplay}`
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
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải danh sách lớp học...</p>
      </div>
    );
  }

  if (!subject) {
    return <div className="error-container">Không tìm thấy môn học!</div>;
  }

  return (
    <div className="class-selection-page">
      {/* Header */}
      <div className="page-header">
        <button onClick={handleBack} className="btn-back">
          ← Quay lại
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
          <h2>Lớp học phần đang chờ đăng ký</h2>
          {semesterId && (
            <div className="semester-info">
              <span>🎓 Học kỳ được chọn</span>
            </div>
          )}
          <div className="filter-option">
            <label>
              <input type="checkbox" defaultChecked />
              Lọc tất cả lịch trùng
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="classes-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}></th>
                <th style={{ width: '60px' }}>STT</th>
                <th style={{ width: '250px' }}>Tên lớp học phần</th>
                <th style={{ width: '150px' }}>Mã lớp học phần</th>
                <th style={{ width: '100px' }}>Đã đăng ký</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="no-data">
                    <span className="no-data-icon">📚</span>
                    <p>Chưa có lớp học nào!</p>
                    <small>
                      {semesterId 
                        ? 'Không có lớp nào trong học kỳ này' 
                        : 'Vui lòng liên hệ phòng đào tạo'}
                    </small>
                  </td>
                </tr>
              ) : (
                classes.map((cls, index) => (
                  <tr
                    key={cls.classId}
                    className={selectedClassId === cls.classId ? 'selected-row' : ''}
                  >
                    <td>
                      <input
                        type="radio"
                        name="class"
                        checked={selectedClassId === cls.classId}
                        onChange={() => setSelectedClassId(cls.classId)}
                        disabled={!cls.canRegister}
                      />
                    </td>
                    <td>{index + 1}</td>
                    <td>
                      <div className="class-name">
                        <strong>{subject.subjectName}</strong>
                        <div className="class-status">
                          Trạng thái: <span className={`status-${cls.status.toLowerCase()}`}>
                            {cls.status === 'OPEN' ? 'Đang chờ đăng ký' : 'Đã đầy'}
                          </span>
                        </div>
                        <div className="class-code-small">
                          Mã lớp: {cls.classCode} | Học kỳ: {cls.semesterCode}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="class-code-main">{cls.classCode}</div>
                    </td>
                    <td className="text-center">
                      <button className="btn-view-detail">∞</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail */}
      <div className="class-detail-section">
        <h3>Chi tiết lớp học phần</h3>
        {selectedClassId ? (
          <div className="detail-content">
            {(() => {
              const selectedClass = classes.find(c => c.classId === selectedClassId);
              if (!selectedClass) return <p>Chọn lớp để xem chi tiết</p>;
              
              return (
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Giảng viên:</label>
                    <span>{selectedClass.teacherName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Lịch học:</label>
                    <span>{selectedClass.dayOfWeekDisplay}, {selectedClass.timeSlotDisplay}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phòng:</label>
                    <span>{selectedClass.room}</span>
                  </div>
                  <div className="detail-item">
                    <label>Sĩ số:</label>
                    <span>{selectedClass.enrolledCount}/{selectedClass.maxStudents}</span>
                  </div>
                  <div className="detail-item">
                    <label>Học kỳ:</label>
                    <span>{selectedClass.semesterCode}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="detail-content">
            <p className="text-muted">Chọn lớp để xem chi tiết</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="action-buttons">
        <button onClick={handleRegister} disabled={!selectedClassId} className="btn-register">
          ĐĂNG KÝ
        </button>
      </div>
    </div>
  );
};

export default ClassSelection;