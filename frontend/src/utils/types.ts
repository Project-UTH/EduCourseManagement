// types.ts - Shared types for Class Management

export interface ClassItem {
  classId: number;
  classCode: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  teacherName: string;
  semesterCode: string;
  semesterStatus: string;
  maxStudents: number;
  enrolledCount: number;
  availableSeats: number;
  status: string;
  dayOfWeekDisplay: string;
  timeSlotDisplay: string;
  room: string;
  startDate: string;
  endDate: string;
  totalSessionsGenerated: number;
  rescheduledSessionsCount: number;
}

export interface Session {
  sessionId: number;
  sessionNumber: number;
  sessionType: string;
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