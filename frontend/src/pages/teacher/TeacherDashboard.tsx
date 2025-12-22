import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';

interface ClassCard {
  id: number;
  subjectName: string;
  classCode: string;
  room: string;
  schedule: string;
  enrolledStudents: number;
  maxStudents: number;
  nextClassDate: string;
  progress: number;
}

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState('current');

  // Mock data - will be replaced with real API calls
  const stats = [
    { label: 'Tổng lớp học', value: '8', icon: '📚', color: 'blue' },
    { label: 'Tổng sinh viên', value: '245', icon: '👨‍🎓', color: 'green' },
    { label: 'Bài chưa chấm', value: '23', icon: '📝', color: 'orange' },
    { label: 'Lớp tuần này', value: '12', icon: '📅', color: 'purple' },
  ];

  const myClasses: ClassCard[] = [
    {
      id: 1,
      subjectName: 'Lập trình Web',
      classCode: 'IT101-01',
      room: 'A201',
      schedule: 'Thứ 2, Ca 1 (06:45-09:15)',
      enrolledStudents: 35,
      maxStudents: 40,
      nextClassDate: '25/12/2024',
      progress: 60
    },
    {
      id: 2,
      subjectName: 'Cơ sở dữ liệu',
      classCode: 'IT202-02',
      room: 'B105',
      schedule: 'Thứ 3, Ca 2 (09:25-11:55)',
      enrolledStudents: 40,
      maxStudents: 40,
      nextClassDate: '26/12/2024',
      progress: 75
    },
    {
      id: 3,
      subjectName: 'Mạng máy tính',
      classCode: 'IT303-01',
      room: 'C302',
      schedule: 'Thứ 4, Ca 3 (12:10-14:40)',
      enrolledStudents: 28,
      maxStudents: 35,
      nextClassDate: '27/12/2024',
      progress: 45
    },
    {
      id: 4,
      subjectName: 'Lập trình Mobile',
      classCode: 'IT404-01',
      room: 'A301',
      schedule: 'Thứ 5, Ca 4 (14:50-17:20)',
      enrolledStudents: 32,
      maxStudents: 35,
      nextClassDate: '28/12/2024',
      progress: 55
    },
  ];

  const upcomingClasses = [
    { subject: 'Lập trình Web', class: 'IT101-01', time: 'Hôm nay, 06:45', room: 'A201' },
    { subject: 'Cơ sở dữ liệu', class: 'IT202-02', time: 'Ngày mai, 09:25', room: 'B105' },
    { subject: 'Mạng máy tính', class: 'IT303-01', time: '27/12, 12:10', room: 'C302' },
  ];

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Lớp học của tôi</h1>
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
          <button className="create-assignment-btn" onClick={() => navigate('/teacher/assignments')}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo bài tập mới
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        {/* Classes Grid */}
        <div className="classes-section">
          <div className="section-header">
            <h2>Danh sách lớp học ({myClasses.length})</h2>
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

          <div className="classes-grid">
            {myClasses.map((classItem) => (
              <div key={classItem.id} className="class-card">
                <div className="class-header">
                  <div className="class-info">
                    <h3>{classItem.subjectName}</h3>
                    <span className="class-code">{classItem.classCode}</span>
                  </div>
                  <button className="class-menu-btn">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
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

                <div className="class-progress">
                  <div className="progress-header">
                    <span className="progress-label">Tiến độ giảng dạy</span>
                    <span className="progress-value">{classItem.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${classItem.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="class-footer">
                  <span className="next-class">
                    Lớp tiếp theo: {classItem.nextClassDate}
                  </span>
                  <div className="class-actions">
                    <button 
                      className="action-btn secondary"
                      onClick={() => navigate(`/teacher/classes/${classItem.id}`)}
                    >
                      Xem danh sách
                    </button>
                    <button 
                      className="action-btn primary"
                      onClick={() => navigate(`/teacher/assignments?class=${classItem.id}`)}
                    >
                      Bài tập
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Classes Sidebar */}
        <div className="upcoming-section">
          <div className="section-header">
            <h2>Lớp sắp diễn ra</h2>
          </div>
          <div className="upcoming-list">
            {upcomingClasses.map((item, index) => (
              <div key={index} className="upcoming-item">
                <div className="upcoming-icon">📅</div>
                <div className="upcoming-content">
                  <h4>{item.subject}</h4>
                  <p className="upcoming-class">{item.class}</p>
                  <div className="upcoming-details">
                    <span className="upcoming-time">{item.time}</span>
                    <span className="upcoming-room">Phòng {item.room}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

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
    </div>
  );
};

export default TeacherDashboard;