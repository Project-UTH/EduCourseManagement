// types.ts - Shared types for Class Management
// ✅ SIMPLIFIED: Removed extra/elearning fields (backend auto-handles)

export interface ClassItem {
  classId: number;
  classCode: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  
  // Session counts (for display only)
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
  
  // Fixed schedule (backend auto-assigned)
  dayOfWeekDisplay: string;
  timeSlotDisplay: string;
  fixedRoom: string;         // ⭐ Auto-assigned by backend
  dayOfWeek: string;         // Raw value for editing
  timeSlot: string;          // Raw value for editing
  
  startDate: string;
  endDate: string;
  totalSessionsGenerated: number;
  rescheduledSessionsCount: number;
}

export interface Session {
  sessionId: number;
  sessionNumber: number;
  sessionType: string;  // "IN_PERSON" or "E_LEARNING"
  
  // Original schedule
  originalDate: string | null;
  originalDayOfWeekDisplay: string | null;
  originalTimeSlotDisplay: string | null;
  originalRoom: string | null;
  
  // Actual schedule (if rescheduled)
  actualDate: string | null;
  actualDayOfWeekDisplay: string | null;
  actualTimeSlotDisplay: string | null;
  actualRoom: string | null;
  
  // Effective schedule (what to display)
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

// ==================== FORM DATA ====================

/**
 * ✅ SIMPLIFIED: Form data for creating/updating class
 * Only fixed schedule needed - backend handles rest
 */
export interface ClassFormData {
  classCode: string;
  subjectId: number | null;
  teacherId: number | null;
  semesterId: number | null;
  maxStudents: number;
  
  // Fixed schedule only
  dayOfWeek: string;
  timeSlot: string;
  
  // ⭐ No room input - backend auto-assigns
  // ⭐ No extra schedule - backend auto-schedules when semester activated
  // ⭐ No elearning schedule - backend auto-creates
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