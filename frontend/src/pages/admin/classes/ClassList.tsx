import React, { useState, useEffect } from 'react';
import './ClassList.css'; // File CSS độc lập

// Import modals (Giả định các file này đã tồn tại)
import SessionListModal from './SessionListModal';
import StudentListModal from './StudentListModal';
import ClassModal from './ClassModal';

interface ClassItem {
  classId: number;
  classCode: string;
  // Subject info
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  totalSessions: number;
  inPersonSessions: number;
  eLearningSessions: number;
  // Teacher info
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  teacherDegree: string | null;
  // Semester info
  semesterId: number;
  semesterCode: string;
  semesterName: string;
  semesterStatus: string;
  // Capacity
  maxStudents: number;
  enrolledCount: number;
  availableSeats: number;
  // Status
  status: string;
  canRegister: boolean;
  isFull: boolean;
  // Schedule
  dayOfWeek: string;
  dayOfWeekDisplay: string;
  timeSlot: string;
  timeSlotDisplay: string;
  room: string;
  // Dates
  startDate: string;
  endDate: string;
  // Statistics
  totalSessionsGenerated: number;
  completedSessions: number;
  rescheduledSessionsCount: number;
  // Metadata
  createdAt: string;
  updatedAt: string;
}

interface Semester {
  semesterId: number;
  semesterCode: string;
  semesterName: string;
  status: string;
  startDate: string;
  endDate: string;
}

const ClassList: React.FC = () => {
  // ==================== STATE ====================
  
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  
  // Filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<number | ''>('');
  const [semesters, setSemesters] = useState<Semester[]>([]);
  
  // Modals
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  
  // ==================== FETCH DATA ====================
  
  useEffect(() => {
    fetchClasses();
    fetchSemesters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedSemester]);
  
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = `/api/admin/classes?page=${currentPage}&size=${pageSize}&sortBy=classCode&sortDir=asc`;
      
      if (selectedSemester) {
        url = `/api/admin/classes/semester/${selectedSemester}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Không thể tải danh sách lớp học');
      
      const data = await response.json();
      
      if (selectedSemester) {
        setClasses(data.data);
        setTotalElements(data.data.length);
        setTotalPages(1);
      } else {
        setClasses(data.data.content);
        setTotalElements(data.data.totalElements);
        setTotalPages(data.data.totalPages);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/admin/semesters', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch semesters');
      
      const data = await response.json();
      
      if (Array.isArray(data.data)) {
        setSemesters(data.data);
      } else if (data.data && Array.isArray(data.data.content)) {
        setSemesters(data.data.content);
      } else {
        setSemesters([]);
      }
    } catch (err) {
      console.error('Error fetching semesters:', err);
      setSemesters([]);
    }
  };
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) {
      fetchClasses();
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/classes/search?keyword=${encodeURIComponent(searchKeyword)}&page=${currentPage}&size=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Tìm kiếm thất bại');
      
      const data = await response.json();
      setClasses(data.data.content);
      setTotalElements(data.data.totalElements);
      setTotalPages(data.data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  // ==================== ACTIONS ====================
  
  const handleViewSessions = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setShowSessionModal(true);
  };
  
  const handleViewStudents = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setShowStudentModal(true);
  };
  
  const handleEditClass = (classItem: ClassItem) => {
    setSelectedClass(classItem);
    setShowClassModal(true);
  };
  
  const handleDeleteClass = async (classId: number, classCode: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa lớp ${classCode}?\nChỉ có thể xóa lớp chưa có sinh viên đăng ký.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Delete failed');
      }
      
      alert('Xóa lớp học thành công!');
      fetchClasses();
    } catch (err) {
      alert(`Lỗi: ${err instanceof Error ? err.message : 'Delete failed'}`);
    }
  };
  
  // ==================== HELPERS ====================
  
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; text: string }> = {
      'OPEN': { className: 'badge-open', text: 'Mở' },
      'FULL': { className: 'badge-full', text: 'Đầy' },
      'CLOSED': { className: 'badge-closed', text: 'Đóng' }
    };
    
    const badge = badges[status] || { className: 'badge-closed', text: status };
    return <span className={`badge ${badge.className}`}>{badge.text}</span>;
  };
  
  const getSemesterBadge = (status: string) => {
    const badges: Record<string, { className: string; text: string }> = {
      'UPCOMING': { className: 'badge-upcoming', text: 'Sắp tới' },
      'ACTIVE': { className: 'badge-active', text: 'Đang học' },
      'COMPLETED': { className: 'badge-completed', text: 'Đã xong' }
    };
    
    const badge = badges[status] || { className: '', text: status };
    return <span className={`badge ${badge.className}`}>{badge.text}</span>;
  };
  
  // ==================== RENDER ====================
  
  return (
    // Scope tất cả vào class-list-page để CSS độc lập
    <div className="class-list-page">
      {/* HEADER */}
      <div className="page-header">
    <h1>Quản lý Lớp học</h1>

    <button
      className="btn btn-add"
      onClick={() => {
        setSelectedClass(null);
        setShowClassModal(true);
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M12 5v14m7-7H5"
        />
      </svg>
      <span>Tạo lớp mới</span>
    </button>
  </div>
      
      {/* FILTERS */}
      <div className="filters-bar">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm theo mã lớp, môn học, giảng viên..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <button type="submit" className="btn-search">
            Tìm kiếm
          </button>
        </form>
        
        <select
          className="filter-select"
          value={selectedSemester}
          onChange={(e) => {
            setSelectedSemester(e.target.value ? Number(e.target.value) : '');
            setCurrentPage(0);
          }}
        >
          <option value="">-- Tất cả học kỳ --</option>
          {Array.isArray(semesters) && semesters.map(sem => (
            <option key={sem.semesterId} value={sem.semesterId}>
              {sem.semesterCode} - {sem.semesterName}
            </option>
          ))}
        </select>
      </div>
      
      {/* TABLE */}
      <div className="table-container">
        {loading ? (
          <div className="loading"> Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="error-message"> {error}</div>
        ) : classes.length === 0 ? (
          <div className="no-data">Không tìm thấy lớp học nào</div>
        ) : (
          <>
            <table className="class-table">
              <thead>
                <tr>
                  <th>Mã lớp</th>
                  <th>Môn học</th>
                  <th>Giảng viên</th>
                  <th>Học kỳ</th>
                  <th>Sĩ số</th>
                  <th>Tiến độ</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls.classId}>
                    <td data-label="Mã lớp">
                      <strong>{cls.classCode}</strong>
                    </td>
                    <td data-label="Môn học">
                      <div className="subject-info">
                        <span className="subject-code">{cls.subjectCode}</span>
                        <span className="subject-name">{cls.subjectName}</span>
                        <span className="credits">({cls.credits} TC)</span>
                      </div>
                    </td>
                    <td data-label="Giảng viên">
                      {cls.teacherName || <span style={{color:'#999'}}>Chưa phân công</span>}
                    </td>
                    <td data-label="Học kỳ">
                      <div className="semester-info">
                        <span>{cls.semesterCode}</span>
                        {getSemesterBadge(cls.semesterStatus)}
                      </div>
                    </td>
                    <td data-label="Sĩ số">
                      <div className="enrollment-info">
                        <div className="enrollment-count">
                          <strong>{cls.enrolledCount}</strong> / {cls.maxStudents}
                        </div>
                        <div className="seats-available">
                          Còn {cls.availableSeats} chỗ
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${Math.min((cls.enrolledCount / cls.maxStudents) * 100, 100)}%`,
                              backgroundColor: cls.enrolledCount >= cls.maxStudents ? '#ef4444' : '#10b981'
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td data-label="Tiến độ">
                      <div className="sessions-info">
                        <div>{cls.totalSessionsGenerated} buổi</div>
                        {cls.completedSessions > 0 && (
                          <small style={{color: '#6b7280'}}>Đã xong: {cls.completedSessions}</small>
                        )}
                      </div>
                    </td>
                    <td data-label="Trạng thái">
                      {getStatusBadge(cls.status)}
                    </td>

<td data-label="Thao tác">
  <div className="action-buttons">
    {/* Nút 1: Lịch (Góc trên trái) */}
    <button
      className="btn-action btn-view"
      onClick={() => handleViewSessions(cls)}
      title="Xem lịch chi tiết"
    >
      Lịch
    </button>

    {/* Nút 2: Sinh viên (Góc trên phải) */}
    <button
      className="btn-action btn-students"
      onClick={() => handleViewStudents(cls)}
      title={`Xem danh sách sinh viên (${cls.enrolledCount})`}
    >
      SV
    </button>

    {/* Nút 3: Sửa (Góc dưới trái) */}
    <button
      className="btn-action btn-edit"
      onClick={() => handleEditClass(cls)}
      title="Chỉnh sửa thông tin"
    >
      Sửa
    </button>

    {/* Nút 4: Xóa (Góc dưới phải) */}
    <button
      className="btn-action btn-delete"
      onClick={() => handleDeleteClass(cls.classId, cls.classCode)}
      title="Xóa lớp học"
      disabled={cls.enrolledCount > 0}
    >
      Xóa
    </button>
  </div>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* PAGINATION */}
            <div className="pagination">
                <div className="pagination-info">
                 Hiện thị {classes.length}/{totalElements} lớp học
                </div>
                <div className="pagination-controls">
                  <button className="btn-page" onClick={() => setCurrentPage(0)} disabled={currentPage === 0}>«</button>
                  <button className="btn-page" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 0}>‹</button>
                  <span style={{margin: '0 10px', fontWeight: 600}}>{currentPage + 1}</span>
                  <button className="btn-page" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}>›</button>
                  <button className="btn-page" onClick={() => setCurrentPage(totalPages - 1)} disabled={currentPage >= totalPages - 1}>»</button>
                </div>
              </div>
          </>
        )}
      </div>
      
      {/* MODALS */}
      {showSessionModal && selectedClass && (
        <SessionListModal
          classData={selectedClass}
          onClose={() => setShowSessionModal(false)}
        />
      )}
      
      {showStudentModal && selectedClass && (
        <StudentListModal
          classData={selectedClass}
          onClose={() => setShowStudentModal(false)}
          onUpdate={fetchClasses}
        />
      )}
      
      {showClassModal && (
        <ClassModal
          isOpen={showClassModal}
          classData={selectedClass || undefined}
          onClose={() => {
            setShowClassModal(false);
            setSelectedClass(null);
          }}
          onSuccess={() => {
            fetchClasses();
            setShowClassModal(false);
            setSelectedClass(null);
          }}
        />
      )}
    </div>
  );
};

export default ClassList;