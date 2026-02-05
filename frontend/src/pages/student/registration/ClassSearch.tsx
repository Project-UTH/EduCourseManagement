import React, { useState, useEffect } from 'react';
import axios from 'axios';
import registrationApi from '../../../services/api/registrationApi';
import './ClassSearch.css';

interface ClassItem {
  classId: number;
  classCode: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  teacherName: string;
  dayOfWeek: string;
  dayOfWeekDisplay: string;
  timeSlot: string;
  timeSlotDisplay: string;
  room: string;
  maxStudents: number;
  enrolledCount: number;
  availableSeats: number;
  semesterName: string;
  status: string;
  canRegister: boolean;
}
interface RegistrationItem {
  classId: number;
  status: 'REGISTERED' | 'CANCELLED' | 'DROPPED';
}


const ClassSearch: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:8080/api/student/classes/available', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page: currentPage,
          size: 10,
          sortBy: 'classCode',
          sortDir: 'asc'
        }
      });

      if (response.data.success) {
        const classData = response.data.data;
        let classList: ClassItem[] = [];
        
        if (classData.content) {
          classList = classData.content || [];
          setTotalPages(classData.totalPages || 0);
        } else if (Array.isArray(classData)) {
          classList = classData;
          setTotalPages(1);
        }

        // LẤY DANH SÁCH LỚP ĐÃ ĐĂNG KÝ
        const myRegistrations = await registrationApi.getMyRegistrations();

const registeredClassIds: number[] = myRegistrations.data.success
  ? (myRegistrations.data.data as RegistrationItem[])
      .filter(reg => reg.status === 'REGISTERED')
      .map(reg => reg.classId)
  : [];


        // LỌC BỎ LỚP ĐÃ ĐĂNG KÝ
        const filteredClasses = classList.filter(
  (cls) => !registeredClassIds.includes(cls.classId)
);


        setClasses(filteredClasses);
      }
    } catch (error: unknown) {
      console.error('Error fetching classes:', error);
      alert('Không thể tải danh sách lớp học!');
      setClasses([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [currentPage]);

  const handleRegister = async (classId: number, className: string) => {
    if (!window.confirm(`Bạn có chắc muốn đăng ký lớp "${className}"?`)) {
      return;
    }

    try {
      const response = await registrationApi.registerForClass(classId);
      
      if (response.data.success) {
        alert('Đăng ký thành công!');
        fetchClasses();
      }
    } catch (error: unknown) {
  let errorMsg = 'Đăng ký thất bại!';

  if (axios.isAxiosError(error)) {
    errorMsg = error.response?.data?.message || errorMsg;
  }

  alert('❌ ' + errorMsg);
}

  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchClasses();
  };

  return (
    <div className="class-search-container">
      <div className="page-header">
        <h1>Tìm Kiếm Lớp Học</h1>
      </div>

      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã lớp, tên môn học, giảng viên..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search">
             Tìm kiếm
          </button>
        </form>
      </div>

      <div className="classes-section">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : classes.length === 0 ? (
          <div className="no-data">Không có lớp học nào!</div>
        ) : (
          <div className="classes-grid">
            {classes.map((cls) => (
              <div key={cls.classId} className="class-card">
                <div className="class-header">
                  <h3>{cls.subjectName}</h3>
                  <span className={`badge ${cls.status.toLowerCase()}`}>
                    {cls.status}
                  </span>
                </div>

                <div className="class-body">
                  <div className="class-info">
                    <div className="info-row">
                      <span className="label">Mã lớp:</span>
                      <span className="value">{cls.classCode}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Mã môn:</span>
                      <span className="value">{cls.subjectCode}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Tín chỉ:</span>
                      <span className="value">{cls.credits} TC</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Giảng viên:</span>
                      <span className="value">{cls.teacherName}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Lịch học:</span>
                      <span className="value">
                        {cls.dayOfWeekDisplay}, {cls.timeSlotDisplay}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Phòng:</span>
                      <span className="value">{cls.room}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Sĩ số:</span>
                      <span className={`value ${cls.availableSeats === 0 ? 'full' : ''}`}>
                        {cls.enrolledCount}/{cls.maxStudents} 
                        ({cls.availableSeats} chỗ trống)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="class-footer">
                  {cls.canRegister ? (
                    <button
                      onClick={() => handleRegister(cls.classId, cls.subjectName)}
                      className="btn-register"
                    >
                      Đăng ký
                    </button>
                  ) : (
                    <button className="btn-register" disabled>
                      Không thể đăng ký
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && classes.length > 0 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="btn-page"
            >
              ← Trước
            </button>
            <span className="page-info">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="btn-page"
            >
              Sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassSearch;