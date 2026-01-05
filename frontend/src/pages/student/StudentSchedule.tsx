import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/apiClient';
import './StudentSchedule.css';

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
  { code: 'CA1', name: 'Ca 1', time: '06:45 - 09:15' },
  { code: 'CA2', name: 'Ca 2', time: '09:25 - 11:55' },
  { code: 'CA3', name: 'Ca 3', time: '12:10 - 14:40' },
  { code: 'CA4', name: 'Ca 4', time: '14:50 - 17:20' },
  { code: 'CA5', name: 'Ca 5', time: '17:30 - 20:00' },
];

const DAYS_OF_WEEK = [
  { code: 'MONDAY', display: 'Thứ 2' },
  { code: 'TUESDAY', display: 'Thứ 3' },
  { code: 'WEDNESDAY', display: 'Thứ 4' },
  { code: 'THURSDAY', display: 'Thứ 5' },
  { code: 'FRIDAY', display: 'Thứ 6' },
  { code: 'SATURDAY', display: 'Thứ 7' },
  { code: 'SUNDAY', display: 'Chủ nhật' },
];

const StudentSchedule: React.FC = () => {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getThisWeekMonday());

  useEffect(() => {
    fetchSchedule();
  }, [currentWeekStart]);

  function getThisWeekMonday(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const weekStartStr = formatDate(currentWeekStart);
      console.log('📅 Fetching schedule for week:', weekStartStr);

      const response = await apiClient.get(
        `/api/student/schedule/weekly?weekStartDate=${weekStartStr}`
      );

      if (response.data && response.data.success) {
        console.log('✅ Schedule items:', response.data.data);
        setScheduleItems(response.data.data || []);
      }
    } catch (error: any) {
      console.error('❌ Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const goToThisWeek = () => {
    setCurrentWeekStart(getThisWeekMonday());
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  // Get items for specific day and time slot
  const getItemsForSlot = (dayCode: string, slotCode: string): ScheduleItem[] => {
    return scheduleItems.filter(
      item => item.dayOfWeek === dayCode && item.timeSlot === slotCode
    );
  };

  // Format week display
  const getWeekDisplay = (): string => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    
    return `${formatDateDisplay(currentWeekStart)} - ${formatDateDisplay(endDate)}`;
  };

  const formatDateDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return <div className="loading-container">Đang tải lịch học...</div>;
  }

  return (
    <div className="schedule-page">
      {/* Header */}
      <div className="schedule-header">
        <h1>Lịch học theo tuần</h1>
        
        <div className="schedule-controls">
          <input
            type="date"
            value={formatDate(currentWeekStart)}
            onChange={(e) => setCurrentWeekStart(new Date(e.target.value))}
            className="date-input"
          />
          
          <button onClick={goToPreviousWeek} className="btn-nav">←</button>
          <button onClick={goToThisWeek} className="btn-current">HIỆN TẠI</button>
          <button onClick={goToNextWeek} className="btn-nav">→</button>
        </div>

        <div className="week-display">{getWeekDisplay()}</div>
      </div>

      {/* Schedule Grid */}
      <div className="schedule-grid-container">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="col-timeslot">Ca học</th>
              {DAYS_OF_WEEK.map(day => {
                const date = new Date(currentWeekStart);
                const dayIndex = DAYS_OF_WEEK.indexOf(day);
                date.setDate(currentWeekStart.getDate() + dayIndex);
                
                return (
                  <th key={day.code} className="col-day">
                    <div className="day-header">
                      <div className="day-name">{day.display}</div>
                      <div className="day-date">{formatDateDisplay(date)}</div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(slot => (
              <tr key={slot.code}>
                <td className="timeslot-cell">
                  <div className="timeslot-name">{slot.name}</div>
                  <div className="timeslot-time">{slot.time}</div>
                </td>
                
                {DAYS_OF_WEEK.map(day => {
                  const items = getItemsForSlot(day.code, slot.code);
                  
                  return (
                    <td key={`${day.code}-${slot.code}`} className="schedule-cell">
                      {items.length > 0 ? (
                        items.map((item, idx) => (
                          <div key={idx} className="schedule-item">
                            <div className="item-subject">{item.subjectName}</div>
                            <div className="item-code">{item.classCode}</div>
                            <div className="item-info">
                              📍 Tiết: {item.sessionNumber}
                            </div>
                            <div className="item-info">
                              ⏰ {slot.time}
                            </div>
                            <div className="item-info">
                              🏢 Phòng: {item.room}
                            </div>
                            <div className="item-info">
                              👤 {item.campus}
                            </div>
                            {item.sessionType === 'E_LEARNING' && (
                              <div className="item-badge">🎓 LMS</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="empty-cell"></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentSchedule;