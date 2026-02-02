import React, { useState, useEffect } from 'react';
import semesterApi, { SemesterResponse } from '../../../services/api/semesterApi';
import SemesterModal from './SemesterModal';
import './SemesterList.css';

const SemesterList: React.FC = () => {
  const [semesters, setSemesters] = useState<SemesterResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<SemesterResponse | null>(null);

  useEffect(() => { fetchSemesters(); }, [currentPage, searchKeyword]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      let response;
      if (searchKeyword.trim()) response = await semesterApi.search(searchKeyword, currentPage, 10);
      else response = await semesterApi.getAll(currentPage, 10, 'startDate', 'desc');
      
      const pageData = response.data;
      setSemesters(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setTotalElements(pageData.totalElements || 0);
    } catch (error) {
      console.error('Error fetching semesters:', error);
      alert('Lỗi tải danh sách học kỳ');
    } finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setCurrentPage(0); };
  const handleCreate = () => { setEditingSemester(null); setIsModalOpen(true); };
  
  const handleEdit = (semester: SemesterResponse) => {
    if (semester.status === 'COMPLETED') { alert('Không thể sửa học kỳ đã hoàn thành!'); return; }
    setEditingSemester(semester); setIsModalOpen(true);
  };

  const handleDelete = async (id: number, semesterName: string, status: string) => {
    if (status === 'ACTIVE') { alert('Không thể xóa học kỳ đang diễn ra! Hãy hoàn thành nó trước.'); return; }
    if (!window.confirm(`Xác nhận xóa học kỳ "${semesterName}"?`)) return;
    try { await semesterApi.delete(id); alert('Xóa học kỳ thành công!'); fetchSemesters(); } 
    catch  { alert('Lỗi xóa học kỳ'); }
  };

  const handleActivate = async (id: number, semesterName: string) => {
    if (!window.confirm(`Kích hoạt học kỳ "${semesterName}"?\nLưu ý: Học kỳ ĐANG HOẠT ĐỘNG hiện tại sẽ tự động chuyển sang HOÀN THÀNH.`)) return;
    try { await semesterApi.activate(id); alert('Kích hoạt học kỳ thành công!'); fetchSemesters(); } 
    catch { alert('Lỗi kích hoạt học kỳ'); }
  };

  const handleComplete = async (id: number, semesterName: string) => {
    if (!window.confirm(`Hoàn thành học kỳ "${semesterName}"?`)) return;
    try { await semesterApi.complete(id); alert('Hoàn thành học kỳ thành công!'); fetchSemesters(); } 
    catch  { alert('Lỗi hoàn thành học kỳ'); }
  };

  const handleToggleRegistration = async (semester: SemesterResponse) => {
    try {
      if (semester.registrationEnabled) {
        await semesterApi.disableRegistration(semester.semesterId); alert('Đã tắt đăng ký!');
      } else {
        if (!semester.registrationStartDate || !semester.registrationEndDate) { alert('Vui lòng đặt thời gian đăng ký trước!'); return; }
        await semesterApi.enableRegistration(semester.semesterId); alert('Đã bật đăng ký!');
      }
      fetchSemesters();
    } catch { alert('Lỗi thay đổi trạng thái đăng ký'); }
  };

  const handleModalClose = () => { setIsModalOpen(false); setEditingSemester(null); };
  const handleModalSuccess = () => { setIsModalOpen(false); setEditingSemester(null); fetchSemesters(); };

  const formatDate = (dateString: string | undefined) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : 'Chưa đặt';
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'UPCOMING': return 'Sắp diễn ra';
      case 'ACTIVE': return 'Đang diễn ra';
      case 'COMPLETED': return 'Đã hoàn thành';
      default: return status;
    }
  };

  const getRegistrationLabel = (semester: SemesterResponse) => {
    if (semester.isRegistrationOpen) return 'Đang mở ĐK';
    else if (semester.registrationEnabled) return 'ĐK đã bật';
    else return 'ĐK đã tắt';
  };

  return (
    <div className="semester-list-page">
      <div className="page-header">
        <h1>Quản lý Học kỳ</h1>
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
  <span>Thêm học kỳ</span>
</button>

      </div>

      <div className="main-card">
        <div className="filters-bar">
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="Tìm theo mã hoặc tên học kỳ..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <button type="submit" className="btn btn-search">Tìm kiếm</button>
          </form>
        </div>

        <div className="table-responsive">
          {loading ? ( <div className="loading">Đang tải dữ liệu...</div> ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã HK</th>
                    <th>Tên học kỳ</th>
                    <th>Thời gian học kỳ</th>
                    <th>Đăng ký</th>
                    <th>Trạng thái</th>
                    <th>TT Đăng ký</th>
                    <th className="center">Thời lượng</th>
                    <th className="center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {semesters.length === 0 ? (
                    <tr><td colSpan={8} className="center" style={{padding: '2rem'}}>Không có dữ liệu</td></tr>
                  ) : (
                    semesters.map((semester) => (
                      <tr key={semester.semesterId}>
                        <td><span className="code">{semester.semesterCode}</span></td>
                        <td><span className="semester-name">{semester.semesterName}</span></td>
                        <td>
                          <div className="date-range">
                            <span>{formatDate(semester.startDate)}</span> <span className="arrow">→</span> <span>{formatDate(semester.endDate)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="date-range">
                            <span>{formatDate(semester.registrationStartDate)}</span> <span className="arrow">→</span> <span>{formatDate(semester.registrationEndDate)}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${semester.status}`}>{getStatusLabel(semester.status)}</span>
                        </td>
                        <td>
                          <span className={`badge badge-reg-${semester.isRegistrationOpen ? 'open' : semester.registrationEnabled ? 'enabled' : 'closed'}`}>
                            {getRegistrationLabel(semester)}
                          </span>
                        </td>
                        <td className="center">
                          {semester.durationInWeeks} tuần ({semester.durationInDays} ngày)
                        </td>
                        <td>
                          <div className="btn-action-group">
                            {semester.status === 'UPCOMING' && (
                              <>
                                <button className="btn-sm btn-activate" onClick={() => handleActivate(semester.semesterId, semester.semesterName)} title="Kích hoạt">Bắt đầu</button>
                                <button 
                                  className={`btn-sm ${semester.registrationEnabled ? 'btn-reg-off' : 'btn-reg-on'}`} 
                                  onClick={() => handleToggleRegistration(semester)} 
                                  title={semester.registrationEnabled ? 'Tắt đăng ký' : 'Bật đăng ký'}
                                >
                                  {semester.registrationEnabled ? 'Tắt ĐK' : 'Mở ĐK'}
                                </button>
                              </>
                            )}
                            
                            {semester.status === 'ACTIVE' && (
                              <button className="btn-sm btn-complete" onClick={() => handleComplete(semester.semesterId, semester.semesterName)} title="Hoàn thành">HT</button>
                            )}
                            
                            {semester.status !== 'COMPLETED' && (
                              <button className="btn-sm btn-edit" onClick={() => handleEdit(semester)} title="Sửa">Sửa</button>
                            )}
                            
                            {semester.status !== 'ACTIVE' && (
                              <button className="btn-sm btn-delete" onClick={() => handleDelete(semester.semesterId, semester.semesterName, semester.status)} title="Xóa">Xóa</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="pagination">
                <div className="pagination-info">Hiển thị {semesters.length} / {totalElements} học kỳ</div>
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

      {isModalOpen && <SemesterModal semester={editingSemester} onClose={handleModalClose} onSuccess={handleModalSuccess} />}
    </div>
  );
};

export default SemesterList;