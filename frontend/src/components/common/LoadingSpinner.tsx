import React from 'react';
import './common.css';

/**
 * LoadingSpinner Component
 * 
 * Displays a loading spinner
 * 
 * @example
 * <LoadingSpinner />
 * <LoadingSpinner size={60} message="Đang tải dữ liệu..." />
 */

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 40,
  message,
  fullScreen = false
}) => {
  if (fullScreen) {
    return (
      <div className="loading-spinner-fullscreen">
        <div className="loading-spinner-container">
          <div
            className="loading-spinner"
            style={{
              width: size,
              height: size,
            }}
          />
          {message && <div className="loading-message">{message}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="loading-spinner-container">
      <div
        className="loading-spinner"
        style={{
          width: size,
          height: size,
        }}
      />
      {message && <div className="loading-message">{message}</div>}
    </div>
  );
};

export default LoadingSpinner;