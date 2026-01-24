import React, { useState, useEffect } from 'react';
import studentApi, { StudentResponse } from '../../../services/api/studentApi';
import majorApi from '../../../services/api/majorApi';
import StudentModal from './StudentModal';
import ImportModal from '../../admin/import/ImportModal';
import './StudentList.css'; // Đảm bảo đã import file CSS mới

interface Major {
  majorId: number;
  majorCode: string;
  majorName: string;
}

const StudentList: React.FC = () => {
  // State
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterMajorId, setFilterMajorId] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentResponse | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Fetch majors for filter
  useEffect(() => {
    fetchMajors();
  }, []);

  // Fetch students when page, search, or filter changes
  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchKeyword, filterMajorId]);

  const fetchMajors = async () => {
    try {
      const response = await majorApi.getAll(0, 100);
      setMajors(response.data || []);
    } catch (error) {
      console.error('Error fetching majors:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let response;

      if (searchKeyword.trim()) {
        response = await studentApi.search(searchKeyword, currentPage, 10);
      } else if (filterMajorId) {
        response = await studentApi.getByMajor(Number(filterMajorId));
        const data = response.data;
        setStudents(Array.isArray(data) ? data : []);
        setTotalPages(1);
        setTotalElements(Array.isArray(data) ? data.length : 0);
        setLoading(false);
        return;
      } else {
        response = await studentApi.getAll(currentPage, 10);
      }

      const pageData = response.data;
      setStudents(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Lỗi tải danh sách sinh viên');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    setFilterMajorId('');
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterMajorId(e.target.value);
    setSearchKeyword('');
    setCurrentPage(0);
  };

  const handleCreate = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (student: StudentResponse) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, fullName: string) => {
    if (!window.confirm(`Xác nhận xóa sinh viên "${fullName}"?`)) {
      return;
    }
    try {
      await studentApi.delete(id);
      alert('Xóa sinh viên thành công!');
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Lỗi xóa sinh viên');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    fetchStudents();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleImport = () => {
    setIsImportModalOpen(true);
  };

  const handleImportClose = () => {
    setIsImportModalOpen(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'MALE': return 'Nam';
      case 'FEMALE': return 'Nữ';
      case 'OTHER': return 'Khác';
      default: return gender;
    }
  };

  const getEducationLevelLabel = (level: string) => {
    switch (level) {
      case 'ASSOCIATE': return 'Cao đẳng';
      case 'BACHELOR': return 'Đại học';
      case 'MASTER': return 'Thạc sĩ';
      case 'DOCTOR': return 'Tiến sĩ';
      default: return level;
    }
  };

  const getTrainingTypeLabel = (type: string) => {
    switch (type) {
      case 'REGULAR': return 'Chính quy';
      case 'DISTANCE': return 'Từ xa';
      case 'PART_TIME': return 'Vừa làm vừa học';
      default: return type;
    }
  };

  // QUAN TRỌNG: Root class phải là 'student-list-page' để khớp CSS
  return (
    <div className="student-list-page">
      {/* HEADER */}
      <div className="page-header">
        <h1>Quản lý Sinh viên</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleImport}>
            <span className="icon">📥</span>
            Import Excel
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            <span className="icon">+</span>
            Thêm Sinh viên
          </button>
        </div>
      </div>

      {/* FILTERS - Đã cập nhật class để sống động hơn */}
      <div className="filters-bar">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm theo MSSV, tên, email, SĐT..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <button type="submit" className="btn-search">
            Tìm kiếm
          </button>
        </form>

        <select
          className="filter-select"
          value={filterMajorId}
          onChange={handleFilterChange}
        >
          <option value="">Tất cả chuyên ngành</option>
          {majors.map((major) => (
            <option key={major.majorId} value={major.majorId}>
              {major.majorCode} - {major.majorName}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="student-table-container">
        {loading ? (
          <div className="loading" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            Đang tải dữ liệu...
          </div>
        ) : (
          <>
            <table className="student-data-table">
              <thead>
                <tr>
                  {/* Định nghĩa 12 cột khớp với CSS nth-child */}
                  <th>MSSV</th>
                  <th>Họ và tên</th>
                  <th>Giới tính</th>
                  <th>Ngày sinh</th>
                  <th>Khóa</th>
                  <th>Trình độ</th>
                  <th>Hình thức</th>
                  <th>Chuyên ngành</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Thao tác</th>   {/* Cột 12 */}
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="no-data" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.studentId}>
                      {/* 1. MSSV */}
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{student.studentCode}</td>
                      
                      {/* 2. Họ tên */}
                      <td style={{ fontWeight: 500 }}>{student.fullName}</td>
                      
                      {/* 3. Giới tính */}
                      <td style={{ textAlign: 'center' }}>{getGenderLabel(student.gender)}</td>
                      
                      {/* 4. Ngày sinh */}
                      <td>{formatDate(student.dateOfBirth)}</td>
                      
                      {/* 5. Khóa */}
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{student.academicYear}</td>
                      
                      {/* 6. Trình độ */}
                      <td>
                        <span className="badge-education">
                          {getEducationLevelLabel(student.educationLevel)}
                        </span>
                      </td>
                      
                      {/* 7. Hình thức */}
                      <td>
                        <span className="badge-training">
                          {getTrainingTypeLabel(student.trainingType)}
                        </span>
                      </td>
                      
                      {/* 8. Chuyên ngành */}
                       <td>
                        {student.majorId ? (
                          <>
                            <span className="badge badge-major">
                              {student.majorCode || 'N/A'}
                            </span>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              {student.majorName || '—'}
                            </div>
                          </>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                      
                      {/* 9. Email */}
                      <td>{student.email || '—'}</td>
                      
                      {/* 10. SĐT */}
                      <td>{student.phone || '—'}</td>

                      {/* 12. Thao tác - Nút Text đơn giản nằm ngang */}
                      <td className="actions">
  <div className="action-buttons">
    <button
      className="btn-text btn-edit"
      onClick={() => handleEdit(student)}
    >
      Sửa
    </button>
    
    <button
      className="btn-text btn-delete"
      onClick={() => handleDelete(student.studentId, student.fullName)}
    >
      Xóa
    </button>
  </div>
</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* PAGINATION */}
            <div className="pagination">
              <div className="pagination-info">
                Hiển thị {students.length} / {totalElements} sinh viên
              </div>
              <div className="pagination-controls">
                <button
                  className="btn-page"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  Trước
                </button>
                <span className="page-info">
                  Trang {currentPage + 1} / {totalPages || 1}
                </span>
                <button
                  className="btn-page"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <StudentModal
          student={editingStudent}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
        <ImportModal
          title="Import Sinh viên từ Excel"
          entityType="student"
          onClose={handleImportClose}
          onImport={studentApi.importFromExcel}
          onDownloadTemplate={studentApi.downloadTemplate}
        />
      )}
    </div>
  );
};

export default StudentList;