import { useAuthStore } from '@/store/authStore';
import './NotFound.css';

const NotFound = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Trang không tồn tại</h2>
        <p className="not-found-description">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <a
          href={isAuthenticated ? '/' : '/login'}
          className="not-found-button"
        >
          {isAuthenticated ? 'Về trang chủ' : 'Về trang đăng nhập'}
        </a>
      </div>
    </div>
  );
};

export default NotFound;