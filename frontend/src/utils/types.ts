// types.ts - Shared types for Class Management
// ⭐ UPDATED: Added extra and elearning schedule fields

export interface ClassItem {
  classId: number;
  classCode: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  
  // ⭐ NEW: Session counts for validation
  totalSessions: number;
  inPersonSessions: number;
  eLearningSessions: number;
  
  teacherName: string;
  semesterCode: string;
  semesterStatus: string;
  maxStudents: number;
  enrolledCount: number;
  availableSeats: number;
  status: string;
  
  // ⭐ Fixed schedule (always present)
  dayOfWeekDisplay: string;
  timeSlotDisplay: string;
  room: string;
  dayOfWeek: string;        // Raw value for editing
  timeSlot: string;         // Raw value for editing
  
  // ⭐ NEW: Extra schedule (only if inPersonSessions > 10)
  extraDayOfWeek: string | null;
  extraDayOfWeekDisplay: string | null;
  extraTimeSlot: string | null;
  extraTimeSlotDisplay: string | null;
  extraRoom: string | null;
  
  // ⭐ NEW: E-learning schedule (only if eLearningSessions > 0)
  elearningDayOfWeek: string | null;
  elearningDayOfWeekDisplay: string | null;
  elearningTimeSlot: string | null;
  elearningTimeSlotDisplay: string | null;
  elearningRoom: string | null;  // Always "ONLINE"
  
  startDate: string;
  endDate: string;
  totalSessionsGenerated: number;
  rescheduledSessionsCount: number;
}

export interface Session {
  sessionId: number;
  sessionNumber: number;
  sessionType: string;  // "IN_PERSON" or "E_LEARNING"
  originalDate: string | null;
  originalDayOfWeekDisplay: string | null;
  originalTimeSlotDisplay: string | null;
  originalRoom: string | null;
  actualDate: string | null;
  actualDayOfWeekDisplay: string | null;
  actualTimeSlotDisplay: string | null;
  actualRoom: string | null;
  effectiveDate: string | null;
  effectiveDayOfWeekDisplay: string | null;
  effectiveTimeSlotDisplay: string | null;
  effectiveRoom: string | null;
  isRescheduled: boolean;
  rescheduleReason: string | null;
  status: string;
}

export interface Student {
  registrationId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  enrollmentType: string;
  enrollmentTypeDisplay: string;
  status: string;
  statusDisplay: string;
  registeredAt: string;
  enrolledByAdminName: string | null;
  enrollmentReason: string | null;
  enrollmentNote: string | null;
}

export interface SearchStudent {
  studentId: number;
  studentCode: string;
  fullName: string;
  email: string;
  majorName: string;
}

export interface Semester {
  semesterId: number;
  semesterCode: string;
  semesterName: string;
  status: string;
  startDate: string;
  endDate: string;
}

// ==================== NEW TYPES (for form & validation) ====================

/**
 * Form data for creating/updating class
 */
export interface ClassFormData {
  classCode: string;
  subjectId: number | null;
  teacherId: number | null;
  semesterId: number | null;
  maxStudents: number;
  
  // Fixed schedule
  dayOfWeek: string;
  timeSlot: string;
  room: string;
  
  // ⭐ Extra schedule (conditional)
  extraDayOfWeek: string;
  extraTimeSlot: string;
  extraRoom: string;
  
  // ⭐ E-learning schedule (conditional)
  elearningDayOfWeek: string;
  elearningTimeSlot: string;
}

/**
 * Validation errors for form
 */
export interface ValidationErrors {
  classCode?: string;
  subjectId?: string;
  teacherId?: string;
  semesterId?: string;
  maxStudents?: string;
  dayOfWeek?: string;
  timeSlot?: string;
  room?: string;
  extraDayOfWeek?: string;
  extraTimeSlot?: string;
  extraRoom?: string;
  elearningDayOfWeek?: string;
  elearningTimeSlot?: string;
  general?: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  totalPages?: number;
  totalItems?: number;
  currentPage?: number;
}