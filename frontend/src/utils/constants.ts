// constants.ts - Days of week, time slots, etc.

// ==================== DAYS OF WEEK ====================

export const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Thứ 2', short: 'T2' },
  { value: 'TUESDAY', label: 'Thứ 3', short: 'T3' },
  { value: 'WEDNESDAY', label: 'Thứ 4', short: 'T4' },
  { value: 'THURSDAY', label: 'Thứ 5', short: 'T5' },
  { value: 'FRIDAY', label: 'Thứ 6', short: 'T6' },
  { value: 'SATURDAY', label: 'Thứ 7', short: 'T7' },
];

export const getDayOfWeekLabel = (value: string): string => {
  const day = DAYS_OF_WEEK.find(d => d.value === value);
  return day ? day.label : value;
};

export const getDayOfWeekShort = (value: string): string => {
  const day = DAYS_OF_WEEK.find(d => d.value === value);
  return day ? day.short : value;
};

// ==================== TIME SLOTS ====================

export const TIME_SLOTS = [
  { value: 'CA1', label: 'Ca 1', time: '06:45 - 09:15' },
  { value: 'CA2', label: 'Ca 2', time: '09:25 - 11:55' },
  { value: 'CA3', label: 'Ca 3', time: '12:10 - 14:40' },
  { value: 'CA4', label: 'Ca 4', time: '14:50 - 17:20' },
  { value: 'CA5', label: 'Ca 5', time: '17:30 - 20:00' },
];

export const getTimeSlotLabel = (value: string): string => {
  const slot = TIME_SLOTS.find(s => s.value === value);
  return slot ? slot.label : value;
};

export const getTimeSlotTime = (value: string): string => {
  const slot = TIME_SLOTS.find(s => s.value === value);
  return slot ? slot.time : '';
};

export const getTimeSlotDisplay = (value: string): string => {
  const slot = TIME_SLOTS.find(s => s.value === value);
  return slot ? `${slot.label} (${slot.time})` : value;
};

// ==================== CLASS STATUS ====================

export const CLASS_STATUS = {
  OPEN: { value: 'OPEN', label: 'Mở đăng ký', color: 'green' },
  FULL: { value: 'FULL', label: 'Đã đầy', color: 'red' },
  CLOSED: { value: 'CLOSED', label: 'Đã đóng', color: 'gray' },
  IN_PROGRESS: { value: 'IN_PROGRESS', label: 'Đang học', color: 'blue' },
  COMPLETED: { value: 'COMPLETED', label: 'Hoàn thành', color: 'gray' },
};

export const getClassStatusInfo = (value: string) => {
  return CLASS_STATUS[value as keyof typeof CLASS_STATUS] || { 
    value, 
    label: value, 
    color: 'gray' 
  };
};

// ==================== SESSION STATUS ====================

export const SESSION_STATUS = {
  SCHEDULED: { value: 'SCHEDULED', label: 'Đã lên lịch', color: 'blue' },
  COMPLETED: { value: 'COMPLETED', label: 'Hoàn thành', color: 'green' },
  CANCELLED: { value: 'CANCELLED', label: 'Đã hủy', color: 'red' },
};

export const getSessionStatusInfo = (value: string) => {
  return SESSION_STATUS[value as keyof typeof SESSION_STATUS] || { 
    value, 
    label: value, 
    color: 'gray' 
  };
};

// ==================== SESSION TYPE ====================

export const SESSION_TYPE = {
  IN_PERSON: { value: 'IN_PERSON', label: 'Trực tiếp', icon: '🏫' },
  E_LEARNING: { value: 'E_LEARNING', label: 'E-learning', icon: '💻' },
};

export const getSessionTypeInfo = (value: string) => {
  return SESSION_TYPE[value as keyof typeof SESSION_TYPE] || { 
    value, 
    label: value, 
    icon: '📚' 
  };
};

// ==================== VALIDATION ====================

export const validateClassCode = (code: string): string | null => {
  if (!code) return 'Mã lớp không được để trống';
  if (code.length > 20) return 'Mã lớp không quá 20 ký tự';
  if (!/^[A-Z0-9-]+$/.test(code)) return 'Mã lớp chỉ chứa chữ in hoa, số và dấu gạch ngang';
  return null;
};

export const validateRoom = (room: string): string | null => {
  if (!room) return 'Phòng không được để trống';
  if (room.length > 50) return 'Tên phòng không quá 50 ký tự';
  return null;
};

export const validateMaxStudents = (max: number): string | null => {
  if (!max) return 'Sĩ số tối đa không được để trống';
  if (max < 1) return 'Sĩ số tối đa phải ít nhất 1';
  if (max > 200) return 'Sĩ số tối đa không quá 200';
  return null;
};

// ==================== HELPERS ====================

/**
 * Format date to display
 * "2024-10-15" → "15/10/2024"
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format date to input value
 * "15/10/2024" → "2024-10-15"
 */
export const formatDateForInput = (dateStr: string): string => {
  if (!dateStr) return '';
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month}-${day}`;
};

/**
 * Check if date is in the past
 */
export const isPastDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Get class capacity display
 * "45/50" with percentage
 */
export const getCapacityDisplay = (enrolled: number, max: number) => {
  const percentage = Math.round((enrolled / max) * 100);
  return {
    text: `${enrolled}/${max}`,
    percentage,
    color: percentage >= 100 ? 'red' : percentage >= 80 ? 'orange' : 'green'
  };
};