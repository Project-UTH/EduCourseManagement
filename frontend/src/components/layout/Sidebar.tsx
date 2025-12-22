import { NavLink } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  collapsed: boolean;
  userRole: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

interface MenuItem {
  icon: string;
  label: string;
  path: string;
  badge?: string;
  children?: MenuItem[];
}

const Sidebar = ({ collapsed, userRole }: SidebarProps) => {
  const getMenuItems = (): MenuItem[] => {
    switch (userRole) {
      case 'ADMIN':
        return [
          { 
            icon: '📊', 
            label: 'Dashboard', 
            path: '/admin/dashboard' 
          },
          {
            icon: '👥',
            label: 'Quản lý Người dùng',
            path: '/admin/users',
            children: [
              { icon: '👨‍🏫', label: 'Giảng viên', path: '/admin/teachers' },
              { icon: '👨‍🎓', label: 'Sinh viên', path: '/admin/students' },
              { icon: '📥', label: 'Import từ Excel', path: '/admin/import' },
            ]
          },
          {
            icon: '📚',
            label: 'Quản lý Học vụ',
            path: '/admin/academic',
            children: [
              { icon: '🏢', label: 'Khoa', path: '/admin/departments' },
              { icon: '📖', label: 'Chuyên ngành', path: '/admin/majors' },
              { icon: '📕', label: 'Môn học', path: '/admin/subjects' },
              { icon: '📅', label: 'Học kỳ', path: '/admin/semesters' },
            ]
          },
          {
            icon: '🏫',
            label: 'Quản lý Lớp học',
            path: '/admin/classes-management',
            children: [
              { icon: '📋', label: 'Danh sách lớp', path: '/admin/classes' },
              { icon: '👨‍🏫', label: 'Phân công giảng dạy', path: '/admin/assignments' },
              { icon: '📝', label: 'Đề xuất giảng dạy', path: '/admin/proposals' },
            ]
          },
          {
            icon: '⚙️',
            label: 'Cài đặt Hệ thống',
            path: '/admin/system',
            children: [
              { icon: '🔐', label: 'Khóa/Mở đăng ký', path: '/admin/registration-settings' },
              { icon: '⚙️', label: 'Cấu hình', path: '/admin/settings' },
            ]
          },
        ];
      
      case 'TEACHER':
        return [
          { 
            icon: '🏠', 
            label: 'Trang chủ', 
            path: '/teacher/dashboard' 
          },
          {
            icon: '📚',
            label: 'Lớp học',
            path: '/teacher/classes-menu',
            children: [
              { icon: '📋', label: 'Lớp của tôi', path: '/teacher/classes' },
              { icon: '📄', label: 'Đề xuất giảng dạy', path: '/teacher/proposals' },
            ]
          },
          { 
            icon: '📅', 
            label: 'Lịch giảng dạy', 
            path: '/teacher/schedule' 
          },
          {
            icon: '📝',
            label: 'Bài tập',
            path: '/teacher/assignments-menu',
            children: [
              { icon: '📝', label: 'Quản lý bài tập', path: '/teacher/assignments' },
              { icon: '📊', label: 'Bài nộp của SV', path: '/teacher/submissions' },
            ]
          },
          {
            icon: '📊',
            label: 'Chấm điểm',
            path: '/teacher/grading-menu',
            children: [
              { icon: '🎯', label: 'Nhập điểm', path: '/teacher/grading' },
              { icon: '📈', label: 'Thống kê điểm', path: '/teacher/grade-statistics' },
            ]
          },
          { 
            icon: '👤', 
            label: 'Hồ sơ cá nhân', 
            path: '/teacher/profile' 
          },
        ];
      
      case 'STUDENT':
        return [
          { 
            icon: '🏠', 
            label: 'Trang chủ', 
            path: '/student/dashboard' 
          },
          {
            icon: '📚',
            label: 'Khóa học',
            path: '/student/courses-menu',
            children: [
              { icon: '📋', label: 'Khóa học của tôi', path: '/student/courses' },
              { icon: '✏️', label: 'Đăng ký học phần', path: '/student/registration' },
            ]
          },
          { 
            icon: '📅', 
            label: 'Lịch học', 
            path: '/student/schedule' 
          },
          {
            icon: '📝',
            label: 'Bài tập',
            path: '/student/assignments-menu',
            children: [
              { icon: '📝', label: 'Danh sách bài tập', path: '/student/assignments' },
              { icon: '📤', label: 'Bài đã nộp', path: '/student/submissions' },
            ]
          },
          {
            icon: '📊',
            label: 'Điểm số',
            path: '/student/grades-menu',
            children: [
              { icon: '📈', label: 'Xem điểm', path: '/student/grades' },
              { icon: '📄', label: 'Bảng điểm tích lũy', path: '/student/transcript' },
            ]
          },
          { 
            icon: '💬', 
            label: 'Phản hồi', 
            path: '/student/feedback' 
          },
          { 
            icon: '👤', 
            label: 'Hồ sơ cá nhân', 
            path: '/student/profile' 
          },
        ];
      
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const renderMenuItem = (item: MenuItem, index: number) => {
    if (item.children) {
      return (
        <SidebarSubmenu 
          key={index} 
          item={item} 
          collapsed={collapsed}
        />
      );
    }

    return (
      <NavLink
        key={index}
        to={item.path}
        className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
      >
        <span className="sidebar-icon">{item.icon}</span>
        {!collapsed && (
          <>
            <span className="sidebar-label">{item.label}</span>
            {item.badge && (
              <span className="sidebar-badge">{item.badge}</span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => renderMenuItem(item, index))}
      </nav>
    </aside>
  );
};

// Submenu component for nested items
interface SidebarSubmenuProps {
  item: MenuItem;
  collapsed: boolean;
}

const SidebarSubmenu = ({ item, collapsed }: SidebarSubmenuProps) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="sidebar-submenu">
      <button
        className={`sidebar-item submenu-trigger ${expanded ? 'expanded' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="sidebar-icon">{item.icon}</span>
        {!collapsed && (
          <>
            <span className="sidebar-label">{item.label}</span>
            <svg 
              className="submenu-arrow" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              width="16"
              height="16"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>
      
      {!collapsed && expanded && item.children && (
        <div className="submenu-items">
          {item.children.map((child, idx) => (
            <NavLink
              key={idx}
              to={child.path}
              className={({ isActive }) => `sidebar-item submenu-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{child.icon}</span>
              <span className="sidebar-label">{child.label}</span>
              {child.badge && (
                <span className="sidebar-badge">{child.badge}</span>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

// Add React import for useState
import React from 'react';

export default Sidebar;