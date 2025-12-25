import React, { useState, useEffect, useCallback } from 'react';
import majorApi, { Major } from '../../../services/api/majorApi';
import departmentApi, { Department } from '../../../services/api/departmentApi';
import MajorModal from './MajorModal';
import './MajorList.css';

const MajorList: React.FC = () => {
  const [majors, setMajors] = useState<Major[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(10);
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('majorName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ⭐ TOOLTIP STATE
  const [descriptionTooltip, setDescriptionTooltip] = useState<{
    show: boolean;
    content: string;
    x: number;
    y: number;
  }>({ show: false, content: '', x: 0, y: 0 });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentApi.getAll(0, 100, 'departmentName', 'asc');
        const departments = Array.isArray(response.data) ? response.data : [];
        setDepartments(departments);
      } catch (err) {
        console.error('[MajorList] Error fetching departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const fetchMajors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      if (selectedDepartmentId) {
        response = await majorApi.getByDepartment(selectedDepartmentId);
      } else if (searchKeyword.trim()) {
        response = await majorApi.search(searchKeyword, currentPage, pageSize);
      } else {
        response = await majorApi.getAll(currentPage, pageSize, sortBy, sortDir);
      }
      
      if (response) {
        setMajors(Array.isArray(response.data) ? response.data : []);
        setTotalPages(response.totalPages || 0);
        setTotalItems(response.totalItems || 0);
      } else {
        setMajors([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('[MajorList] Error fetching majors:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách chuyên ngành';
      setError(errorMessage);
      setMajors([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchKeyword, selectedDepartmentId, sortBy, sortDir]);

  useEffect(() => {
    fetchMajors();
  }, [fetchMajors]);

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
    setEditingMajor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (major: Major) => {
    setEditingMajor(major);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chuyên ngành này?')) {
      return;
    }
    
    try {
      setDeletingId(id);
      await majorApi.delete(id);
      alert('Xóa chuyên ngành thành công!');
      fetchMajors();
    } catch (err) {
      console.error('[MajorList] Error deleting major:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa chuyên ngành';
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setEditingMajor(null);
    fetchMajors();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingMajor(null);
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

  // ⭐ TOOLTIP HANDLERS
  const showDescription = (description: string | undefined, event: React.MouseEvent) => {
    if (!description) return;
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    setDescriptionTooltip({
      show: true,
      content: description,
      x: rect.left,
      y: rect.bottom + 5
    });
  };

  const hideDescription = () => {
    setDescriptionTooltip({ show: false, content: '', x: 0, y: 0 });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Quản lý Chuyên ngành</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="icon">+</span>
          Thêm Chuyên ngành
        </button>
      </div>

      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã hoặc tên chuyên ngành..."
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
        ) : !majors || majors.length === 0 ? (
          <div className="no-data">
            {searchKeyword || selectedDepartmentId 
              ? 'Không tìm thấy kết quả' 
              : 'Chưa có chuyên ngành nào'}
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('majorCode')} className="sortable">
                    Mã CN {sortBy === 'majorCode' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('majorName')} className="sortable">
                    Tên CN {sortBy === 'majorName' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Khoa</th>
                  <th className="center">MT</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {majors.map((major) => (
                  <tr key={major.majorId}>
                    <td className="code">{major.majorCode}</td>
                    <td>{major.majorName}</td>
                    <td>
                      <span className="badge badge-department">
                        {major.departmentCode}
                      </span>
                      <span className="department-name">{major.departmentName}</span>
                    </td>
                    {/* ⭐ MÔ TẢ - TOOLTIP BUTTON */}
                    <td className="center">
                      {major.description ? (
                        <button
                          className="btn-icon-info"
                          onMouseEnter={(e) => showDescription(major.description, e)}
                          onMouseLeave={hideDescription}
                          title="Xem mô tả"
                        >
                          ℹ️
                        </button>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="date-cell">{formatDate(major.createdAt)}</td>
                    <td className="actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(major)}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(major.majorId)}
                        disabled={deletingId === major.majorId}
                      >
                        {deletingId === major.majorId ? '...' : 'Xóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!selectedDepartmentId && (
              <div className="pagination">
                <div className="pagination-info">
                  Hiển thị {majors.length} / {totalItems} chuyên ngành
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

      {/* ⭐ DESCRIPTION TOOLTIP */}
      {descriptionTooltip.show && (
        <div
          className="description-tooltip"
          style={{
            left: `${descriptionTooltip.x}px`,
            top: `${descriptionTooltip.y}px`
          }}
        >
          {descriptionTooltip.content}
        </div>
      )}

      {isModalOpen && (
        <MajorModal
          major={editingMajor}
          departments={departments}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default MajorList;