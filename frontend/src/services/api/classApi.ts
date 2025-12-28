import apiClient from './apiClient';

// ==================== INTERFACES ====================

/**
 * ✅ Class creation with schedule
 * - Fixed schedule: Required (admin chooses day + slot)
 * - E-learning schedule: Optional (only if subject has e-learning sessions)
 * - Backend auto-assigns rooms
 */
export interface ClassCreateRequest {
  classCode: string;
  subjectId: number;
  teacherId: number;
  semesterId: number;
  maxStudents: number;
  
  // Fixed schedule (required for in-person sessions)
  dayOfWeek: string;  // "MONDAY", "TUESDAY", etc.
  timeSlot: string;   // "CA1", "CA2", etc.
  
  // ⭐ E-learning schedule (required if subject has e-learning sessions)
  elearningDayOfWeek?: string;  // "MONDAY", "TUESDAY", etc.
  elearningTimeSlot?: string;   // "CA1", "CA2", etc.
  
  // ⭐ Backend auto-assigns rooms:
  // - Fixed sessions: Physical room (4-tier fallback)
  // - E-learning sessions: ONLINE room (no conflict check!)
}

/**
 * ✅ Class update
 */
export interface ClassUpdateRequest {
  teacherId: number;
  maxStudents: number;
  
  // Fixed schedule
  dayOfWeek: string;
  timeSlot: string;
  
  // E-learning schedule (if subject has e-learning)
  elearningDayOfWeek?: string;
  elearningTimeSlot?: string;
  
  // ⚠️ Changing schedule regenerates ALL sessions!
}

/**
 * Class response with all schedule info (display only)
 */
export interface ClassResponse {
  classId: number;
  classCode: string;
  
  // Subject
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  totalSessions: number;
  inPersonSessions: number;
  eLearningSessions: number;
  
  // Teacher
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  teacherDegree: string | null;
  
  // Semester
  semesterId: number;
  semesterCode: string;
  semesterName: string;
  semesterStatus: string;
  
  // Capacity
  maxStudents: number;
  enrolledCount: number;
  availableSeats: number;
  
  // Status
  status: string;
  canRegister: boolean;
  isFull: boolean;
  
  // Fixed schedule (from backend)
  dayOfWeek: string;
  dayOfWeekDisplay: string;
  timeSlot: string;
  timeSlotDisplay: string;
  fixedRoom: string;  // ⭐ Auto-assigned by backend
  
  // E-learning schedule (if applicable)
  elearningDayOfWeek?: string;
  elearningDayOfWeekDisplay?: string;
  elearningTimeSlot?: string;
  elearningTimeSlotDisplay?: string;
  elearningRoom?: string;  // Always "ONLINE"
  
  // Dates
  startDate: string;
  endDate: string;
  
  // Statistics
  totalSessionsGenerated: number;
  completedSessions: number;
  rescheduledSessionsCount: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// ==================== API METHODS ====================

const classApi = {
  
  /**
   * Create a new class
   * 
   * ⭐ AUTO-MAGIC:
   * 1. Backend auto-assigns rooms:
   *    - Fixed: Physical room (4-tier fallback, conflict check)
   *    - E-learning: ONLINE room (NO conflict check!)
   * 2. Backend auto-generates sessions:
   *    - 10 FIXED (with dates + physical room)
   *    - Extra (PENDING, no schedule yet)
   *    - E-learning (with dates + ONLINE room)
   * 3. Admin activates semester → Extra auto-scheduled
   */
  createClass: async (data: ClassCreateRequest): Promise<ClassResponse> => {
    console.log('[classApi] Creating class:', data.classCode);
    console.log('[classApi] Fixed schedule:', data.dayOfWeek, data.timeSlot);
    
    if (data.elearningDayOfWeek && data.elearningTimeSlot) {
      console.log('[classApi] E-learning schedule:', data.elearningDayOfWeek, data.elearningTimeSlot);
      console.log('[classApi] ℹ️ E-learning: ONLINE room, NO conflict check');
    }
    
    console.log('[classApi] 🎯 Backend will auto-assign rooms & generate sessions');
    
    try {
      const response = await apiClient.post('/api/admin/classes', data);
      console.log('[classApi] ✅ Class created successfully');
      console.log('[classApi] 🏠 Fixed room:', response.data.data.fixedRoom);
      
      if (response.data.data.elearningRoom) {
        console.log('[classApi] 💻 E-learning room:', response.data.data.elearningRoom);
      }
      
      console.log('[classApi] 📅 Sessions generated:', response.data.data.totalSessionsGenerated);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] ❌ Failed to create class:', error);
      
      // Log specific validation errors
      if (error.response?.data?.message) {
        console.error('[classApi] Error:', error.response.data.message);
      }
      
      throw error;
    }
  },
  
