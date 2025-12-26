import React, { useState, useEffect } from 'react';
import studentApi, { StudentResponse } from '../../../services/api/studentApi';
import majorApi from '../../../services/api/majorApi';
import StudentModal from './StudentModal';
import './StudentList.css';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentResponse | null>(null);

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
        // Search mode
        response = await studentApi.search(searchKeyword, currentPage, 10);
      } else if (filterMajorId) {
        // Filter by major (returns array, not paginated)
        response = await studentApi.getByMajor(Number(filterMajorId));
        
        // Convert to page format
        const data = response.data;
        setStudents(Array.isArray(data) ? data : []);
        setTotalPages(1);
        setTotalElements(Array.isArray(data) ? data.length : 0);
        setLoading(false);
        return;
      } else {
        // Get all with pagination
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
    setFilterMajorId(''); // Clear filter when searching
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterMajorId(e.target.value);
    setSearchKeyword(''); // Clear search when filtering
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

  const formatDate = (dateString: string) => {
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

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header">
        <h1>Quản lý Sinh viên</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="icon">+</span>
          Thêm Sinh viên
        </button>
      </div>

      {/* FILTERS */}
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
          <div className="loading">Đang tải dữ liệu...</div>
        ) : (
          <>
            <table className="student-data-table">
              <thead>
                <tr>
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
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="no-data">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.studentId}>
                      <td className="code">{student.studentCode}</td>
                      <td className="font-semibold">{student.fullName}</td>
                      <td className="center">{getGenderLabel(student.gender)}</td>
                      <td>{formatDate(student.dateOfBirth)}</td>
                      <td className="center">{student.academicYear}</td>
                      <td>
                        <span className="badge badge-education">
                          {getEducationLevelLabel(student.educationLevel)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-training">
                          {getTrainingTypeLabel(student.trainingType)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-major">
                          {student.majorCode}
                        </span>
                        <div className="text-muted small">
                          {student.majorName}
                        </div>
                      </td>
                      <td className="small">{student.email || '—'}</td>
                      <td>{student.phone || '—'}</td>
                      <td className="center">
                        {student.isActive ? (
                          <span className="badge badge-success">Hoạt động</span>
                        ) : (
                          <span className="badge badge-inactive">Vô hiệu</span>
                        )}
                      </td>
                      <td className="actions">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(student)}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(student.studentId, student.fullName)}
                        >
                          Xóa
                        </button>
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
    </div>
  );
};

export default StudentList;