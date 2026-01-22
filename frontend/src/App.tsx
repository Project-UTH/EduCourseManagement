import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/auth/Login';
import ProtectedRoute from './components/common/ProtectedRoute';
import { DashboardLayout } from './components/layout';

// Dashboards
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

// Admin Pages
import DepartmentList from './pages/admin/departments/DepartmentList';
import MajorList from './pages/admin/majors/MajorList';
import SubjectList from './pages/admin/subjects/SubjectList';
import SemesterList from './pages/admin/semesters/SemesterList';
import TeacherList from './pages/admin/teachers/TeacherList';
import StudentList from './pages/admin/students/StudentList';
import ClassList from './pages/admin/classes/ClassList';
import RoomList from './pages/admin/rooms/RoomList';
import RoomDetail from './pages/admin/rooms/RoomDetail';

// Student Pages - PHASE 5
import ClassSearch from './pages/student/ClassSearch';
import MyRegistrations from './pages/student/MyRegistrations';
import SubjectSelection from './pages/student/SubjectSelection';
import ClassSelection from './pages/student/ClassSelection';
import StudentSchedule from './pages/student/StudentSchedule';
import StudentProfile from './pages/student/profile/StudentProfile';
import MyClasses from './pages/student/classes/MyClasses';
import ClassDetail from './pages/student/courses/ClassDetail';
import StudentHomeworkDetail from './pages/student/homeworks/HomeworkDetail'; // ✅ RENAMED
import StudentTranscript from './pages/student/StudentTranscript'; // ✅ NEW - Bảng điểm tích lũy

// ✅ Teacher Pages - PHASE 4
import HomeworkList from './pages/teacher/assignments/HomeworkList';
import CreateHomework from './pages/teacher/assignments/CreateHomework';
import TeacherHomeworkDetail from './pages/teacher/assignments/HomeworkDetail'; // ✅ RENAMED
import EditHomework from './pages/teacher/assignments/EditHomework';
import SubmissionList from './pages/teacher/submissions/SubmissionList';
import TeacherGrading from './pages/teacher/grading/TeacherGrading';
import GradeStatistics from './pages/teacher/grading/GradeStatistics';
import TeacherSchedule from './pages/teacher/schedule/TeacherSchedule';
import TeacherClasses from './pages/teacher/classes/TeacherClasses';
import TeacherClassDetail from './pages/teacher/TeacherClassDetail'; // ✅ NEW - Class detail with tabs
import TeacherProfile from './pages/teacher/profile/TeacherProfile';

// Placeholder
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
          <Route path="teachers" element={<TeacherList />} />
          <Route path="students" element={<StudentList />} />
          <Route path="departments" element={<DepartmentList />} />
          <Route path="majors" element={<MajorList />} />
          <Route path="subjects" element={<SubjectList />} />
          <Route path="semesters" element={<SemesterList />} />
          <Route path="classes" element={<ClassList />} />
          <Route path="rooms" element={<RoomList />} />
          <Route path="rooms/:id" element={<RoomDetail />} />
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
          <Route path="classes" element={<TeacherClasses />} />
          
          {/* ✅ NEW - Class detail with tabs (MUST be before "schedule" to avoid conflict) */}
          <Route path="classes/:classId" element={<TeacherClassDetail />} />
          
          <Route path="schedule" element={<TeacherSchedule />} />
          
          {/* ✅ PHASE 4 - Homework Management */}
          <Route path="assignments" element={<HomeworkList />} />
          <Route path="assignments/create" element={<CreateHomework />} />
          <Route path="assignments/:id" element={<TeacherHomeworkDetail />} /> {/* ✅ FIXED */}
          <Route path="assignments/edit/:id" element={<EditHomework />} />
          
          <Route path="submissions" element={<SubmissionList />} />
          <Route path="grading" element={<TeacherGrading />} />
          <Route path="grade-statistics" element={<GradeStatistics />} />
          <Route path="profile" element={<TeacherProfile />} />
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
          <Route path="classes" element={<MyClasses />} />
          <Route path="courses/:classId" element={<ClassDetail />} />
          <Route path="courses/:classId/assignments" element={<ClassDetail />} />
          <Route path="homeworks/:homeworkId" element={<StudentHomeworkDetail />} /> {/* ✅ FIXED */}
          
          {/* ✅ PHASE 5 - Course Registration (2-STEP) */}
          <Route path="subjects" element={<SubjectSelection />} />
          <Route path="classes/:subjectId" element={<ClassSelection />} />
          <Route path="schedule" element={<StudentSchedule />} /> 
          
          {/* ✅ PHASE 5 - Course Registration (OLD) */}
          <Route path="search" element={<ClassSearch />} />
          <Route path="registrations" element={<MyRegistrations />} />  
          
          {/* Placeholder pages */}
          <Route path="courses" element={<Placeholder title="Khóa học của tôi" />} />
          <Route path="registration" element={<Placeholder title="Đăng ký học phần" />} />
          <Route path="assignments" element={<Placeholder title="Danh sách Bài tập" />} />
          <Route path="submissions" element={<Placeholder title="Bài đã nộp" />} />
          <Route path="grades" element={<Placeholder title="Xem điểm" />} />
          
          {/* ✅ NEW - Bảng điểm tích lũy */}
          <Route path="transcript" element={<StudentTranscript />} />
          
          <Route path="feedback" element={<Placeholder title="Gửi Phản hồi" />} />
          <Route path="profile" element={<StudentProfile />} />
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