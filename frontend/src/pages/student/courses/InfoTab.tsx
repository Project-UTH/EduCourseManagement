import React from 'react';
// Đảm bảo import file CSS (hoặc để ClassDetail import cũng được, nhưng import ở đây cho chắc chắn)
import './ClassDetail.css';

/**
 * InfoTab - Hiển thị thông tin chi tiết lớp học và tiêu chí đánh giá
 * Style: Được định nghĩa trong ClassDetail.css (.info-tab, .info-section, .grading-table...)
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
  };
}

const InfoTab = ({ classInfo }: InfoTabProps) => {
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
            <span className="info-value">
              {classInfo.enrolledCount} / {classInfo.maxStudents} sinh viên
            </span>
          </div>
        </div>
      </div>

      {/* 2. Phần tiêu chí đánh giá (Điểm thành phần) */}
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
      
      {/* 3. Phần thông tin liên hệ (Optional) */}
      <div className="info-section">
        <h3>📞 Liên hệ giảng viên</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
          Sinh viên có thắc mắc về bài giảng hoặc điểm số vui lòng liên hệ trực tiếp giảng viên qua email hoặc gặp mặt vào giờ hành chính tại văn phòng khoa.
        </p>
      </div>

    </div>
  );
};

export default InfoTab;