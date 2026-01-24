import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import './Header.css';

interface HeaderProps {
  userRole: 'ADMIN' | 'TEACHER' | 'STUDENT';
  onToggleSidebar: () => void;
}


const Header = ({ userRole, onToggleSidebar }: HeaderProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Mock notifications - will be replaced with real data


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button className="menu-toggle-btn" onClick={onToggleSidebar}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="header-logo">
          <svg className="logo-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <div className="logo-text">
            <span className="logo-title">ECMS</span>
            <span className="logo-subtitle">Education Course Management</span>
          </div>
        </div>
      </div>

      <div className="header-right">

        {/* Notifications */}
        

        {/* User Menu */}
        <div className="user-menu-wrapper" ref={userMenuRef}>
          <button 
            className="user-menu-btn"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
            }}
          >
            <div className={`user-avatar ${userRole.toLowerCase()}`}>
              {user?.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.fullName}</span>
              <span className="user-role">{userRole}</span>
            </div>
            <svg className="chevron-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div className={`user-avatar-large ${userRole.toLowerCase()}`}>
                  {user?.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="user-name-large">{user?.fullName}</p>
                  <p className="user-email">{user?.email || 'No email'}</p>
                  <p className="user-role-badge">{userRole}</p>
                </div>
              </div>
              
              <div className="user-dropdown-menu">
                <button className="menu-item" onClick={() => navigate(`/${userRole.toLowerCase()}/profile`)}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Hồ sơ cá nhân
                </button>
                <button className="menu-item" onClick={() => navigate(`/${userRole.toLowerCase()}/settings`)}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Cài đặt
                </button>
                <button className="menu-item">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Đổi mật khẩu
                </button>
                <div className="dropdown-divider"></div>
                <button className="menu-item logout-item" onClick={handleLogout}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;