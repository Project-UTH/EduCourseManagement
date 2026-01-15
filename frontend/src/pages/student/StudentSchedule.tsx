import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api/apiClient';
import './StudentSchedule.css';

interface ScheduleItem {
  classId: number;
  classCode: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  sessionDate: string; // "YYYY-MM-DD" format from API
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
  
  // ✅ Helper: Verify what day of week a date string is
  const verifyDateDayOfWeek = (dateStr: string): string => {
    const date = parseDate(dateStr);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNamesVi = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayNum = date.getDay();
    return `${dateStr} is ${dayNames[dayNum]} (${dayNamesVi[dayNum]})`;
  };

  // ✅ CRITICAL FIX: Parse date without timezone issues
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ✅ CRITICAL FIX: Parse "YYYY-MM-DD" correctly (no timezone shift)
  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  // ✅ ULTIMATE FIX: Get Monday using ISO week (avoid timezone issues)
  function getThisWeekMonday(): string {
    const today = new Date();
    
    // Get local date parts to avoid timezone issues
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();
    const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    console.log('🔍 Today:', formatDateToString(today));
    console.log('🔍 Day of week:', dayOfWeek, ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]);
    
    // Create a new date for Monday calculation
    const monday = new Date(year, month, date);
    
    // Calculate offset to Monday
    // CRITICAL: We want the Monday of THIS week
    // If today is Sunday, we want YESTERDAY's Monday (6 days back)
    // If today is Monday, offset = 0
    // If today is Tuesday, offset = -1
    // etc.
    let offset: number;
    if (dayOfWeek === 0) {
      // Sunday: go back 6 days to get THIS week's Monday
      offset = -6;
    } else {
      // Any other day: go back (dayOfWeek - 1) days
      offset = -(dayOfWeek - 1);
    }
    
    monday.setDate(monday.getDate() + offset);
    
    const result = formatDateToString(monday);
    const mondayDay = monday.getDay();
    
    console.log('✅ Calculated Monday:', result);
    console.log('🔍 Monday day of week:', mondayDay, '(should be 1)');
    
    if (mondayDay !== 1) {
      console.error('❌ ERROR: Calculated Monday is not actually Monday! It is day', mondayDay);
      console.error('❌ Please check parseDate() and formatDateToString() functions');
    }
    
    return result;
  }

  const [currentWeekStart, setCurrentWeekStart] = useState<string>(getThisWeekMonday());

  useEffect(() => {
    fetchSchedule();
  }, [currentWeekStart]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      console.log('📅 Fetching schedule for week:', currentWeekStart);
      console.log('🔍 Verify week start:', verifyDateDayOfWeek(currentWeekStart));

      const response = await apiClient.get(
        `/api/student/schedule/weekly?weekStartDate=${currentWeekStart}`
      );

      if (response.data && response.data.success) {
        const items = response.data.data || [];
        console.log('✅ Received', items.length, 'schedule items');
        
        // ✅ DEBUG: Log each item's date and verify its day
        items.forEach((item: ScheduleItem) => {
          console.log(`📍 ${item.sessionDate} | ${item.dayOfWeekDisplay} | ${item.timeSlot} | ${item.subjectName}`);
          console.log(`   🔍 ${verifyDateDayOfWeek(item.sessionDate)}`);
        });
        
        setScheduleItems(items);
      }
    } catch (error: any) {
      console.error('❌ Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToThisWeek = () => {
    setCurrentWeekStart(getThisWeekMonday());
  };

  const goToPreviousWeek = () => {
    const currentDate = parseDate(currentWeekStart);
    currentDate.setDate(currentDate.getDate() - 7);
    setCurrentWeekStart(formatDateToString(currentDate));
  };

  const goToNextWeek = () => {
    const currentDate = parseDate(currentWeekStart);
    currentDate.setDate(currentDate.getDate() + 7);
    setCurrentWeekStart(formatDateToString(currentDate));
  };

  // ✅ CRITICAL FIX: Filter by EXACT date string match (no parsing issues)
  const getItemsForSlot = (dateStr: string, slotCode: string): ScheduleItem[] => {
    const filtered = scheduleItems.filter(
      item => item.sessionDate === dateStr && item.timeSlot === slotCode
    );
    
    if (filtered.length > 0) {
      console.log(`🎯 Found ${filtered.length} items for ${dateStr} ${slotCode}`);
    }
    
    return filtered;
  };

  // ✅ Get 7 days of the week as YYYY-MM-DD strings
  const getWeekDates = (): string[] => {
    const dates: string[] = [];
    const startDate = parseDate(currentWeekStart);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(formatDateToString(date));
    }
    
    return dates;
  };

  // Format week display
  const getWeekDisplay = (): string => {
    const startDate = parseDate(currentWeekStart);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`;
  };

  const formatDateDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // ✅ DEBUG: Log week structure when it changes
  useEffect(() => {
    const weekDates = getWeekDates();
    console.log('🗓️ Week structure:');
    DAYS_OF_WEEK.forEach((day, idx) => {
      const dateStr = weekDates[idx];
      console.log(`  ${day.display} (${day.code}): ${dateStr} | ${verifyDateDayOfWeek(dateStr)}`);
    });
  }, [currentWeekStart]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải lịch học...</p>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      {/* Header */}
      <div className="schedule-header">
        <h1>📅 Lịch học theo tuần</h1>
        
        <div className="schedule-controls">
          <input
            type="date"
            value={currentWeekStart}
            onChange={(e) => {
              const selectedDate = e.target.value;
              console.log('📅 User selected date:', selectedDate);
              
              // Force adjust to Monday if not Monday
              const date = parseDate(selectedDate);
              const dayOfWeek = date.getDay();
              console.log('🔍 Selected date day of week:', dayOfWeek);
              
              if (dayOfWeek !== 1) {
                // Adjust to Monday
                const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                date.setDate(date.getDate() + offset);
                const mondayDate = formatDateToString(date);
                console.log('🔧 Adjusted to Monday:', mondayDate);
                setCurrentWeekStart(mondayDate);
              } else {
                setCurrentWeekStart(selectedDate);
              }
            }}
            className="date-input"
          />
          
          <button onClick={goToPreviousWeek} className="btn-nav">←</button>
          <button onClick={goToThisWeek} className="btn-current">HIỆN TẠI</button>
          <button onClick={goToNextWeek} className="btn-nav">→</button>
        </div>

        <div className="week-display">{getWeekDisplay()}</div>
      </div>

      {/* Info */}
      {scheduleItems.length === 0 && !loading && (
        <div className="no-schedule-info">
          <p>📭 Không có lịch học trong tuần này</p>
          <small>Chỉ hiển thị lịch của các lớp trong kỳ sắp tới hoặc đang diễn ra</small>
        </div>
      )}

      {/* Schedule Grid */}
      <div className="schedule-grid-container">
        <table className="schedule-table" key={currentWeekStart}>
          <thead>
            <tr>
              <th className="col-timeslot">Ca học</th>
              {DAYS_OF_WEEK.map((day, idx) => {
                const weekDates = getWeekDates();
                const dateStr = weekDates[idx];
                const date = parseDate(dateStr);
                
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
            {TIME_SLOTS.map(slot => {
              const weekDates = getWeekDates();
              
              return (
                <tr key={slot.code}>
                  <td className="timeslot-cell">
                    <div className="timeslot-name">{slot.name}</div>
                    <div className="timeslot-time">{slot.time}</div>
                  </td>
                  
                  {weekDates.map((dateStr) => {
                    const items = getItemsForSlot(dateStr, slot.code);
                    
                    return (
                      <td key={`${dateStr}-${slot.code}`} className="schedule-cell">
                        {items.length > 0 ? (
                          items.map((item, idx) => (
                            <div key={idx} className="schedule-item">
                              <div className="item-subject">{item.subjectName}</div>
                              <div className="item-code">{item.classCode}</div>
                              <div className="item-info">
                                📚 Buổi {item.sessionNumber}
                              </div>
                              <div className="item-info">
                                👤 {item.teacherName}
                              </div>
                              <div className="item-info">
                                🏢 {item.room}
                              </div>
                              <div className="item-info campus">
                                📍 {item.campus}
                              </div>
                              {item.sessionType === 'E_LEARNING' && (
                                <div className="item-badge elearning">💻 E-Learning</div>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentSchedule;