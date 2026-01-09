import React from 'react';
import './common.css';

/**
 * StatCard Component
 * 
 * Displays a statistic with icon, label, and value
 * Used in dashboards and list pages
 * 
 * @example
 * <StatCard 
 *   icon="📝" 
 *   label="Tổng bài tập" 
 *   value={24} 
 *   color="#10b981"
 *   subtext="Trong tháng này"
 * />
 */

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
  subtext?: string;
  onClick?: () => void;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  label, 
  value, 
  color = '#10b981',
  subtext,
  onClick,
  className = ''
}) => {
  return (
    <div 
      className={`stat-card ${onClick ? 'stat-card-clickable' : ''} ${className}`}
      onClick={onClick}
      style={{ borderLeftColor: color }}
    >
      <div className="stat-card-icon" style={{ color }}>
        {icon}
      </div>
      <div className="stat-card-content">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value" style={{ color }}>
          {value}
        </div>
        {subtext && (
          <div className="stat-card-subtext">{subtext}</div>
        )}
      </div>
    </div>
  );
};

export default StatCard;