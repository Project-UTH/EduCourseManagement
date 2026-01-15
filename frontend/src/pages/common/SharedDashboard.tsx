import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import studentClassApi from '../../services/api/studentClassApi';
import './SharedDashboard.css';

/**
 * SharedDashboard - CHUNG CHO TEACHER VÀ STUDENT
 * 
 * Student: Hiển thị cards màu sắc (giống portal trường)
 * Teacher: Hiển thị cards lớp đang dạy
 * Click card → Chi tiết lớp
 */

interface CourseCard {
  classId: number;
  subjectName: string;
  classCode: string;
  semesterName: string;
  progress: number;
  color: string;
  enrolledStudents?: number;
  maxStudents?: number;
  teacherName?: string;
}

interface DashboardProps {
  userRole: 'TEACHER' | 'STUDENT';
}

const SharedDashboard = ({ userRole }: DashboardProps) => {
  const navigate = useNavigate();
  const user = useAuthStore((state: any) => state.user);
  
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('last-accessed');

  // Colors for course cards (giống portal trường)
  const cardColors = [
    '#f4a261', // orange/yellow
    '#5eafea', // light blue
    '#2a9fd8', // blue
    '#7fb3d5', // light blue-gray
    '#8b7fc7', // purple
    '#6c9bd1', // steel blue
    '#e9c46a', // yellow-gold
    '#9d84b7', // light purple
  ];

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await studentClassApi.getMyClasses();
      
      // Transform to CourseCard format
      const transformedCourses: CourseCard[] = data
        .filter((c: any) => c.status === 'ACTIVE')
        .map((c: any, index: number) => ({
          classId: c.classId,
          subjectName: c.subjectName || c.className,
          classCode: c.classCode,
          semesterName: c.academicYear || '2025-2026',
          progress: Math.floor(Math.random() * 30), // Mock progress
          color: cardColors[index % cardColors.length],
          enrolledStudents: c.currentStudents,
          maxStudents: c.maxStudents,
          teacherName: c.teacherName
        }));
      
      setCourses(transformedCourses);
    } catch (err) {
      console.error('Failed to load courses:', err);
      // Fallback to mock data
      setCourses(getMockCourses());
    } finally {
      setLoading(false);
    }
  };

  const getMockCourses = (): CourseCard[] => {
    return [
      {
        classId: 1,
        subjectName: 'Chủ nghĩa xã hội khoa học',
        classCode: '[CLC]_HKII2024-2025_Khoa Lý luận chính trị',
        semesterName: '2024-2025',
        progress: 3,
        color: '#f4a261',
        teacherName: 'TS. Nguyễn Văn A'
      },
      {
        classId: 2,
        subjectName: 'Hệ quản trị cơ sở dữ liệu',
        classCode: '[CLC]_HKII2025-2026_Viện Công nghệ thông tin và Điện, điện tử',
        semesterName: '2025-2026',
        progress: 0,
        color: '#5eafea',
        teacherName: 'ThS. Trần Thị B'
      },
      {
        classId: 3,
        subjectName: 'XD phần mềm hướng đối tượng',
        classCode: '[CLC]_HKII2025-2026_Viện Công nghệ thông tin và Điện, điện tử',
        semesterName: '2025-2026',
        progress: 0,
        color: '#2a9fd8',
        teacherName: 'TS. Lê Văn C'
      },
      {
        classId: 4,
        subjectName: 'Tư duy thiết kế và đổi mới sáng tạo',
        classCode: '[TT]_HKII2025-2026_Phòng Đào tạo',
        semesterName: '2025-2026',
        progress: 0,
        color: '#7fb3d5',
        teacherName: 'ThS. Phạm Thị D'
      },
      {
        classId: 5,
        subjectName: 'Quản trị dự án CNTT',
        classCode: '[CLC]_HKII2025-2026_Viện Công nghệ thông tin và Điện, điện tử',
        semesterName: '2025-2026',
        progress: 7,
        color: '#8b7fc7',
        teacherName: 'TS. Hoàng Văn E'
      },
      {
        classId: 6,
        subjectName: 'Quản trị mạng',
        classCode: '[CLC]_HKII2025-2026_Viện Công nghệ thông tin và Điện, điện tử',
        semesterName: '2025-2026',
        progress: 0,
        color: '#6c9bd1',
        teacherName: 'ThS. Võ Thị F'
      },
    ];
  };

  const handleCourseClick = (classId: number) => {
    const basePath = userRole === 'TEACHER' ? '/teacher' : '/student';
    navigate(`${basePath}/courses/${classId}`);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.classCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'in-progress' && course.progress > 0) ||
                         (filter === 'not-started' && course.progress === 0);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="shared-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <h1>
            {userRole === 'TEACHER' 
              ? `👨‍🏫 Xin chào, ${user?.fullName || 'Giảng viên'}!`
              : `👋 Xin chào, ${user?.fullName || 'Sinh viên'}!`
            }
          </h1>
          <p>
            {userRole === 'TEACHER'
              ? 'Quản lý và theo dõi các lớp học bạn đang giảng dạy'
              : 'Chào mừng bạn đến với hệ thống quản lý khóa học'
            }
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Courses Section */}
        <div className="courses-section">
          <h2>
            {userRole === 'TEACHER' 
              ? '📚 Lớp học đang giảng dạy'
              : '📚 Tổng quan về khóa học'
            }
          </h2>
          
          {/* Filters */}
          <div className="courses-filters">
            <select 
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="in-progress">In progress</option>
              <option value="not-started">Not started</option>
            </select>

            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select 
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="last-accessed">Sort by last accessed</option>
              <option value="name">Sort by name</option>
              <option value="progress">Sort by progress</option>
            </select>
          </div>

          {/* Course Cards Grid */}
          <div className="courses-grid">
            {filteredCourses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📚</div>
                <p>Không tìm thấy khóa học nào</p>
              </div>
            ) : (
              filteredCourses.map((course) => (
                <div
                  key={course.classId}
                  className="course-card"
                  onClick={() => handleCourseClick(course.classId)}
                  style={{ backgroundColor: course.color }}
                >
                  {/* Course Menu */}
                  <div className="course-menu">
                    <button 
                      className="menu-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Show menu options
                      }}
                    >
                      ⋮
                    </button>
                  </div>

                  {/* Course Content */}
                  <div className="course-content">
                    <h3 className="course-title">{course.subjectName}</h3>
                    <p className="course-code">{course.classCode}</p>
                    
                    {userRole === 'STUDENT' && course.teacherName && (
                      <p className="course-teacher">👨‍🏫 {course.teacherName}</p>
                    )}
                    
                    {userRole === 'TEACHER' && course.enrolledStudents !== undefined && (
                      <p className="course-students">
                        👥 {course.enrolledStudents}/{course.maxStudents} sinh viên
                      </p>
                    )}
                    
                    <div className="course-footer">
                      <span className="course-progress">{course.progress}% complete</span>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="course-overlay">
                    <button className="view-course-btn">
                      {userRole === 'TEACHER' ? 'Quản lý lớp học →' : 'Xem khóa học →'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar - Deadline */}
        <div className="sidebar-section">
          <div className="deadline-widget">
            <h3>⏰ Deadline sắp tới</h3>
            
            <div className="deadline-list">
              <div className="deadline-item urgent">
                <div className="deadline-icon">📝</div>
                <div className="deadline-content">
                  <h4>Bài tập tuần 5</h4>
                  <p className="deadline-course">Lập trình Web</p>
                  <p className="deadline-time">23:59 25-12</p>
                  <span className="deadline-badge">Quá hạn</span>
                </div>
              </div>

              <div className="deadline-item">
                <div className="deadline-icon">📂</div>
                <div className="deadline-content">
                  <h4>Đồ án giữa kỳ</h4>
                  <p className="deadline-course">Cơ sở dữ liệu</p>
                  <p className="deadline-time">23:59 28-12</p>
                  <span className="deadline-badge">Quá hạn</span>
                </div>
              </div>
            </div>

            <button 
              className="view-all-btn"
              onClick={() => {
                const path = userRole === 'TEACHER' ? '/teacher/assignments' : '/student/assignments';
                navigate(path);
              }}
            >
              Xem tất cả →
            </button>
          </div>

          {/* Calendar Widget */}
          <div className="calendar-widget">
            <div className="calendar-header">
              <button className="calendar-nav">‹</button>
              <span>Tháng 1/2026</span>
              <button className="calendar-nav">›</button>
            </div>
            
            <div className="calendar-grid">
              <div className="calendar-days">
                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                  <div key={day} className="calendar-day-label">{day}</div>
                ))}
              </div>
              
              <div className="calendar-dates">
                {Array.from({ length: 31 }, (_, i) => i + 1).map(date => (
                  <div 
                    key={date} 
                    className={`calendar-date ${date === 9 ? 'today' : ''} ${[5, 12, 25].includes(date) ? 'has-deadline' : ''}`}
                  >
                    {date}
                  </div>
                ))}
              </div>
            </div>

            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-dot today"></span>
                <span>Có deadline</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedDashboard;