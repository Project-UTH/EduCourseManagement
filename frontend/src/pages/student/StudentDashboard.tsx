import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

interface CourseCard {
  id: number;
  subjectName: string;
  classCode: string;
  teacherName: string;
  schedule: string;
  room: string;
  progress: number;
  grade?: string;
  nextClassDate: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState('current');

  // Mock data - will be replaced with real API calls
  const stats = [
    { label: 'Tín chỉ đã đăng ký', value: '18', icon: '📚', color: 'blue' },
    { label: 'Bài tập hoàn thành', value: '12/15', icon: '✅', color: 'green' },
    { label: 'Bài tập chưa nộp', value: '3', icon: '📝', color: 'orange' },
    { label: 'Điểm TB tích lũy', value: '3.45', icon: '📊', color: 'purple' },
  ];

  const myCourses: CourseCard[] = [
    {
      id: 1,
      subjectName: 'Lập trình Web',
      classCode: 'IT101-01',
      teacherName: 'TS. Nguyễn Văn A',
      schedule: 'Thứ 2, Ca 1 (06:45-09:15)',
      room: 'A201',
      progress: 60,
      grade: 'A',
      nextClassDate: '25/12/2024'
    },
    {
      id: 2,
      subjectName: 'Cơ sở dữ liệu',
      classCode: 'IT202-02',
      teacherName: 'ThS. Trần Thị B',
      schedule: 'Thứ 3, Ca 2 (09:25-11:55)',
      room: 'B105',
      progress: 75,
      nextClassDate: '26/12/2024'
    },
    {
      id: 3,
      subjectName: 'Mạng máy tính',
      classCode: 'IT303-01',
      teacherName: 'TS. Lê Văn C',
      schedule: 'Thứ 4, Ca 3 (12:10-14:40)',
      room: 'C302',
      progress: 45,
      grade: 'B+',
      nextClassDate: '27/12/2024'
    },
    {
      id: 4,
      subjectName: 'Lập trình Mobile',
      classCode: 'IT404-01',
      teacherName: 'ThS. Phạm Thị D',
      schedule: 'Thứ 5, Ca 4 (14:50-17:20)',
      room: 'A301',
      progress: 55,
      nextClassDate: '28/12/2024'
    },
  ];

  const pendingAssignments = [
    { 
      id: 1,
      title: 'Bài tập tuần 5 - ReactJS',
      course: 'Lập trình Web',
      dueDate: '25/12/2024 23:59',
      timeLeft: 'Còn 2 ngày',
      status: 'pending'
    },
    { 
      id: 2,
      title: 'Thiết kế Database cho hệ thống',
      course: 'Cơ sở dữ liệu',
      dueDate: '28/12/2024 23:59',
      timeLeft: 'Còn 5 ngày',
      status: 'pending'
    },
    { 
      id: 3,
      title: 'Phân tích giao thức TCP/IP',
      course: 'Mạng máy tính',
      dueDate: '30/12/2024 23:59',
      timeLeft: 'Còn 7 ngày',
      status: 'pending'
    },
  ];

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Khóa học của tôi</h1>
          <p>Theo dõi tiến độ học tập và các khóa học bạn đang tham gia</p>
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
            className="register-btn"
            onClick={() => navigate('/student/registration')}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Đăng ký học phần
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
        {/* Courses Grid */}
        <div className="courses-section">
          <div className="section-header">
            <h2>Khóa học đã đăng ký ({myCourses.length})</h2>
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

          <div className="courses-grid">
            {myCourses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  <div className="course-info">
                    <h3>{course.subjectName}</h3>
                    <span className="course-code">{course.classCode}</span>
                  </div>
                  {course.grade && (
                    <div className="course-grade">{course.grade}</div>
                  )}
                </div>

                <div className="course-teacher">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{course.teacherName}</span>
                </div>

                <div className="course-details">
                  <div className="detail-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{course.schedule}</span>
                  </div>
                  <div className="detail-item">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Phòng {course.room}</span>
                  </div>
                </div>

                <div className="course-progress">
                  <div className="progress-header">
                    <span className="progress-label">Tiến độ học tập</span>
                    <span className="progress-value">{course.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="course-footer">
                  <span className="next-class">
                    Lớp tiếp theo: {course.nextClassDate}
                  </span>
                  <div className="course-actions">
                    <button 
                      className="action-btn secondary"
                      onClick={() => navigate(`/student/assignments?course=${course.id}`)}
                    >
                      Bài tập
                    </button>
                    <button 
                      className="action-btn primary"
                      onClick={() => navigate(`/student/grades?course=${course.id}`)}
                    >
                      Xem điểm
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Assignments Sidebar */}
        <div className="assignments-section">
          <div className="section-header">
            <h2>Bài tập cần làm</h2>
            <button 
              className="view-all-link"
              onClick={() => navigate('/student/assignments')}
            >
              Xem tất cả
            </button>
          </div>
          <div className="assignments-list">
            {pendingAssignments.map(assignment => (
              <div key={assignment.id} className="assignment-item">
                <div className="assignment-icon">📝</div>
                <div className="assignment-content">
                  <h4>{assignment.title}</h4>
                  <p className="assignment-course">{assignment.course}</p>
                  <div className="assignment-details">
                    <span className="assignment-due">Hạn nộp: {assignment.dueDate}</span>
                    <span className="assignment-time-left urgent">{assignment.timeLeft}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            className="view-schedule-btn"
            onClick={() => navigate('/student/schedule')}
          >
            Xem lịch học
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;