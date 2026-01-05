import React, { useState, useEffect } from 'react';
import registrationApi, { RegistrationResponse } from '../../services/api/registrationApi';
import './MyRegistrations.css';

const MyRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<RegistrationResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch registrations
  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await registrationApi.getMyRegistrations();
      
      if (response.data.success) {
        setRegistrations(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      alert('Không thể tải danh sách đăng ký!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Handle drop
  const handleDrop = async (registrationId: number, subjectName: string) => {
    if (!window.confirm(`Bạn có chắc muốn hủy đăng ký lớp "${subjectName}"?`)) {
      return;
    }

    try {
      const response = await registrationApi.dropClass(registrationId);
      
      if (response.data.success) {
        alert('✅ Hủy đăng ký thành công!');
        fetchRegistrations(); // Reload
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
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="my-registrations-container">
      <div className="page-header">
        <h1>📚 Lớp Học Đã Đăng Ký</h1>
        <button onClick={fetchRegistrations} className="btn-refresh">
          🔄 Làm mới
        </button>
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : registrations.length === 0 ? (
        <div className="no-data">
          <p>Bạn chưa đăng ký lớp học nào!</p>
          <a href="/student/search" className="btn-primary">
            🔍 Tìm kiếm lớp học
          </a>
        </div>
      ) : (
        <div className="registrations-grid">
          {registrations.map((reg) => (
            <div key={reg.registrationId} className="registration-card">
              <div className="card-header">
                <h3>{reg.subjectName}</h3>
                <span className={`badge ${reg.status.toLowerCase()}`}>
                  {reg.status === 'REGISTERED' ? 'Đang học' : 
                   reg.status === 'DROPPED' ? 'Đã hủy' : reg.status}
                </span>
              </div>

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
                  {reg.droppedAt && (
                    <div className="info-item">
                      <span className="label">Hủy lúc:</span>
                      <span className="value dropped">{formatDate(reg.droppedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {reg.status === 'REGISTERED' && (
                <div className="card-footer">
                  <button
                    onClick={() => handleDrop(reg.registrationId, reg.subjectName)}
                    className="btn-drop"
                  >
                    ❌ Hủy đăng ký
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {registrations.length > 0 && (
        <div className="summary">
          <div className="summary-card">
            <span className="summary-label">Tổng số lớp:</span>
            <span className="summary-value">{registrations.length}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Đang học:</span>
            <span className="summary-value">
              {registrations.filter(r => r.status === 'REGISTERED').length}
            </span>
          </div>
          <div className="summary-card">
            <span className="summary-label">Tổng tín chỉ:</span>
            <span className="summary-value">
              {registrations
                .filter(r => r.status === 'REGISTERED')
                .reduce((sum, r) => sum + r.credits, 0)} TC
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;