import React, { useState, useEffect, useCallback } from 'react';
import departmentApi, { Department } from '../../../services/api/departmentApi';
import DepartmentModal from './DepartmentModal';
import './DepartmentList.css';

const DepartmentList: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(10);
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState('departmentName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ⭐ TOOLTIP STATE
  const [descriptionTooltip, setDescriptionTooltip] = useState<{
    show: boolean;
    content: string;
    x: number;
    y: number;
  }>({ show: false, content: '', x: 0, y: 0 });

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (searchKeyword.trim()) {
        response = await departmentApi.search(searchKeyword, currentPage, pageSize);
      } else {
        response = await departmentApi.getAll(currentPage, pageSize, sortBy, sortDir);
      }
      
      if (response) {
        setDepartments(Array.isArray(response.data) ? response.data : []);
        setTotalPages(response.totalPages || 0);
        setTotalItems(response.totalItems || 0);
      } else {
        setDepartments([]);
        setTotalPages(0);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('[DepartmentList] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách khoa';
      setError(errorMessage);
      setDepartments([]);
      setTotalPages(0);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchKeyword, sortBy, sortDir]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const handleCreate = () => {
    setEditingDepartment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khoa này?')) {
      return;
    }
    
    try {
      setDeletingId(id);
      await departmentApi.delete(id);
      alert('Xóa khoa thành công!');
      fetchDepartments();
    } catch (err) {
      console.error('[DepartmentList] Error deleting:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa khoa';
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
    fetchDepartments();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const getKnowledgeTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      GENERAL: 'Đại cương',
      SPECIALIZED: 'Chuyên ngành',
    };
    return labels[type] || type;
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
        <h1>Quản lý Khoa</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="icon">+</span>
          Thêm Khoa
        </button>
      </div>

      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã khoa hoặc tên khoa..."
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
      </div>

      {error && (
        <div className="error-message">Lỗi: {error}</div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : !departments || departments.length === 0 ? (
          <div className="no-data">
            {searchKeyword ? 'Không tìm thấy kết quả' : 'Chưa có khoa nào'}
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('departmentCode')} className="sortable">
                    Mã Khoa {sortBy === 'departmentCode' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('departmentName')} className="sortable">
                    Tên Khoa {sortBy === 'departmentName' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Loại Kiến thức</th>
                  <th className="center">MT</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.departmentId}>
                    <td className="code">{dept.departmentCode}</td>
                    <td>{dept.departmentName}</td>
                    <td>
                      <span className="badge badge-department">
                        {getKnowledgeTypeLabel(dept.knowledgeType)}
                      </span>
                    </td>
                    {/* ⭐ MÔ TẢ - TOOLTIP BUTTON */}
                    <td className="center">
                      {dept.description ? (
                        <button
                          className="btn-icon-info"
                          onMouseEnter={(e) => showDescription(dept.description, e)}
                          onMouseLeave={hideDescription}
                          title="Xem mô tả"
                        >
                          ℹ️
                        </button>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="date-cell">{formatDate(dept.createdAt)}</td>
                    <td className="actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(dept)}
                      >
                        Sửa
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(dept.departmentId)}
                        disabled={deletingId === dept.departmentId}
                      >
                        {deletingId === dept.departmentId ? '...' : 'Xóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              <div className="pagination-info">
                Hiển thị {departments.length} / {totalItems} khoa
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
        <DepartmentModal
          department={editingDepartment}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default DepartmentList;