import React, { useState, useEffect } from 'react';
import semesterApi, { Semester } from '../../../services/api/semesterApi';

/**
 * Registration Modal Component - Manage registration period
 */

interface RegistrationModalProps {
  semester: Semester;
  onClose: () => void;
  onSuccess: () => void;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({
  semester,
  onClose,
  onSuccess,
}) => {
  const [enabled, setEnabled] = useState(semester.registrationEnabled);
  const [startDate, setStartDate] = useState(semester.registrationStartDate || '');
  const [endDate, setEndDate] = useState(semester.registrationEndDate || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEnabled(semester.registrationEnabled);
    setStartDate(semester.registrationStartDate || '');
    setEndDate(semester.registrationEndDate || '');
  }, [semester]);

  const validateDates = (): boolean => {
    if (!enabled) return true;

    if (!startDate || !endDate) {
      setError('Vui lòng chọn ngày bắt đầu và kết thúc đăng ký');
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const semesterStart = new Date(semester.startDate);
    const semesterEnd = new Date(semester.endDate);

    if (end <= start) {
      setError('Ngày kết thúc phải sau ngày bắt đầu');
      return false;
    }

    if (start < semesterStart || end > semesterEnd) {
      setError('Thời gian đăng ký phải nằm trong khoảng thời gian học kỳ');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDates()) {
      return;
    }

    try {
      setLoading(true);
      await semesterApi.toggleRegistration(
        semester.semesterId,
        enabled,
        enabled ? startDate : undefined,
        enabled ? endDate : undefined
      );
      alert(enabled ? 'Mở đăng ký thành công!' : 'Khóa đăng ký thành công!');
      onSuccess();
    } catch (err: unknown) {
      console.error('[RegistrationModal] Lỗi:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Quản lý Đăng ký - {semester.semesterName}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Enable/Disable Toggle */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                disabled={loading}
              />
              <span>Cho phép sinh viên đăng ký học phần</span>
            </label>
          </div>

          {enabled && (
            <>
              {/* Registration Start Date */}
              <div className="form-group">
                <label htmlFor="startDate">
                  Ngày bắt đầu đăng ký <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={semester.startDate}
                  max={semester.endDate}
                  disabled={loading}
                  required={enabled}
                />
                <span className="helper-text">
                  Trong khoảng: {new Date(semester.startDate).toLocaleDateString('vi-VN')} - {new Date(semester.endDate).toLocaleDateString('vi-VN')}
                </span>
              </div>

              {/* Registration End Date */}
              <div className="form-group">
                <label htmlFor="endDate">
                  Ngày kết thúc đăng ký <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || semester.startDate}
                  max={semester.endDate}
                  disabled={loading}
                  required={enabled}
                />
              </div>
            </>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrationModal;