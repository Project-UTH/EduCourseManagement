import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import registrationApi, { RegistrationResponse } from '../../services/api/registrationApi';
import './MyRegistrations.css';

const MyRegistrations: React.FC = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<RegistrationResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch registrations
  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await registrationApi.getMyRegistrations();
      
      if (response.data.success) {
        const allRegs = response.data.data || [];
        
        // ✅ Filter: Only UPCOMING and ACTIVE semesters
        const filteredRegs = allRegs.filter((reg: RegistrationResponse) => {
          // Only show REGISTERED status
          if (reg.status !== 'REGISTERED') {
            return false;
          }
          
          // Check semester status
          if (reg.semesterStatus) {
            return reg.semesterStatus === 'UPCOMING' || reg.semesterStatus === 'ACTIVE';
          }
          
          return true; // Show if no status info
        });
        
        console.log(`📚 Total: ${allRegs.length}, Filtered (UPCOMING/ACTIVE): ${filteredRegs.length}`);
        setRegistrations(filteredRegs);
      }
    } catch (error) {
      console.error('❌ Error fetching registrations:', error);
      alert('Không thể tải danh sách đăng ký!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // ✅ Handle drop - Only for UPCOMING semesters
  const handleDrop = async (reg: RegistrationResponse) => {
    const canDrop = !reg.semesterStatus || reg.semesterStatus === 'UPCOMING';
    
    if (!canDrop) {
      alert('⚠️ Không thể hủy đăng ký lớp đang học (học kỳ đã bắt đầu)!\n\nChỉ có thể hủy đăng ký lớp của học kỳ chưa bắt đầu.');
      return;
    }
    
    if (!window.confirm(
      `Bạn có chắc muốn hủy đăng ký?\n\n` +
      `Môn học: ${reg.subjectName}\n` +
      `Mã lớp: ${reg.classCode}\n` +
      `Học kỳ: ${reg.semesterName}`
    )) {
      return;
    }

    try {
      const response = await registrationApi.dropClass(reg.registrationId);
      
      if (response.data.success) {
        alert('✅ Hủy đăng ký thành công!');
        fetchRegistrations(); // Reload list
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Hủy đăng ký thất bại!';
      alert('❌ ' + errorMsg);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get semester status badge
  const getSemesterStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const badges: Record<string, { text: string; className: string; icon: string }> = {
      'UPCOMING': { text: 'Sắp diễn ra', className: 'upcoming', icon: '⏰' },
      'ACTIVE': { text: 'Đang học', className: 'active', icon: '📚' }
    };
    
    const badge = badges[status] || { text: status, className: 'default', icon: '📋' };
    
    return (
      <span className={`semester-badge ${badge.className}`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  return (
    <div className="my-registrations-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button onClick={() => navigate('/student/subjects')} className="btn-back">
            ← Quay lại đăng ký học phần
          </button>
          <div>
            <h1>📚 Lớp Học Đã Đăng Ký</h1>
            <p>Quản lý các lớp học đã đăng ký</p>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={fetchRegistrations} className="btn-refresh">
            🔄 Làm mới
          </button>
          <button onClick={() => navigate('/student/subjects')} className="btn-primary">
            ➕ Đăng ký thêm
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && registrations.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa có lớp học nào</h3>
          <p>Không có lớp học nào trong kỳ sắp tới hoặc đang diễn ra</p>
          <button onClick={() => navigate('/student/subjects')} className="btn-primary">
            🔍 Tìm kiếm lớp học
          </button>
        </div>
      )}

      {/* Registrations Grid */}
      {!loading && registrations.length > 0 && (
        <>
          <div className="registrations-grid">
            {registrations.map((reg) => {
              // Check if can drop (only UPCOMING)
              const canDrop = !reg.semesterStatus || reg.semesterStatus === 'UPCOMING';
              
              return (
                <div key={reg.registrationId} className="registration-card">
                  {/* Header */}
                  <div className="card-header">
                    <h3>{reg.subjectName}</h3>
                    <div className="badges">
                      {getSemesterStatusBadge(reg.semesterStatus)}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="card-body">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Mã lớp:</span>
                        <span className="value">{reg.classCode}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Mã môn:</span>
                        <span className="value">{reg.subjectCode}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Tín chỉ:</span>
                        <span className="value">{reg.credits} TC</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Giảng viên:</span>
                        <span className="value">{reg.teacherName}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Lịch học:</span>
                        <span className="value">
                          {reg.dayOfWeekDisplay}, {reg.timeSlotDisplay}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Phòng:</span>
                        <span className="value">{reg.room}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Học kỳ:</span>
                        <span className="value">{reg.semesterName}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Đăng ký lúc:</span>
                        <span className="value">{formatDate(reg.registeredAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="card-footer">
                    {canDrop ? (
                      <button
                        onClick={() => handleDrop(reg)}
                        className="btn-drop"
                      >
                        ❌ Hủy đăng ký
                      </button>
                    ) : (
                      <div className="drop-disabled">
                        <span className="lock-icon">🔒</span>
                        <span>Không thể hủy lớp đang học</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="summary-section">
            <h3>📊 Thống kê</h3>
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon">📚</div>
                <div className="summary-content">
                  <div className="summary-label">Tổng số lớp</div>
                  <div className="summary-value">{registrations.length}</div>
                </div>
              </div>
              
              <div className="summary-card upcoming">
                <div className="summary-icon">⏰</div>
                <div className="summary-content">
                  <div className="summary-label">Sắp diễn ra</div>
                  <div className="summary-value">
                    {registrations.filter(r => r.semesterStatus === 'UPCOMING').length}
                  </div>
                </div>
              </div>
              
              <div className="summary-card active">
                <div className="summary-icon">🎓</div>
                <div className="summary-content">
                  <div className="summary-label">Đang học</div>
                  <div className="summary-value">
                    {registrations.filter(r => r.semesterStatus === 'ACTIVE').length}
                  </div>
                </div>
              </div>
              
              <div className="summary-card credits">
                <div className="summary-icon">📖</div>
                <div className="summary-content">
                  <div className="summary-label">Tổng tín chỉ</div>
                  <div className="summary-value">
                    {registrations.reduce((sum, r) => sum + r.credits, 0)} TC
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MyRegistrations;