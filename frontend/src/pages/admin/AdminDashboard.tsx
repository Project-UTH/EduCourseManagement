import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Mock statistics - will be replaced with real API calls
  const statistics = [
    { 
      label: 'Tổng sinh viên', 
      value: '1,234', 
      icon: '👨‍🎓', 
      color: 'blue',
      change: '+12%',
      changeType: 'increase'
    },
    { 
      label: 'Tổng giảng viên', 
      value: '156', 
      icon: '👨‍🏫', 
      color: 'green',
      change: '+5%',
      changeType: 'increase'
    },
    { 
      label: 'Tổng lớp học', 
      value: '89', 
      icon: '🏫', 
      color: 'purple',
      change: '+8%',
      changeType: 'increase'
    },
    { 
      label: 'Tổng môn học', 
      value: '245', 
      icon: '📚', 
      color: 'orange',
      change: '+3%',
      changeType: 'increase'
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'registration',
      message: 'Có 15 sinh viên mới đăng ký học phần',
      time: '5 phút trước',
      icon: '✏️'
    },
    {
      id: 2,
      type: 'proposal',
      message: 'GV Nguyễn Văn A đã gửi đề xuất giảng dạy môn Lập trình Web',
      time: '1 giờ trước',
      icon: '📝'
    },
    {
      id: 3,
      type: 'class',
      message: 'Lớp IT101-01 đã đủ sĩ số',
      time: '2 giờ trước',
      icon: '✅'
    },
    {
      id: 4,
      type: 'system',
      message: 'Import thành công 50 sinh viên mới',
      time: 'Hôm qua',
      icon: '📥'
    },
  ];

  const quickActions = [
    {
      title: 'Import Sinh viên',
      description: 'Nhập danh sách sinh viên từ Excel',
      icon: '📥',
      color: 'blue',
      path: '/admin/import'
    },
    {
      title: 'Import Giảng viên',
      description: 'Nhập danh sách giảng viên từ Excel',
      icon: '📥',
      color: 'green',
      path: '/admin/import'
    },
    {
      title: 'Tạo Lớp học',
      description: 'Tạo lớp học mới cho học kỳ',
      icon: '➕',
      color: 'purple',
      path: '/admin/classes'
    },
    {
      title: 'Quản lý Học kỳ',
      description: 'Cấu hình học kỳ và đăng ký',
      icon: '📅',
      color: 'orange',
      path: '/admin/semesters'
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Chào mừng trở lại! Đây là tổng quan về hệ thống.</p>
        </div>
        <button className="refresh-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        {statistics.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
              <div className={`stat-change ${stat.changeType}`}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>{stat.change} so với tháng trước</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        {/* Recent Activities */}
        <div className="activity-section">
          <div className="section-header">
            <h2>Hoạt động gần đây</h2>
            <button className="view-all-link">Xem tất cả</button>
          </div>
          <div className="activity-list">
            {recentActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <p className="activity-message">{activity.message}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <div className="section-header">
            <h2>Thao tác nhanh</h2>
          </div>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className={`quick-action-card ${action.color}`}
                onClick={() => navigate(action.path)}
              >
                <div className="action-icon">{action.icon}</div>
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;