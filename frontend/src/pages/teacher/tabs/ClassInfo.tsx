import React from 'react';
import EnrolledStudentsList from './EnrolledStudentsList';
import './TabComponents.css';

/**
 * ClassInfo Tab
 * 
 * Features:
 * - Display class information
 * - Subject details
 * - Schedule info
 * - Teacher info
 * - Enrolled students list (NEW)
 */

interface Props {
  classDetail: {
    classId: number;
    classCode: string;
    subjectName: string;
    subjectCode: string;
    credits: number;
    dayOfWeekDisplay: string;
    timeSlotDisplay: string;
    room: string;
    teacherName: string;
    studentCount: number;
    maxStudents: number;
    semesterCode: string;
  };
}

const ClassInfo: React.FC<Props> = ({ classDetail }) => {
  return (
    <div className="tab-info">
      <div className="tab-header">
        <h2>ℹ️ Thông tin lớp học</h2>
      </div>

      <div className="info-sections">
        {/* Subject Information */}
        <div className="info-section">
          <h3>📚 Thông tin môn học</h3>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Tên môn học:</span>
              <span className="info-value">{classDetail.subjectName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Mã môn học:</span>
              <span className="info-value">{classDetail.subjectCode}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Số tín chỉ:</span>
              <span className="info-value">{classDetail.credits}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Học kỳ:</span>
              <span className="info-value">{classDetail.semesterCode}</span>
            </div>
          </div>
        </div>

        {/* Class Information */}
        <div className="info-section">
          <h3>🏫 Thông tin lớp</h3>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Mã lớp:</span>
              <span className="info-value">{classDetail.classCode}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Giảng viên:</span>
              <span className="info-value">{classDetail.teacherName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Sĩ số:</span>
              <span className="info-value">
                {classDetail.studentCount}/{classDetail.maxStudents} sinh viên
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Tỷ lệ lấp đầy:</span>
              <span className="info-value">
                {Math.round((classDetail.studentCount / classDetail.maxStudents) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Schedule Information */}
        <div className="info-section">
          <h3>📅 Lịch học</h3>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Thời gian:</span>
              <span className="info-value">
                {classDetail.dayOfWeekDisplay}, {classDetail.timeSlotDisplay}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Phòng học:</span>
              <span className="info-value">{classDetail.room}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ✅ NEW: ENROLLED STUDENTS LIST ==================== */}
      <div className="class-students-section">
        <EnrolledStudentsList 
          classId={classDetail.classId} 
          enrolledCount={classDetail.studentCount} 
        />
      </div>
    </div>
  );
};

export default ClassInfo;