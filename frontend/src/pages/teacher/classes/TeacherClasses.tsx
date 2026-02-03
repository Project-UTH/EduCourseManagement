import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classApi from '../../../services/api/classApi';
import './TeacherClasses.css';
import ChatList from '../../../components/chat/ChatList';
import { useAuthStore } from '@/store/authStore';


/**
 * TeacherClasses Component
 * Scope: Independent styled component (prefix: tc-)
 */
interface TeacherClass {
  classId: number;
  classCode: string;
  subjectName: string;
  subjectCredits?: number;
  credits?: number;

  semesterId: number;
  semesterName: string;

  status: 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'CLOSED' | 'CANCELLED' | 'CANCELED';

  enrolledCount?: number;
  currentStudents?: number;
  maxStudents?: number;
}


const TeacherClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    filterClasses();
  }, [classes, searchTerm, selectedSemester, selectedStatus]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await classApi.getMyClasses() as TeacherClass[];
      setClasses(data);
      setFilteredClasses(data);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClasses = () => {
    let filtered = [...classes];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(cls =>
        cls.subjectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.classCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Semester filter
    if (selectedSemester !== 'all') {
      filtered = filtered.filter(cls => cls.semesterId?.toString() === selectedSemester);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(cls => {
        const classStatus = cls.status?.toUpperCase() || '';
        const filterStatus = selectedStatus.toUpperCase();
        return classStatus === filterStatus;
      });
    }

    setFilteredClasses(filtered);
  };

  // Get unique semesters for filter
  const semesters = Array.from(new Set(classes.map(c => ({
    id: c.semesterId,
    name: c.semesterName
  }))));

  // Calculate statistics
  const stats = {
    totalClasses: classes.length,
    activeClasses: classes.filter(c => c.status?.toUpperCase() === 'OPEN' || c.status?.toUpperCase() === 'ACTIVE').length,
    // ⭐ FIX: Use enrolledCount from backend
    totalStudents: classes.reduce((sum, c) => sum + (c.enrolledCount || c.currentStudents || 0), 0),
    avgClassSize: classes.length > 0 
      ? Math.round(classes.reduce((sum, c) => sum + (c.enrolledCount || c.currentStudents || 0), 0) / classes.length)
      : 0,
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toUpperCase() || '';
    
    const badges: Record<string, { text: string; class: string }> = {
      'ACTIVE': { text: 'Đang dạy', class: 'tc-status-active' },
      'OPEN': { text: 'Đang dạy', class: 'tc-status-active' },
      'COMPLETED': { text: 'Đã kết thúc', class: 'tc-status-completed' },
      'CLOSED': { text: 'Đã kết thúc', class: 'tc-status-completed' },
      'CANCELLED': { text: 'Đã hủy', class: 'tc-status-cancelled' },
      'CANCELED': { text: 'Đã hủy', class: 'tc-status-cancelled' },
    };
    
    return badges[normalizedStatus] || { text: status || 'N/A', class: 'tc-status-default' };
  };

  // Navigation Handlers
  const handleViewDetail = (classId: number) => {
    navigate(`/teacher/classes/${classId}`);
  };

  const handleCreateHomework = (classId: number, e: React.MouseEvent) => {
    e.stopPropagation(); 
    navigate(`/teacher/assignments/create?classId=${classId}`);
  };

  const handleViewGrades = (classId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/teacher/grading?classId=${classId}`);
  };

  const handleViewStats = (classId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/teacher/grade-statistics?classId=${classId}`);
  }

  interface AuthState {
  user: {
    username: string;
    role: string;
  } | null;
}

