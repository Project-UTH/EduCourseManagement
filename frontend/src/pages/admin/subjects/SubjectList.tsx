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

  // Description tooltip state
  const [descriptionTooltip, setDescriptionTooltip] = useState<{
    show: boolean;
    content: string;
    x: number;
    y: number;
  }>({ show: false, content: '', x: 0, y: 0 });

  // ⭐ Prerequisite tooltip state
  const [prereqTooltip, setPrereqTooltip] = useState<{
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
        console.error('[SubjectList] Lỗi tải danh sách khoa:', err);
      }
    };
    fetchDepartments();
  }, []);

  const fetchPrerequisitesForSubjects = async (subjectList: Subject[]) => {
    const subjectsWithPrereqs: SubjectWithPrerequisites[] = await Promise.all(
      subjectList.map(async (subject) => {
        try {
          const prereqsRes = await subjectApi.getPrerequisites(subject.subjectId);
          const prereqList = Array.isArray(prereqsRes.data) ? prereqsRes.data : [];
          return {
            ...subject,
            prerequisitesList: prereqList,
            prerequisitesLoading: false
          };
        } catch (err) {
          console.error(`[SubjectList] Failed to fetch prerequisites for ${subject.subjectCode}:`, err);
          return {
            ...subject,
            prerequisitesList: [],
            prerequisitesLoading: false
          };
        }
      })
    );
    return subjectsWithPrereqs;
  };

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
        const baseSubjects = Array.isArray(response.data) ? response.data : [];
        const subjectsWithPrereqs = await fetchPrerequisitesForSubjects(baseSubjects);
        
        setSubjects(subjectsWithPrereqs);
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

  const handleOpenPrerequisites = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsPrerequisiteModalOpen(true);
  };

  const handleClosePrerequisites = () => {
    setIsPrerequisiteModalOpen(false);
    setSelectedSubject(null);
  };

  const handlePrerequisiteSuccess = () => {
    fetchSubjects();
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

  // ⭐ PREREQUISITE TOOLTIP HANDLERS
  const showPrereqTooltip = (prereqName: string, event: React.MouseEvent) => {
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    setPrereqTooltip({
      show: true,
      content: prereqName,
      x: rect.left,
      y: rect.bottom + 5
    });
  };

  const hidePrereqTooltip = () => {
    setPrereqTooltip({ show: false, content: '', x: 0, y: 0 });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Quản lý Môn học</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
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
                    Mã
                  </th>
                  <th onClick={() => handleSort('subjectName')} className="sortable">
                    Tên Môn học
                  </th>
                  <th>Khoa</th>
                  <th>Ngành</th>
                  <th>TC</th>
                  <th>Tổng</th>
                  <th>E-L</th>
                  <th>TT</th>
                  <th>Môn ĐK</th>
                  <th>Ngày</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.subjectId}>
                    <td className="code">{subject.subjectCode}</td>
                    <td className="name">{subject.subjectName}</td>
                    
                    <td>
                      <span className="badge badge-department">
                        {subject.departmentCode}
                      </span>
                      <div className="dept-name">{subject.departmentName}</div>
                    </td>
                    
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
                    <td className="center highlight">{subject.totalSessions}</td>
                    <td className="center text-blue">{subject.elearningSessions}</td>
                    <td className="center text-green">{subject.inpersonSessions}</td>
                    
                    {/* ⭐ MÔN ĐIỀU KIỆN - WITH TOOLTIP */}
                    <td className="prerequisites-cell">
                      {subject.prerequisitesLoading ? (
                        <span className="text-muted">...</span>
                      ) : subject.prerequisitesList && subject.prerequisitesList.length > 0 ? (
                        <div className="prerequisites-compact">
                          {subject.prerequisitesList.map((prereq, index) => (
                            <span 
                              key={prereq.subjectId} 
                              className="prereq-code"
                              onMouseEnter={(e) => showPrereqTooltip(prereq.subjectName, e)}
                              onMouseLeave={hidePrereqTooltip}
                            >
                              {prereq.subjectCode}
                              {index < subject.prerequisitesList!.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    
                    <td className="date-cell">{formatDate(subject.createdAt)}</td>
                    
                    {/* THAO TÁC */}
                    <td className="actions">
                      {subject.description && (
                        <button
                          className="btn-action btn-info"
                          onMouseEnter={(e) => showDescription(subject.description, e)}
                          onMouseLeave={hideDescription}
                          title="Xem mô tả"
                        >
                          ℹ️
                        </button>
                      )}
                      
                      <button
                        className="btn-action btn-prereq"
                        onClick={() => handleOpenPrerequisites(subject)}
                        title="Quản lý môn điều kiện"
                      >
                        📚
                      </button>
                      
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(subject)}
                      >
                        Sửa
                      </button>
                      
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(subject.subjectId)}
                        disabled={deletingId === subject.subjectId}
                      >
                        {deletingId === subject.subjectId ? '...' : 'Xóa'}
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

      {/* DESCRIPTION TOOLTIP */}
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

      {/* ⭐ PREREQUISITE TOOLTIP */}
      {prereqTooltip.show && (
        <div
          className="prereq-tooltip"
          style={{
            left: `${prereqTooltip.x}px`,
            top: `${prereqTooltip.y}px`
          }}
        >
          {prereqTooltip.content}
        </div>
      )}

      {isModalOpen && (
        <SubjectModal
          subject={editingSubject}
          departments={departments}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      {isPrerequisiteModalOpen && selectedSubject && (
        <PrerequisiteManager
          subject={selectedSubject}
          onClose={handleClosePrerequisites}
          onSuccess={handlePrerequisiteSuccess}
        />
      )}
    </div>
  );
};

export default SubjectList;