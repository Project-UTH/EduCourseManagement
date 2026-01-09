import { useState, useEffect } from 'react';
import teacherApi from '../../../services/api/teacherApi';
import './TeacherProfile.css';

/**
 * TeacherProfile Component
 * 
 * Teacher profile management page
 * Features:
 * - View profile information
 * - Edit profile (email, phone, address)
 * - Change password
 * - Teaching statistics
 * - Avatar display
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
    currentPassword: '',
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
      
      // Reload profile to get updated data
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
    
    setLoading(true);
    try {
      await teacherApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
      showMessage('success', 'Đổi mật khẩu thành công!');
    } catch (error: any) {
      console.error('Failed to change password:', error);
      const errorMessage = error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại!';
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

  if (loading && !profile) {
    return (
      <div className="teacher-profile-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="teacher-profile-container">
        <div className="error-state">
          <p>Không thể tải thông tin hồ sơ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-profile-container">
      {/* Page Header */}
      <div className="page-header">
        <h1>👤 Hồ sơ cá nhân</h1>
        <p>Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="profile-layout">
        {/* Left Column - Profile Card */}
        <div className="profile-sidebar">
          <div className="profile-card">
            {/* Avatar */}
            <div className="avatar-section">
              <div className="avatar-wrapper">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.fullName} className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder">
                    {profile.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="profile-name">{profile.fullName}</h2>
              <p className="profile-role">Giảng viên</p>
              <p className="profile-degree">{profile.degree}</p>
            </div>

            {/* Quick Info */}
            <div className="quick-info">
              <div className="info-item">
                <span className="info-icon">🆔</span>
                <div>
                  <div className="info-label">CCCD</div>
                  <div className="info-value">{profile.citizenId}</div>
                </div>
              </div>

              <div className="info-item">
                <span className="info-icon">📧</span>
                <div>
                  <div className="info-label">Email</div>
                  <div className="info-value">{profile.email}</div>
                </div>
              </div>

              <div className="info-item">
                <span className="info-icon">📞</span>
                <div>
                  <div className="info-label">Điện thoại</div>
                  <div className="info-value">{profile.phone}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="profile-actions">
              <button 
                className="btn-primary"
                onClick={() => setIsEditing(true)}
                disabled={isEditing || isChangingPassword}
              >
                ✏️ Chỉnh sửa
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setIsChangingPassword(true)}
                disabled={isEditing || isChangingPassword}
              >
                🔒 Đổi mật khẩu
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Details & Forms */}
        <div className="profile-main">
          {/* Profile Details (View Mode) */}
          {!isEditing && !isChangingPassword && (
            <div className="profile-section">
              <div className="section-header">
                <h3>📋 Thông tin chi tiết</h3>
              </div>

              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Họ và tên:</span>
                  <span className="detail-value">{profile.fullName}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Giới tính:</span>
                  <span className="detail-value">{formatGender(profile.gender)}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Ngày sinh:</span>
                  <span className="detail-value">{formatDate(profile.dateOfBirth)}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">CCCD:</span>
                  <span className="detail-value">{profile.citizenId}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{profile.email}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Điện thoại:</span>
                  <span className="detail-value">{profile.phone}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Khoa:</span>
                  <span className="detail-value">{profile.departmentName}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Chuyên ngành:</span>
                  <span className="detail-value">{profile.majorName}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Học vị:</span>
                  <span className="detail-value">{profile.degree}</span>
                </div>

                <div className="detail-row full-width">
                  <span className="detail-label">Địa chỉ:</span>
                  <span className="detail-value">{profile.address}</span>
                </div>
              </div>
            </div>
          )}

          {/* Edit Profile Form */}
          {isEditing && (
            <div className="profile-section">
              <div className="section-header">
                <h3>✏️ Chỉnh sửa thông tin</h3>
              </div>

              <form onSubmit={handleEditSubmit} className="edit-form">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
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
            <div className="profile-section">
              <div className="section-header">
                <h3>🔒 Đổi mật khẩu</h3>
              </div>

              <form onSubmit={handlePasswordSubmit} className="password-form">
                <div className="form-group">
                  <label>Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>

                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    placeholder="Nhập lại mật khẩu mới"
                    minLength={6}
                  />
                </div>

                <div className="password-hint">
                  💡 Mật khẩu phải có ít nhất 6 ký tự
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Đang xử lý...' : '🔒 Đổi mật khẩu'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
    </div>
  );
};

export default TeacherProfile;