const user = useAuthStore((state: AuthState) => state.user);


  return (
    <div className="tc-container">
      {/* Page Header */}
      <div className="tc-page-header">
        <div className="tc-header-content">
          <h1> Lớp học của tôi</h1>
          <p>Quản lý các lớp học đang giảng dạy</p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="tc-stats-grid">
        <div className="tc-stat-card">
          <div className="tc-stat-content">
            <div className="tc-stat-label">Tổng số lớp</div>
            <div className="tc-stat-value">{stats.totalClasses}</div>
          </div>
        </div>
        
        <div className="tc-stat-card">
          <div className="tc-stat-content">
            <div className="tc-stat-label">Đang dạy</div>
            <div className="tc-stat-value">{stats.activeClasses}</div>
          </div>
        </div>
        
        <div className="tc-stat-card">
          <div className="tc-stat-content">
            <div className="tc-stat-label">Tổng sinh viên</div>
            <div className="tc-stat-value">{stats.totalStudents}</div>
          </div>
        </div>
        
        <div className="tc-stat-card">
          <div className="tc-stat-content">
            <div className="tc-stat-label">TB mỗi lớp</div>
            <div className="tc-stat-value">{stats.avgClassSize}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="tc-filters-section">
        <div className="tc-search-box">
          <input
            type="text"
            placeholder=" Tìm kiếm lớp học (Tên hoặc mã lớp)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tc-search-input"
          />
        </div>

        <div className="tc-filter-controls">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="tc-filter-select"
          >
            <option value="all">Tất cả học kỳ</option>
            {semesters.map(sem => (
              <option key={sem.id} value={sem.id.toString()}>
                {sem.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="tc-filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="OPEN">Đang dạy</option>
            <option value="COMPLETED">Đã kết thúc</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="tc-loading-state">
          <div className="tc-spinner"></div>
          <p>Đang tải danh sách lớp học...</p>
        </div>
      )}

      {/* Class Cards Grid */}
      {!loading && (
        <div className="tc-classes-grid">
          {filteredClasses.map(cls => {
            //  Calculate current students (use enrolledCount if available)
            const currentStudents = cls.enrolledCount ?? cls.currentStudents ?? 0;
            const maxStudents = cls.maxStudents || 40;
            const capacityPercent = maxStudents > 0 ? (currentStudents / maxStudents) * 100 : 0;

            return (
              <div 
                key={cls.classId} 
                className="tc-class-card"
                onClick={() => handleViewDetail(cls.classId)}
                style={{ cursor: 'pointer' }}
              >
                {/* Card Header */}
                <div className="tc-card-header">
                  <div className="tc-class-title">
                    <h3>{cls.subjectName}</h3>
                    <span className="tc-class-code">{cls.classCode}</span>
                  </div>
                  <span className={`tc-status-badge ${getStatusBadge(cls.status).class}`}>
                    {getStatusBadge(cls.status).text}
                  </span>
                </div>

                {/* Card Body */}
                <div className="tc-card-body">
                  <div className="tc-info-row">
                    <span className="tc-info-label"> Số tín chỉ:</span>
                    <span className="tc-info-value">{cls.subjectCredits || cls.credits} TC</span>
                  </div>

                  <div className="tc-info-row">
                    <span className="tc-info-label">Học kỳ:</span>
                    <span className="tc-info-value">{cls.semesterName}</span>
                  </div>

                  <div className="tc-info-row">
                    <span className="tc-info-label">Sĩ số:</span>
                    <span className="tc-info-value">
                      {currentStudents} / {maxStudents}
                      <span className="tc-capacity-bar">
                        <span 
                          className="tc-capacity-fill" 
                          style={{ width: `${capacityPercent}%` }}
                        ></span>
                      </span>
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="tc-card-actions">
                  <button 
                    className="tc-action-btn tc-btn-primary"
                    onClick={(e) => handleCreateHomework(cls.classId, e)}
                    title="Tạo bài tập mới"
                  >
                  Bài tập
                  </button>

                  <button 
                    className="tc-action-btn tc-btn-secondary"
                    onClick={(e) => handleViewGrades(cls.classId, e)}
                    title="Quản lý điểm"
                  >
                    Chấm điểm
                  </button>
                  
                  <button 
                    className="tc-action-btn tc-btn-secondary"
                    onClick={(e) => handleViewStats(cls.classId, e)}
                    title="Thống kê"
                  >
                    Thống kê
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredClasses.length === 0 && (
        <div className="tc-empty-state">
          <h3>Không tìm thấy lớp học</h3>
          <p>
            {searchTerm || selectedSemester !== 'all' || selectedStatus !== 'all'
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Bạn chưa được phân công giảng dạy lớp học nào'}
          </p>
        </div>
      )}
      <ChatList currentUsername={user?.username || 'teacher'} currentRole="TEACHER" />
    </div>
  );
};

export default TeacherClasses;