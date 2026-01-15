import { useNavigate } from 'react-router-dom';

/**
 * ClassGrading Tab
 * 
 * Features:
 * - Quick link to grading page
 * - Quick link to statistics page
 * - Overview of grading progress
 */

interface Props {
  classId: number;
}

const ClassGrading: React.FC<Props> = ({ classId }) => {
  const navigate = useNavigate();

  const handleGoToGrading = () => {
    navigate('/teacher/grading');
  };

  const handleGoToStatistics = () => {
    navigate('/teacher/grade-statistics');
  };

  return (
    <div className="tab-grading">
      <div className="tab-header">
        <h2>📊 Quản lý điểm</h2>
      </div>

      <div className="quick-actions-grid">
        <div className="action-card" onClick={handleGoToGrading}>
          <div className="action-icon">✏️</div>
          <div className="action-content">
            <h3>Nhập điểm</h3>
            <p>Nhập điểm TX, GK, CK cho sinh viên</p>
          </div>
          <div className="action-arrow">→</div>
        </div>

        <div className="action-card" onClick={handleGoToStatistics}>
          <div className="action-icon">📈</div>
          <div className="action-content">
            <h3>Thống kê điểm</h3>
            <p>Xem phân tích và thống kê kết quả</p>
          </div>
          <div className="action-arrow">→</div>
        </div>
      </div>

      <div className="grading-overview">
        <h3>📋 Tổng quan</h3>
        <div className="overview-stats">
          <div className="overview-stat">
            <span className="stat-label">Tổng sinh viên:</span>
            <span className="stat-value">40</span>
          </div>
          <div className="overview-stat">
            <span className="stat-label">Đã chấm điểm:</span>
            <span className="stat-value">0</span>
          </div>
          <div className="overview-stat">
            <span className="stat-label">Chưa chấm:</span>
            <span className="stat-value">40</span>
          </div>
          <div className="overview-stat">
            <span className="stat-label">Điểm trung bình:</span>
            <span className="stat-value">--</span>
          </div>
        </div>
      </div>

      <div className="info-box">
        <p>💡 <strong>Công thức:</strong> Tổng = TX×30% + GK×30% + CK×40%</p>
      </div>
    </div>
  );
};

export default ClassGrading;