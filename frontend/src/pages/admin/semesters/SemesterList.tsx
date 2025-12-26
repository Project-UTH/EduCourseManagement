import React, { useState, useEffect } from 'react';
import semesterApi, { SemesterResponse } from '../../../services/api/semesterApi';
import SemesterModal from './SemesterModal';
import './SemesterList.css';

const SemesterList: React.FC = () => {
  // State
  const [semesters, setSemesters] = useState<SemesterResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<SemesterResponse | null>(null);

  // Fetch semesters when page or search changes
  useEffect(() => {
    fetchSemesters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchKeyword]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      let response;

      if (searchKeyword.trim()) {
        // Search mode
        response = await semesterApi.search(searchKeyword, currentPage, 10);
      } else {
        // Get all with pagination
        response = await semesterApi.getAll(currentPage, 10, 'startDate', 'desc');
      }

      const pageData = response.data;
      setSemesters(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
    } catch (error) {
      console.error('Error fetching semesters:', error);
      alert('Lỗi tải danh sách học kỳ');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const handleCreate = () => {
    setEditingSemester(null);
    setIsModalOpen(true);
  };

  const handleEdit = (semester: SemesterResponse) => {
    if (semester.status === 'COMPLETED') {
      alert('Không thể sửa học kỳ đã hoàn thành!');
      return;
    }
    setEditingSemester(semester);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number, semesterName: string, status: string) => {
    if (status === 'ACTIVE') {
      alert('Không thể xóa học kỳ đang diễn ra! Hãy hoàn thành nó trước.');
      return;
    }

    if (!window.confirm(`Xác nhận xóa học kỳ "${semesterName}"?`)) {
      return;
    }

    try {
      await semesterApi.delete(id);
      alert('Xóa học kỳ thành công!');
      fetchSemesters();
    } catch (error) {
      console.error('Error deleting semester:', error);
      alert('Lỗi xóa học kỳ');
    }
  };

  const handleActivate = async (id: number, semesterName: string) => {
    if (!window.confirm(
      `Kích hoạt học kỳ "${semesterName}"?\n\n` +
      `Lưu ý: Học kỳ ĐANG HOẠT ĐỘNG hiện tại sẽ tự động chuyển sang HOÀN THÀNH.`
    )) {
      return;
    }

    try {
      await semesterApi.activate(id);
      alert('Kích hoạt học kỳ thành công!');
      fetchSemesters();
    } catch (error) {
      console.error('Error activating semester:', error);
      alert('Lỗi kích hoạt học kỳ');
    }
  };

  const handleComplete = async (id: number, semesterName: string) => {
    if (!window.confirm(`Hoàn thành học kỳ "${semesterName}"?`)) {
      return;
    }

    try {
      await semesterApi.complete(id);
      alert('Hoàn thành học kỳ thành công!');
      fetchSemesters();
    } catch (error) {
      console.error('Error completing semester:', error);
      alert('Lỗi hoàn thành học kỳ');
    }
  };

  const handleToggleRegistration = async (semester: SemesterResponse) => {
    try {
      if (semester.registrationEnabled) {
        await semesterApi.disableRegistration(semester.semesterId);
        alert('Đã tắt đăng ký!');
      } else {
        if (!semester.registrationStartDate || !semester.registrationEndDate) {
          alert('Vui lòng đặt thời gian đăng ký trước!');
          return;
        }
        await semesterApi.enableRegistration(semester.semesterId);
        alert('Đã bật đăng ký!');
      }
      fetchSemesters();
    } catch (error) {
      console.error('Error toggling registration:', error);
      alert('Lỗi thay đổi trạng thái đăng ký');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSemester(null);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    setEditingSemester(null);
    fetchSemesters();
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Chưa đặt';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'UPCOMING': return 'Sắp diễn ra';
      case 'ACTIVE': return 'Đang diễn ra';
      case 'COMPLETED': return 'Đã hoàn thành';
      default: return status;
    }
  };

  const getRegistrationLabel = (semester: SemesterResponse) => {
    if (semester.isRegistrationOpen) {
      return 'Đang mở ĐK';
    } else if (semester.registrationEnabled) {
      return 'ĐK đã bật';
    } else {
      return 'ĐK đã tắt';
    }
  };

  return (
    <div className="semester-page-container">
      {/* HEADER */}
      <div className="semester-page-header">
        <h1>📅 Quản lý Học kỳ</h1>
        <button className="semester-btn-primary" onClick={handleCreate}>
          <span className="semester-icon">+</span>
          Thêm Học kỳ
        </button>
      </div>

      {/* FILTERS */}
      <div className="semester-filters-bar">
        <form className="semester-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="semester-search-input"
            placeholder="Tìm theo mã hoặc tên học kỳ (VD: 2024-1)..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <button type="submit" className="semester-btn-search">
            🔍 Tìm kiếm
          </button>
        </form>
      </div>

      {/* TABLE */}
      <div className="semester-table-container">
        {loading ? (
          <div className="semester-loading">Đang tải dữ liệu...</div>
        ) : (
          <>
            <table className="semester-data-table">
              <thead>
                <tr>
                  <th>Mã học kỳ</th>
                  <th>Tên học kỳ</th>
                  <th>Thời gian học kỳ</th>
                  <th>Đăng ký</th>
                  <th>Trạng thái</th>
                  <th>Đăng ký</th>
                  <th>Thời lượng</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {semesters.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="semester-no-data">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  semesters.map((semester) => (
                    <tr key={semester.semesterId}>
                      <td className="semester-code">{semester.semesterCode}</td>
                      <td className="semester-font-semibold">{semester.semesterName}</td>
                      <td>
                        <div className="semester-date-range">
                          <div>{formatDate(semester.startDate)}</div>
                          <div className="semester-arrow">→</div>
                          <div>{formatDate(semester.endDate)}</div>
                        </div>
                      </td>
                      <td>
                        <div className="semester-date-range semester-small">
                          <div>{formatDate(semester.registrationStartDate)}</div>
                          <div className="semester-arrow">→</div>
                          <div>{formatDate(semester.registrationEndDate)}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`semester-badge semester-badge-${semester.status.toLowerCase()}`}>
                          {getStatusLabel(semester.status)}
                        </span>
                      </td>
                      <td>
                        <span className={`semester-badge semester-badge-reg-${
                          semester.isRegistrationOpen ? 'open' : 
                          semester.registrationEnabled ? 'enabled' : 'closed'
                        }`}>
                          {getRegistrationLabel(semester)}
                        </span>
                      </td>
                      <td className="semester-center">
                        {semester.durationInWeeks} tuần ({semester.durationInDays} ngày)
                      </td>
                      <td>
                        <div className="semester-actions">
                          {semester.status === 'UPCOMING' && (
                            <>
                              <button
                                className="semester-btn-activate"
                                onClick={() => handleActivate(semester.semesterId, semester.semesterName)}
                                title="Kích hoạt"
                              >
                                ▶️
                              </button>
                              <button
                                className={semester.registrationEnabled ? 'semester-btn-reg-on' : 'semester-btn-reg-off'}
                                onClick={() => handleToggleRegistration(semester)}
                                title={semester.registrationEnabled ? 'Tắt đăng ký' : 'Bật đăng ký'}
                              >
                                {semester.registrationEnabled ? '🔓' : '🔒'}
                              </button>
                            </>
                          )}
                          
                          {semester.status === 'ACTIVE' && (
                            <button
                              className="semester-btn-complete"
                              onClick={() => handleComplete(semester.semesterId, semester.semesterName)}
                              title="Hoàn thành"
                            >
                              ✅
                            </button>
                          )}
                          
                          {semester.status !== 'COMPLETED' && (
                            <button
                              className="semester-btn-edit"
                              onClick={() => handleEdit(semester)}
                              title="Sửa"
                            >
                              ✏️
                            </button>
                          )}
                          
                          {semester.status !== 'ACTIVE' && (
                            <button
                              className="semester-btn-delete"
                              onClick={() => handleDelete(semester.semesterId, semester.semesterName, semester.status)}
                              title="Xóa"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* PAGINATION */}
            <div className="semester-pagination">
              <div className="semester-pagination-info">
                Hiển thị {semesters.length} / {totalElements} học kỳ
              </div>
              <div className="semester-pagination-controls">
                <button
                  className="semester-btn-page"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  « Trước
                </button>
                <span className="semester-page-info">
                  Trang {currentPage + 1} / {totalPages || 1}
                </span>
                <button
                  className="semester-btn-page"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  Sau »
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <SemesterModal
          semester={editingSemester}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default SemesterList;