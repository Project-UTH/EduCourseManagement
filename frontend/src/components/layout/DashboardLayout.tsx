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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="dashboard-layout">
      <Header 
        userRole={userRole}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className="dashboard-body">
        <Sidebar 
          collapsed={sidebarCollapsed} 
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