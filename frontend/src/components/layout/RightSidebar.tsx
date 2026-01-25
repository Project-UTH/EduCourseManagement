import { useState, useEffect } from 'react';
import studentClassApi from '../../services/api/studentClassApi';
import studentHomeworkApi from '../../services/api/studentHomeworkApi';
import ChatList from '../chat/ChatList';  
import './RightSidebar.css';

interface RightSidebarProps {
  userRole: 'TEACHER' | 'STUDENT';
  currentUsername: string;
}

interface Deadline {
  id: number;
  title: string;
  courseName: string;
  subjectName: string;
  dueDate: Date;
  type: 'assignment' | 'exam' | 'project';
}

const RightSidebar = ({ userRole, currentUsername }: RightSidebarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
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

      {/* 
        ✅ THAY THẾ phần "Nhóm Chat" cũ bằng ChatList component
        ChatList sẽ hiển thị floating button ở góc dưới phải
        Không cần render trong RightSidebar nữa
      */}
      {/* ChatList được render ở Layout hoặc Dashboard level */}
    </aside>
  );
};

export default RightSidebar;