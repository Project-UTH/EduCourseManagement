import React, { useState, useEffect, useCallback } from 'react';
import departmentApi, { Department } from '../../../services/api/departmentApi';
import DepartmentModal from './DepartmentModal';
import './DepartmentList.css';

/**
 * Department List Page
 * Phase 3 Sprint 3.1 - Fixed Version with Null Checks
 */

const DepartmentList: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(10);
  
  // Search & Filter
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState('departmentName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  
  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  /**
   * Fetch departments
   */
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
      
      console.log('📊 [DepartmentList] Response:', response);

      console.log('📊 [DepartmentList] Response:', response);

      // ✅ FIX: Backend trả flat structure, data là array trực tiếp
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
      console.error('❌ [DepartmentList] Error fetching departments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách khoa';
      setError(errorMessage);
      
      // ✅ Set empty data on error
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

  /**
   * Handle search
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  /**
   * Handle create new
   */
  const handleCreate = () => {
    setEditingDepartment(null);
    setIsModalOpen(true);
  };

  /**
   * Handle edit
   */
  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setIsModalOpen(true);
  };

  /**
   * Handle delete
   */
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
      console.error('❌ [DepartmentList] Error deleting department:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa khoa';
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Handle modal save success
   */
  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
    fetchDepartments();
  };

  /**
   * Handle modal close
   */
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
  };

  /**
   * Handle sort
   */
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  /**
   * Get knowledge type label
   */
  const getKnowledgeTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      GENERAL: 'Đại cương',
      SPECIALIZED: 'Chuyên ngành',
    };
    return labels[type] || type;
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="department-list-container">
      {/* Header */}
      <div className="page-header">
        <h1>Quản lý Khoa</h1>
        <button className="btn-primary" onClick={handleCreate}>
          <span className="icon">+</span>
          Thêm Khoa
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <form onSubmit={handleSearch}>
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã khoa hoặc tên khoa..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn-search">
              Tìm kiếm
            </button>
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
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading">⏳ Đang tải...</div>
        ) : !departments || departments.length === 0 ? (
          <div className="no-data">
            {searchKeyword ? '🔍 Không tìm thấy kết quả' : '📭 Chưa có khoa nào'}
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
                  <th>Mô tả</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.departmentId}>
                    <td className="code">{dept.departmentCode}</td>
                    <td className="name">{dept.departmentName}</td>
                    <td>
                      <span className="badge badge-info">
                        {getKnowledgeTypeLabel(dept.knowledgeType)}
                      </span>
                    </td>
                    <td className="description">{dept.description || '—'}</td>
                    <td>{formatDate(dept.createdAt)}</td>
                    <td className="actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(dept)}
                        title="Sửa"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(dept.departmentId)}
                        disabled={deletingId === dept.departmentId}
                        title="Xóa"
                      >
                        {deletingId === dept.departmentId ? '⏳' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
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
                  ««
                </button>
                <button
                  className="btn-page"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  ‹
                </button>
                <span className="page-number">
                  Trang {currentPage + 1} / {totalPages || 1}
                </span>
                <button
                  className="btn-page"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1 || totalPages === 0}
                >
                  ›
                </button>
                <button
                  className="btn-page"
                  onClick={() => setCurrentPage(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1 || totalPages === 0}
                >
                  »»
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
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