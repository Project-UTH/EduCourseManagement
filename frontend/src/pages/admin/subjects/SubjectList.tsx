import React, { useState, useEffect, useCallback } from 'react';
import subjectApi, { Subject } from '../../../services/api/subjectApi';
import departmentApi, { Department } from '../../../services/api/departmentApi';
import SubjectModal from './SubjectModal';
import './SubjectList.css';

/**
 * Subject List V2 - Hiển thị Khoa, Chuyên ngành, Số buổi
 */

const SubjectList: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(10);
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('subjectName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentApi.getAll(0, 100, 'departmentName', 'asc');
        const departments = Array.isArray(response.data) ? response.data : [];
        setDepartments(departments);
      } catch (err) {
        console.error('[SubjectList] Lỗi tải danh sách khoa:', err);
      }
    };
    fetchDepartments();
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      if (selectedDepartmentId) {
        response = await subjectApi.getByDepartment(selectedDepartmentId);
      } else if (searchKeyword.trim()) {
        response = await subjectApi.search(searchKeyword, currentPage, pageSize);
      } else {
        response = await subjectApi.getAll(currentPage, pageSize, sortBy, sortDir);
      }
      
      if (response) {
        setSubjects(Array.isArray(response.data) ? response.data : []);
        setTotalPages(response.totalPages || 0);
        setTotalItems(response.totalItems || 0);
      } else {
        setSubjects([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('[SubjectList] Lỗi tải danh sách môn học:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách môn học';
      setError(errorMessage);
      setSubjects([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchKeyword, selectedDepartmentId, sortBy, sortDir]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    setSelectedDepartmentId(null);
  };

  const handleDepartmentFilter = (departmentId: number | null) => {
    setSelectedDepartmentId(departmentId);
    setSearchKeyword('');
    setCurrentPage(0);
  };

  const handleCreate = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa môn học này?')) {
      return;
    }
    
    try {
      setDeletingId(id);
      await subjectApi.delete(id);
      alert('Xóa môn học thành công!');
      fetchSubjects();
    } catch (err) {
      console.error('[SubjectList] Lỗi xóa môn học:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa môn học';
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
    fetchSubjects();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="subject-list-container">
      <div className="page-header">
        <h1>Quản lý Môn học</h1>
        <button className="btn-primary" onClick={handleCreate}>
          <span className="icon">+</span>
          Thêm Môn học
        </button>
      </div>

      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã hoặc tên môn học..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search">Tìm kiếm</button>
          {searchKeyword && (
            <button
              type="button"
              className="btn-clear"
              onClick={() => {
                setSearchKeyword('');
                setCurrentPage(0);
              }}
            >
              Xóa
            </button>
          )}
        </form>

        <div className="department-filter">
          <select
            value={selectedDepartmentId || ''}
            onChange={(e) => handleDepartmentFilter(e.target.value ? Number(e.target.value) : null)}
            className="filter-select"
          >
            <option value="">Tất cả các khoa</option>
            {departments.map((dept) => (
              <option key={dept.departmentId} value={dept.departmentId}>
                {dept.departmentName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">Lỗi: {error}</div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : !subjects || subjects.length === 0 ? (
          <div className="no-data">
            {searchKeyword || selectedDepartmentId 
              ? 'Không tìm thấy kết quả' 
              : 'Chưa có môn học nào'}
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('subjectCode')} className="sortable">
                    Mã MH {sortBy === 'subjectCode' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('subjectName')} className="sortable">
                    Tên Môn học {sortBy === 'subjectName' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Khoa</th>
                  <th>Chuyên ngành</th>
                  <th>Tín chỉ</th>
                  <th>Tổng buổi</th>
                  <th>E-Learning</th>
                  <th>Trực tiếp</th>
                  <th>Mô tả</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.subjectId}>
                    <td className="code">{subject.subjectCode}</td>
                    <td className="name">{subject.subjectName}</td>
                    
                    {/* KHOA */}
                    <td>
                      <span className="badge badge-department">
                        {subject.departmentCode}
                      </span>
                      <div className="dept-name">{subject.departmentName}</div>
                    </td>
                    
                    {/* CHUYÊN NGÀNH */}
                    <td>
                      {subject.majorName ? (
                        <>
                          <span className="badge badge-major">
                            {subject.majorCode}
                          </span>
                          <div className="major-name">{subject.majorName}</div>
                        </>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    
                    <td className="center">{subject.credits}</td>
                    
                    {/* SỐ BUỔI */}
                    <td className="center highlight">{subject.totalSessions}</td>
                    <td className="center text-blue">{subject.elearningSessions}</td>
                    <td className="center text-green">{subject.inpersonSessions}</td>
                    
                    <td className="description">{subject.description || '—'}</td>
                    <td>{formatDate(subject.createdAt)}</td>
                    <td className="actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(subject)}
                        title="Sửa"
                      >
                        Sửa
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(subject.subjectId)}
                        disabled={deletingId === subject.subjectId}
                        title="Xóa"
                      >
                        {deletingId === subject.subjectId ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!selectedDepartmentId && (
              <div className="pagination">
                <div className="pagination-info">
                  Hiển thị {subjects.length} / {totalItems} môn học
                </div>
                <div className="pagination-controls">
                  <button
                    className="btn-page"
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                  >
                    Đầu
                  </button>
                  <button
                    className="btn-page"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    Trước
                  </button>
                  <span className="page-number">
                    Trang {currentPage + 1} / {totalPages || 1}
                  </span>
                  <button
                    className="btn-page"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1 || totalPages === 0}
                  >
                    Sau
                  </button>
                  <button
                    className="btn-page"
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1 || totalPages === 0}
                  >
                    Cuối
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <SubjectModal
          subject={editingSubject}
          departments={departments}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default SubjectList;