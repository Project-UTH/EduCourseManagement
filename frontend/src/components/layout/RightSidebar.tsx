import { useState, useEffect } from 'react';
import studentClassApi from '../../services/api/studentClassApi';
import studentHomeworkApi from '../../services/api/studentHomeworkApi';
import './RightSidebar.css';

interface RightSidebarProps {
  userRole: 'TEACHER' | 'STUDENT';
}

interface Deadline {
  id: number;
  title: string;
  courseName: string;
  subjectName: string; // ✅ NEW
  dueDate: Date;
  type: 'assignment' | 'exam' | 'project';
}

interface ChatGroup {
  id: number;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatar: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const RightSidebar = ({ userRole }: RightSidebarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load REAL homework deadlines from API
  useEffect(() => {
    if (userRole === 'STUDENT') {
      loadDeadlines();
    }
  }, [userRole]);

  const loadDeadlines = async () => {
    setLoading(true);
    try {
      console.log('[RightSidebar] Loading homework deadlines...');

      // 1. Get all classes
      const classes = await studentClassApi.getMyClasses();

      // 2. Get all homeworks from all classes
      const allHomeworks: any[] = [];
      for (const cls of classes) {
        try {
          const classHomeworks = await studentHomeworkApi.getClassHomeworks(cls.classId);
          // Attach class info
          const homeworksWithClass = classHomeworks.map(hw => ({
            ...hw,
            classId: cls.classId,
            className: cls.className,
            subjectName: cls.subjectName || cls.className
          }));
          allHomeworks.push(...homeworksWithClass);
        } catch (err) {
          console.error(`Failed to load homeworks for class ${cls.classId}`, err);
        }
      }

      // 3. Transform to Deadline format (only pending assignments)
      const transformedDeadlines: Deadline[] = allHomeworks
        .filter(hw => !hw.hasSubmitted) // Only unsubmitted
        .map(hw => ({
          id: hw.homeworkId,
          title: hw.title,
          courseName: hw.className,
          subjectName: hw.subjectName,
          dueDate: new Date(hw.deadline),
          type: hw.homeworkType === 'MIDTERM' ? 'exam' as const : 
                hw.homeworkType === 'FINAL' ? 'exam' as const : 
                'assignment' as const
        }));

      setDeadlines(transformedDeadlines);
      console.log('[RightSidebar] ✅ Loaded deadlines:', transformedDeadlines.length);

    } catch (err) {
      console.error('[RightSidebar] ❌ Failed to load deadlines:', err);
    } finally {
      setLoading(false);
    }
  };

  const mockChatGroups: ChatGroup[] = [
    {
      id: 1,
      name: 'Lập trình Web - IT101',
      lastMessage: 'Thầy đã up slide bài mới lên rồi nhé',
      lastMessageTime: '10:30',
      unreadCount: 3,
      avatar: '💻'
    },
    {
      id: 2,
      name: 'Cơ sở dữ liệu - IT202',
      lastMessage: 'Nhóm 5 đã nộp báo cáo chưa?',
      lastMessageTime: 'Hôm qua',
      unreadCount: 0,
      avatar: '🗄️'
    },
    {
      id: 3,
      name: 'Mạng máy tính - IT303',
      lastMessage: 'Lịch thi đã ra rồi các bạn ơi',
      lastMessageTime: '2 ngày trước',
      unreadCount: 1,
      avatar: '🌐'
    },
  ];

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const hasDeadline = (date: Date) => {
    return deadlines.some(deadline => 
      deadline.dueDate.getDate() === date.getDate() &&
      deadline.dueDate.getMonth() === date.getMonth() &&
      deadline.dueDate.getFullYear() === date.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const formatTimeLeft = (dueDate: Date) => {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diff < 0) return 'Quá hạn';
    if (days === 0 && hours < 1) return 'Sắp hết hạn';
    if (days === 0) return `Còn ${hours} giờ`;
    if (days === 1) return 'Còn 1 ngày';
    return `Còn ${days} ngày`;
  };

  const getDeadlineColor = (dueDate: Date) => {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (diff < 0) return 'overdue';
    if (hours < 24) return 'urgent';
    if (hours < 72) return 'soon';
    return 'normal';
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const today = isToday(date);
      const deadline = hasDeadline(date);

      days.push(
        <button
          key={day}
          className={`calendar-day ${today ? 'today' : ''} ${deadline ? 'has-deadline' : ''}`}
          onClick={() => setSelectedDate(date)}
        >
          <span className="day-number">{day}</span>
          {deadline && <span className="deadline-dot"></span>}
        </button>
      );
    }

    return days;
  };

  const changeMonth = (increment: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
  };

  const sortedDeadlines = [...deadlines]
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);

  return (
    <aside className="right-sidebar">
      {/* Calendar Widget */}
      <div className="widget calendar-widget">
        <div className="widget-header">
          <h3>Lịch</h3>
          <div className="calendar-nav">
            <button onClick={() => changeMonth(-1)} className="nav-btn">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="current-month">
              Tháng {currentMonth.getMonth() + 1}/{currentMonth.getFullYear()}
            </span>
            <button onClick={() => changeMonth(1)} className="nav-btn">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>
          <div className="calendar-days">
            {renderCalendar()}
          </div>
        </div>

        <div className="calendar-legend">
          <span className="legend-item">
            <span className="legend-dot has-deadline"></span>
            Có deadline
          </span>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="widget deadlines-widget">
        <div className="widget-header">
          <h3>Deadline sắp tới</h3>
          <button className="view-all-btn">Xem tất cả</button>
        </div>
        
        {loading ? (
          <div className="deadline-loading">
            <div className="spinner-small"></div>
            <p>Đang tải...</p>
          </div>
        ) : (
          <div className="deadline-list">
            {sortedDeadlines.length === 0 ? (
              <div className="empty-state">
                <p>✅ Không có deadline sắp tới</p>
              </div>
            ) : (
              sortedDeadlines.map(deadline => (
                <div key={deadline.id} className={`deadline-item ${getDeadlineColor(deadline.dueDate)}`}>
                  <div className="deadline-icon">
                    {deadline.type === 'assignment' && '📝'}
                    {deadline.type === 'exam' && '📊'}
                    {deadline.type === 'project' && '💼'}
                  </div>
                  <div className="deadline-content">
                    <h3 className="deadline-subject">{deadline.subjectName}</h3>
                    <h4>{deadline.title}</h4>
                    <p className="deadline-course">{deadline.courseName}</p>
                    <div className="deadline-time">
                      <span className="deadline-date">
                        {deadline.dueDate.toLocaleDateString('vi-VN', { 
                          day: '2-digit', 
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className={`time-left ${getDeadlineColor(deadline.dueDate)}`}>
                        {formatTimeLeft(deadline.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Chat Groups */}
      <div className="widget chat-widget">
        <div className="widget-header">
          <h3>Nhóm Chat</h3>
          <button className="view-all-btn">Xem tất cả</button>
        </div>
        
        <div className="chat-group-list">
          {mockChatGroups.map(group => (
            <button key={group.id} className="chat-group-item">
              <div className="chat-avatar">{group.avatar}</div>
              <div className="chat-content">
                <div className="chat-header">
                  <h4>{group.name}</h4>
                  <span className="chat-time">{group.lastMessageTime}</span>
                </div>
                <p className="chat-last-message">{group.lastMessage}</p>
              </div>
              {group.unreadCount > 0 && (
                <span className="chat-unread-badge">{group.unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;