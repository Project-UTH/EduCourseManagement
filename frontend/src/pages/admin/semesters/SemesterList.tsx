import React, { useState, useEffect, useCallback } from 'react';
import semesterApi, { Semester, SemesterStatus } from '../../../services/api/semesterApi';
import SemesterModal from './SemesterModal';
import RegistrationModal from './RegistrationModal';
import './SemesterList.css';

const SemesterList: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);

  // ⭐ TOOLTIP STATE
  const [descriptionTooltip, setDescriptionTooltip] = useState<{
    show: boolean;
    content: string;
    x: number;
    y: number;
  }>({ show: false, content: '', x: 0, y: 0 });

  const fetchSemesters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await semesterApi.getAll();
      setSemesters(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('[SemesterList] Lỗi tải danh sách học kỳ:', err);
      setError('Không thể tải danh sách học kỳ');
      setSemesters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSemesters();
  }, [fetchSemesters]);

  const handleCreate = () => {
    setEditingSemester(null);
    setIsModalOpen(true);
  };

  const handleEdit = (semester: Semester) => {
    setEditingSemester(semester);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa học kỳ này?')) {
      return;
    }
    
    try {
      setDeletingId(id);
      await semesterApi.delete(id);
      alert('Xóa học kỳ thành công!');
      fetchSemesters();
    } catch (err: unknown) {
      console.error('[SemesterList] Lỗi xóa học kỳ:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể xóa học kỳ';
      alert(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleActivate = async (id: number) => {
    if (!window.confirm('Kích hoạt học kỳ này? (Học kỳ đang hoạt động sẽ bị kết thúc)')) {
      return;
    }
    
    try {
      await semesterApi.activate(id);
      alert('Kích hoạt học kỳ thành công!');
      fetchSemesters();
    } catch (err: unknown) {
      console.error('[SemesterList] Lỗi kích hoạt học kỳ:', err);
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể kích hoạt học kỳ');
    }
  };

  const handleComplete = async (id: number) => {
    if (!window.confirm('Kết thúc học kỳ này?')) {
      return;
    }
    
    try {
      await semesterApi.complete(id);
      alert('Kết thúc học kỳ thành công!');
      fetchSemesters();
    } catch (err: unknown) {
      console.error('[SemesterList] Lỗi kết thúc học kỳ:', err);
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể kết thúc học kỳ');
    }
  };

  const handleManageRegistration = (semester: Semester) => {
    setSelectedSemester(semester);
    setIsRegistrationModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setEditingSemester(null);
    fetchSemesters();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSemester(null);
  };

  const handleRegistrationModalClose = () => {
    setIsRegistrationModalOpen(false);
    setSelectedSemester(null);
  };

  const handleRegistrationSuccess = () => {
    setIsRegistrationModalOpen(false);
    setSelectedSemester(null);
    fetchSemesters();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status: SemesterStatus) => {
    switch (status) {
      case SemesterStatus.UPCOMING:
        return <span className="badge status-upcoming">Sắp tới</span>;
      case SemesterStatus.ACTIVE:
        return <span className="badge status-active">Đang diễn ra</span>;
      case SemesterStatus.COMPLETED:
        return <span className="badge status-completed">Đã kết thúc</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getRegistrationBadge = (semester: Semester) => {
    if (!semester.registrationEnabled) {
      return <span className="badge registration-disabled">Đã khóa</span>;
    }
    return <span className="badge registration-enabled">Đang mở</span>;
  };

  const getRegistrationPeriod = (semester: Semester) => {
    if (!semester.registrationEnabled || !semester.registrationStartDate || !semester.registrationEndDate) {
      return '—';
    }
    return `${formatDate(semester.registrationStartDate)} - ${formatDate(semester.registrationEndDate)}`;
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
        <h1>Quản lý Học kỳ</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="icon">+</span>
          Thêm Học kỳ
        </button>
      </div>

      {error && (
        <div className="error-message">Lỗi: {error}</div>
      )}

      <div className="table-container">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : !semesters || semesters.length === 0 ? (
          <div className="no-data">Chưa có học kỳ nào</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã HK</th>
                <th>Tên Học kỳ</th>
                <th>Ngày BĐ</th>
                <th>Ngày KT</th>
                <th>TT</th>
                <th>ĐK</th>
                <th>Thời gian ĐK</th>
                <th className="center">MT</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {semesters.map((semester) => (
                <tr key={semester.semesterId}>
                  <td className="code">{semester.semesterCode}</td>
                  <td>{semester.semesterName}</td>
                  <td className="date-cell">{formatDate(semester.startDate)}</td>
                  <td className="date-cell">{formatDate(semester.endDate)}</td>
                  <td>{getStatusBadge(semester.status)}</td>
                  <td>{getRegistrationBadge(semester)}</td>
                  <td className="date-cell">
                    {getRegistrationPeriod(semester)}
                  </td>
                  {/* ⭐ MÔ TẢ - TOOLTIP BUTTON */}
                  <td className="center">
                    {semester.description ? (
                      <button
                        className="btn-icon-info"
                        onMouseEnter={(e) => showDescription(semester.description, e)}
                        onMouseLeave={hideDescription}
                        title="Xem mô tả"
                      >
                        ℹ️
                      </button>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="actions">
                    {semester.status === SemesterStatus.UPCOMING && (
                      <button
                        className="btn-action btn-activate"
                        onClick={() => handleActivate(semester.semesterId)}
                      >
                        KH
                      </button>
                    )}
                    
                    {semester.status === SemesterStatus.ACTIVE && (
                      <>
                        <button
                          className="btn-action btn-toggle-registration"
                          onClick={() => handleManageRegistration(semester)}
                        >
                          ĐK
                        </button>
                        <button
                          className="btn-action btn-complete"
                          onClick={() => handleComplete(semester.semesterId)}
                        >
                          KT
                        </button>
                      </>
                    )}
                    
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(semester)}
                      disabled={semester.status === SemesterStatus.COMPLETED}
                    >
                      Sửa
                    </button>
                    
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(semester.semesterId)}
                      disabled={deletingId === semester.semesterId || semester.status === SemesterStatus.ACTIVE}
                    >
                      {deletingId === semester.semesterId ? '...' : 'Xóa'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        <SemesterModal
          semester={editingSemester}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      {isRegistrationModalOpen && selectedSemester && (
        <RegistrationModal
          semester={selectedSemester}
          onClose={handleRegistrationModalClose}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
};

export default SemesterList;