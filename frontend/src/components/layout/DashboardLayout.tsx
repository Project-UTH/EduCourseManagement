import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  userRole: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

const DashboardLayout = ({ userRole }: DashboardLayoutProps) => {
  // ⭐ KHÔNG CẦN STATE - Sidebar tự động collapsed bằng CSS
  // Chỉ cần state cho mobile
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Header 
        userRole={userRole}
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} 
      />
      
      <div className="dashboard-body">
        <Sidebar 
          collapsed={true} // ⭐ LUÔN TRUE - CSS sẽ xử lý hover
          userRole={userRole}
        />
        
        <main className="main-content">
          <Outlet />
        </main>
        
        {(userRole === 'TEACHER' || userRole === 'STUDENT') && (
          <RightSidebar userRole={userRole} />
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;