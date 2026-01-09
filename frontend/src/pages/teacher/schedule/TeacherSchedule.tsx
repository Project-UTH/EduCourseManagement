import { useState, useEffect } from 'react';
import classApi from '../../../services/api/classApi';
import './TeacherSchedule.css';

/**
 * TeacherSchedule Component
 * 
 * Weekly calendar view for teacher's class schedule
 * Features:
 * - Weekly view with date navigation
 * - Time slot grid (Morning, Afternoon, Evening)
 * - Class session cards with details
 * - Today highlighting
 * - Responsive design
 */

interface ClassSession {
  classId: number;
  classCode: string;
  subjectName: string;
  dayOfWeek: number; // 2=Monday, 3=Tuesday, ..., 8=Sunday
  timeSlot: string; // "CA_1", "CA_2", etc.
  sessionPeriod: string; // "1-3", "7-9", "16-18"
  startTime: string; // "06:45"
  endTime: string; // "09:15"
  roomCode: string;
  roomName: string;
  location: string;
  isOnline: boolean;
}

// Time slot definitions
const TIME_SLOTS = [
  { id: 'CA_1', label: 'Ca 1', period: 'Sáng', time: '06:45 - 09:15' },
  { id: 'CA_2', label: 'Ca 2', period: 'Sáng', time: '09:30 - 12:00' },
  { id: 'CA_3', label: 'Ca 3', period: 'Chiều', time: '12:10 - 14:40' },
  { id: 'CA_4', label: 'Ca 4', period: 'Chiều', time: '14:50 - 17:20' },
  { id: 'CA_5', label: 'Ca 5', period: 'Chiều', time: '17:30 - 20:00' },
  { id: 'CA_6', label: 'Ca 6', period: 'Tối', time: '20:10 - 22:40' },
];

const PERIODS = ['Sáng', 'Chiều', 'Tối'];

const TeacherSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, [selectedDate]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      // Get all teacher's classes
      const classes = await classApi.getMyClasses();
      
      // Transform to session format
      // Note: This is mock data - need real ClassSession API
      const mockSessions: ClassSession[] = classes.flatMap(cls => {
        // Parse schedule from class (assuming format like "THU_6_CA_1")
        const schedules = parseClassSchedule(cls);
        return schedules.map(schedule => ({
          classId: cls.classId,
          classCode: cls.classCode,
          subjectName: cls.subjectName,
          dayOfWeek: schedule.dayOfWeek,
          timeSlot: schedule.timeSlot,
          sessionPeriod: schedule.sessionPeriod,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          roomCode: (cls as any).roomCode || (cls as any).fixedRoom || 'TBA',
          roomName: (cls as any).roomName || 'To Be Announced',
          location: extractLocation((cls as any).roomName),
          isOnline: (cls as any).roomCode === 'E-Learning' || (cls as any).roomName?.includes('E-Learning'),
        }));
      });
      
      setSessions(mockSessions);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Parse class schedule string (mock implementation)
  const parseClassSchedule = (cls: any) => {
    // This is a simplified parser - adjust based on actual data format
    // Expected format: "THU_6_CA_1" or similar
    return [
      {
        dayOfWeek: 6, // Friday
        timeSlot: 'CA_1',
        sessionPeriod: '1-3',
        startTime: '06:45',
        endTime: '09:15',
      }
    ];
  };

  const extractLocation = (roomName: string) => {
    if (!roomName) return '';
    if (roomName.includes('E-Learning')) return 'E-Learning';
    // Extract location like "(P.Thanh Mỹ Tây, TP.HCM)"
    const match = roomName.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
  };

  // Get week dates
  const getWeekDates = () => {
    const curr = new Date(selectedDate);
    const first = curr.getDate() - curr.getDay() + 1; // Monday
    const dates = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(curr.setDate(first + i));
      dates.push(date);
    }
    
    return dates;
  };

  const weekDates = getWeekDates();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (date: Date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate.getTime() === today.getTime();
  };

  const formatDateHeader = (date: Date, dayIndex: number) => {
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const day = dayNames[dayIndex === 0 ? 0 : dayIndex];
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return { day, date: dateStr };
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const getSessionsForSlot = (dayIndex: number, timeSlot: string) => {
    const dayOfWeek = dayIndex === 0 ? 8 : dayIndex + 1; // Convert: 0=Sunday(8), 1=Monday(2), etc.
    return sessions.filter(s => s.dayOfWeek === dayOfWeek && s.timeSlot === timeSlot);
  };

  return (
    <div className="teacher-schedule-container">
      {/* Header Controls */}
      <div className="schedule-controls">
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="date-picker"
        />
        
        <div className="nav-buttons">
          <button onClick={goToPreviousWeek} className="nav-btn" title="Tuần trước">
            ←
          </button>
          <button onClick={goToToday} className="today-btn">
            📅 HIỆN TẠI
          </button>
          <button onClick={goToNextWeek} className="nav-btn" title="Tuần sau">
            →
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải lịch giảng dạy...</p>
        </div>
      )}

      {/* Calendar Grid */}
      {!loading && (
        <div className="calendar-wrapper">
          <table className="schedule-table">
            <thead>
              <tr>
                <th className="period-header" rowSpan={2}>Ca học</th>
                {weekDates.map((date, index) => {
                  const header = formatDateHeader(date, index);
                  const todayClass = isToday(date) ? 'today-column' : '';
                  return (
                    <th key={index} className={`day-header ${todayClass}`}>
                      <div className="day-name">{header.day}</div>
                      <div className="day-date">{header.date}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map(period => {
                const periodSlots = TIME_SLOTS.filter(slot => slot.period === period);
                return periodSlots.map((slot, slotIndex) => (
                  <tr key={slot.id}>
                    {slotIndex === 0 && (
                      <td className="period-label-cell" rowSpan={periodSlots.length}>
                        {period}
                      </td>
                    )}
                    <td className="shift-label-cell">{slot.label}</td>
                    
                    {weekDates.map((date, dayIndex) => {
                      const todayClass = isToday(date) ? 'today-cell' : '';
                      const daySessions = getSessionsForSlot(dayIndex, slot.id);
                      
                      return (
                        <td key={dayIndex} className={`session-cell ${todayClass}`}>
                          {daySessions.map(session => (
                            <div key={session.classId} className="session-card">
                              <div className="session-title">{session.subjectName}</div>
                              <div className="session-code">{session.classCode}</div>
                              <div className="session-info">
                                📚 Tiết: {session.sessionPeriod}
                              </div>
                              <div className="session-info">
                                🕐 {session.startTime} - {session.endTime}
                              </div>
                              <div className="session-info">
                                📍 Phòng: {session.roomCode}
                              </div>
                              {session.location && (
                                <div className="session-location">
                                  📌 {session.location}
                                </div>
                              )}
                              {session.isOnline && (
                                <div className="lms-badge">🎓 LMS</div>
                              )}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && sessions.length === 0 && (
        <div className="empty-state">
          <p>📅 Không có lịch giảng dạy trong tuần này</p>
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;