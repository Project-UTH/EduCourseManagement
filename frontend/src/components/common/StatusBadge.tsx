import React from 'react';
import './common.css';

/**
 * StatusBadge Component
 * 
 * Displays status with appropriate color and label
 * 
 * @example
 * <StatusBadge status="GRADED" />
 * <StatusBadge status="LATE" size="sm" />
 */

type StatusType = 
  | 'SUBMITTED' 
  | 'GRADED' 
  | 'LATE' 
  | 'IN_PROGRESS' 
  | 'PASSED' 
  | 'FAILED'
  | 'OPEN'
  | 'CLOSED'
  | 'OVERDUE';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md',
  className = ''
}) => {
  const getStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      padding: size === 'sm' ? '0.125rem 0.5rem' : size === 'lg' ? '0.375rem 1rem' : '0.25rem 0.75rem',
      fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '1rem' : '0.875rem',
      borderRadius: '9999px',
      fontWeight: '600',
      display: 'inline-block',
      whiteSpace: 'nowrap',
    };

    switch (status) {
      case 'SUBMITTED':
        return { ...baseStyles, background: '#dbeafe', color: '#1e40af' };
      case 'GRADED':
        return { ...baseStyles, background: '#d1fae5', color: '#065f46' };
      case 'LATE':
      case 'OVERDUE':
        return { ...baseStyles, background: '#fee2e2', color: '#991b1b' };
      case 'PASSED':
      case 'OPEN':
        return { ...baseStyles, background: '#d1fae5', color: '#065f46' };
      case 'FAILED':
      case 'CLOSED':
        return { ...baseStyles, background: '#fee2e2', color: '#991b1b' };
      case 'IN_PROGRESS':
        return { ...baseStyles, background: '#fef3c7', color: '#92400e' };
      default:
        return { ...baseStyles, background: '#f3f4f6', color: '#6b7280' };
    }
  };

  const getLabel = (): string => {
    switch (status) {
      case 'SUBMITTED': return ' Đã nộp';
      case 'GRADED': return ' Đã chấm';
      case 'LATE': return ' Muộn';
      case 'OVERDUE': return ' Quá hạn';
      case 'PASSED': return ' Đạt';
      case 'FAILED': return ' Không đạt';
      case 'IN_PROGRESS': return ' Đang học';
      case 'OPEN': return ' Mở';
      case 'CLOSED': return ' Đóng';
      default: return status;
    }
  };

  return (
    <span 
      className={`status-badge status-badge-${size} ${className}`}
      style={getStyles()}
    >
      {getLabel()}
    </span>
  );
};

export default StatusBadge;