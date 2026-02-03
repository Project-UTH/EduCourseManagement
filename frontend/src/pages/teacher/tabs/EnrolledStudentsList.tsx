// ==================== FILE: frontend/src/pages/teacher/tabs/EnrolledStudentsList.tsx ====================

import React, { useState, useEffect } from 'react';
import teacherApi, { StudentEnrollmentDto } from '../../../services/api/teacherApi';
import './EnrolledStudentsList.css';

interface EnrolledStudentsListProps {
  classId: number;
  enrolledCount: number;
}

const EnrolledStudentsList: React.FC<EnrolledStudentsListProps> = ({ 
  classId, 
  enrolledCount 
}) => {
  const [students, setStudents] = useState<StudentEnrollmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStudents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teacherApi.getEnrolledStudents(classId);
      setStudents(data);
    }  catch (err: unknown) {
  console.error(err);

  if (err instanceof Error) {
    setError(err.message || 'Không thể tải danh sách tài liệu');
  } else {
    setError('Không thể tải danh sách tài liệu');
  }
}

     finally {
      setLoading(false);
    }
  };

  // Filter students by search term
  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentCode.includes(searchTerm) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get gender display
  const getGenderDisplay = (gender: string) => {
    return gender === 'MALE' ? 'Nam' : 'Nữ';
  };

  if (loading) {
    return (
      <div className="enrolled-students-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải danh sách sinh viên...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enrolled-students-error">
        <p> {error}</p>
        <button onClick={loadStudents} className="btn-retry">
           Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="enrolled-students-container">
      <div className="students-header">
        <h3> Danh sách sinh viên ({students.length}/{enrolledCount})</h3>
        
        <div className="search-box">
          <input
            type="text"
            placeholder=" Tìm theo tên, MSSV, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {students.length === 0 ? (
        <div className="no-students">
          <p>📭 Chưa có sinh viên nào đăng ký lớp này</p>
        </div>
      ) : (
        <>
          <div className="students-stats">
            <span>Hiển thị: <strong>{filteredStudents.length}</strong> / {students.length} sinh viên</span>
          </div>

          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>MSSV</th>
                  <th>Họ và tên</th>
                  <th>Giới tính</th>
                  <th>Chuyên ngành</th>
                  <th>Khóa học</th>
                  <th>Email</th>
                  <th>Điện thoại</th>
                  <th>Ngày ĐK</th>
                  <th>Điểm TB</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student.studentId}>
                    <td className="text-center">{index + 1}</td>
                    <td className="student-code">{student.studentCode}</td>
                    <td className="student-name">
                      <strong>{student.fullName}</strong>
                    </td>
                    <td className="text-center">{getGenderDisplay(student.gender)}</td>
                    <td>
                      <div className="major-info">
                        <span className="major-code">{student.majorCode}</span>
                        <span className="major-name">{student.majorName}</span>
                      </div>
                    </td>
                    <td className="text-center">{student.academicYear}</td>
                    <td className="email">{student.email || '-'}</td>
                    <td className="phone">{student.phone || '-'}</td>
                    <td className="text-center">
                      {formatDate(student.registrationDate)}
                    </td>
                    <td className="text-center">
                      {student.totalScore != null ? (
                        <span className={`score ${student.gradeStatus?.toLowerCase()}`}>
                          {student.totalScore.toFixed(2)}
                          {student.letterGrade && (
                            <span className="letter-grade"> ({student.letterGrade})</span>
                          )}
                        </span>
                      ) : (
                        <span className="no-score">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default EnrolledStudentsList;