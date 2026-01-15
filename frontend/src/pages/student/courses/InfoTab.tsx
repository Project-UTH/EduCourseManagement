/**
 * InfoTab - Tab thông tin trong ClassDetail
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
      {/* Class Information */}
      <div className="info-section">
        <h3>Thông tin lớp học</h3>
        
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Mã lớp</span>
            <span className="info-value">{classInfo.classCode}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Tên môn học</span>
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
            <span className="info-value">Phòng {classInfo.room}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Sĩ số</span>
            <span className="info-value">
              {classInfo.enrolledCount}/{classInfo.maxStudents} sinh viên
            </span>
          </div>
        </div>
      </div>

      {/* Course Description */}
      <div className="info-section">
        <h3>Mô tả môn học</h3>
        <p className="description">
          Môn học cung cấp kiến thức nền tảng và kỹ năng thực hành về lập trình web,
          bao gồm HTML, CSS, JavaScript và các framework hiện đại. Sinh viên sẽ học
          cách xây dựng website responsive, tương tác và tối ưu hiệu năng.
        </p>
      </div>

      {/* Learning Outcomes */}
      <div className="info-section">
        <h3>Mục tiêu học tập</h3>
        <ul className="outcomes-list">
          <li>Hiểu và áp dụng các nguyên lý cơ bản của lập trình web</li>
          <li>Xây dựng website responsive sử dụng HTML5, CSS3</li>
          <li>Lập trình tương tác với JavaScript và DOM</li>
          <li>Làm việc với các framework và thư viện hiện đại</li>
          <li>Tối ưu hiệu năng và trải nghiệm người dùng</li>
        </ul>
      </div>

      {/* Grading Criteria */}
      <div className="info-section">
        <h3>Tiêu chí đánh giá</h3>
        <div className="grading-table">
          <table>
            <thead>
              <tr>
                <th>Thành phần</th>
                <th>Trọng số</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Chuyên cần</td>
                <td>10%</td>
                <td>Đi học đầy đủ, tham gia thảo luận</td>
              </tr>
              <tr>
                <td>Bài tập</td>
                <td>20%</td>
                <td>Bài tập hàng tuần</td>
              </tr>
              <tr>
                <td>Giữa kỳ</td>
                <td>30%</td>
                <td>Bài kiểm tra giữa kỳ</td>
              </tr>
              <tr>
                <td>Cuối kỳ</td>
                <td>40%</td>
                <td>Bài kiểm tra cuối kỳ / Đồ án</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Contact */}
      <div className="info-section">
        <h3>Liên hệ</h3>
        <div className="contact-info">
          <div className="contact-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Email: {classInfo.teacherName.toLowerCase().replace(/\s+/g, '.')}@uth.edu.vn</span>
          </div>
          
          <div className="contact-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Điện thoại: 028-3895-xxxx</span>
          </div>
          
          <div className="contact-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Giờ làm việc: Thứ 2 - Thứ 6, 8:00 - 17:00</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoTab;