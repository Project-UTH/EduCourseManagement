import React, { useState, useEffect } from 'react';
import teacherApi, { TeacherResponse } from '../../../services/api/teacherApi';
import departmentApi from '../../../services/api/departmentApi';
import TeacherModal from './TeacherModal';
import ImportModal from '../../admin/import/ImportModal';
import './TeacherList.css';

interface Department {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
}

const TeacherList: React.FC = () => {
  // State
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherResponse | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Fetch departments for filter
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch teachers when page, search, or filter changes
  useEffect(() => {
    fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchKeyword, filterDepartmentId]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAll(0, 100);
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      let response;

      if (searchKeyword.trim()) {
        // Search mode
        response = await teacherApi.search(searchKeyword, currentPage, 10);
      } else if (filterDepartmentId) {
        // Filter by department (returns array, not paginated)
        response = await teacherApi.getByDepartment(Number(filterDepartmentId));
        
        // Convert to page format
        const data = response.data;
        setTeachers(Array.isArray(data) ? data : []);
        setTotalPages(1);
        setTotalElements(Array.isArray(data) ? data.length : 0);
        setLoading(false);
        return;
      } else {
        // Get all with pagination
        response = await teacherApi.getAll(currentPage, 10);
      }

      const pageData = response.data;
      setTeachers(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      alert('Lỗi tải danh sách giảng viên');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    setFilterDepartmentId(''); // Clear filter when searching
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterDepartmentId(e.target.value);
    setSearchKeyword(''); // Clear search when filtering
    setCurrentPage(0);
  };

  const handleCreate = () => {
    setEditingTeacher(null);
    setIsModalOpen(true);
  };

  const handleEdit = (teacher: TeacherResponse) => {
    setEditingTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, fullName: string) => {
    if (!window.confirm(`Xác nhận xóa giảng viên "${fullName}"?`)) {
      return;
    }

    try {
      await teacherApi.delete(id);
      alert('Xóa giảng viên thành công!');
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Lỗi xóa giảng viên: ' + errorMessage);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTeacher(null);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setEditingTeacher(null);
    fetchTeachers();
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

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header">
        <h1>Quản lý Giảng viên</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleImport}>
            <span className="icon">📥</span>
            Import Excel
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            <span className="icon">+</span>
            Thêm Giảng viên
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filters-bar">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm theo tên, email, SĐT, CCCD..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <button type="submit" className="btn-search">
            Tìm kiếm
          </button>
        </form>

        <select
          className="filter-select"
          value={filterDepartmentId}
          onChange={handleFilterChange}
        >
          <option value="">Tất cả các khoa</option>
          {departments.map((dept) => (
            <option key={dept.departmentId} value={dept.departmentId}>
              {dept.departmentCode} - {dept.departmentName}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="teacher-table-container">
        {loading ? (
          <div className="loading">Đang tải dữ liệu...</div>
        ) : (
          <>
            <table className="teacher-data-table">
              <thead>
                <tr>
                  <th>CCCD</th>
                  <th>Họ và tên</th>
                  <th>Giới tính</th>
                  <th>Ngày sinh</th>
                  <th>Khoa</th>
                  <th>Chuyên ngành</th>
                  <th>Các môn dạy</th>
                  <th>Học vị</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="no-data">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher.teacherId}>
                      <td>{teacher.citizenId}</td>
                      <td className="font-semibold">{teacher.fullName}</td>
                      <td>{getGenderLabel(teacher.gender)}</td>
                      <td>{formatDate(teacher.dateOfBirth)}</td>
                      <td>
                        <span className="badge badge-department">
                          {teacher.departmentCode}
                        </span>
                        <div className="text-muted small">
                          {teacher.departmentName}
                        </div>
                      </td>
                      <td>
                        {teacher.majorId ? (
                          <>
                            <span className="badge badge-major">
                              {teacher.majorCode || 'N/A'}
                            </span>
                            <div className="text-muted small">
                              {teacher.majorName || '—'}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        {teacher.subjects && teacher.subjects.length > 0 ? (
                          <div className="subjects-list">
                            <span className="subjects-count">
                              {teacher.subjects.length} môn
                            </span>
                            <div className="subjects-preview">
                              {teacher.subjects.slice(0, 2).map(s => (
                                <span 
                                  key={s.subjectId} 
                                  className={`subject-tag ${s.isPrimary ? 'primary' : ''}`}
                                  title={s.subjectName}
                                >
                                  {s.subjectCode}
                                  {s.isPrimary && ' ⭐'}
                                </span>
                              ))}
                              {teacher.subjects.length > 2 && (
                                <span className="more-subjects">
                                  +{teacher.subjects.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted">Chưa có</span>
                        )}
                      </td>
                      <td>{teacher.degree || '—'}</td>
                      <td className="small">{teacher.email || '—'}</td>
                      <td>{teacher.phone || '—'}</td>
                      <td className="actions">
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(teacher)}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(teacher.teacherId, teacher.fullName)}
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
                Hiển thị {teachers.length} / {totalElements} giảng viên
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
        <TeacherModal
          teacher={editingTeacher}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
        <ImportModal
          title="Import Giảng viên từ Excel"
          entityType="teacher"
          onClose={handleImportClose}
          onImport={teacherApi.importFromExcel}
          onDownloadTemplate={teacherApi.downloadTemplate}
        />
      )}
    </div>
  );
};

export default TeacherList;