import apiClient from './apiClient';

/**
 * Student Class API Service
 * 
 * Handles:
 * - Get enrolled classes
 * - Get class details
 * - Get class schedule
 */

// ==================== INTERFACES ====================

export interface StudentClassResponse {
  classId: number;
  classCode: string;
  className: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  teacherId: number;
  teacherName: string;
  semesterId: number;
  semesterName: string;
  academicYear: string;
  roomId?: number;
  roomName?: string;
  schedule?: string; // "Thứ 2, Ca 1 (06:45 - 09:15)"
  maxStudents: number;
  enrolledCount: number; // ⭐ FIXED: Changed from currentStudents to match backend
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  registrationDate?: string;
}

export interface ClassDetailResponse {
  classId: number;
  classCode: string;
  className: string;
  subject: {
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    credits: number;
    description?: string;
  };
  teacher: {
    teacherId: number;
    fullName: string;
    email?: string;
    phone?: string;
    degree?: string;
  };
  semester: {
    semesterId: number;
    semesterName: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  };
  room?: {
    roomId: number;
    roomName: string;
    building?: string;
    capacity?: number;
  };
  schedule: ClassSchedule[];
  maxStudents: number;
  enrolledCount: number; // ⭐ FIXED: Changed from currentStudents to match backend
  registrationDate?: string;
}

export interface ClassSchedule {
  sessionId: number;
  dayOfWeek: number; // 2 = Monday, 3 = Tuesday, etc.
  timeSlotId: number;
  timeSlotName: string;
  startTime: string;
  endTime: string;
  roomId?: number;
  roomName?: string;
  sessionType: 'FIXED' | 'EXTRA' | 'ELEARNING';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiError {
  response?: {
    data?: unknown;
  };
  message: string;
}

const studentClassApi = {
  /**
   * Get all enrolled classes
   * GET /api/student/classes
   */
  getMyClasses: async (): Promise<StudentClassResponse[]> => {
    console.log('[studentClassApi] Fetching my classes');
    
    try {
      const response = await apiClient.get<ApiResponse<StudentClassResponse[]>>(
        '/api/student/classes'
      );
      
      console.log('[studentClassApi] ✅ Classes fetched:', response.data.data.length);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentClassApi] ❌ Failed to fetch classes:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get class detail
   * GET /api/student/classes/{id}
   */
  getClassDetail: async (classId: number): Promise<ClassDetailResponse> => {
    console.log('[studentClassApi] Fetching class detail:', classId);
    
    try {
      const response = await apiClient.get<ApiResponse<ClassDetailResponse>>(
        `/api/student/classes/${classId}`
      );
      
      console.log('[studentClassApi] ✅ Class detail fetched:', response.data.data.className);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentClassApi] ❌ Failed to fetch class detail:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get my schedule
   * GET /api/student/schedule
   */
  getMySchedule: async (semesterId?: number): Promise<ClassSchedule[]> => {
    console.log('[studentClassApi] Fetching my schedule');
    
    try {
      const response = await apiClient.get<ApiResponse<ClassSchedule[]>>(
        '/api/student/schedule',
        { params: { semesterId } }
      );
      
      console.log('[studentClassApi] ✅ Schedule fetched');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentClassApi] ❌ Failed to fetch schedule:', apiError.response?.data || apiError.message);
      throw error;
    }
  },
};

export default studentClassApi;