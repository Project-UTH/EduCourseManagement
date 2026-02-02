import { useState, useEffect } from 'react';
import './RoomModal.css';

interface RoomModalProps {
  room: Room | null; // null = create mode, object = edit mode
  onClose: () => void;
  onSuccess: () => void;
}

interface Room {
  roomId?: number;
  roomCode: string;
  roomName: string;
  building: string;
  floor: number;
  roomType: string;
  capacity: number;
  isActive: boolean;
}

interface FormErrors {
  roomCode?: string;
  roomName?: string;
  building?: string;
  floor?: string;
  roomType?: string;
  capacity?: string;
}

const RoomModal = ({ room, onClose, onSuccess }: RoomModalProps) => {
  const isEditMode = room !== null;
  
  // Form state
  const [formData, setFormData] = useState<Room>({
    roomCode: '',
    roomName: '',
    building: '',
    floor: 1,
    roomType: 'LECTURE_HALL',
    capacity: 50,
    isActive: true
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // Initialize form when editing
  useEffect(() => {
    if (room) {
      setFormData({
        roomId: room.roomId,
        roomCode: room.roomCode,
        roomName: room.roomName,
        building: room.building,
        floor: room.floor,
        roomType: room.roomType,
        capacity: room.capacity,
        isActive: room.isActive
      });
    }
  }, [room]);

  // ==================== HANDLERS ====================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              (name === 'floor' || name === 'capacity') ? Number(value) :
              value
    }));
    
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Room Code
    if (!formData.roomCode.trim()) {
      newErrors.roomCode = 'Mã phòng không được để trống';
    } else if (formData.roomCode.length > 10) {
      newErrors.roomCode = 'Mã phòng không quá 10 ký tự';
    } else if (!/^[A-Z0-9]+$/.test(formData.roomCode)) {
      newErrors.roomCode = 'Mã phòng chỉ chứa chữ IN HOA và số (VD: A201, B105)';
    }
    
    // Room Name
    if (!formData.roomName.trim()) {
      newErrors.roomName = 'Tên phòng không được để trống';
    } else if (formData.roomName.length > 100) {
      newErrors.roomName = 'Tên phòng không quá 100 ký tự';
    }
    
    // Building
    if (!formData.building.trim()) {
      newErrors.building = 'Tòa nhà không được để trống';
    } else if (!/^[A-Z]$/.test(formData.building)) {
      newErrors.building = 'Tòa nhà phải là 1 chữ IN HOA (VD: A, B, C)';
    }
    
    // Floor
    if (formData.floor < 1 || formData.floor > 20) {
      newErrors.floor = 'Tầng phải từ 1 đến 20';
    }
    
    // Capacity
    if (formData.capacity < 1) {
      newErrors.capacity = 'Sức chứa phải lớn hơn 0';
    } else if (formData.capacity > 500) {
      newErrors.capacity = 'Sức chứa không quá 500';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      const url = isEditMode
        ? `/api/admin/rooms/${formData.roomId}`
        : '/api/admin/rooms';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          roomCode: formData.roomCode,
          roomName: formData.roomName,
          building: formData.building,
          floor: formData.floor,
          roomType: formData.roomType,
          capacity: formData.capacity,
          isActive: formData.isActive
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Có lỗi xảy ra');
      }
      
      alert(isEditMode ? 'Cập nhật phòng thành công!' : 'Tạo phòng thành công!');
      onSuccess();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Lỗi khi lưu phòng');
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="room-modal-overlay" onClick={onClose}>
      <div className="room-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="room-modal-header">
          <h2 className="room-modal-title">
            {isEditMode ? ' Sửa phòng học' : 'Thêm phòng học'}
          </h2>
          <button className="room-modal-close-btn" onClick={onClose}>
            ✖
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="room-modal-body">
          {/* Row 1: Room Code + Building */}
          <div className="room-form-row">
            <div className="room-form-group">
              <label className="room-form-label">
                Mã phòng <span className="required-star">*</span>
              </label>
              <input
                type="text"
                name="roomCode"
                className={`room-form-input ${errors.roomCode ? 'input-error' : ''}`}
                placeholder="VD: A201, B105, LAB01"
                value={formData.roomCode}
                onChange={handleChange}
                disabled={isEditMode} // Không cho sửa mã phòng
                maxLength={10}
              />
              {errors.roomCode && (
                <span className="room-error-text">{errors.roomCode}</span>
              )}
            </div>

            <div className="room-form-group">
              <label className="room-form-label">
                Tòa nhà <span className="required-star">*</span>
              </label>
              <input
                type="text"
                name="building"
                className={`room-form-input ${errors.building ? 'input-error' : ''}`}
                placeholder="VD: A, B, C, D"
                value={formData.building}
                onChange={handleChange}
                maxLength={1}
                style={{ textTransform: 'uppercase' }}
              />
              {errors.building && (
                <span className="room-error-text">{errors.building}</span>
              )}
            </div>
          </div>

          {/* Row 2: Room Name */}
          <div className="room-form-group">
            <label className="room-form-label">
              Tên phòng <span className="required-star">*</span>
            </label>
            <input
              type="text"
              name="roomName"
              className={`room-form-input ${errors.roomName ? 'input-error' : ''}`}
              placeholder="VD: Phòng thực hành, Giảng đường A, Lab máy tính"
              value={formData.roomName}
              onChange={handleChange}
              maxLength={100}
            />
            {errors.roomName && (
              <span className="room-error-text">{errors.roomName}</span>
            )}
          </div>

          {/* Row 3: Floor + Room Type */}
          <div className="room-form-row">
            <div className="room-form-group">
              <label className="room-form-label">
                Tầng <span className="required-star">*</span>
              </label>
              <input
                type="number"
                name="floor"
                className={`room-form-input ${errors.floor ? 'input-error' : ''}`}
                placeholder="VD: 1, 2, 3..."
                value={formData.floor}
                onChange={handleChange}
                min={1}
                max={20}
              />
              {errors.floor && (
                <span className="room-error-text">{errors.floor}</span>
              )}
            </div>

            <div className="room-form-group">
              <label className="room-form-label">
                Loại phòng <span className="required-star">*</span>
              </label>
              <select
                name="roomType"
                className="room-form-select"
                value={formData.roomType}
                onChange={handleChange}
              >
                <option value="LECTURE_HALL">Giảng đường</option>
                <option value="LAB">Phòng thực hành</option>
                <option value="COMPUTER_LAB">Phòng máy tính</option>
                <option value="SEMINAR_ROOM">Phòng seminar</option>
                <option value="ONLINE">Trực tuyến</option>
              </select>
            </div>
          </div>

          {/* Row 4: Capacity + Status */}
          <div className="room-form-row">
            <div className="room-form-group">
              <label className="room-form-label">
                Sức chứa <span className="required-star">*</span>
              </label>
              <input
                type="number"
                name="capacity"
                className={`room-form-input ${errors.capacity ? 'input-error' : ''}`}
                placeholder="VD: 50, 100, 200"
                value={formData.capacity}
                onChange={handleChange}
                min={1}
                max={500}
              />
              {errors.capacity && (
                <span className="room-error-text">{errors.capacity}</span>
              )}
              <span className="room-input-hint">Số chỗ ngồi tối đa</span>
            </div>

            <div className="room-form-group">
              <label className="room-form-label">Trạng thái</label>
              <div className="room-checkbox-wrapper">
                <label className="room-checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="room-checkbox"
                  />
                  <span className="room-checkbox-text">
                    {formData.isActive ? ' Đang hoạt động' : ' Ngừng hoạt động'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* INFO BOX */}
          <div className="room-info-box">
            <strong> Thông tin:</strong>
            <ul>
              <li>Mã phòng: Chỉ chữ IN HOA và số (VD: A201, LAB05)</li>
              <li>Tòa nhà: 1 chữ IN HOA (A-Z)</li>
              <li>Tầng: Từ 1 đến 20</li>
              <li>Sức chứa: Từ 1 đến 500 chỗ ngồi</li>
            </ul>
          </div>

          {/* FOOTER */}
          <div className="room-modal-footer">
            <button
              type="button"
              className="room-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="room-btn-submit"
              disabled={loading}
            >
              {loading ? ' Đang xử lý...' : isEditMode ? ' Cập nhật' : ' Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;