import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import roomApi, { RoomResponse, PageData } from '../../../services/api/roomApi';
import RoomModal from './RoomModal';
import DeleteConfirmation from './DeleteConfirmation';
import './RoomList.css';

const RoomList = () => {
  const navigate = useNavigate();
  
  // State
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterAdminStatus, setFilterAdminStatus] = useState('');
  const [filterCurrentStatus, setFilterCurrentStatus] = useState('');
  
  // Lookups
  const [buildings, setBuildings] = useState<string[]>([]);
  const [floors, setFloors] = useState<number[]>([]);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomResponse | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<RoomResponse | null>(null);
  
  // Semester
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  // ==================== FETCH DATA ====================

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 60000); // Auto-refresh status
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchKeyword, filterBuilding, filterFloor, filterType, filterAdminStatus, filterCurrentStatus, selectedSemester]);

  useEffect(() => {
    fetchLookups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterBuilding]);

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      // Mocking fetch logic for brevity based on your provided code
      const response = await fetch('/api/admin/semesters', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch semesters');
      const result = await response.json();
      
      let semestersData = [];
      if (Array.isArray(result)) semestersData = result;
      else if (result.data) semestersData = result.data;
      else if (result.content) semestersData = result.content;

      if (semestersData.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeSemester = semestersData.find((s: any) => s.status === 'ACTIVE');
        setSelectedSemester(activeSemester ? activeSemester.id : semestersData[0].id);
      }
    } catch (error) {
      console.error('❌ Error fetching semesters:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      let data: PageData<RoomResponse>;
      
      if (searchKeyword.trim()) {
        data = await roomApi.searchRooms(searchKeyword, selectedSemester, currentPage, 10);
      } else if (filterBuilding || filterFloor || filterType || filterAdminStatus || filterCurrentStatus) {
        data = await roomApi.filterRooms(
          {
            building: filterBuilding || undefined,
            floor: filterFloor ? Number(filterFloor) : undefined,
            roomType: filterType || undefined,
            isActive: filterAdminStatus ? filterAdminStatus === 'ACTIVE' : undefined,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currentStatus: filterCurrentStatus as any || undefined
          },
          selectedSemester,
          currentPage,
          10
        );
      } else {
        data = await roomApi.getAllRooms(selectedSemester, currentPage, 10);
      }
      
      setRooms(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error('❌ Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const buildingsData = await roomApi.getAllBuildings();
      setBuildings(buildingsData);
      if (filterBuilding) {
        const floorsData = await roomApi.getFloorsByBuilding(filterBuilding);
        setFloors(floorsData);
      } else {
        setFloors([]);
      }
    } catch (error) {
      console.error('❌ Error fetching lookups:', error);
    }
  };

  // ==================== HANDLERS ====================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    fetchRooms();
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setFilterBuilding('');
    setFilterFloor('');
    setFilterType('');
    setFilterAdminStatus('');
    setFilterCurrentStatus('');
    setCurrentPage(0);
  };

  const handleViewDetails = (roomId: number) => {
    navigate(`/admin/rooms/${roomId}`);
  };

  const handleRefresh = () => {
    fetchRooms();
  };

  const handleCreate = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const handleEdit = (room: RoomResponse) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleDelete = (room: RoomResponse) => {
    setDeletingRoom(room);
  };

  const confirmDelete = async () => {
    if (!deletingRoom) return;
    try {
      const response = await fetch(`/api/admin/rooms/${deletingRoom.roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Error deleting');
      alert('✅ Xóa phòng thành công!');
      setDeletingRoom(null);
      fetchRooms();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error deleting room:', error);
      alert('Lỗi khi xóa phòng');
    }
  };

  const handleModalSuccess = () => {
    fetchRooms();
  };

  // ==================== RENDER HELPERS ====================

  const getStatusBadge = (room: RoomResponse) => {
    switch (room.currentStatus) {
      case 'IN_USE':
        return <span className="room-status-badge status-in-use"> Đang dùng</span>;
      case 'AVAILABLE':
        return <span className="room-status-badge status-available"> Trống</span>;
      case 'INACTIVE':
        return <span className="room-status-badge status-inactive"> Ngừng HĐ</span>;
      default:
        return <span className="room-status-badge">—</span>;
    }
  };

  const renderCurrentSession = (room: RoomResponse) => {
    if (!room.currentSession) return <span className="no-session-indicator">—</span>;
    const { classCode, subjectName, timeSlotDisplay } = room.currentSession;
    return (
      <div className="current-session-info">
        <div className="session-class-code">{classCode}</div>
        <div className="session-subject-name">{subjectName}</div>
        <div className="session-time-slot">{timeSlotDisplay}</div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  return (
    <div className="room-list-page"> {/* ROOT CLASS FOR CSS SCOPING */}
      
      {/* HEADER */}
      <div className="room-list-header">
        <h1 className="page-title">
          <span className="title-icon"></span>
          Quản lý Phòng học
        </h1>
        <div className="header-actions">
          <button className="create-room-button" onClick={handleCreate}>
            Thêm phòng
          </button>
          <button className="refresh-button" onClick={handleRefresh} disabled={loading} title="Làm mới dữ liệu">
             Làm mới
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="room-filters-section">
        <form className="room-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="room-search-input"
            placeholder="Tìm theo mã phòng, tên, tòa nhà..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <button type="submit" className="room-search-button">
             Tìm kiếm
          </button>
        </form>

        <div className="room-filter-controls">
          <select 
            className="room-filter-select"
            value={filterBuilding}
            onChange={(e) => { setFilterBuilding(e.target.value); setFilterFloor(''); }}
          >
            <option value="">Tất cả tòa nhà</option>
            {buildings.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select 
            className="room-filter-select"
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            disabled={!filterBuilding}
          >
            <option value="">Tất cả tầng</option>
            {floors.map(f => <option key={f} value={f}>Tầng {f}</option>)}
          </select>

          <select className="room-filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Tất cả loại</option>
            <option value="LECTURE_HALL">Giảng đường</option>
            <option value="LAB">Phòng thực hành</option>
            <option value="COMPUTER_LAB">Phòng máy tính</option>
            <option value="SEMINAR_ROOM">Phòng seminar</option>
            <option value="ONLINE">Trực tuyến</option>
          </select>

          <select className="room-filter-select" value={filterAdminStatus} onChange={(e) => setFilterAdminStatus(e.target.value)}>
            <option value="">Admin: Tất cả</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Ngừng HĐ</option>
          </select>

          <select className="room-filter-select filter-status-special" value={filterCurrentStatus} onChange={(e) => setFilterCurrentStatus(e.target.value)}>
            <option value="">Trạng thái: Tất cả</option>
            <option value="IN_USE"> Đang dùng</option>
            <option value="AVAILABLE">Trống</option>
            <option value="INACTIVE"> Ngừng HĐ</option>
          </select>

          <button className="room-clear-filters-button" onClick={handleClearFilters}>
         Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* STATISTICS */}
      <div className="room-stats-bar">
        <div className="stat-item">
          <span className="stat-label">Tổng số phòng:</span>
          <span className="stat-value">{totalElements}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Đang hiển thị:</span>
          <span className="stat-value">{rooms.length}</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="room-table-wrapper">
        {loading ? (
          <div className="room-loading-state">
            <div className="loading-spinner"></div>
            <span>Đang tải...</span>
          </div>
        ) : rooms.length === 0 ? (
          <div className="room-empty-state">
            <span className="empty-icon">📭</span>
            <p>Không tìm thấy phòng nào</p>
          </div>
        ) : (
          <table className="room-data-table">
            <thead>
              <tr>
                <th className="col-room-code">Mã phòng</th>
                <th className="col-room-name">Tên phòng</th>
                <th className="col-location">Vị trí</th>
                <th className="col-type">Loại phòng</th>
                <th className="col-capacity center-text">Sức chứa</th>
                <th className="col-status">Trạng thái</th>
                <th className="col-current-session">Đang dùng</th>
                <th className="col-actions center-text">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.roomId} className="room-table-row">
                  <td className="col-room-code"><strong>{room.roomCode}</strong></td>
                  <td className="col-room-name">{room.roomName || '—'}</td>
                  <td className="col-location">
                    {room.building && room.floor ? `Tòa ${room.building} - Tầng ${room.floor}` : '—'}
                  </td>
                  <td className="col-type">{room.roomTypeDisplay}</td>
                  <td className="col-capacity center-text">{room.capacityInfo}</td>
                  <td className="col-status">{getStatusBadge(room)}</td>
                  <td className="col-current-session">{renderCurrentSession(room)}</td>
                  <td className="col-actions">
                    <div className="action-buttons">
  <div className="action-row top">
    <button
      className="btn-view"
      onClick={() => handleViewDetails(room.roomId)}
      title="Xem chi tiết"
    >
      Xem
    </button>

    <button
      className="btn-delete"
      onClick={() => handleDelete(room)}
      title="Xóa phòng"
    >
       Xóa
    </button>
  </div>

  <div className="action-row bottom">
    <button
      className="btn-edit"
      onClick={() => handleEdit(room)}
      title="Sửa phòng"
    >
       Sửa
    </button>
  </div>
</div>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
   <div className="room-pagination">
  <div className="pagination-info">
    Hiển thị {rooms.length} / {totalElements} phòng
  </div>

  <div className="pagination-controls">
    <button
      className="pagination-button"
      onClick={() => setCurrentPage(0)}
      disabled={currentPage === 0}
    >
      «
    </button>

    <button
      className="pagination-button"
      onClick={() => setCurrentPage(currentPage - 1)}
      disabled={currentPage === 0}
    >
      ‹
    </button>

    <span className="pagination-current">
      {currentPage + 1}
    </span>

    <button
      className="pagination-button"
      onClick={() => setCurrentPage(currentPage + 1)}
      disabled={currentPage >= totalPages - 1}
    >
      ›
    </button>

    <button
      className="pagination-button"
      onClick={() => setCurrentPage(totalPages - 1)}
      disabled={currentPage >= totalPages - 1}
    >
      »
    </button>
  </div>
</div>


      {/* MODALS */}
      {isModalOpen && (
        <RoomModal
          room={editingRoom}
          onClose={() => { setIsModalOpen(false); setEditingRoom(null); }}
          onSuccess={handleModalSuccess}
        />
      )}

      {deletingRoom && (
        <DeleteConfirmation
          roomCode={deletingRoom.roomCode}
          roomName={deletingRoom.roomName}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingRoom(null)}
        />
      )}
    </div>
  );
};

export default RoomList;