import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import classApi from '../../services/api/classApi';
import ChatList from '../../components/chat/ChatList';
import './TeacherDashboard.css';

/**
 * TeacherDashboard - REAL DATA FROM API + CHAT INTEGRATION
 * 
 * ✅ Load từ: GET /api/teacher/classes
 * ✅ Tích hợp ChatList cho giảng viên
 */

interface ClassCard {
  classId: number;
  subjectName: string;
  classCode: string;
  room: string;
  schedule: string;
  enrolledStudents: number;
  maxStudents: number;
  nextClassDate: string;
  dayOfWeekDisplay: string;
  timeSlotDisplay: string;
}

interface UpcomingClass {
  classId: number;
  classCode: string;
  subjectName: string;
  time: string;
  room: string;
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state: any) => state.user);
  const [selectedSemester, setSelectedSemester] = useState('current');

  const [classes, setClasses] = useState<ClassCard[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    pendingGrading: 0,
    weekClasses: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[TeacherDashboard] Loading classes...');

      // 1. Load teacher's classes
      const classesData = await classApi.getMyClasses();
      console.log('[TeacherDashboard] ✅ Received classes:', classesData);

      // 2. Transform to ClassCard format
      const transformedClasses: ClassCard[] = classesData.map((c: any) => ({
        classId: c.classId,
        subjectName: c.subjectName || c.className,
        classCode: c.classCode,
        room: c.fixedRoom || c.roomName || 'Chưa có phòng',
        schedule: `${c.dayOfWeekDisplay}, ${c.timeSlotDisplay}`,
        dayOfWeekDisplay: c.dayOfWeekDisplay || 'Chưa xếp lịch',
        timeSlotDisplay: c.timeSlotDisplay || '',
        enrolledStudents: c.studentCount || 0,
        maxStudents: c.maxStudents || 40,
        nextClassDate: new Date().toLocaleDateString('vi-VN')
      }));

      setClasses(transformedClasses);

      // 3. Calculate stats
      const totalStudents = transformedClasses.reduce((sum, c) => sum + c.enrolledStudents, 0);
      
      setStats({
        totalClasses: transformedClasses.length,
        totalStudents: totalStudents,
        pendingGrading: 23, // Mock - will calculate from homework API
        weekClasses: transformedClasses.length // Mock - will filter by week
      });

      // 4. Mock upcoming classes (top 3)
      const upcoming: UpcomingClass[] = transformedClasses.slice(0, 3).map((c, index) => ({
        classId: c.classId,
        classCode: c.classCode,
        subjectName: c.subjectName,
        time: index === 0 ? 'Hôm nay, ' + c.timeSlotDisplay : 
              index === 1 ? 'Ngày mai, ' + c.timeSlotDisplay :
              c.dayOfWeekDisplay + ', ' + c.timeSlotDisplay,
        room: c.room
      }));

      setUpcomingClasses(upcoming);

      console.log('[TeacherDashboard] ✅ Loaded successfully:', {
        classes: transformedClasses.length,
        students: totalStudents
      });

    } catch (err: any) {
      console.error('[TeacherDashboard] ❌ Failed to load data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classId: number) => {
    // Navigate to class detail with tabs
    navigate(`/teacher/classes/${classId}`);
  };

  const handleCreateAssignment = () => {
    navigate('/teacher/assignments');
  };

  if (loading) {
    return (
      <div className="teacher-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-dashboard">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadDashboardData} className="btn-retry">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>👨‍🏫 Lớp học của tôi</h1>
          <p>Quản lý và theo dõi các lớp học bạn đang giảng dạy</p>
        </div>
        <div className="header-actions">
          <select 
            className="semester-select"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="current">Học kỳ hiện tại</option>
            <option value="2024-1">Học kỳ 1 (2024-2025)</option>
            <option value="2023-2">Học kỳ 2 (2023-2024)</option>
          </select>
          <button 
            className="create-assignment-btn" 
            onClick={handleCreateAssignment}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo bài tập mới
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <p className="stat-label">Tổng lớp học</p>
            <h3 className="stat-value">{stats.totalClasses}</h3>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <p className="stat-label">Tổng sinh viên</p>
            <h3 className="stat-value">{stats.totalStudents}</h3>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <p className="stat-label">Bài chưa chấm</p>
            <h3 className="stat-value">{stats.pendingGrading}</h3>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <p className="stat-label">Lớp tuần này</p>
            <h3 className="stat-value">{stats.weekClasses}</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Classes Grid */}
        <div className="classes-section">
          <div className="section-header">
            <h2>Danh sách lớp học ({classes.length})</h2>
            <div className="view-options">
              <button className="view-btn active">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button className="view-btn">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {classes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>Chưa có lớp học nào</h3>
              <p>Bạn chưa được phân công giảng dạy lớp học nào.</p>
            </div>
          ) : (
            <div className="classes-grid">
              {classes.map((classItem) => (
                <div 
                  key={classItem.classId} 
                  className="class-card"
                  onClick={() => handleClassClick(classItem.classId)}
                >
                  <div className="class-header">
                    <div className="class-info">
                      <h3>{classItem.subjectName}</h3>
                      <span className="class-code">{classItem.classCode}</span>
                    </div>
                  </div>

                  <div className="class-details">
                    <div className="detail-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{classItem.schedule}</span>
                    </div>
                    <div className="detail-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>Phòng {classItem.room}</span>
                    </div>
                    <div className="detail-item">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>{classItem.enrolledStudents}/{classItem.maxStudents} sinh viên</span>
                    </div>
                  </div>

                  <div className="class-footer">
                    <span className="next-class">
                      Lớp tiếp theo: {classItem.nextClassDate}
                    </span>
                    <button className="btn-view-detail">
                      Xem chi tiết →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Classes Sidebar */}
        <div className="upcoming-section">
          <div className="section-header">
            <h2>Lớp sắp diễn ra</h2>
          </div>
          
          {upcomingClasses.length === 0 ? (
            <div className="empty-state-small">
              <p>📭 Không có lớp sắp diễn ra</p>
            </div>
          ) : (
            <div className="upcoming-list">
              {upcomingClasses.map((item) => (
                <div 
                  key={item.classId} 
                  className="upcoming-item"
                  onClick={() => handleClassClick(item.classId)}
                >
                  <div className="upcoming-icon">📅</div>
                  <div className="upcoming-content">
                    <h4>{item.subjectName}</h4>
                    <p className="upcoming-class">{item.classCode}</p>
                    <div className="upcoming-details">
                      <span className="upcoming-time">{item.time}</span>
                      <span className="upcoming-room">Phòng {item.room}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button 
            className="view-schedule-btn"
            onClick={() => navigate('/teacher/schedule')}
          >
            Xem lịch đầy đủ
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ✅ CHAT INTEGRATION - Floating button ở góc dưới phải */}
      <ChatList 
        currentUsername={user?.citizenId || user?.username || 'teacher'}
        currentRole="TEACHER"
      />
    </div>
  );
};

export default TeacherDashboard;