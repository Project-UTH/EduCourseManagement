import React, { useState, useEffect } from 'react';
import './SessionListModal.css';

interface Session {
  sessionId: number;
  sessionNumber: number;
  sessionType: string;
  originalDate: string | null;
  originalDayOfWeekDisplay: string | null;
  originalTimeSlotDisplay: string | null;
  originalRoom: string | null;
  actualDate: string | null;
  actualDayOfWeekDisplay: string | null;
  actualTimeSlotDisplay: string | null;
  actualRoom: string | null;
  effectiveDate: string | null;
  effectiveDayOfWeekDisplay: string | null;
  effectiveTimeSlotDisplay: string | null;
  effectiveRoom: string | null;
  isRescheduled: boolean;
  rescheduleReason: string | null;
  status: string;
}

interface Props {
  classData: {
    classId: number;
    classCode: string;
    subjectName: string;
    semesterCode: string;
  };
  onClose: () => void;
}

const SessionListModal: React.FC<Props> = ({ classData, onClose }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Reschedule form
  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: '',
    newDayOfWeek: 'MONDAY',
    newTimeSlot: 'CA1',
    newRoom: '',
    reason: ''
  });
  
  useEffect(() => {
    fetchSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/admin/sessions/class/${classData.classId}/in-person`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch sessions');
      
      const data = await response.json();
      setSessions(data.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartEdit = (session: Session) => {
    setEditingSession(session.sessionId);
    setRescheduleForm({
      newDate: session.effectiveDate || '',
      newDayOfWeek: getDayOfWeekEnum(session.effectiveDayOfWeekDisplay || ''),
      newTimeSlot: getTimeSlotEnum(session.effectiveTimeSlotDisplay || ''),
      newRoom: session.effectiveRoom || '',
      reason: session.rescheduleReason || ''
    });
  };
  
  const handleCancelEdit = () => {
    setEditingSession(null);
    setRescheduleForm({
      newDate: '',
      newDayOfWeek: 'MONDAY',
      newTimeSlot: 'CA1',
      newRoom: '',
      reason: ''
    });
  };
  
  const handleReschedule = async (sessionId: number) => {
    if (!rescheduleForm.reason.trim()) {
      alert('Vui lòng nhập lý do đổi lịch');
      return;
    }
    
    try {
      const response = await fetch(
        `/api/admin/sessions/${sessionId}/reschedule`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(rescheduleForm)
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Reschedule failed');
      }
      
      alert('✅ Đổi lịch thành công!');
      handleCancelEdit();
      fetchSessions();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };
  
  const handleResetToOriginal = async (sessionId: number) => {
    if (!window.confirm('Bạn có chắc muốn hủy đổi lịch và về lịch gốc?')) {
      return;
    }
    
    try {
      const response = await fetch(
        `/api/admin/sessions/${sessionId}/reset`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Reset failed');
      
      alert('✅ Đã reset về lịch gốc!');
      fetchSessions();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(`❌ Lỗi: ${err.message}`);
    }
  };
  
  // Helper functions
  const getDayOfWeekEnum = (display: string): string => {
    const map: Record<string, string> = {
      'Thứ 2': 'MONDAY',
      'Thứ 3': 'TUESDAY',
      'Thứ 4': 'WEDNESDAY',
      'Thứ 5': 'THURSDAY',
      'Thứ 6': 'FRIDAY',
      'Thứ 7': 'SATURDAY',
      'Chủ nhật': 'SUNDAY'
    };
    return map[display] || 'MONDAY';
  };
  
  const getTimeSlotEnum = (display: string): string => {
    if (display.includes('06:45')) return 'CA1';
    if (display.includes('09:25')) return 'CA2';
    if (display.includes('12:10')) return 'CA3';
    if (display.includes('14:50')) return 'CA4';
    if (display.includes('17:30')) return 'CA5';
    return 'CA1';
  };
  
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h2>📅 Lịch học - {classData.classCode}</h2>
            <p className="modal-subtitle">
              {classData.subjectName} • {classData.semesterCode}
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        
        {/* BODY */}
        <div className="modal-body">
          {loading ? (
            <div className="loading">⏳ Đang tải...</div>
          ) : error ? (
            <div className="error-message">❌ {error}</div>
          ) : (
            <div className="sessions-table-wrapper">
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>Buổi</th>
                    <th>Lịch gốc</th>
                    <th>Lịch hiện tại</th>
                    <th>Lý do đổi lịch</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(session => (
                    <tr 
                      key={session.sessionId}
                      className={session.isRescheduled ? 'rescheduled-row' : ''}
                    >
                      <td>
                        <strong>Buổi {session.sessionNumber}</strong>
                        {session.isRescheduled && (
                          <div className="rescheduled-badge">🔄 Đã đổi</div>
                        )}
                      </td>
                      
                      <td>
                        <div className="schedule-cell">
                          <div className="date">{formatDate(session.originalDate)}</div>
                          <div className="time">
                            {session.originalDayOfWeekDisplay}, {session.originalTimeSlotDisplay}
                          </div>
                          <div className="room">📍 {session.originalRoom}</div>
                        </div>
                      </td>
                      
                      <td>
                        {editingSession === session.sessionId ? (
                          // EDIT MODE
                          <div className="edit-form">
                            <input
                              type="date"
                              className="form-input"
                              value={rescheduleForm.newDate}
                              onChange={e => setRescheduleForm({
                                ...rescheduleForm,
                                newDate: e.target.value
                              })}
                            />
                            <select
                              className="form-select"
                              value={rescheduleForm.newDayOfWeek}
                              onChange={e => setRescheduleForm({
                                ...rescheduleForm,
                                newDayOfWeek: e.target.value
                              })}
                            >
                              <option value="MONDAY">Thứ 2</option>
                              <option value="TUESDAY">Thứ 3</option>
                              <option value="WEDNESDAY">Thứ 4</option>
                              <option value="THURSDAY">Thứ 5</option>
                              <option value="FRIDAY">Thứ 6</option>
                              <option value="SATURDAY">Thứ 7</option>
                            </select>
                            <select
                              className="form-select"
                              value={rescheduleForm.newTimeSlot}
                              onChange={e => setRescheduleForm({
                                ...rescheduleForm,
                                newTimeSlot: e.target.value
                              })}
                            >
                              <option value="CA1">Ca 1 (06:45-09:15)</option>
                              <option value="CA2">Ca 2 (09:25-11:55)</option>
                              <option value="CA3">Ca 3 (12:10-14:40)</option>
                              <option value="CA4">Ca 4 (14:50-17:20)</option>
                              <option value="CA5">Ca 5 (17:30-20:00)</option>
                            </select>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Phòng"
                              value={rescheduleForm.newRoom}
                              onChange={e => setRescheduleForm({
                                ...rescheduleForm,
                                newRoom: e.target.value
                              })}
                            />
                          </div>
                        ) : (
                          // VIEW MODE
                          <div className="schedule-cell">
                            <div className="date">{formatDate(session.effectiveDate)}</div>
                            <div className="time">
                              {session.effectiveDayOfWeekDisplay}, {session.effectiveTimeSlotDisplay}
                            </div>
                            <div className="room">📍 {session.effectiveRoom}</div>
                          </div>
                        )}
                      </td>
                      
                      <td>
                        {editingSession === session.sessionId ? (
                          <textarea
                            className="form-textarea"
                            placeholder="Nhập lý do đổi lịch (bắt buộc)"
                            value={rescheduleForm.reason}
                            onChange={e => setRescheduleForm({
                              ...rescheduleForm,
                              reason: e.target.value
                            })}
                            rows={2}
                          />
                        ) : (
                          <div className="reason-text">
                            {session.rescheduleReason || '—'}
                          </div>
                        )}
                      </td>
                      
                      <td>
                        {editingSession === session.sessionId ? (
                          // EDIT MODE ACTIONS
                          <div className="action-buttons">
                            <button
                              className="btn-save"
                              onClick={() => handleReschedule(session.sessionId)}
                            >
                              💾 Lưu
                            </button>
                            <button
                              className="btn-cancel"
                              onClick={handleCancelEdit}
                            >
                              ✖️ Hủy
                            </button>
                          </div>
                        ) : (
                          // VIEW MODE ACTIONS
                          <div className="action-buttons">
                            <button
                              className="btn-edit"
                              onClick={() => handleStartEdit(session)}
                            >
                              🔄 Đổi lịch
                            </button>
                            {session.isRescheduled && (
                              <button
                                className="btn-reset"
                                onClick={() => handleResetToOriginal(session.sessionId)}
                              >
                                ↩️ Reset
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="sessions-summary">
                <div className="summary-item">
                  <strong>Tổng số buổi:</strong> {sessions.length}
                </div>
                <div className="summary-item">
                  <strong>Đã đổi lịch:</strong> {sessions.filter(s => s.isRescheduled).length}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* FOOTER */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionListModal;