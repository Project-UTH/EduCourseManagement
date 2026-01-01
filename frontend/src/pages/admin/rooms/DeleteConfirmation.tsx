import './DeleteConfirmation.css';

interface DeleteConfirmationProps {
  roomCode: string;
  roomName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmation = ({ 
  roomCode, 
  roomName, 
  onConfirm, 
  onCancel 
}: DeleteConfirmationProps) => {
  
  return (
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* ICON */}
        <div className="delete-icon-wrapper">
          <span className="delete-icon">🗑️</span>
        </div>

        {/* TITLE */}
        <h2 className="delete-title">Xác nhận xóa phòng</h2>

        {/* MESSAGE */}
        <div className="delete-message">
          <p>Bạn có chắc chắn muốn xóa phòng:</p>
          <div className="delete-room-info">
            <strong>{roomCode}</strong> - {roomName}
          </div>
          <p className="delete-warning">
            ⚠️ <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác!
          </p>
        </div>

        {/* BUTTONS */}
        <div className="delete-actions">
          <button
            className="delete-btn-cancel"
            onClick={onCancel}
          >
            Hủy
          </button>
          <button
            className="delete-btn-confirm"
            onClick={onConfirm}
          >
            🗑️ Xóa phòng
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;