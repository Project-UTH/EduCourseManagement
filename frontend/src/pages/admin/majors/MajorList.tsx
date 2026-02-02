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

  //  TOOLTIP STATE
  const [descriptionTooltip, setDescriptionTooltip] = useState<{
    show: boolean; content: string; x: number; y: number;
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
        setMajors([]); setTotalPages(0); setTotalItems(0);
      }
    } catch (err) {
      console.error('[MajorList] Error fetching majors:', err);
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách chuyên ngành');
      setMajors([]);
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

  const handleCreate = () => { setEditingMajor(null); setIsModalOpen(true); };
  const handleEdit = (major: Major) => { setEditingMajor(major); setIsModalOpen(true); };
  
  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chuyên ngành này?')) return;
    try {
      setDeletingId(id);
      await majorApi.delete(id);
      alert('Xóa chuyên ngành thành công!');
      fetchMajors();
    } catch {
      alert('Không thể xóa chuyên ngành');
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalSuccess = () => { setIsModalOpen(false); setEditingMajor(null); fetchMajors(); };
  const handleModalClose = () => { setIsModalOpen(false); setEditingMajor(null); };

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN');

  const showDescription = (desc: string | undefined, event: React.MouseEvent) => {
    if (!desc) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setDescriptionTooltip({ show: true, content: desc, x: rect.left - 100, y: rect.top - 40 });
  };

  return (
    // 1. Root class namespace mới
    <div className="major-list-page">
      
      <div className="page-header">
        <h1>Quản lý Chuyên ngành</h1>
        <button className="btn btn-add" onClick={handleCreate}>
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      d="M12 5v14m7-7H5"
    />
  </svg>
  <span>Thêm chuyên ngành</span>
</button>

      </div>

      {error && <div className="error-message">Lỗi: {error}</div>}

      {/* 2. Main Card Wrapper */}
      <div className="main-card">
        
        {/* Filter Bar bên trong Card */}
        <div className="filters-bar">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Tìm kiếm mã/tên ngành..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-search">Tìm kiếm</button>
            {(searchKeyword || selectedDepartmentId) && (
              <button
                type="button"
                className="btn btn-clear"
                onClick={() => { setSearchKeyword(''); setSelectedDepartmentId(null); setCurrentPage(0); }}
              >
                Xóa lọc
              </button>
            )}
            
            {/* Dropdown chọn khoa nằm cùng hàng với search */}
            <select
              value={selectedDepartmentId || ''}
              onChange={(e) => handleDepartmentFilter(e.target.value ? Number(e.target.value) : null)}
              className="filter-select"
              style={{maxWidth: '250px'}}
            >
              <option value="">-- Tất cả các khoa --</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentName}
                </option>
              ))}
            </select>

            
          </form>
        </div>

        {/* Table Responsive Wrapper */}
        <div className="table-responsive">
          {loading ? (
            <div className="loading">Đang tải dữ liệu...</div>
          ) : !majors || majors.length === 0 ? (
            <div className="no-data">
              {searchKeyword || selectedDepartmentId ? 'Không tìm thấy kết quả' : 'Chưa có chuyên ngành nào'}
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
                      Tên Chuyên Ngành {sortBy === 'majorName' }
                    </th>
                    <th>Khoa Quản lý</th>
                    <th className="center">Mô tả</th>
                    <th>Ngày tạo</th>
                    <th className="center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {majors.map((major) => (
                    <tr key={major.majorId}>
                      <td><span className="code">{major.majorCode}</span></td>
                      <td style={{fontWeight: 500}}>{major.majorName}</td>
                      <td>
                        {/* Hiển thị Khoa với Badge và Tên */}
                        <span className="badge-dept">{major.departmentCode}</span>
                        <span className="department-name">{major.departmentName}</span>
                      </td>
                      <td className="center">
                        {major.description ? (
                          <button
                            className="btn-icon-info"
                            onMouseEnter={(e) => showDescription(major.description, e)}
                            onMouseLeave={() => setDescriptionTooltip({ ...descriptionTooltip, show: false })}
                          >
                            i
                          </button>
                        ) : <span className="text-muted">-</span>}
                      </td>
                      <td>{formatDate(major.createdAt)}</td>
                      <td>
                        {/* 3. Wrapper actions để căn giữa */}
                        <div className="actions">
                          <button className="btn btn-edit" onClick={() => handleEdit(major)}>
                            Sửa
                          </button>
                          <button
      className="btn btn-delete"
      onClick={() => handleDelete(major.majorId)}
      disabled={deletingId === major.majorId}
    >
      {deletingId === major.majorId ? 'Đang xóa...' : 'Xóa'}
    </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* 4. Pagination (Square Icons) */}
              {!selectedDepartmentId && (
                <div className="pagination">
                <div className="pagination-info">
                 Hiện thị {departments.length}/{totalItems} chuyên ngành
                </div>
                <div className="pagination-controls">
                  <button className="btn-page" onClick={() => setCurrentPage(0)} disabled={currentPage === 0}>«</button>
                  <button className="btn-page" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 0}>‹</button>
                  <span style={{margin: '0 10px', fontWeight: 600}}>{currentPage + 1}</span>
                  <button className="btn-page" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}>›</button>
                  <button className="btn-page" onClick={() => setCurrentPage(totalPages - 1)} disabled={currentPage >= totalPages - 1}>»</button>
                </div>
              </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 5. Tooltip với class mới */}
      {descriptionTooltip.show && (
        <div
          className="ml-description-tooltip"
          style={{ left: descriptionTooltip.x, top: descriptionTooltip.y }}
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