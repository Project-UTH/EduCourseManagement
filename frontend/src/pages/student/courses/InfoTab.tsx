import React from 'react';
import './ClassDetail.css';

/**
 * InfoTab - Hiển thị thông tin chi tiết lớp học và tiêu chí đánh giá
 * ⭐ NEW: Added description section
 */

interface InfoTabProps {
  classInfo: {
    classId: number;
    classCode: string;
    subjectName: string;
    teacherName: string;
    schedule: string;
    room: string;
    semesterName: string;
    credits: number;
    maxStudents: number;
    enrolledCount: number;
    description?: string; // ⭐ NEW: Mô tả môn học
  };
}

const InfoTab = ({ classInfo }: InfoTabProps) => {
  console.log('📊 [InfoTab] Received classInfo:', classInfo);
  console.log('📊 [InfoTab] Sĩ số:', classInfo.enrolledCount, '/', classInfo.maxStudents);

  return (
    <div className="info-tab">
      {/* 1. Phần thông tin chung */}
      <div className="info-section">
        <h3>ℹ️ Thông tin lớp học</h3>
        
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Mã lớp</span>
            <span className="info-value">{classInfo.classCode}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Môn học</span>
            <span className="info-value">{classInfo.subjectName}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Số tín chỉ</span>
            <span className="info-value">{classInfo.credits} TC</span>
          </div>

          <div className="info-item">
            <span className="info-label">Học kỳ</span>
            <span className="info-value">{classInfo.semesterName}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Giảng viên</span>
            <span className="info-value">{classInfo.teacherName}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Lịch học</span>
            <span className="info-value">{classInfo.schedule}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Phòng học</span>
            <span className="info-value">{classInfo.room}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Sĩ số lớp</span>
            <span className="info-value" style={{ fontWeight: 600 }}>
              {classInfo.enrolledCount} / {classInfo.maxStudents} sinh viên
              {classInfo.enrolledCount > 0 && (
                <span style={{ 
                  marginLeft: '8px', 
                  fontSize: '12px', 
                  color: '#059669',
                  fontWeight: 400
                }}>
                  ({Math.round((classInfo.enrolledCount / classInfo.maxStudents) * 100)}% đã đăng ký)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ⭐ NEW: 2. Phần mô tả môn học */}
      {classInfo.description && (
        <div className="info-section">
          <h3>📝 Mô tả môn học</h3>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            lineHeight: '1.8',
            color: '#334155',
            fontSize: '0.95rem',
            whiteSpace: 'pre-wrap', // Giữ nguyên xuống dòng
            wordWrap: 'break-word'
          }}>
            {classInfo.description}
          </div>
        </div>
      )}

      {/* 3. Phần tiêu chí đánh giá (Điểm thành phần) */}
      <div className="info-section">
        <h3>📊 Tiêu chí đánh giá</h3>
        <div className="grading-table">
          <table>
            <thead>
              <tr>
                <th>Thành phần điểm</th>
                <th>Trọng số</th>
                <th>Mô tả / Yêu cầu</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="type-badge regular">Thường xuyên</span>
                </td>
                <td className="score">20%</td>
                <td>Điểm danh, bài tập về nhà, tham gia xây dựng bài.</td>
              </tr>
              <tr>
                <td>
                  <span className="type-badge midterm">Giữa kỳ</span>
                </td>
                <td className="score">30%</td>
                <td>Bài kiểm tra tập trung hoặc bài tập lớn giữa kỳ.</td>
              </tr>
              <tr>
                <td>
                  <span className="type-badge final">Cuối kỳ</span>
                </td>
                <td className="score">50%</td>
                <td>Thi kết thúc học phần (Tự luận/Trắc nghiệm/Vấn đáp).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 4. Phần thông tin liên hệ */}
      <div className="info-section">
        <h3>📞 Liên hệ giảng viên</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
          Sinh viên có thắc mắc về bài giảng hoặc điểm số vui lòng liên hệ trực tiếp giảng viên <strong>{classInfo.teacherName}</strong> qua email hoặc gặp mặt vào giờ hành chính tại văn phòng khoa.
        </p>
      </div>

      {/* 5. Thống kê lớp học */}
      {classInfo.enrolledCount > 0 && (
        <div className="info-section">
          <h3>📈 Thống kê</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <div className="stat-value">{classInfo.enrolledCount}</div>
                <div className="stat-label">Sinh viên đã đăng ký</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🪑</div>
              <div className="stat-info">
                <div className="stat-value">{classInfo.maxStudents - classInfo.enrolledCount}</div>
                <div className="stat-label">Chỗ còn lại</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <div className="stat-value">
                  {Math.round((classInfo.enrolledCount / classInfo.maxStudents) * 100)}%
                </div>
                <div className="stat-label">Tỷ lệ lấp đầy</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoTab;