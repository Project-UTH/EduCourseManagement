import React, { useState, useEffect, useCallback } from 'react';
import majorApi, { MajorResponse } from '../../../services/api/majorApi';
import departmentApi, { DepartmentResponse } from '../../../services/api/departmentApi';
import MajorModal from './MajorModal';
import './MajorList.css';

/**
 * Major List Page
 * Phase 3 Sprint 3.1
 */

const MajorList: React.FC = () => {
  const [majors, setMajors] = useState<MajorResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(10);
  
  // Search & Filter
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('majorName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<MajorResponse | null>(null);
  
  // Delete confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  /**
   * Fetch departments for filter dropdown
   */
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await departmentApi.getAllDepartmentsNoPaging();
        setDepartments(data);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  /**
   * Fetch majors
   */
  const fetchMajors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      // Filter by department
      if (selectedDepartmentId) {
        const data = await majorApi.getMajorsByDepartment(selectedDepartmentId);
        // Convert to paginated response format
        response = {
          success: true,
          data: data,
          currentPage: 0,
          totalPages: 1,
          totalItems: data.length,
        };
      }
      // Search by keyword
      else if (searchKeyword.trim()) {
        response = await majorApi.searchMajors(searchKeyword, {
          page: currentPage,
          size: pageSize,
        });
      }
      // Get all with pagination
      else {
        response = await majorApi.getAllMajors({
          page: currentPage,
          size: pageSize,
          sortBy,
          sortDir,
        });
      }
      
      setMajors(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.totalItems);
    } catch (err) {
      console.error('Error fetching majors:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách chuyên ngành';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchKeyword, selectedDepartmentId, sortBy, sortDir]);

  useEffect(() => {
    fetchMajors();
  }, [fetchMajors]);

  /**
   * Handle search
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    setSelectedDepartmentId(null); // Clear department filter when searching
    fetchMajors();
  };

  /**
   * Handle department filter change
   */
  const handleDepartmentFilter = (departmentId: number | null) => {
    setSelectedDepartmentId(departmentId);
    setSearchKeyword(''); // Clear search when filtering
    setCurrentPage(0);
  };

  /**
   * Handle create new
   */
  const handleCreate = () => {
    setEditingMajor(null);
    setIsModalOpen(true);
  };

  /**
   * Handle edit
   */
  const handleEdit = (major: MajorResponse) => {
    setEditingMajor(major);
    setIsModalOpen(true);
  };

  /**
   * Handle delete
   */
  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chuyên ngành này?')) {
      return;
    }
    
    try {
      setDeletingId(id);
      await majorApi.deleteMajor(id);
      
      alert('Xóa chuyên ngành thành công!');
      fetchMajors();
    } catch (err) {
      console.error('Error deleting major:', err);
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa chuyên ngành';
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
    setEditingMajor(null);
    fetchMajors();
  };

  /**
   * Handle modal close
   */
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingMajor(null);
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
   * Format date
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="major-list-container">
      {/* Header */}
      <div className="page-header">
        <h1>Quản lý Chuyên ngành</h1>
        <button className="btn-primary" onClick={handleCreate}>
          <span className="icon">+</span>
          Thêm Chuyên ngành
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        {/* Search */}
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã hoặc tên chuyên ngành..."
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
        </form>

        {/* Department Filter */}
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

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : majors.length === 0 ? (
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
                    Tên Chuyên ngành {sortBy === 'majorName' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Khoa</th>
                  <th>Mô tả</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {majors.map((major) => (
                  <tr key={major.majorId}>
                    <td className="code">{major.majorCode}</td>
                    <td className="name">{major.majorName}</td>
                    <td>
                      <span className="badge badge-department">
                        {major.departmentCode}
                      </span>
                      <span className="department-name">{major.departmentName}</span>
                    </td>
                    <td className="description">{major.description || '—'}</td>
                    <td>{formatDate(major.createdAt)}</td>
                    <td className="actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(major)}
                        title="Sửa"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(major.majorId)}
                        disabled={deletingId === major.majorId}
                        title="Xóa"
                      >
                        {deletingId === major.majorId ? '...' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
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
                    disabled={currentPage >= totalPages - 1}
                  >
                    ›
                  </button>
                  <button
                    className="btn-page"
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    »»
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
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