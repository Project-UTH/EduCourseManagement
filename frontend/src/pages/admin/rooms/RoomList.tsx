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
    
    // Auto-refresh every 60 seconds to update real-time status
    const interval = setInterval(fetchRooms, 60000);
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
      const response = await fetch('/api/admin/semesters', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch semesters');
      }
      
      const result = await response.json();
      console.log('📅 Semesters API response:', result);
      
      // Handle different response formats
      let semestersData = [];
      
      if (Array.isArray(result)) {
        semestersData = result;
      } else if (result.data && Array.isArray(result.data)) {
        semestersData = result.data;
      } else if (result.content && Array.isArray(result.content)) {
        semestersData = result.content;
      } else {
        console.warn('⚠️ Unexpected semesters response format:', result);
        semestersData = [];
      }
      
      console.log('✅ Processed semesters:', semestersData);

      
      // Set current active semester as default
      if (semestersData.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const activeSemester = semestersData.find((s: any) => s.status === 'ACTIVE');
        if (activeSemester) {
          setSelectedSemester(activeSemester.id);
        } else {
          setSelectedSemester(semestersData[0].id);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching semesters:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      
      let data: PageData<RoomResponse>;
      
      // Search mode
      if (searchKeyword.trim()) {
        console.log('🔍 Searching rooms:', searchKeyword);
        data = await roomApi.searchRooms(searchKeyword, selectedSemester, currentPage, 10);
      }
      // Advanced filter mode
      else if (filterBuilding || filterFloor || filterType || filterAdminStatus || filterCurrentStatus) {
        console.log('🔎 Filtering rooms');
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
      }
      // Default: get all
      else {
        console.log('📋 Getting all rooms');
        data = await roomApi.getAllRooms(selectedSemester, currentPage, 10);
      }
      
      setRooms(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error('❌ Error fetching rooms:', error);
      alert('Lỗi khi tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      // Fetch buildings
      const buildingsData = await roomApi.getAllBuildings();
      setBuildings(buildingsData);
      
      // Fetch floors if building selected
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
    console.log('🔄 Manual refresh');
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
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Có lỗi xảy ra');
      }

      alert('✅ Xóa phòng thành công!');
      setDeletingRoom(null);
      fetchRooms();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error deleting room:', error);
      alert(error.message || 'Lỗi khi xóa phòng');
    }
  };

  const handleModalSuccess = () => {
    fetchRooms();
  };

  // ==================== RENDER HELPERS ====================

  // ⭐ FIXED: Removed time remaining display
  const getStatusBadge = (room: RoomResponse) => {
    switch (room.currentStatus) {
      case 'IN_USE':
        return (
          <span className="room-status-badge status-in-use">
            🟢 Đang dùng
          </span>
        );
      case 'AVAILABLE':
        return <span className="room-status-badge status-available">⚪ Trống</span>;
      case 'INACTIVE':
        return <span className="room-status-badge status-inactive">⚫ Ngừng HĐ</span>;
      default:
        return <span className="room-status-badge">—</span>;
    }
  };

  const renderCurrentSession = (room: RoomResponse) => {
    if (!room.currentSession) {
      return <span className="no-session-indicator">—</span>;
    }

    const { classCode, subjectName, timeSlotDisplay } = room.currentSession;
    
    return (
      <div className="current-session-info">
        <div className="session-class-code">{classCode}</div>
        <div className="session-subject-name">{subjectName}</div>
        <div className="session-time-slot">{timeSlotDisplay}</div>
      </div>
    );
  };

  const renderUtilization = (percentage: number) => {
    return (
      <div className="utilization-container">
        <div className="utilization-bar-wrapper">
          <div 
            className="utilization-bar-fill"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="utilization-percentage">
          {percentage.toFixed(1)}%
        </span>
      </div>
    );
  };

  // ==================== RENDER ====================

  return (
    <div className="room-list-page">
      {/* HEADER */}
      <div className="room-list-header">
        <h1 className="page-title">
          <span className="title-icon">🏢</span>
          Quản lý Phòng học
        </h1>
        <div className="header-actions">
          <button 
            className="create-room-button"
            onClick={handleCreate}
          >
            <span className="create-icon">➕</span>
            Thêm phòng
          </button>
          <button 
            className="refresh-button"
            onClick={handleRefresh}
            disabled={loading}
            title="Làm mới dữ liệu"
          >
            <span className="refresh-icon">🔄</span>
            Làm mới
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="room-filters-section">
        {/* Search Bar */}
        <form className="room-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="room-search-input"
            placeholder="Tìm theo mã phòng, tên, tòa nhà..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <button type="submit" className="room-search-button">
            <span className="search-icon">🔍</span>
            Tìm kiếm
          </button>
        </form>



        {/* Filter Controls */}
        <div className="room-filter-controls">
          <select
            className="room-filter-select"
            value={filterBuilding}
            onChange={(e) => {
              setFilterBuilding(e.target.value);
              setFilterFloor('');
            }}
          >
            <option value="">Tất cả tòa nhà</option>
            {buildings.map(building => (
              <option key={building} value={building}>{building}</option>
            ))}
          </select>

          <select
            className="room-filter-select"
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            disabled={!filterBuilding}
          >
            <option value="">Tất cả tầng</option>
            {floors.map(floor => (
              <option key={floor} value={floor}>Tầng {floor}</option>
            ))}
          </select>

          <select
            className="room-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Tất cả loại</option>
            <option value="LECTURE_HALL">Giảng đường</option>
            <option value="LAB">Phòng thực hành</option>
            <option value="COMPUTER_LAB">Phòng máy tính</option>
            <option value="SEMINAR_ROOM">Phòng seminar</option>
            <option value="ONLINE">Trực tuyến</option>
          </select>

          <select
            className="room-filter-select"
            value={filterAdminStatus}
            onChange={(e) => setFilterAdminStatus(e.target.value)}
          >
            <option value="">Admin: Tất cả</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Ngừng HĐ</option>
          </select>

          {/* Real-time Status Filter */}
          <select
            className="room-filter-select filter-status-special"
            value={filterCurrentStatus}
            onChange={(e) => setFilterCurrentStatus(e.target.value)}
          >
            <option value="">Trạng thái: Tất cả</option>
            <option value="IN_USE">🟢 Đang dùng</option>
            <option value="AVAILABLE">⚪ Trống</option>
            <option value="INACTIVE">⚫ Ngừng HĐ</option>
          </select>

          <button
            className="room-clear-filters-button"
            onClick={handleClearFilters}
          >
            <span className="clear-icon">✖</span>
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
                <th className="col-capacity">Sức chứa</th>
                <th className="col-status">⭐ Trạng thái</th>
                <th className="col-current-session">⭐ Đang dùng</th>
                <th className="col-utilization">Sử dụng</th>
                <th className="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.roomId} className="room-table-row">
                  <td className="col-room-code">
                    <strong className="room-code-text">{room.roomCode}</strong>
                  </td>
                  <td className="col-room-name">
                    {room.roomName || '—'}
                  </td>
                  <td className="col-location">
                    {room.building && room.floor ? (
                      <span>Tòa {room.building} - Tầng {room.floor}</span>
                    ) : '—'}
                  </td>
                  <td className="col-type">{room.roomTypeDisplay}</td>
                  <td className="col-capacity center-text">{room.capacityInfo}</td>
                  <td className="col-status">{getStatusBadge(room)}</td>
                  <td className="col-current-session">{renderCurrentSession(room)}</td>
                  <td className="col-utilization center-text">
                    {renderUtilization(room.utilizationPercentage)}
                  </td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => handleViewDetails(room.roomId)}
                        title="Xem chi tiết"
                      >
                        👁️
                      </button>
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(room)}
                        title="Sửa phòng"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(room)}
                        title="Xóa phòng"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="room-pagination">
          <div className="pagination-info">
            Hiển thị {rooms.length} / {totalElements} phòng
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-button"
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              ‹ Trước
            </button>
            <span className="pagination-page-number">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <button
              className="pagination-button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Sau ›
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isModalOpen && (
        <RoomModal
          room={editingRoom}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRoom(null);
          }}
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