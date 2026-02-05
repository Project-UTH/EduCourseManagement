import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import studentClassApi, { StudentClassResponse } from '../../../services/api/studentClassApi';
import './MyClasses.css';

/**
 * MyClasses Component - Student Dashboard
 * 
 * Displays enrolled classes (only ACTIVE semester)
 * Features:
 * - View class cards with schedule, teacher, room info
 * - Quick actions: View homework, View materials, View grades
 * - Refresh button
 * - Statistics: Total classes, total credits
 */

const MyClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<StudentClassResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await studentClassApi.getMyClasses();
      
      // Filter only ACTIVE classes
      const activeClasses = data.filter(c => c.status === 'ACTIVE');
      setClasses(activeClasses);
      
      console.log('[MyClasses] Loaded classes:', activeClasses.length);
    } catch (err: unknown) {
      console.error('[MyClasses] Failed to load classes:', err);
      setError('Không thể tải danh sách lớp học. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleViewClass = (classId: number) => {
    navigate(`/student/classes/${classId}`);
  };

  const calculateStats = () => {
    const totalClasses = classes.length;
    const totalCredits = classes.reduce((sum, c) => sum + c.credits, 0);
    
    return { totalClasses, totalCredits };
  };

  const formatSchedule = (cls: StudentClassResponse) => {
    return cls.schedule || 'Chưa có lịch';
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="my-classes-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải danh sách lớp học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-classes-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Lớp Học Đã Đăng Ký</h1>
          <p>Danh sách lớp học bạn đang tham gia trong học kỳ hiện tại</p>
        </div>
        <button className="btn-refresh" onClick={loadClasses} disabled={loading}>
          Làm mới
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* Statistics */}
      {classes.length > 0 && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Tổng số lớp</div>
              <div className="stat-value">{stats.totalClasses}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Đang học</div>
              <div className="stat-value">{stats.totalClasses}</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-info">
              <div className="stat-label">Tổng tín chỉ</div>
              <div className="stat-value">{stats.totalCredits} TC</div>
            </div>
          </div>
        </div>
      )}

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="empty-state">
          <h3>Chưa có lớp học nào</h3>
          <p>Bạn chưa đăng ký lớp học nào trong học kỳ này.</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/student/subjects')}
          >
            Đăng ký học phần
          </button>
        </div>
      ) : (
        <div className="classes-grid">
          {classes.map((cls) => (
            <div key={cls.classId} className="class-card">
              {/* Card Header */}
              <div className="card-header">
                <h3 className="class-name">{cls.className}</h3>
                <span className="class-status status-active">Đang học</span>
              </div>

              {/* Class Info */}
              <div className="class-info">
                <div className="info-row">
                  <span className="info-label">Mã lớp:</span>
                  <span className="info-value">{cls.classCode}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Mã môn:</span>
                  <span className="info-value">{cls.subjectCode}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Tín chỉ:</span>
                  <span className="info-value">{cls.credits} TC</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Giảng viên:</span>
                  <span className="info-value">{cls.teacherName}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Lịch học:</span>
                  <span className="info-value">{formatSchedule(cls)}</span>
                </div>

                {cls.roomName && (
                  <div className="info-row">
                    <span className="info-label">Phòng:</span>
                    <span className="info-value">{cls.roomName}</span>
                  </div>
                )}

                <div className="info-row">
                  <span className="info-label">Học kỳ:</span>
                  <span className="info-value">{cls.academicYear}</span>
                </div>

                {cls.registrationDate && (
                  <div className="info-row">
                    <span className="info-label">Đăng ký lúc:</span>
                    <span className="info-value">
                      {new Date(cls.registrationDate).toLocaleString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="card-actions">
                <button
                  className="btn-view"
                  onClick={() => handleViewClass(cls.classId)}
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClasses;