import React, { useState, useEffect } from 'react';
import './StudentListModal.css';

interface Student {
  studentId: number;
  studentCode: string;
  fullName: string;
  email: string;
  phone?: string;
  majorId: number;
  majorCode: string;
  majorName: string;
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  academicYear: string;
}

interface EnrolledStudent {
  registrationId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  studentEmail: string;
  majorName: string;
  departmentName: string;
  registeredAt: string;
  enrollmentType: string;
  manualReason?: string;
  status: string;
}

interface ClassData {
  classId: number;
  classCode: string;
  subjectCode: string;
  subjectName: string;
  enrolledCount: number;
  maxStudents: number;
}

interface Props {
  classData: ClassData;
  onClose: () => void;
  onUpdate: () => void;
}

const StudentListModal: React.FC<Props> = ({ classData, onClose, onUpdate }) => {
  
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<Student[]>([]);
  const [eligibilityInfo, setEligibilityInfo] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [selectedStudentId, setSelectedStudentId] = useState<number>(0);
  const [enrollReason, setEnrollReason] = useState('');
  const [enrollNote, setEnrollNote] = useState('');

  const token = localStorage.getItem('token') || '';

  // ===== LOAD DATA =====

  useEffect(() => {
    loadEnrolledStudents();
    loadEligibilityInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEnrolledStudents = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `/api/admin/enrollments/class/${classData.classId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEnrolledStudents(data.data || []);
      }
    } catch (err) {
      console.error('Load enrolled students failed:', err);
      alert(' Không thể tải danh sách sinh viên!');
    } finally {
      setLoading(false);
    }
  };

  const loadEligibilityInfo = async () => {
    try {
      const response = await fetch(
        `/api/admin/classes/${classData.classId}/eligibility-info`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEligibilityInfo(data.data || '');
      }
    } catch (err) {
      console.error('Load eligibility info failed:', err);
    }
  };

  const loadEligibleStudents = async () => {
    try {
      setLoadingEligible(true);
      
      const response = await fetch(
        `/api/admin/classes/${classData.classId}/eligible-students`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEligibleStudents(data.data || []);
        
        if (data.data.length === 0) {
          alert(' Không có sinh viên nào đủ điều kiện hoặc tất cả đã đăng ký!');
          setShowAddModal(false);
        }
      } else {
        alert(' Không thể tải danh sách sinh viên!');
        setShowAddModal(false);
      }
    } catch (err) {
      console.error('Load eligible students failed:', err);
      alert(' Lỗi khi tải danh sách sinh viên!');
      setShowAddModal(false);
    } finally {
      setLoadingEligible(false);
    }
  };

  // ===== ACTIONS =====

  const handleAddStudent = () => {
    setShowAddModal(true);
    loadEligibleStudents();
  };

  const handleEnroll = async () => {
    if (!selectedStudentId) {
      alert('Vui lòng chọn sinh viên!');
      return;
    }

    if (!enrollReason.trim()) {
      alert('Vui lòng nhập lý do thêm sinh viên!');
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/enrollments/manual`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            classId: classData.classId,
            studentId: selectedStudentId,
            reason: enrollReason,
            note: enrollNote
          })
        }
      );

      if (response.ok) {
        alert(' Thêm sinh viên thành công!');
        setShowAddModal(false);
        setSelectedStudentId(0);
        setEnrollReason('');
        setEnrollNote('');
        loadEnrolledStudents();
        onUpdate();
      } else {
        const error = await response.json();
        alert(` ${error.message || 'Thêm sinh viên thất bại!'}`);
      }
    } catch (err) {
      console.error('Enroll failed:', err);
      alert(' Có lỗi xảy ra!');
    }
  };

  const handleRemoveStudent = async (studentId: number, studentName: string) => {
    if (!window.confirm(`Xóa sinh viên ${studentName} khỏi lớp?`)) {
      return;
    }

    const reason = prompt('Nhập lý do xóa (tùy chọn):');

    try {
      const response = await fetch(
        `/api/admin/enrollments/class/${classData.classId}/student/${studentId}?reason=${encodeURIComponent(reason || '')}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        alert(' Xóa sinh viên thành công!');
        loadEnrolledStudents();
        onUpdate();
      } else {
        const error = await response.json();
        alert(` ${error.message || 'Xóa sinh viên thất bại!'}`);
      }
    } catch (err) {
      console.error('Remove failed:', err);
      alert(' Có lỗi xảy ra!');
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSelectedStudentId(0);
    setEnrollReason('');
    setEnrollNote('');
  };

  // ===== RENDER =====

  return (
    <>
      {/* MAIN MODAL - STUDENT LIST */}
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
          
          {/* HEADER */}
          <div className="modal-header">
            <div>
              <h2>👥 Danh sách sinh viên</h2>
              <p className="modal-subtitle">
                {classData.classCode} - {classData.subjectName}
              </p>
            </div>
            <button className="btn-close" onClick={onClose}>×</button>
          </div>

          {/* BODY */}
          <div className="modal-body">
            
            {/* INFO BOX */}
            {eligibilityInfo && (
              <div className="info-box">
                <strong>Điều kiện đăng ký:</strong>
                <p>{eligibilityInfo}</p>
              </div>
            )}

            {/* STATS */}
            <div className="enrollment-stats">
              <div className="stat-item">
                <span className="stat-label">Đã đăng ký:</span>
                <span className="stat-value">
                  {enrolledStudents.length} / {classData.maxStudents}
                </span>
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleAddStudent}
                disabled={enrolledStudents.length >= classData.maxStudents}
              >
                Thêm sinh viên
              </button>
            </div>

            {/* TABLE */}
            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : enrolledStudents.length === 0 ? (
              <div className="no-data">Chưa có sinh viên nào đăng ký</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>MSSV</th>
                      <th>Họ tên</th>
                      <th>Ngành</th>
                      <th>Email</th>
                      <th>Ngày ĐK</th>
                      <th>Loại ĐK</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map(student => (
                      <tr key={student.registrationId}>
                        <td>{student.studentCode}</td>
                        <td>
                          <strong>{student.studentName}</strong>
                        </td>
                        <td>
                          <div className="major-info">
                            <span className="major-name">{student.majorName}</span>
                            <small className="dept-name">{student.departmentName}</small>
                          </div>
                        </td>
                        <td>{student.studentEmail}</td>
                        <td>
                          {new Date(student.registeredAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td>
                          <span className={`badge ${student.enrollmentType === 'MANUAL' ? 'badge-warning' : 'badge-success'}`}>
                            {student.enrollmentType === 'MANUAL' ? 'Thủ công' : 'Tự động'}
                          </span>
                          {student.manualReason && (
                            <small className="manual-reason" title={student.manualReason}>
                               {student.manualReason}
                            </small>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn-action btn-delete"
                            onClick={() => handleRemoveStudent(student.studentId, student.studentName)}
                            title="Xóa sinh viên"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="modal-footer">
            <button className="btn btn-cancel" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* ===== ADD STUDENT MODAL - SEPARATE ===== */}
      {showAddModal && (
        <div className="modal-overlay modal-overlay-top" onClick={handleCloseAddModal}>
          <div className="modal-content modal-medium" onClick={e => e.stopPropagation()}>
            
            <div className="modal-header">
              <h3> Thêm sinh viên vào lớp</h3>
              <button className="btn-close" onClick={handleCloseAddModal}>×</button>
            </div>

            <div className="modal-body">
              
              {/* ELIGIBILITY INFO */}
              {eligibilityInfo && (
                <div className="info-box info-box-small">
                  <strong> {eligibilityInfo}</strong>
                </div>
              )}

              {/* LOADING STATE */}
              {loadingEligible ? (
                <div className="loading"> Đang tải danh sách sinh viên...</div>
              ) : (
                <>
                  {/* STUDENT SELECT */}
                  <div className="form-group">
                    <label>
                      Sinh viên <span className="required">*</span>
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={e => setSelectedStudentId(Number(e.target.value))}
                      className="form-select"
                    >
                      <option value="0">-- Chọn sinh viên --</option>
                      {eligibleStudents.map(student => (
                        <option key={student.studentId} value={student.studentId}>
                          {student.studentCode} - {student.fullName} ({student.majorName})
                        </option>
                      ))}
                    </select>
                    {eligibleStudents.length > 0 && (
                      <span className="form-hint form-hint-success">
                        {eligibleStudents.length} sinh viên có thể thêm
                      </span>
                    )}
                  </div>

                  {/* REASON */}
                  <div className="form-group">
                    <label>
                      Lý do thêm <span className="required">*</span>
                    </label>
                    <select
                      value={enrollReason}
                      onChange={e => setEnrollReason(e.target.value)}
                      className="form-select"
                    >
                      <option value="">-- Chọn lý do --</option>
                      <option value="Học bù">Học bù</option>
                      <option value="Chuyển lớp">Chuyển lớp</option>
                      <option value="Đăng ký muộn">Đăng ký muộn</option>
                      <option value="Điều chỉnh">Điều chỉnh</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  {/* NOTE */}
                  <div className="form-group">
                    <label>Ghi chú</label>
                    <textarea
                      value={enrollNote}
                      onChange={e => setEnrollNote(e.target.value)}
                      placeholder="Ghi chú bổ sung (tùy chọn)"
                      rows={3}
                      className="form-textarea"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-cancel" 
                onClick={handleCloseAddModal}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleEnroll}
                disabled={!selectedStudentId || !enrollReason || loadingEligible}
              >
                Thêm sinh viên
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentListModal;