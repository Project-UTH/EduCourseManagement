import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <svg className="logo-icon-small" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h1>ECMS - Admin</h1>
          </div>
          <div className="user-section">
            <div className="user-info">
              <div className="user-avatar">
                {user?.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <p className="user-name">{user?.fullName}</p>
                <p className="user-role">Administrator</p>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-body">
        <div className="welcome-card">
          <div className="welcome-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2>Chào mừng, {user?.fullName}!</h2>
          <p>Bạn đã đăng nhập thành công với vai trò <strong>Administrator</strong></p>
          <p className="info-text">
            Phase 1 - Authentication đã hoàn thành. Dashboard và các tính năng quản lý sẽ được phát triển ở Phase 2.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon admin">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3>Quản lý người dùng</h3>
            <p>Quản lý giảng viên và sinh viên</p>
            <span className="badge coming-soon">Coming Soon</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon admin">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3>Quản lý khoa/ngành</h3>
            <p>Thêm, sửa, xóa khoa và chuyên ngành</p>
            <span className="badge coming-soon">Coming Soon</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon admin">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3>Quản lý môn học</h3>
            <p>Quản lý danh sách môn học</p>
            <span className="badge coming-soon">Coming Soon</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon admin">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3>Quản lý lớp học</h3>
            <p>Mở lớp và phân công giảng viên</p>
            <span className="badge coming-soon">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;