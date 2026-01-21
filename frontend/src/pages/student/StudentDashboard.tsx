import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import studentClassApi from '../../services/api/studentClassApi';
import studentHomeworkApi from '../../services/api/studentHomeworkApi';
import ChatList from '../../components/chat/ChatList';
import './StudentDashboard.css';

/**
 * StudentDashboard - REAL DATA FROM API + CHAT INTEGRATION
 * 
 * ✅ Load từ: GET /api/student/classes
 * ✅ Tích hợp ChatList - floating button ở góc dưới phải
 */

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

interface Assignment {
  id: number;
  title: string;
  course: string;
  subjectName: string;
  dueDate: string;
  timeLeft: string;
  status: string;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state: any) => state.user);
  const [selectedSemester, setSelectedSemester] = useState('current');

  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load REAL data from API
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[Dashboard] Loading registered classes...');

      // 1. Load registered classes (Backend đã filter ACTIVE rồi)
      const classesData = await studentClassApi.getMyClasses();
      console.log('[Dashboard] ✅ Received classes:', classesData);

      // 2. Transform to CourseCard format
      const transformedCourses: CourseCard[] = classesData.map((c: any) => ({
        id: c.classId,
        subjectName: c.subjectName || c.className,
        classCode: c.classCode,
        teacherName: c.teacherName || 'Chưa có giảng viên',
        schedule: c.dayOfWeekDisplay + ', ' + c.timeSlotDisplay || 'Chưa xếp lịch',
        room: c.fixedRoom || c.roomName || 'Chưa có phòng',
        progress: 60, // Mock progress
        grade: undefined,
        nextClassDate: new Date().toLocaleDateString('vi-VN')
      }));

      setCourses(transformedCourses);
      console.log('[Dashboard] ✅ Courses set:', transformedCourses.length);

      // 3. Load homeworks
      const allHomeworks: any[] = [];
      for (const cls of classesData) {
        try {
          const classHomeworks = await studentHomeworkApi.getClassHomeworks(cls.classId);
          // ✅ Attach classId and subjectName to each homework
          const homeworksWithClass = classHomeworks.map(hw => ({
            ...hw,
            classId: cls.classId,
            subjectName: cls.subjectName || cls.className
          }));
          allHomeworks.push(...homeworksWithClass);
        } catch (err) {
          console.error(`[Dashboard] Failed to load homeworks for class ${cls.classId}:`, err);
        }
      }

      // 4. Transform to Assignment format
      const transformedAssignments: Assignment[] = allHomeworks
        .filter(hw => !hw.hasSubmitted && !hw.isOverdue)
        .slice(0, 3)
        .map(hw => {
          const deadline = new Date(hw.deadline);
          const now = new Date();
          const diff = deadline.getTime() - now.getTime();
          const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

          return {
            id: hw.homeworkId,
            title: hw.title,
            course: hw.className,
            subjectName: hw.subjectName,
            dueDate: deadline.toLocaleString('vi-VN'),
            timeLeft: daysLeft <= 0 ? 'Quá hạn' : `Còn ${daysLeft} ngày`,
            status: 'pending'
          };
        });

      setPendingAssignments(transformedAssignments);

      console.log('[Dashboard] ✅ Loaded successfully:', {
        courses: transformedCourses.length,
        assignments: transformedAssignments.length
      });

    } catch (err: any) {
      console.error('[Dashboard] ❌ Failed to load data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate stats from REAL data
  const stats = [
    { 
      label: 'Tín chỉ đã đăng ký', 
      value: courses.reduce((sum) => sum + 3, 0).toString(), // Assume 3 credits each
      icon: '📚', 
      color: 'blue' 
    },
    { 
      label: 'Bài tập hoàn thành', 
      value: '12/15', // Will calculate from homework API
      icon: '✅', 
      color: 'green' 
    },
    { 
      label: 'Bài tập chưa nộp', 
      value: pendingAssignments.length.toString(), 
      icon: '📝', 
      color: 'orange' 
    },
    { 
      label: 'Điểm TB tích lũy', 
      value: '3.45', // Will calculate from grades API
      icon: '📊', 
      color: 'purple' 
    },
  ];

  if (loading) {
    return (
      <div className="student-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-dashboard">
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
            onClick={() => navigate('/student/subjects')}
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
            <h2>Khóa học đã đăng ký ({courses.length})</h2>
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

          {courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>Chưa đăng ký khóa học nào</h3>
              <p>Bạn chưa đăng ký khóa học nào. Hãy đăng ký để bắt đầu học!</p>
              <button 
                className="btn-primary"
                onClick={() => navigate('/student/subjects')}
              >
                Đăng ký ngay
              </button>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map((course) => (
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
                        onClick={() => navigate(`/student/courses/${course.id}/assignments`)}
                      >
                        Bài tập
                      </button>
                      <button 
                        className="action-btn primary"
                        onClick={() => navigate(`/student/courses/${course.id}`)}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

          {pendingAssignments.length === 0 ? (
            <div className="empty-state-small">
              <p>✅ Không có bài tập nào cần làm</p>
            </div>
          ) : (
            <div className="assignments-list">
              {pendingAssignments.map(assignment => (
                <div key={assignment.id} className="assignment-item">
                  <div className="assignment-icon">📝</div>
                  <div className="assignment-content">
                    <h3 className="assignment-subject">{assignment.subjectName}</h3>
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
          )}

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

      {/* ✅ CHAT INTEGRATION - Floating button ở góc dưới phải */}
      <ChatList 
        currentUsername={user?.username || 'student'}
        currentRole="STUDENT"
      />
    </div>
  );
};

export default StudentDashboard;