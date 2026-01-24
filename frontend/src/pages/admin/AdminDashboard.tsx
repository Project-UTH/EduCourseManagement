import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import statisticsApi, { DashboardStatistics } from '../../services/api/statisticsApi';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await statisticsApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Không thể tải thống kê. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="admin-dashboard">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error || 'Không thể tải dữ liệu'}</p>
          <button onClick={fetchDashboardStats} className="retry-btn">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Quick stats configuration
  const quickStats = [
    {
      label: 'Sinh viên',
      value: stats.totalStudents,
      icon: '👨‍🎓',
      color: '#3b82f6',
      route: '/admin/students',
    },
    {
      label: 'Giảng viên',
      value: stats.totalTeachers,
      icon: '👨‍🏫',
      color: '#8b5cf6',
      route: '/admin/teachers',
    },
    {
      label: 'Khoa',
      value: stats.totalDepartments,
      icon: '🏢',
      color: '#10b981',
      route: '/admin/departments',
    },
    {
      label: 'Chuyên ngành',
      value: stats.totalMajors,
      icon: '📖',
      color: '#f59e0b',
      route: '/admin/majors',
    },
    {
      label: 'Môn học',
      value: stats.totalSubjects,
      icon: '📚',
      color: '#ec4899',
      route: '/admin/subjects',
    },
    {
      label: 'Phòng học',
      value: stats.totalRooms,
      icon: '🏫',
      color: '#06b6d4',
      route: '/admin/rooms',
    },
    {
      label: 'Lớp học',
      value: stats.totalClasses,
      icon: '📋',
      color: '#84cc16',
      route: '/admin/classes',
    },
  ];

  // Quick actions configuration
  const quickActions = [
    {
      title: 'Quản lý Sinh viên',
      icon: '👨‍🎓',
      color: '#3b82f6',
      actions: [
        { label: 'Danh sách sinh viên', route: '/admin/students' },
        { label: 'Thêm sinh viên mới', route: '/admin/students?action=create' },
        { label: 'Import từ Excel', route: '/admin/students?action=import' },
      ],
    },
    {
      title: 'Quản lý Giảng viên',
      icon: '👨‍🏫',
      color: '#8b5cf6',
      actions: [
        { label: 'Danh sách giảng viên', route: '/admin/teachers' },
        { label: 'Thêm giảng viên mới', route: '/admin/teachers?action=create' },
        { label: 'Import từ Excel', route: '/admin/teachers?action=import' },
      ],
    },
    {
      title: 'Quản lý Học vụ',
      icon: '📚',
      color: '#10b981',
      actions: [
        { label: 'Quản lý Khoa', route: '/admin/departments' },
        { label: 'Quản lý Chuyên ngành', route: '/admin/majors' },
        { label: 'Quản lý Môn học', route: '/admin/subjects' },
        { label: 'Quản lý Học kỳ', route: '/admin/semesters' },
      ],
    },
    {
      title: 'Quản lý Lớp học',
      icon: '🏫',
      color: '#f59e0b',
      actions: [
        { label: 'Danh sách lớp học', route: '/admin/classes' },
        { label: 'Tạo lớp học mới', route: '/admin/classes?action=create' },
        { label: 'Quản lý Phòng học', route: '/admin/rooms' },
      ],
    },
  ];

  return (
    <div className="admin-dashboard">

      {/* Current Semester Info */}
      {stats.currentSemester && (
        <div className="current-semester-card">
          <div className="semester-header">
            <span className="semester-icon">📅</span>
            <div className="semester-info">
              <h3>{stats.currentSemester.semesterName}</h3>
              <p className="semester-code">{stats.currentSemester.semesterCode}</p>
            </div>
            <span className={`semester-status status-${stats.currentSemester.status.toLowerCase()}`}>
              {stats.currentSemester.status === 'ACTIVE' ? '🟢 Đang hoạt động' : 
               stats.currentSemester.status === 'UPCOMING' ? '🟡 Sắp diễn ra' : 
               '🔴 Đã kết thúc'}
            </span>
          </div>
          <div className="semester-dates">
            <span>📆 Từ {new Date(stats.currentSemester.startDate).toLocaleDateString('vi-VN')}</span>
            <span>đến {new Date(stats.currentSemester.endDate).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        {quickStats.map((stat, index) => (
          <Link
            key={index}
            to={stat.route}
            className="stat-card"
            style={{ '--card-color': stat.color } as React.CSSProperties}
          >
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <h3 className="stat-value">
                {stat.value.toLocaleString('vi-VN')}
              </h3>
              <p className="stat-label">{stat.label}</p>
            </div>
            <div className="stat-arrow">→</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2 className="section-title">⚡ Thao tác nhanh</h2>
        <div className="quick-actions-grid">
          {quickActions.map((section, index) => (
            <div key={index} className="action-card">
              <div 
                className="action-header"
                style={{ backgroundColor: section.color }}
              >
                <span className="action-icon">{section.icon}</span>
                <h3>{section.title}</h3>
              </div>
              <div className="action-list">
                {section.actions.map((action, idx) => (
                  <Link
                    key={idx}
                    to={action.route}
                    className="action-item"
                  >
                    <span>→</span>
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;