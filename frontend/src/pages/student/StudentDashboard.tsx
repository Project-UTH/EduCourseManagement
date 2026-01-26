import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import studentClassApi from '../../services/api/studentClassApi';
import studentHomeworkApi from '../../services/api/studentHomeworkApi';
import ChatList from '../../components/chat/ChatList';
import './StudentDashboard.css';

/**
 * StudentDashboard - Namespaced (sd-)
 * * Real data from API + Chat integration
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Load registered classes
      const classesData = await studentClassApi.getMyClasses();
      
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

      // 2. Load homeworks
      const allHomeworks: any[] = [];
      for (const cls of classesData) {
        try {
          const classHomeworks = await studentHomeworkApi.getClassHomeworks(cls.classId);
          const homeworksWithClass = classHomeworks.map(hw => ({
            ...hw,
            classId: cls.classId,
            subjectName: cls.subjectName || cls.className
          }));
          allHomeworks.push(...homeworksWithClass);
        } catch (err) {
          console.error(`Failed to load homeworks for class ${cls.classId}`, err);
        }
      }

      // 3. Filter pending assignments
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

    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  
  const stats = [
    { label: 'Tín chỉ đã đăng ký', value: courses.reduce((sum) => sum + 3, 0).toString(), icon: '📚', color: 'sd-blue' },
    { label: 'Bài tập hoàn thành', value: '12/15', icon: '✅', color: 'sd-green' },
    { label: 'Bài tập chưa nộp', value: pendingAssignments.length.toString(), icon: '📝', color: 'sd-orange' },
    { label: 'Điểm TB tích lũy', value: '3.45', icon: '📊', color: 'sd-purple' },
  ];

  if (loading) {
    return (
      <div className="sd-container">
        <div className="sd-loading">
          <div className="sd-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sd-container">
        <div className="sd-error">
          <p>{error}</p>
          <button onClick={loadDashboardData} className="sd-btn-register">Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sd-container">
      {/* Header */}
      <div className="sd-header">
        <div className="sd-header-content">
          <h1>Chào mừng trở lại, {user?.fullName || 'Sinh viên'}! 👋</h1>
        </div>
      </div>

      {/* Stats Grid */}

      <div className="sd-content-layout">
        {/* Main Courses Area */}
        <div className="sd-courses-section">
          <div className="sd-section-header">
            <h2>Khóa học đã đăng ký ({courses.length})</h2>
          </div>

          {courses.length === 0 ? (
            <div className="sd-empty">
              <div className="sd-empty-icon">📚</div>
              <h3>Chưa đăng ký khóa học nào</h3>
              <p>Bạn chưa đăng ký khóa học nào. Hãy đăng ký để bắt đầu học!</p>
              <button className="sd-btn-register" onClick={() => navigate('/student/subjects')}>
                Đăng ký ngay
              </button>
            </div>
          ) : (
            <div className="sd-courses-grid">
              {courses.map((course) => (
                <div key={course.id} className="sd-course-card">
                  <div className="sd-course-header">
                    <div className="sd-course-info">
                      <h3>{course.subjectName}</h3>
                      <span className="sd-course-code">{course.classCode}</span>
                    </div>
                    {course.grade && <div className="sd-course-grade">{course.grade}</div>}
                  </div>

                  <div className="sd-course-teacher">
                    <span className="sd-detail-icon">👨‍🏫</span>
                    <span>{course.teacherName}</span>
                  </div>

                  
                  <div className="sd-course-footer">
                    
                    <div className="sd-course-actions">
                      <button 
                        className="sd-btn sd-btn-secondary"
                        onClick={() => navigate(`/student/courses/${course.id}/assignments`)}
                      >
                        Bài tập
                      </button>
                      <button 
                        className="sd-btn sd-btn-primary"
                        onClick={() => navigate(`/student/courses/${course.id}`)}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Assignments & Schedule */}
        <div className="sd-sidebar">
          <div className="sd-assignments-panel">
            <div className="sd-section-header">
              <h2>Bài tập cần làm</h2>
            </div>

            {pendingAssignments.length === 0 ? (
              <div className="sd-empty" style={{ padding: '20px' }}>
                <p style={{ margin: 0 }}>✅ Không có bài tập nào</p>
              </div>
            ) : (
              <div className="sd-assign-list">
                {pendingAssignments.map(assignment => (
                  <div key={assignment.id} className="sd-assign-item">
                    <div className="sd-assign-icon">📝</div>
                    <div className="sd-assign-content">
                      <div className="sd-assign-subject">{assignment.subjectName}</div>
                      <h4 className="sd-assign-title">{assignment.title}</h4>
                      <p className="sd-assign-course">{assignment.course}</p>
                      <div className="sd-assign-meta">
                        <span className="sd-assign-due">Hạn: {assignment.dueDate}</span>
                        <span className="sd-assign-urgent">{assignment.timeLeft}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button className="sd-btn-schedule" onClick={() => navigate('/student/schedule')}>
              📅 Xem lịch học chi tiết
            </button>
          </div>
        </div>
      </div>

      <ChatList 
        currentUsername={user?.username || 'student'}
        currentRole="STUDENT"
      />
    </div>
  );
};

export default StudentDashboard;