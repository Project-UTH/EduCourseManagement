import { useState, useEffect } from 'react';
import teacherApi from '../../../services/api/teacherApi';
import './TeacherProfile.css';
import ChatList from '../../../components/chat/ChatList';
import { useAuthStore } from '@/store/authStore';


/**
 * TeacherProfile Component - Namespaced (tp-)
 * * Teacher profile management page
 */

const TeacherProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    email: '',
    phone: '',
    address: '',
  });

  // Change password form state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await teacherApi.getProfile();
      setProfile(data);
      setEditForm({
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      showMessage('error', 'Không thể tải thông tin hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await teacherApi.updateProfile(editForm);
      await loadProfile();
      setIsEditing(false);
      showMessage('success', 'Cập nhật thông tin thành công!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const errorMessage = error.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại!';
      showMessage('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'Mật khẩu mới không khớp!');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }
    
    const payload = {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
    };
    
    setLoading(true);
    try {
      await teacherApi.changePassword(payload);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
      showMessage('success', 'Đổi mật khẩu thành công!');
    } catch (error: any) {
      console.error('Failed to change password:', error);
      const errorMessage = error.response?.data?.message || 'Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu cũ!';
      showMessage('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatGender = (gender: string) => {
    const genders: Record<string, string> = {
      MALE: 'Nam',
      FEMALE: 'Nữ',
      OTHER: 'Khác',
    };
    return genders[gender] || gender;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };
  const user = useAuthStore((state: any) => state.user);


  if (loading && !profile) {
    return (
      <div className="tp-container">
        <div className="tp-loading">
          <div className="tp-spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="tp-container">
        <div className="tp-error">
          <p>Không thể tải thông tin hồ sơ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-container">
      {/* Page Header */}
      <div className="tp-header">
        <h1>👤 Hồ sơ cá nhân</h1>
        <p>Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`tp-alert tp-alert-${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="tp-layout">
        {/* Left Column - Profile Card */}
        <div className="tp-sidebar">
          <div className="tp-card">
            {/* Avatar */}
            <div className="tp-avatar-section">
              <div className="tp-avatar-wrapper">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.fullName} className="tp-avatar-img" />
                ) : (
                  <div className="tp-avatar-placeholder">
                    {profile.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="tp-name">{profile.fullName}</h2>
              <p className="tp-role">Giảng viên</p>
              <p className="tp-degree">{profile.degree}</p>
            </div>

            {/* Quick Info */}
            <div className="tp-quick-info">
              <div className="tp-info-item">
                <span className="tp-info-icon">🆔</span>
                <div>
                  <div className="tp-info-label">CCCD</div>
                  <div className="tp-info-value">{profile.citizenId}</div>
                </div>
              </div>

              <div className="tp-info-item">
                <span className="tp-info-icon">📧</span>
                <div>
                  <div className="tp-info-label">Email</div>
                  <div className="tp-info-value">{profile.email}</div>
                </div>
              </div>

              <div className="tp-info-item">
                <span className="tp-info-icon">📞</span>
                <div>
                  <div className="tp-info-label">Điện thoại</div>
                  <div className="tp-info-value">{profile.phone}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="tp-actions">
              <button 
                className="tp-btn tp-btn-primary"
                onClick={() => setIsEditing(true)}
                disabled={isEditing || isChangingPassword}
              >
                ✏️ Chỉnh sửa
              </button>
              <button 
                className="tp-btn tp-btn-secondary"
                onClick={() => setIsChangingPassword(true)}
                disabled={isEditing || isChangingPassword}
              >
                🔒 Đổi mật khẩu
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Details & Forms */}
        <div className="tp-main">
          {/* Profile Details (View Mode) */}
          {!isEditing && !isChangingPassword && (
            <div className="tp-section">
              <div className="tp-section-header">
                <h3>📋 Thông tin chi tiết</h3>
              </div>

              <div className="tp-detail-grid">
                <div className="tp-detail-row">
                  <span className="tp-detail-label">Họ và tên:</span>
                  <span className="tp-detail-value">{profile.fullName}</span>
                </div>

                <div className="tp-detail-row">
                  <span className="tp-detail-label">Giới tính:</span>
                  <span className="tp-detail-value">{formatGender(profile.gender)}</span>
                </div>

                <div className="tp-detail-row">
                  <span className="tp-detail-label">Ngày sinh:</span>
                  <span className="tp-detail-value">{formatDate(profile.dateOfBirth)}</span>
                </div>

                <div className="tp-detail-row">
                  <span className="tp-detail-label">CCCD:</span>
                  <span className="tp-detail-value">{profile.citizenId}</span>
                </div>

                <div className="tp-detail-row">
                  <span className="tp-detail-label">Email:</span>
                  <span className="tp-detail-value">{profile.email}</span>
                </div>

                <div className="tp-detail-row">
                  <span className="tp-detail-label">Điện thoại:</span>
                  <span className="tp-detail-value">{profile.phone}</span>
                </div>

                <div className="tp-detail-row">
                  <span className="tp-detail-label">Khoa:</span>
                  <span className="tp-detail-value">{profile.departmentName}</span>
                </div>

                <div className="tp-detail-row">
                  <span className="tp-detail-label">Chuyên ngành:</span>
                  <span className="tp-detail-value">{profile.majorName}</span>
                </div>

                <div className="tp-detail-row">
                  <span className="tp-detail-label">Học vị:</span>
                  <span className="tp-detail-value">{profile.degree}</span>
                </div>

                <div className="tp-detail-row full-width">
                  <span className="tp-detail-label">Địa chỉ:</span>
                  <span className="tp-detail-value">{profile.address}</span>
                </div>
              </div>
            </div>
          )}

          {/* Edit Profile Form */}
          {isEditing && (
            <div className="tp-section">
              <div className="tp-section-header">
                <h3>✏️ Chỉnh sửa thông tin</h3>
              </div>

              <form onSubmit={handleEditSubmit} className="tp-form">
                <div className="tp-form-group">
                  <label>Email</label>
                  <input
                    className="tp-input"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="tp-form-group">
                  <label>Số điện thoại</label>
                  <input
                    className="tp-input"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="tp-form-group">
                  <label>Địa chỉ</label>
                  <textarea
                    className="tp-textarea"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="tp-form-actions">
                  <button type="submit" className="tp-btn tp-btn-primary" disabled={loading}>
                    {loading ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                  </button>
                  <button 
                    type="button" 
                    className="tp-btn tp-btn-secondary" 
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        email: profile.email,
                        phone: profile.phone,
                        address: profile.address,
                      });
                    }}
                    disabled={loading}
                  >
                    ❌ Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Change Password Form */}
          {isChangingPassword && (
            <div className="tp-section">
              <div className="tp-section-header">
                <h3>🔒 Đổi mật khẩu</h3>
              </div>

              <form onSubmit={handlePasswordSubmit} className="tp-form">
                <div className="tp-form-group">
                  <label>Mật khẩu hiện tại</label>
                  <input
                    className="tp-input"
                    type="password"
                    name="oldPassword"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    required
                    placeholder="Nhập mật khẩu hiện tại"
                    autoComplete="current-password"
                  />
                </div>

                <div className="tp-form-group">
                  <label>Mật khẩu mới</label>
                  <input
                    className="tp-input"
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>

                <div className="tp-form-group">
                  <label>Xác nhận mật khẩu mới</label>
                  <input
                    className="tp-input"
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>

                <div className="tp-password-hint">
                  💡 Mật khẩu phải có ít nhất 6 ký tự
                </div>

                <div className="tp-form-actions">
                  <button type="submit" className="tp-btn tp-btn-primary" disabled={loading}>
                    {loading ? 'Đang xử lý...' : '🔒 Đổi mật khẩu'}
                  </button>
                  <button 
                    type="button" 
                    className="tp-btn tp-btn-secondary" 
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    disabled={loading}
                  >
                    ❌ Hủy
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <ChatList currentUsername={user?.username || 'teacher'} currentRole="TEACHER" />
    </div>
  );
};

export default TeacherProfile;