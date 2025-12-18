import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import '../admin/Dashboard.css';

const TeacherDashboard = () => {
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
            <h1>ECMS - Giảng viên</h1>
          </div>
          <div className="user-section">
            <div className="user-info">
              <div className="user-avatar teacher">
                {user?.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <p className="user-name">{user?.fullName}</p>
                <p className="user-role">Giảng viên</p>
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
        <div className="welcome-card teacher-card">
          <div className="welcome-icon teacher">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2>Chào mừng, {user?.fullName}!</h2>
          <p>Bạn đã đăng nhập thành công với vai trò <strong>Giảng viên</strong></p>
          {user?.isFirstLogin && (
            <div className="first-login-notice">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>Đây là lần đăng nhập đầu tiên. Vui lòng đổi mật khẩu!</p>
            </div>
          )}
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon teacher">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3>Lịch giảng dạy</h3>
            <p>Xem lịch giảng dạy của bạn</p>
            <span className="badge coming-soon">Coming Soon</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon teacher">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3>Quản lý lớp học</h3>
            <p>Quản lý lớp học được phân công</p>
            <span className="badge coming-soon">Coming Soon</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon teacher">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3>Chấm điểm</h3>
            <p>Nhập điểm cho sinh viên</p>
            <span className="badge coming-soon">Coming Soon</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon teacher">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3>Bài tập</h3>
            <p>Quản lý bài tập và nộp bài</p>
            <span className="badge coming-soon">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;