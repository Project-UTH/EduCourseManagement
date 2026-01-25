import { useState, useEffect } from 'react';
import classApi from '../../../services/api/classApi';
import './TeacherSchedule.css';
import ChatList from '../../../components/chat/ChatList';
import { useAuthStore } from '@/store/authStore';


/**
 * TeacherSchedule Component
 * Logic: Same as provided (StudentSchedule logic adapted for Teacher)
 */

interface ClassSession {
  classId: number;
  classCode: string;
  subjectName: string;
  dayOfWeek: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  roomCode: string;
  roomName: string;
  location: string;
  isOnline: boolean;
  semester: string;
  academicYear: string;
  currentStudents: number;
  maxStudents: number;
}

// Time slots grouped by period
const TIME_SLOTS = [
  { id: 'CA_1', label: 'Ca 1', period: 'Sáng', time: '06:45 - 09:15' },
  { id: 'CA_2', label: 'Ca 2', period: 'Sáng', time: '09:30 - 12:00' },
  { id: 'CA_3', label: 'Ca 3', period: 'Chiều', time: '12:10 - 14:40' },
  { id: 'CA_4', label: 'Ca 4', period: 'Chiều', time: '14:50 - 17:20' },
  { id: 'CA_5', label: 'Ca 5', period: 'Chiều', time: '17:30 - 20:00' },
  { id: 'CA_6', label: 'Ca 6', period: 'Tối', time: '20:10 - 22:40' },
];

const PERIODS = ['Sáng', 'Chiều', 'Tối'];

const DAY_MAPPING = {
  'MONDAY': { display: 'Thứ 2', weekIndex: 0 },
  'TUESDAY': { display: 'Thứ 3', weekIndex: 1 },
  'WEDNESDAY': { display: 'Thứ 4', weekIndex: 2 },
  'THURSDAY': { display: 'Thứ 5', weekIndex: 3 },
  'FRIDAY': { display: 'Thứ 6', weekIndex: 4 },
  'SATURDAY': { display: 'Thứ 7', weekIndex: 5 },
  'SUNDAY': { display: 'Chủ nhật', weekIndex: 6 },
};

const TeacherSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, [selectedDate]);

  // Get Monday of the current week
  const getWeekMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sunday, 1=Monday...
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Format date to YYYY-MM-DD for API
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get 7 dates of the week
  const getWeekDates = (): Date[] => {
    const monday = getWeekMonday(selectedDate);
    const dates: Date[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const loadSchedule = async () => {
    setLoading(true);
    try {
      // Get all teacher's classes
      const classes = await classApi.getMyClasses();
      
      console.log('📦 Teacher classes received:', classes.length);
      
      // Transform classes to session format
      const transformedSessions: ClassSession[] = classes.map((cls: any) => {
        const dayOfWeek = cls.dayOfWeek;
        const timeSlotId = mapTimeSlotToId(cls.timeSlot?.slotName);
        
        return {
          classId: cls.classId,
          classCode: cls.classCode,
          subjectName: cls.subject?.subjectName || 'N/A',
          dayOfWeek: dayOfWeek,
          timeSlot: timeSlotId,
          startTime: cls.timeSlot?.startTime || '00:00',
          endTime: cls.timeSlot?.endTime || '00:00',
          roomCode: cls.fixedRoom || 'TBA',
          roomName: cls.fixedRoom || 'To Be Announced',
          location: extractLocation(cls.fixedRoom),
          isOnline: cls.fixedRoom === 'E-Learning' || cls.fixedRoom?.includes('E-Learning'),
          semester: cls.semester,
          academicYear: cls.academicYear,
          currentStudents: cls.currentStudents || 0,
          maxStudents: cls.maxStudents || 0,
        };
      });
      
      setSessions(transformedSessions);
    } catch (error) {
      console.error('❌ Failed to load teacher schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Map time slot name from API to our ID format
  const mapTimeSlotToId = (slotName?: string): string => {
    if (!slotName) return 'CA_1';
    
    const match = slotName.match(/Ca\s*(\d+)/i);
    if (match) {
      return `CA_${match[1]}`;
    }
    
    return 'CA_1';
  };

  const extractLocation = (roomName?: string): string => {
    if (!roomName) return '';
    if (roomName.includes('E-Learning')) return 'E-Learning';
    
    const match = roomName.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
  };

  const getSessionsForSlot = (weekDayIndex: number, timeSlotId: string): ClassSession[] => {
    return sessions.filter(session => {
      const dayMapping = DAY_MAPPING[session.dayOfWeek as keyof typeof DAY_MAPPING];
      return dayMapping?.weekIndex === weekDayIndex && session.timeSlot === timeSlotId;
    });
  };

  // Navigation
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

  // Format date for display
  const formatDateHeader = (date: Date, weekDayIndex: number): { day: string; date: string } => {
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    const day = dayNames[weekDayIndex];
    const dateStr = date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    return { day, date: dateStr };
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  const user = useAuthStore((state: any) => state.user);


  const weekDates = getWeekDates();

  return (
    <div className="teacher-schedule-container">
      {/* Header Controls */}
      <div className="schedule-controls">
        <input
          type="date"
          value={formatDateForAPI(selectedDate)}
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
                <th className="period-header" rowSpan={2}></th>
                <th className="shift-header" rowSpan={2}>Ca học</th>
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
                    {/* Period label (merged cells) */}
                    {slotIndex === 0 && (
                      <td className="period-label-cell" rowSpan={periodSlots.length}>
                        {period}
                      </td>
                    )}
                    
                    {/* Time slot label */}
                    <td className="shift-label-cell">
                      <div className="shift-label">{slot.label}</div>
                      <div className="shift-time">{slot.time}</div>
                    </td>
                    
                    {/* Day cells */}
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
                              <div className="session-info">
                                👥 {session.currentStudents}/{session.maxStudents} SV
                              </div>
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
      <ChatList currentUsername={user?.username || 'teacher'} currentRole="TEACHER" />
    </div>
  );
};

export default TeacherSchedule;