  /**
   * Update an existing class
   * 
   * ⚠️ WARNING: Changing schedule regenerates ALL sessions!
   */
  updateClass: async (id: number, data: ClassUpdateRequest): Promise<ClassResponse> => {
    console.log('[classApi] Updating class ID:', id);
    console.log('[classApi] ⚠️ WARNING: Schedule changes regenerate all sessions!');
    
    try {
      const response = await apiClient.put(`/api/admin/classes/${id}`, data);
      console.log('[classApi] ✅ Class updated successfully');
      console.log('[classApi] 📅 Sessions regenerated:', response.data.data.totalSessionsGenerated);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] ❌ Failed to update class:', error);
      throw error;
    }
  },
  
  /**
   * Delete a class
   * Cannot delete if has enrolled students
   */
  deleteClass: async (id: number): Promise<void> => {
    console.log('[classApi] Deleting class ID:', id);
    try {
      await apiClient.delete(`/api/admin/classes/${id}`);
      console.log('[classApi] ✅ Class deleted successfully');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] ❌ Failed to delete class:', error);
      throw error;
    }
  },
  
  /**
   * Get class by ID
   */
  getClassById: async (id: number): Promise<ClassResponse> => {
    console.log('[classApi] Fetching class ID:', id);
    try {
      const response = await apiClient.get(`/api/admin/classes/${id}`);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] ❌ Failed to fetch class:', error);
      throw error;
    }
  },
  
  /**
   * Get all classes with pagination
   */
  getAllClasses: async (
    page: number = 0,
    size: number = 10,
    sortBy: string = 'classCode',
    sortDir: string = 'asc'
  ): Promise<PageResponse<ClassResponse>> => {
    console.log(`[classApi] Fetching classes - page: ${page}, size: ${size}`);
    try {
      const response = await apiClient.get('/api/admin/classes', {
        params: { page, size, sortBy, sortDir }
      });
      console.log(`[classApi] ✅ Classes fetched: ${response.data.data.totalElements} total`);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] ❌ Failed to fetch classes:', error);
      throw error;
    }
  },
  
  /**
   * Get classes by semester
   */
  getClassesBySemester: async (semesterId: number): Promise<ClassResponse[]> => {
    console.log('[classApi] Fetching classes for semester:', semesterId);
    try {
      const response = await apiClient.get(`/api/admin/classes/semester/${semesterId}`);
      console.log(`[classApi] ✅ Semester classes fetched: ${response.data.data.length}`);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] ❌ Failed to fetch semester classes:', error);
      throw error;
    }
  },
  
  /**
   * Get classes by teacher
   */
  getClassesByTeacher: async (teacherId: number): Promise<ClassResponse[]> => {
    console.log('[classApi] Fetching classes for teacher:', teacherId);
    try {
      const response = await apiClient.get(`/api/admin/classes/teacher/${teacherId}`);
      console.log(`[classApi] ✅ Teacher classes fetched: ${response.data.data.length}`);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] ❌ Failed to fetch teacher classes:', error);
      throw error;
    }
  },
  
  /**
   * Get classes by subject
   */
  getClassesBySubject: async (subjectId: number): Promise<ClassResponse[]> => {
    console.log('[classApi] Fetching classes for subject:', subjectId);
    try {
      const response = await apiClient.get(`/api/admin/classes/subject/${subjectId}`);
      console.log(`[classApi] ✅ Subject classes fetched: ${response.data.data.length}`);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] ❌ Failed to fetch subject classes:', error);
      throw error;
    }
  },
  
  /**
   * Search classes by keyword
   */
  searchClasses: async (
    keyword: string,
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<ClassResponse>> => {
    console.log('[classApi] Searching classes with keyword:', keyword);
    try {
      const response = await apiClient.get('/api/admin/classes/search', {
        params: { keyword, page, size }
      });
      console.log(`[classApi] ✅ Search results: ${response.data.data.totalElements} found`);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] ❌ Failed to search classes:', error);
      throw error;
    }
  },
};

export default classApi;