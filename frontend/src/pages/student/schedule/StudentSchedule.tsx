import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/api/apiClient';
import './StudentSchedule.css';
import ChatList from '../../../components/chat/ChatList';
import { useAuthStore } from '@/store/authStore';

/**
 * StudentSchedule Component - SIMPLE FIX
 * 
 * CHỈ SỬA 1 DÒNG: Thêm check cho 'ELEARNING'
 */

interface ScheduleItem {
  classId: number;
  classCode: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  sessionDate: string;
  dayOfWeek: string;
  dayOfWeekDisplay: string;
  timeSlot: string;
  timeSlotDisplay: string;
  room: string;
  sessionNumber: number;
  sessionType: string;
  campus: string;
}

const TIME_SLOTS = [
  { id: 'CA1', label: 'Ca 1', period: 'Sáng', time: '06:45 - 09:15' },
  { id: 'CA2', label: 'Ca 2', period: 'Sáng', time: '09:25 - 11:55' },
  { id: 'CA3', label: 'Ca 3', period: 'Chiều', time: '12:10 - 14:40' },
  { id: 'CA4', label: 'Ca 4', period: 'Chiều', time: '14:50 - 17:20' },
  { id: 'CA5', label: 'Ca 5', period: 'Chiều', time: '17:30 - 20:00' },
  { id: 'CA6', label: 'Ca 6', period: 'Tối', time: '20:10 - 22:40' },
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

const StudentSchedule: React.FC = () => {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadSchedule();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const getWeekMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
      const monday = getWeekMonday(selectedDate);
      const weekStartDate = formatDateForAPI(monday);
      
      console.log('📅 Fetching schedule for week starting:', weekStartDate);

      const response = await apiClient.get(
        `/api/student/schedule/weekly?weekStartDate=${weekStartDate}`
      );

      if (response.data && response.data.success) {
        const items = response.data.data || [];
        console.log('Received', items.length, 'schedule items');
        
        items.forEach((item: ScheduleItem) => {
          const mapping = DAY_MAPPING[item.dayOfWeek as keyof typeof DAY_MAPPING];
          console.log(
            `📍 ${item.sessionDate} | ${item.dayOfWeek} → ${mapping?.display} (index ${mapping?.weekIndex}) | ${item.timeSlot} | ${item.subjectName}`
          );
        });
        
        setScheduleItems(items);
      }
    } catch (error: unknown) {
      console.error(' Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSessionsForSlot = (weekDayIndex: number, timeSlotId: string): ScheduleItem[] => {
    return scheduleItems.filter(item => {
      const dayMapping = DAY_MAPPING[item.dayOfWeek as keyof typeof DAY_MAPPING];
      return dayMapping?.weekIndex === weekDayIndex && item.timeSlot === timeSlotId;
    });
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

  const user = useAuthStore((state) => state.user);
  const weekDates = getWeekDates();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải lịch học...</p>
      </div>
    );
  }

  return (
    <div className="student-schedule-container">
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
            HIỆN TẠI
          </button>
          <button onClick={goToNextWeek} className="nav-btn" title="Tuần sau">
            →
          </button>
        </div>
      </div>

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
                  {slotIndex === 0 && (
                    <td className="period-label-cell" rowSpan={periodSlots.length}>
                      {period}
                    </td>
                  )}
                  
                  <td className="shift-label-cell">
                    <div className="shift-label">{slot.label}</div>
                    <div className="shift-time">{slot.time}</div>
                  </td>
                  
                  {weekDates.map((date, dayIndex) => {
                    const todayClass = isToday(date) ? 'today-cell' : '';
                    const sessions = getSessionsForSlot(dayIndex, slot.id);
                    
                    return (
                      <td key={dayIndex} className={`session-cell ${todayClass}`}>
                        {sessions.map(session => (
                          <div key={session.classId} className="session-card">
                            <div className="session-title">{session.subjectName}</div>
                            <div className="session-code">{session.classCode}</div>
                            <div className="session-info">
                              Buổi {session.sessionNumber}
                            </div>
                            <div className="session-info">
                              {session.teacherName}
                            </div>
                            <div className="session-info">
                              {session.room}
                            </div>
                            <div className="session-info campus">
                              {session.campus}
                            </div>
                            {/* SIMPLE FIX: Check cả hai format */}
                            {(session.sessionType === 'E_LEARNING' || 
                              session.sessionType === 'ELEARNING') && (
                              <div className="online-badge">E-Learning</div>
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
      <ChatList currentUsername={user?.username || 'student'} currentRole="STUDENT" />
    </div>
  );
};

export default StudentSchedule;