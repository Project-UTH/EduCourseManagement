import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ClassAssignments Tab
 * 
 * Features:
 * - List of assignments for this class
 * - Create new assignment button
 * - View submissions button
 * - Quick stats (total, pending grading)
 */

interface Props {
  classId: number;
}

const ClassAssignments: React.FC<Props> = ({ classId }) => {
  const navigate = useNavigate();

  const handleCreateAssignment = () => {
    navigate('/teacher/assignments', { state: { classId } });
  };

  const handleViewSubmissions = () => {
    navigate('/teacher/submissions');
  };

  return (
    <div className="tab-assignments">
      <div className="tab-header">
        <h2>📝 Quản lý bài tập</h2>
      </div>

      <div className="quick-actions-grid">
        <div className="action-card" onClick={handleCreateAssignment}>
          <div className="action-icon">📝</div>
          <div className="action-content">
            <h3>Quản lý bài tập</h3>
            <p>Tạo, sửa, xóa bài tập của lớp</p>
          </div>
          <div className="action-arrow">→</div>
        </div>

        <div className="action-card" onClick={handleViewSubmissions}>
          <div className="action-icon">📥</div>
          <div className="action-content">
            <h3>Bài nộp của sinh viên</h3>
            <p>Xem và quản lý bài nộp</p>
          </div>
          <div className="action-arrow">→</div>
        </div>
      </div>

      <div className="info-box">
        <p>💡 <strong>Tip:</strong> Quản lý bài tập và xem bài nộp từ các trang chuyên dụng.</p>
      </div>
    </div>
  );
};

export default ClassAssignments;