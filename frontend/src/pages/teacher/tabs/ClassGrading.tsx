import { useNavigate } from 'react-router-dom';

/**
 * ClassGrading Tab
 * 
 * Features:
 * - Quick link to grading page
 * - Quick link to statistics page
 */

interface Props {
  classId: number;
}

const ClassGrading: React.FC<Props> = () => {
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
        <h2> Quản lý điểm</h2>
      </div>

      <div className="quick-actions-grid">
        <div className="action-card" onClick={handleGoToGrading}>
          <div className="action-content">
            <h3>Nhập điểm</h3>
            <p>Nhập điểm TX, GK, CK cho sinh viên</p>
          </div>
          <div className="action-arrow">→</div>
        </div>

        <div className="action-card" onClick={handleGoToStatistics}>
          <div className="action-content">
            <h3>Thống kê điểm</h3>
            <p>Xem phân tích và thống kê kết quả</p>
          </div>
          <div className="action-arrow">→</div>
        </div>
      </div>
    </div>
  );
};

export default ClassGrading;