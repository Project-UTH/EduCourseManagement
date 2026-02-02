import React, { useState, useEffect } from 'react';
import './SessionListModal.css'; // File CSS độc lập

interface Session {
  sessionId: number;
  sessionNumber: number;
  sessionType: string;  // "IN_PERSON" or "E_LEARNING"
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
  
  // Filter
  const [filterType, setFilterType] = useState<string>('ALL'); // ALL, IN_PERSON, E_LEARNING
  
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
        `/api/admin/sessions/class/${classData.classId}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (!response.ok) throw new Error('Không thể tải lịch học');
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
    if (session.sessionType === 'E_LEARNING') {
      alert(' Không thể đổi lịch cho buổi E-learning!');
      return;
    }
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
    setRescheduleForm({ newDate: '', newDayOfWeek: 'MONDAY', newTimeSlot: 'CA1', newRoom: '', reason: '' });
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
        throw new Error(error.message || 'Lỗi đổi lịch');
      }
      alert(' Đổi lịch thành công!');
      handleCancelEdit();
      fetchSessions();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(` Lỗi: ${err.message}`);
    }
  };
  
  const handleResetToOriginal = async (sessionId: number) => {
    if (!window.confirm('Hủy đổi lịch và quay về lịch gốc?')) return;
    try {
      const response = await fetch(
        `/api/admin/sessions/${sessionId}/reset`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      if (!response.ok) throw new Error('Lỗi reset');
      alert(' Đã reset về lịch gốc!');
      fetchSessions();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(` Lỗi: ${err.message}`);
    }
  };
  
  // Helpers
  const getDayOfWeekEnum = (display: string): string => {
    const map: Record<string, string> = {
      'Thứ 2': 'MONDAY', 'Thứ 3': 'TUESDAY', 'Thứ 4': 'WEDNESDAY',
      'Thứ 5': 'THURSDAY', 'Thứ 6': 'FRIDAY', 'Thứ 7': 'SATURDAY', 'Chủ nhật': 'SUNDAY'
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
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };
  
  const getSessionTypeBadge = (type: string) => {
    if (type === 'IN_PERSON') return <span className="slm-badge badge-inperson"> Trực tiếp</span>;
    return <span className="slm-badge badge-elearning"> E-learning</span>;
  };
  
  const filteredSessions = sessions.filter(session => {
    if (filterType === 'ALL') return true;
    return session.sessionType === filterType;
  });
  
  const stats = {
    total: sessions.length,
    inPerson: sessions.filter(s => s.sessionType === 'IN_PERSON').length,
    eLearning: sessions.filter(s => s.sessionType === 'E_LEARNING').length,
    rescheduled: sessions.filter(s => s.isRescheduled).length,
  };
  
  return (
    <div className="session-list-wrapper slm-overlay" onClick={onClose}>
      <div className="slm-modal" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="slm-header">
          <div>
            <h2 className="slm-title"> Quản lý Lịch học - {classData.classCode}</h2>
            <p className="slm-subtitle">{classData.subjectName} • {classData.semesterCode}</p>
          </div>
          <button className="slm-close" onClick={onClose}>&times;</button>
        </div>
        
        {/* BODY */}
        <div className="slm-body">
          {loading ? (
            <div className="slm-loading"> Đang tải dữ liệu lịch học...</div>
          ) : error ? (
            <div className="slm-no-data" style={{color: 'red'}}>❌ {error}</div>
          ) : (
            <>
              {/* CONTROLS */}
              <div className="slm-controls">
                <div className="slm-stats">
                  <div className="slm-stat-item">
                    <span>Tổng:</span> <span className="slm-stat-val">{stats.total}</span>
                  </div>
                  <div className="slm-stat-item">
                    <span>Trực tiếp:</span> <span className="slm-stat-val">{stats.inPerson}</span>
                  </div>
                  <div className="slm-stat-item">
                    <span>Online:</span> <span className="slm-stat-val">{stats.eLearning}</span>
                  </div>
                  <div className="slm-stat-item">
                    <span>Đổi lịch:</span> <span className="slm-stat-val" style={{color:'#d97706'}}>{stats.rescheduled}</span>
                  </div>
                </div>
                
                <div className="slm-filter">
                  <label style={{fontSize:'13px', fontWeight:600}}>Lọc:</label>
                  <select 
                    className="slm-select"
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="ALL">Tất cả</option>
                    <option value="IN_PERSON">Trực tiếp</option>
                    <option value="E_LEARNING">E-learning</option>
                  </select>
                </div>
              </div>
              
              {/* TABLE */}
              <div className="slm-table-container">
                <table className="slm-table">
                  <thead>
                    <tr>
                      <th style={{width: '10%'}}>Buổi</th>
                      <th style={{width: '12%'}}>Loại hình</th>
                      <th style={{width: '20%'}}>Lịch gốc</th>
                      <th style={{width: '25%'}}>Lịch thực tế</th>
                      <th style={{width: '20%'}}>Lý do thay đổi</th>
                      <th style={{width: '13%', textAlign: 'center'}}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="slm-no-data">Không có dữ liệu buổi học</td>
                      </tr>
                    ) : (
                      filteredSessions.map(session => (
                        <tr 
                          key={session.sessionId}
                          className={`
                            ${session.isRescheduled ? 'slm-row-rescheduled' : ''}
                            ${session.sessionType === 'E_LEARNING' ? 'slm-row-elearning' : ''}
                          `}
                        >
                          {/* 1. BUỔI */}
                          <td>
                            <div className="slm-cell-content">
                              <span style={{fontWeight: 700}}>#{session.sessionNumber}</span>
                              {session.isRescheduled && (
                                <span className="slm-badge badge-rescheduled">Đã đổi</span>
                              )}
                            </div>
                          </td>
                          
                          {/* 2. LOẠI */}
                          <td>{getSessionTypeBadge(session.sessionType)}</td>
                          
                          {/* 3. LỊCH GỐC - FIX: Hiển thị đầy đủ cho E-learning */}
                          <td>
                            {session.sessionType === 'E_LEARNING' ? (
                              <div className="slm-cell-content">
                                <span className="slm-date">{formatDate(session.originalDate)}</span>
                                <span className="slm-time" style={{fontStyle:'italic'}}>
                                  {session.originalDayOfWeekDisplay}, {session.originalTimeSlotDisplay}
                                </span>
                                <span className="slm-room" style={{background:'#dbeafe', color:'#1e40af', padding:'2px 8px', borderRadius:'4px', fontSize:'12px'}}>
                                  ONLINE
                                </span>
                              </div>
                            ) : (
                              <div className="slm-cell-content">
                                <span className="slm-date">{formatDate(session.originalDate)}</span>
                                <span className="slm-time">{session.originalDayOfWeekDisplay}, {session.originalTimeSlotDisplay}</span>
                                <span className="slm-room">{session.originalRoom}</span>
                              </div>
                            )}
                          </td>
                          
                          {/* 4. LỊCH HIỆN TẠI - FIX: Hiển thị đầy đủ cho E-learning */}
                          <td>
                            {editingSession === session.sessionId ? (
                              <div className="slm-edit-form">
                                <input
                                  type="date"
                                  className="slm-edit-input"
                                  value={rescheduleForm.newDate}
                                  onChange={e => setRescheduleForm({...rescheduleForm, newDate: e.target.value})}
                                />
                                <div style={{display:'flex', gap:'4px'}}>
                                  <select
                                    className="slm-edit-select"
                                    value={rescheduleForm.newDayOfWeek}
                                    onChange={e => setRescheduleForm({...rescheduleForm, newDayOfWeek: e.target.value})}
                                  >
                                    <option value="MONDAY">T2</option>
                                    <option value="TUESDAY">T3</option>
                                    <option value="WEDNESDAY">T4</option>
                                    <option value="THURSDAY">T5</option>
                                    <option value="FRIDAY">T6</option>
                                    <option value="SATURDAY">T7</option>
                                  </select>
                                  <select
                                    className="slm-edit-select"
                                    value={rescheduleForm.newTimeSlot}
                                    onChange={e => setRescheduleForm({...rescheduleForm, newTimeSlot: e.target.value})}
                                  >
                                    <option value="CA1">Ca1</option>
                                    <option value="CA2">Ca2</option>
                                    <option value="CA3">Ca3</option>
                                    <option value="CA4">Ca4</option>
                                    <option value="CA5">Ca5</option>
                                  </select>
                                </div>
                                <input
                                  type="text"
                                  className="slm-edit-input"
                                  placeholder="Phòng mới"
                                  value={rescheduleForm.newRoom}
                                  onChange={e => setRescheduleForm({...rescheduleForm, newRoom: e.target.value})}
                                />
                              </div>
                            ) : (
                              session.sessionType === 'E_LEARNING' ? (
                                <div className="slm-cell-content">
                                  <span className="slm-date">{formatDate(session.effectiveDate)}</span>
                                  <span className="slm-time" style={{fontStyle:'italic'}}>
                                    {session.effectiveDayOfWeekDisplay}, {session.effectiveTimeSlotDisplay}
                                  </span>
                                  <span className="slm-room" style={{background:'#dbeafe', color:'#1e40af', padding:'2px 8px', borderRadius:'4px', fontSize:'12px'}}>
                                    ONLINE
                                  </span>
                                </div>
                              ) : (
                                <div className="slm-cell-content">
                                  <span className="slm-date">{formatDate(session.effectiveDate)}</span>
                                  <span className="slm-time">{session.effectiveDayOfWeekDisplay}, {session.effectiveTimeSlotDisplay}</span>
                                  <span className="slm-room">{session.effectiveRoom}</span>
                                </div>
                              )
                            )}
                          </td>
                          
                          {/* 5. LÝ DO */}
                          <td>
                            {editingSession === session.sessionId ? (
                              <textarea
                                className="slm-edit-textarea"
                                placeholder="Lý do..."
                                value={rescheduleForm.reason}
                                onChange={e => setRescheduleForm({...rescheduleForm, reason: e.target.value})}
                              />
                            ) : (
                              <span style={{fontSize:'13px', color: session.rescheduleReason ? '#b45309' : '#9ca3af', fontStyle: 'italic'}}>
                                {session.rescheduleReason || '—'}
                              </span>
                            )}
                          </td>
                          
                          {/* 6. THAO TÁC */}
                          <td style={{textAlign: 'center'}}>
                            {session.sessionType === 'IN_PERSON' && (
                              editingSession === session.sessionId ? (
                                <div className="slm-actions">
                                  <button className="slm-btn btn-save" onClick={() => handleReschedule(session.sessionId)}> Lưu</button>
                                  <button className="slm-btn btn-cancel" onClick={handleCancelEdit}> Hủy</button>
                                </div>
                              ) : (
                                <div className="slm-actions">
                                  <button 
                                    className="slm-btn btn-edit"
                                    onClick={() => handleStartEdit(session)}
                                    title="Đổi lịch buổi này"
                                  >
                                    Đổi
                                  </button>
                                  {session.isRescheduled && (
                                    <button 
                                      className="slm-btn btn-reset"
                                      onClick={() => handleResetToOriginal(session.sessionId)}
                                      title="Quay về lịch gốc"
                                    >
                                      Quay lại
                                    </button>
                                  )}
                                </div>
                              )
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        
        {/* FOOTER */}
        <div className="slm-footer">
          <button className="btn-close-footer" onClick={onClose}>Đóng</button>
        </div>
        
      </div>
    </div>
  );
};

export default SessionListModal;