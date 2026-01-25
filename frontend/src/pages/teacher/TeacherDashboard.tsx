import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import classApi from '../../services/api/classApi';
import ChatList from '../../components/chat/ChatList';
import './TeacherDashboard.css';

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
  const user = useAuthStore((state: any ) => state.user);

  const [classes, setClasses] = useState<ClassCard[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    pendingGrading: 0,
    weekClasses: 0
  });
  const [loading, setLoading] = useState(true);
  const [ setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      // 1. Load teacher's classes (Giả lập gọi API)
      const classesData = await classApi.getMyClasses();

      // 2. Transform Data
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

      // 3. Stats
      setStats({
        totalClasses: transformedClasses.length,
        totalStudents: transformedClasses.reduce((sum, c) => sum + c.enrolledStudents, 0),
        pendingGrading: 12, 
        weekClasses: transformedClasses.length 
      });

      // 4. Upcoming
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

    } catch (err: any) {
      console.error('Error:', err);
      setError('Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const handleClassClick = (classId: number) => {
    navigate(`/teacher/classes/${classId}`);
  };

  if (loading) return (
    <div className="teacher-dashboard">
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    </div>
  );

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>👨‍🏫 Quản lý các lớp học và theo dõi tiến độ giảng dạy</h1>
        </div>
        <div className="header-actions">
        </div>
      </div>


      <div className="dashboard-content">
        {/* Main List */}
        <div className="classes-section">
          <div className="section-header">
            <h2>Danh sách lớp học</h2>
            
          </div>

          <div className="classes-grid">
            {classes.map((classItem) => (
              <div key={classItem.classId} className="class-card" onClick={() => handleClassClick(classItem.classId)}>
                <div className="class-header">
                  <div className="class-info">
                    <h3>{classItem.subjectName}</h3>
                    <span className="class-code">{classItem.classCode}</span>
                  </div>
                </div>
                <div className="class-details">
                  <div className="detail-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>{classItem.schedule}</span>
                  </div>
                  <div className="detail-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <span>Phòng {classItem.room}</span>
                  </div>
                  <div className="detail-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    <span>{classItem.enrolledStudents}/{classItem.maxStudents} SV</span>
                  </div>
                </div>
                <div className="class-footer">
                  <span className="next-class">Tiếp: {classItem.nextClassDate}</span>
                  <button className="btn-view-detail">Chi tiết</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="upcoming-section">
          <div className="section-header">
            <h2>Lớp sắp tới</h2>
          </div>
          <div className="upcoming-list">
            {upcomingClasses.map((item) => (
              <div key={item.classId} className="upcoming-item" onClick={() => handleClassClick(item.classId)}>
                <div className="upcoming-icon">🔔</div>
                <div className="upcoming-content">
                  <h4>{item.subjectName}</h4>
                  <span className="upcoming-class">{item.classCode}</span>
                  <div className="upcoming-details">
                    <span className="upcoming-time">{item.time}</span>
                    <span className="upcoming-room"> • P.{item.room}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="view-schedule-btn" onClick={() => navigate('/teacher/schedule')}>
            Xem toàn bộ lịch
          </button>
        </div>
      </div>

      <ChatList currentUsername={user?.username || 'teacher'} currentRole="TEACHER" />
    </div>
  );
};

export default TeacherDashboard;