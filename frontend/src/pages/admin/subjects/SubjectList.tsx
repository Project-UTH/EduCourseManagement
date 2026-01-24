import React, { useState, useEffect, useCallback } from 'react';
import subjectApi, { Subject } from '../../../services/api/subjectApi';
import departmentApi, { Department } from '../../../services/api/departmentApi';
import SubjectModal from './SubjectModal';
import PrerequisiteManager from './PrerequisiteManager';
import './SubjectList.css';

interface SubjectWithPrerequisites extends Subject {
  prerequisitesList?: Subject[];
  prerequisitesLoading?: boolean;
}

const SubjectList: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectWithPrerequisites[]>([]);
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

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isPrerequisiteModalOpen, setIsPrerequisiteModalOpen] = useState(false);

  // Tooltip state (Dùng chung 1 state cho gọn)
  const [tooltip, setTooltip] = useState<{ show: boolean; content: string; x: number; y: number }>({
    show: false, content: '', x: 0, y: 0
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentApi.getAll(0, 100, 'departmentName', 'asc');
        setDepartments(Array.isArray(response.data) ? response.data : []);
      } catch (err) { console.error(err); }
    };
    fetchDepartments();
  }, []);

  const fetchPrerequisitesForSubjects = async (subjectList: Subject[]) => {
    return Promise.all(subjectList.map(async (subject) => {
      try {
        const prereqsRes = await subjectApi.getPrerequisites(subject.subjectId);
        return { ...subject, prerequisitesList: Array.isArray(prereqsRes.data) ? prereqsRes.data : [], prerequisitesLoading: false };
      } catch (err) {
        return { ...subject, prerequisitesList: [], prerequisitesLoading: false };
      }
    }));
  };

  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      let response;
      if (selectedDepartmentId) response = await subjectApi.getByDepartment(selectedDepartmentId);
      else if (searchKeyword.trim()) response = await subjectApi.search(searchKeyword, currentPage, pageSize);
      else response = await subjectApi.getAll(currentPage, pageSize, sortBy, sortDir);
      
      if (response) {
        const baseSubjects = Array.isArray(response.data) ? response.data : [];
        const subjectsWithPrereqs = await fetchPrerequisitesForSubjects(baseSubjects);
        setSubjects(subjectsWithPrereqs);
        setTotalPages(response.totalPages || 0);
        setTotalItems(response.totalItems || 0);
      } else { setSubjects([]); setTotalPages(0); setTotalItems(0); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách');
      setSubjects([]);
    } finally { setLoading(false); }
  }, [currentPage, pageSize, searchKeyword, selectedDepartmentId, sortBy, sortDir]);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setCurrentPage(0); setSelectedDepartmentId(null); };
  const handleCreate = () => { setEditingSubject(null); setIsModalOpen(true); };
  const handleEdit = (subject: Subject) => { setEditingSubject(subject); setIsModalOpen(true); };
  const handleDelete = async (id: number) => {
    if (!window.confirm('Xóa môn học này?')) return;
    try {
      setDeletingId(id); await subjectApi.delete(id); alert('Xóa thành công!'); fetchSubjects();
    } catch (err) { alert('Không thể xóa'); } finally { setDeletingId(null); }
  };
  const handleModalSuccess = () => { setIsModalOpen(false); setEditingSubject(null); fetchSubjects(); };
  const handleModalClose = () => { setIsModalOpen(false); setEditingSubject(null); };

  const handleOpenPrerequisites = (subject: Subject) => { setSelectedSubject(subject); setIsPrerequisiteModalOpen(true); };
  const handleClosePrerequisites = () => { setIsPrerequisiteModalOpen(false); setSelectedSubject(null); };
  const handlePrerequisiteSuccess = () => { fetchSubjects(); };

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN');

  // Tooltip Helper
  const showTooltip = (content: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ show: true, content, x: rect.left, y: rect.bottom + 5 });
  };

  return (
    <div className="subject-list-page">
      <div className="page-header">
        <h1>Quản lý Môn học</h1>
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
  <span>Thêm môn học</span>
</button>

      </div>

      <div className="main-card">
        <div className="filters-bar">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="🔍 Tìm mã/tên môn học..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="btn btn-search">Tìm kiếm</button>
            {(searchKeyword || selectedDepartmentId) && (
              <button type="button" className="btn btn-clear" onClick={() => { setSearchKeyword(''); setSelectedDepartmentId(null); setCurrentPage(0); }}>Xóa lọc</button>
            )}
            <select
              value={selectedDepartmentId || ''}
              onChange={(e) => { setSelectedDepartmentId(e.target.value ? Number(e.target.value) : null); setSearchKeyword(''); setCurrentPage(0); }}
              className="filter-select"
              style={{ maxWidth: '250px' }}
            >
              <option value="">-- Tất cả khoa --</option>
              {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
            </select>
            
          </form>
        </div>

        <div className="table-responsive">
          {loading ? <div className="loading">Đang tải...</div> : !subjects.length ? <div className="no-data">Chưa có dữ liệu</div> : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('subjectCode')} className="sortable">Mã {sortBy === 'subjectCode' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                    <th onClick={() => handleSort('subjectName')} className="sortable">Tên Môn học {sortBy === 'subjectName' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                    <th>Khoa</th>
                    <th>Ngành</th>
                    <th className="center">TC</th>
                    <th className="center">Tổng</th>
                    <th className="center">E-L</th>
                    <th className="center">TT</th>
                    <th>Môn ĐK</th>
                    <th>Ngày</th>
                    <th className="center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subj) => (
                    <tr key={subj.subjectId}>
                      <td><span className="code">{subj.subjectCode}</span></td>
                      <td>{subj.subjectName}</td>
                      <td><span className="badge-mini badge-dept" title={subj.departmentName}>{subj.departmentCode}</span></td>
                      <td>{subj.majorCode ? <span className="badge-mini badge-major" title={subj.majorName}>{subj.majorCode}</span> : <span className="text-muted">-</span>}</td>
                      
                      {/* CÁC CỘT SỐ COMPACT */}
                      <td className="center"><b>{subj.credits}</b></td>
                      <td className="center text-blue">{subj.totalSessions}</td>
                      <td className="center">{subj.elearningSessions}</td>
                      <td className="center text-green">{subj.inpersonSessions}</td>
                      
                      <td>
                        {subj.prerequisitesLoading ? <span className="text-muted">...</span> : 
                         subj.prerequisitesList && subj.prerequisitesList.length > 0 ? (
                          <div className="prereq-container">
                            {subj.prerequisitesList.map(p => (
                              <span key={p.subjectId} className="prereq-tag" onMouseEnter={(e) => showTooltip(p.subjectName, e)} onMouseLeave={() => setTooltip({...tooltip, show: false})}>
                                {p.subjectCode}
                              </span>
                            ))}
                          </div>
                        ) : <span className="text-muted">-</span>}
                      </td>
                      
                      <td>{formatDate(subj.createdAt)}</td>
                      <td>
  <div className="btn-action-group">
    {subj.description && (
      <button
        className="btn-sm btn-info"
        onMouseEnter={(e) => showTooltip(subj.description!, e)}
        onMouseLeave={() => setTooltip({ ...tooltip, show: false })}
        title="Mô tả"
      >
        i
      </button>
    )}

    {/* Nhóm 3 nút thẳng hàng */}
    <div className="btn-main-group">
      <button
        className="btn-sm btn-prereq-action"
        onClick={() => handleOpenPrerequisites(subj)}
        title="QL Môn điều kiện"
      >
        📚
      </button>

      <button
        className="btn-sm btn-edit"
        onClick={() => handleEdit(subj)}
      >
        Sửa
      </button>

      <button
        className="btn-sm btn-delete"
        onClick={() => handleDelete(subj.subjectId)}
        disabled={deletingId === subj.subjectId}
      >
        Xóa
      </button>
    </div>
  </div>
</td>

                    </tr>
                  ))}
                </tbody>
              </table>

              {!selectedDepartmentId && (
                <div className="pagination">
                  <div className="pagination-info">Hiển thị {subjects.length} / {totalItems} môn</div>
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

      {tooltip.show && (
        <div className="sl-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.content}
        </div>
      )}

      {isModalOpen && <SubjectModal subject={editingSubject} departments={departments} onClose={handleModalClose} onSuccess={handleModalSuccess} />}
      {isPrerequisiteModalOpen && selectedSubject && <PrerequisiteManager subject={selectedSubject} onClose={handleClosePrerequisites} onSuccess={handlePrerequisiteSuccess} />}
    </div>
  );
};

export default SubjectList;