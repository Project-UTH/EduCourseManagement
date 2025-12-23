import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/auth/Login';
import ProtectedRoute from './components/common/ProtectedRoute';
import { DashboardLayout } from './components/layout';

// Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

import DepartmentList from './pages/admin/departments/DepartmentList';

// Placeholder cho các trang chưa phát triển
const Placeholder = ({ title }: { title: string }) => (
  <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
    <div style={{
      background: 'white',
      borderRadius: '0.75rem',
      padding: '2rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
        {title}
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
        Chức năng đang được phát triển trong các Phase tiếp theo
      </p>
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '0.5rem',
        padding: '1rem',
        color: '#166534'
      }}>
        <p style={{ margin: 0 }}>
          ℹ️ Trang này sẽ được phát triển đầy đủ theo roadmap
        </p>
      </div>
    </div>
  </div>
);

// 404 Page
const NotFound = () => {
  const navigate = (path: string) => window.location.href = path;
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '1rem',
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ fontSize: '6rem', fontWeight: '700', color: '#667eea', margin: '0' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: '1rem 0' }}>
          Trang không tồn tại
        </h2>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />

        {/* Root redirect */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          }
        />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <DashboardLayout userRole="ADMIN" />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="teachers" element={<Placeholder title="Quản lý Giảng viên" />} />
          <Route path="students" element={<Placeholder title="Quản lý Sinh viên" />} />
          <Route path="import" element={<Placeholder title="Import từ Excel" />} />
          <Route path="departments" element={<Placeholder title="Quản lý Khoa" />} />
          <Route path="/admin/departments" element={<DepartmentList />} />
          <Route path="majors" element={<Placeholder title="Quản lý Chuyên ngành" />} />
          <Route path="subjects" element={<Placeholder title="Quản lý Môn học" />} />
          <Route path="semesters" element={<Placeholder title="Quản lý Học kỳ" />} />
          <Route path="classes" element={<Placeholder title="Quản lý Lớp học" />} />
          <Route path="assignments" element={<Placeholder title="Phân công giảng dạy" />} />
          <Route path="proposals" element={<Placeholder title="Đề xuất giảng dạy" />} />
          <Route path="registration-settings" element={<Placeholder title="Cài đặt Đăng ký" />} />
          <Route path="settings" element={<Placeholder title="Cài đặt Hệ thống" />} />
        </Route>

        {/* TEACHER ROUTES */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <DashboardLayout userRole="TEACHER" />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="classes" element={<Placeholder title="Lớp học của tôi" />} />
          <Route path="proposals" element={<Placeholder title="Đề xuất giảng dạy" />} />
          <Route path="schedule" element={<Placeholder title="Lịch giảng dạy" />} />
          <Route path="assignments" element={<Placeholder title="Quản lý Bài tập" />} />
          <Route path="submissions" element={<Placeholder title="Bài nộp của SV" />} />
          <Route path="grading" element={<Placeholder title="Nhập điểm" />} />
          <Route path="grade-statistics" element={<Placeholder title="Thống kê điểm" />} />
          <Route path="profile" element={<Placeholder title="Hồ sơ cá nhân" />} />
        </Route>

        {/* STUDENT ROUTES */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <DashboardLayout userRole="STUDENT" />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<Placeholder title="Khóa học của tôi" />} />
          <Route path="registration" element={<Placeholder title="Đăng ký học phần" />} />
          <Route path="schedule" element={<Placeholder title="Lịch học" />} />
          <Route path="assignments" element={<Placeholder title="Danh sách Bài tập" />} />
          <Route path="submissions" element={<Placeholder title="Bài đã nộp" />} />
          <Route path="grades" element={<Placeholder title="Xem điểm" />} />
          <Route path="transcript" element={<Placeholder title="Bảng điểm tích lũy" />} />
          <Route path="feedback" element={<Placeholder title="Gửi Phản hồi" />} />
          <Route path="profile" element={<Placeholder title="Hồ sơ cá nhân" />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

// Redirect helper
const RoleBasedRedirect = () => {
  const user = useAuthStore((state) => state.user);

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user?.role === 'TEACHER') {
    return <Navigate to="/teacher/dashboard" replace />;
  } else if (user?.role === 'STUDENT') {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default App;
