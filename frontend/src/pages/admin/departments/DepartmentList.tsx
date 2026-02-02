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

  const [descriptionTooltip, setDescriptionTooltip] = useState<{
    show: boolean; content: string; x: number; y: number;
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
        setDepartments([]); setTotalPages(0); setTotalItems(0);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      setDepartments([]);
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

  const handleCreate = () => { setEditingDepartment(null); setIsModalOpen(true); };
  const handleEdit = (department: Department) => { setEditingDepartment(department); setIsModalOpen(true); };
  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khoa này?')) return;
    try {
      setDeletingId(id);
      await departmentApi.delete(id);
      alert('Xóa thành công!');
      fetchDepartments();
    } catch {
      alert('Không thể xóa khoa');
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalSuccess = () => { setIsModalOpen(false); setEditingDepartment(null); fetchDepartments(); };
  const handleModalClose = () => { setIsModalOpen(false); setEditingDepartment(null); };

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  const getKnowledgeTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = { GENERAL: 'Đại cương', SPECIALIZED: 'Chuyên ngành' };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN');

  const showDescription = (desc: string | undefined, e: React.MouseEvent) => {
    if (!desc) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDescriptionTooltip({ show: true, content: desc, x: rect.left - 80, y: rect.top - 40 });
  };

  return (
    <div className="department-list-page">
      <div className="page-header">
        <h1>Quản lý Khoa</h1>
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
  <span>Thêm Khoa</span>
</button>
      </div>

      <div className="main-card">
        <div className="filters-bar">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder=" Tìm kiếm..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-search">Tìm kiếm</button>
            {searchKeyword && (
              <button type="button" className="btn btn-clear" onClick={() => { setSearchKeyword(''); setCurrentPage(0); }}>
                Xóa lọc
              </button>
            )}
          </form>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="table-responsive">
          {loading ? (
            <div className="loading">Đang tải dữ liệu...</div>
          ) : !departments.length ? (
            <div className="no-data">Không có dữ liệu</div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{width: '120px'}} onClick={() => handleSort('departmentCode')} className="sortable">
                      Mã Khoa {sortBy === 'departmentCode' }
                    </th>
                    <th style={{width: '300px'}} onClick={() => handleSort('departmentName')} className="sortable">
                      Tên Khoa {sortBy === 'departmentName'}
                    </th>
                    <th style={{width: '160px'}}>Loại</th>
                    <th style={{width: '80px'}} className="center">Mô tả</th>
                    <th style={{width: '140px'}}>Ngày tạo</th>
                    <th style={{width: '180px'}} className="center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.departmentId}>
                      <td><span className="code">{dept.departmentCode}</span></td>
                      <td style={{fontWeight: 500}}>{dept.departmentName}</td>
                      <td>
                        <span className="badge badge-department">{getKnowledgeTypeLabel(dept.knowledgeType)}</span>
                      </td>
                      <td className="center">
                        {dept.description ? (
                          <button
                            className="btn-icon-info"
                            onMouseEnter={(e) => showDescription(dept.description, e)}
                            onMouseLeave={() => setDescriptionTooltip({ ...descriptionTooltip, show: false })}
                          >
                            i
                          </button>
                        ) : <span className="text-muted">-</span>}
                      </td>
                      <td>{formatDate(dept.createdAt)}</td>
                      
                      {/* Cột Hành động được căn giữa bởi CSS .actions */}
                      <td>
                        <div className="actions">
                          <button className="btn btn-edit" onClick={() => handleEdit(dept)}>
                            Sửa
                          </button>
                          <button
      className="btn btn-delete"
      onClick={() => handleDelete(dept.departmentId)}
      disabled={deletingId === dept.departmentId}
    >
      {deletingId === dept.departmentId ? 'Đang xóa...' : 'Xóa'}
    </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination">
                <div className="pagination-info">
                 Hiện thị {departments.length}/{totalItems}  khoa
                </div>
                <div className="pagination-controls">
                  <button className="btn-page" onClick={() => setCurrentPage(0)} disabled={currentPage === 0}>«</button>
                  <button className="btn-page" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 0}>‹</button>
                  <span style={{margin: '0 10px', fontWeight: 600}}>{currentPage + 1}</span>
                  <button className="btn-page" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}>›</button>
                  <button className="btn-page" onClick={() => setCurrentPage(totalPages - 1)} disabled={currentPage >= totalPages - 1}>»</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {descriptionTooltip.show && (
        <div className="dl-description-tooltip" style={{ left: descriptionTooltip.x, top: descriptionTooltip.y }}>
          {descriptionTooltip.content}
        </div>
      )}

      {isModalOpen && <DepartmentModal department={editingDepartment} onClose={handleModalClose} onSuccess={handleModalSuccess} />}
    </div>
  );
};

export default DepartmentList;