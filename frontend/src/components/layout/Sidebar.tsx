import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import './Sidebar.css';


interface SidebarProps {
  collapsed: boolean;
  userRole: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

interface MenuItem {
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
            label: 'Trang chủ', 
            path: '/admin/dashboard' 
          },
          {
            label: 'Quản lý Người dùng',
            path: '/admin/users',
            children: [
              { label: 'Giảng viên', path: '/admin/teachers' },
              { label: 'Sinh viên', path: '/admin/students' },
            ]
          },
          {
            label: 'Quản lý Học vụ',
            path: '/admin/academic',
            children: [
              { label: 'Khoa', path: '/admin/departments' },
              { label: 'Chuyên ngành', path: '/admin/majors' },
              { label: 'Môn học', path: '/admin/subjects' },
              { label: 'Học kỳ', path: '/admin/semesters' },
            ]
          },
          {
            label: 'Quản lý Lớp học',
            path: '/admin/classes-management',
            children: [
              { label: 'Danh sách lớp', path: '/admin/classes' },
              { label: 'Phòng học', path: '/admin/rooms' },
            ]
          },
        ];
      
      case 'TEACHER':
        return [
          { 
            label: 'Trang chủ', 
            path: '/teacher/dashboard' 
          },
         
          { 
            label: 'Lịch giảng dạy', 
            path: '/teacher/schedule' 
          },
          {
            label: 'Bài tập',
            path: '/teacher/assignments-menu',
            children: [
              { label: 'Quản lý bài tập', path: '/teacher/assignments' },
              { label: 'Bài nộp của SV', path: '/teacher/submissions' },
            ]
          },
          {
            label: 'Chấm điểm',
            path: '/teacher/grading-menu',
            children: [
              { label: 'Quản lí điểm', path: '/teacher/grading' },
              { label: 'Thống kê điểm', path: '/teacher/grade-statistics' },
            ]
          },
          { 
            label: 'Hồ sơ cá nhân', 
            path: '/teacher/profile' 
          },
        ];
      
      case 'STUDENT':
        return [
          { 
            label: 'Trang chủ', 
            path: '/student/dashboard' 
          },
          {
            label: 'Khóa học',
            path: '/student/courses-menu',
            children: [
              { label: 'Đăng ký học phần', path: '/student/subjects' },        //  MỚI
             // CŨ
            ]
          },
          { 
            label: 'Lịch học', 
            path: '/student/schedule' 
          },
          {
            label: 'Điểm số',
            path: '/student/grades-menu',
            children: [
              { label: 'Bảng điểm tích lũy', path: '/student/transcript' },  //  UPDATED - Link đến trang mới
            ]
          },
          { 
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
        data-label={item.label}
      >
        <span className="sidebar-label">{item.label}</span>
        {item.badge && (
          <span className="sidebar-badge">{item.badge}</span>
        )}
      </NavLink>
    );
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* --- PHẦN MỚI: HEADER CHỨA 3 GẠCH --- */}
      <div className="sidebar-header">
        <div className="hamburger-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
        <span className="header-title">MENU</span>
      </div>
      {/* ------------------------------------- */}

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => renderMenuItem(item, index))}
      </nav>
    </aside>
  );
};

// Submenu component
interface SidebarSubmenuProps {
  item: MenuItem;
  collapsed: boolean;
}

const SidebarSubmenu = ({ item }: SidebarSubmenuProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="sidebar-submenu">
      <button
        className={`sidebar-item submenu-trigger ${expanded ? 'expanded' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="sidebar-label">{item.label}</span>
        <svg 
          className="submenu-arrow" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {expanded && item.children && (
        <div className="submenu-items">
          {item.children.map((child, idx) => (
            <NavLink
              key={idx}
              to={child.path}
              className={({ isActive }) => `sidebar-item submenu-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-label">{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidebar;