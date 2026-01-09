import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classApi from '../../../services/api/classApi';
import './TeacherClasses.css';

/**
 * TeacherClasses Component
 * 
 * Display all classes that the teacher is teaching
 * Features:
 * - Class cards with details
 * - Quick action buttons
 * - Filters (semester, status)
 * - Search functionality
 * - Summary statistics
 */

const TeacherClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
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
      const data: any = await classApi.getMyClasses();
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

    // Debug: Log actual status values
    console.log('All classes statuses:', classes.map(c => ({
      code: c.classCode,
      status: c.status,
      statusType: typeof c.status
    })));

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

    // Status filter - FIXED: Case-insensitive comparison
    if (selectedStatus !== 'all') {
      console.log('Filtering by status:', selectedStatus);
      filtered = filtered.filter(cls => {
        const classStatus = cls.status?.toUpperCase() || '';
        const filterStatus = selectedStatus.toUpperCase();
        console.log(`Comparing: "${classStatus}" === "${filterStatus}"`, classStatus === filterStatus);
        return classStatus === filterStatus;
      });
    }

    console.log('Filtered result:', filtered.length, 'classes');
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
    activeClasses: classes.filter(c => c.status?.toUpperCase() === 'OPEN').length,
    totalStudents: classes.reduce((sum, c) => sum + (c.currentStudents || 0), 0),
    avgClassSize: classes.length > 0 
      ? Math.round(classes.reduce((sum, c) => sum + (c.currentStudents || 0), 0) / classes.length)
      : 0,
  };

  const getStatusBadge = (status: string) => {
    // Normalize status to uppercase for comparison
    const normalizedStatus = status?.toUpperCase() || '';
    
    const badges: Record<string, { text: string; class: string }> = {
      'ACTIVE': { text: 'Đang dạy', class: 'status-active' },
      'OPEN': { text: 'Đang dạy', class: 'status-active' },
      'COMPLETED': { text: 'Đã kết thúc', class: 'status-completed' },
      'CLOSED': { text: 'Đã kết thúc', class: 'status-completed' },
      'CANCELLED': { text: 'Đã hủy', class: 'status-cancelled' },
      'CANCELED': { text: 'Đã hủy', class: 'status-cancelled' },
    };
    
    return badges[normalizedStatus] || { text: status || 'N/A', class: 'status-default' };
  };

  const formatSchedule = (dayOfWeek: string, timeSlot: string) => {
    const days: Record<string, string> = {
      'MONDAY': 'Thứ 2',
      'TUESDAY': 'Thứ 3',
      'WEDNESDAY': 'Thứ 4',
      'THURSDAY': 'Thứ 5',
      'FRIDAY': 'Thứ 6',
      'SATURDAY': 'Thứ 7',
      'SUNDAY': 'Chủ nhật',
    };
    return `${days[dayOfWeek] || dayOfWeek} - ${timeSlot}`;
  };

  const handleCreateHomework = (classId: number) => {
    navigate(`/teacher/assignments/create?classId=${classId}`);
  };

  const handleViewGrades = (classId: number) => {
    navigate(`/teacher/grading?classId=${classId}`);
  };

  const handleViewStats = (classId: number) => {
    navigate(`/teacher/grade-statistics?classId=${classId}`);
  };

  return (
    <div className="teacher-classes-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>📚 Lớp học của tôi</h1>
          <p>Quản lý các lớp học đang giảng dạy</p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Tổng số lớp</div>
            <div className="stat-value">{stats.totalClasses}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Đang dạy</div>
            <div className="stat-value">{stats.activeClasses}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-label">Tổng sinh viên</div>
            <div className="stat-value">{stats.totalStudents}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">TB mỗi lớp</div>
            <div className="stat-value">{stats.avgClassSize}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm lớp học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="filter-select"
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
            className="filter-select"
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
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải danh sách lớp học...</p>
        </div>
      )}

      {/* Class Cards Grid */}
      {!loading && (
        <div className="classes-grid">
          {filteredClasses.map(cls => (
            <div key={cls.classId} className="class-card">
              {/* Card Header */}
              <div className="card-header">
                <div className="class-title">
                  <h3>{cls.subjectName}</h3>
                  <span className="class-code">{cls.classCode}</span>
                </div>
                <span className={`status-badge ${getStatusBadge(cls.status).class}`}>
                  {getStatusBadge(cls.status).text}
                </span>
              </div>

              {/* Card Body */}
              <div className="card-body">
                <div className="info-row">
                  <span className="info-label">📖 Số tín chỉ:</span>
                  <span className="info-value">{cls.subjectCredits} TC</span>
                </div>

                <div className="info-row">
                  <span className="info-label">📅 Học kỳ:</span>
                  <span className="info-value">{cls.semesterName}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">🕐 Lịch học:</span>
                  <span className="info-value">
                    {formatSchedule(cls.dayOfWeek, cls.timeSlot)}
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">📍 Phòng:</span>
                  <span className="info-value">{cls.fixedRoom || 'TBA'}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">👥 Sĩ số:</span>
                  <span className="info-value">
                    {cls.currentStudents} / {cls.maxStudents}
                    <span className="capacity-bar">
                      <span 
                        className="capacity-fill" 
                        style={{ width: `${(cls.currentStudents / cls.maxStudents) * 100}%` }}
                      ></span>
                    </span>
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="card-actions">
                <button 
                  className="action-btn primary"
                  onClick={() => handleCreateHomework(cls.classId)}
                  title="Tạo bài tập mới"
                >
                  ➕ Bài tập
                </button>
                
                <button 
                  className="action-btn secondary"
                  onClick={() => handleViewGrades(cls.classId)}
                  title="Quản lý điểm"
                >
                  📝 Điểm
                </button>
                
                <button 
                  className="action-btn secondary"
                  onClick={() => handleViewStats(cls.classId)}
                  title="Thống kê"
                >
                  📊 Thống kê
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredClasses.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>Không tìm thấy lớp học</h3>
          <p>
            {searchTerm || selectedSemester !== 'all' || selectedStatus !== 'all'
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Bạn chưa được phân công giảng dạy lớp học nào'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TeacherClasses;