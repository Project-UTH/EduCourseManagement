import apiClient from './apiClient';

// ==================== INTERFACES ====================

/**
 * ✅ UPDATED: Added extra and elearning schedule fields
 */
export interface ClassCreateRequest {
  classCode: string;
  subjectId: number;
  teacherId: number;
  semesterId: number;
  maxStudents: number;
  
  // Fixed schedule (required)
  dayOfWeek: string;  // "MONDAY", "TUESDAY", etc.
  timeSlot: string;   // "CA1", "CA2", etc.
  room: string;
  
  // ⭐ NEW: Extra schedule (required if subject has > 10 in-person sessions)
  extraDayOfWeek?: string | null;
  extraTimeSlot?: string | null;
  extraRoom?: string | null;
  
  // ⭐ NEW: E-learning schedule (required if subject has e-learning sessions)
  elearningDayOfWeek?: string | null;
  elearningTimeSlot?: string | null;
  // elearningRoom is always "ONLINE" (auto-set by backend)
}

/**
 * ✅ UPDATED: Added extra and elearning schedule fields
 */
export interface ClassUpdateRequest {
  teacherId: number;
  maxStudents: number;
  
  // Fixed schedule
  dayOfWeek: string;
  timeSlot: string;
  room: string;
  
  // ⭐ NEW: Extra schedule
  extraDayOfWeek?: string | null;
  extraTimeSlot?: string | null;
  extraRoom?: string | null;
  
  // ⭐ NEW: E-learning schedule
  elearningDayOfWeek?: string | null;
  elearningTimeSlot?: string | null;
}

/**
 * ✅ UPDATED: Added extra and elearning schedule fields
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
  
  // Fixed schedule
  dayOfWeek: string;
  dayOfWeekDisplay: string;
  timeSlot: string;
  timeSlotDisplay: string;
  room: string;
  
  // ⭐ NEW: Extra schedule
  extraDayOfWeek: string | null;
  extraDayOfWeekDisplay: string | null;
  extraTimeSlot: string | null;
  extraTimeSlotDisplay: string | null;
  extraRoom: string | null;
  
  // ⭐ NEW: E-learning schedule
  elearningDayOfWeek: string | null;
  elearningDayOfWeekDisplay: string | null;
  elearningTimeSlot: string | null;
  elearningTimeSlotDisplay: string | null;
  elearningRoom: string | null;  // Always "ONLINE"
  
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
   * Auto-generates sessions based on subject
   * 
   * ⭐ VALIDATION:
   * - If subject.inpersonSessions > 10 → extraDayOfWeek, extraTimeSlot, extraRoom REQUIRED
   * - If subject.elearningSessions > 0 → elearningDayOfWeek, elearningTimeSlot REQUIRED
   */
  createClass: async (data: ClassCreateRequest): Promise<ClassResponse> => {
    console.log('[classApi] Creating class:', data.classCode);
    console.log('[classApi] Extra schedule:', data.extraDayOfWeek, data.extraTimeSlot, data.extraRoom);
    console.log('[classApi] E-learning schedule:', data.elearningDayOfWeek, data.elearningTimeSlot);
    
    try {
      const response = await apiClient.post('/api/admin/classes', data);
      console.log('[classApi] Class created successfully');
      console.log('[classApi] Sessions generated:', response.data.data.totalSessionsGenerated);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] Failed to create class:', error);
      
      // Log specific validation errors
      if (error.response?.data?.message) {
        console.error('[classApi] Validation error:', error.response.data.message);
      }
      
      throw error;
    }
  },
  
  /**
   * Update an existing class
   * 
   * ⚠️ WARNING: Changing ANY schedule will regenerate ALL sessions!
   * - Changing fixed schedule → regenerate all
   * - Changing extra schedule → regenerate all
   * - Changing elearning schedule → regenerate all
   */
  updateClass: async (id: number, data: ClassUpdateRequest): Promise<ClassResponse> => {
    console.log('[classApi] Updating class ID:', id);
    console.log('[classApi] ⚠️ WARNING: Schedule changes will regenerate all sessions!');
    
    try {
      const response = await apiClient.put(`/api/admin/classes/${id}`, data);
      console.log('[classApi] Class updated successfully');
      console.log('[classApi] Sessions regenerated:', response.data.data.totalSessionsGenerated);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] Failed to update class:', error);
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
      console.log('[classApi] Class deleted successfully');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] Failed to delete class:', error);
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
      console.error('[classApi] Failed to fetch class:', error);
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
      console.log(`[classApi] Classes fetched: ${response.data.data.totalElements} total`);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] Failed to fetch classes:', error);
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
      console.log(`[classApi] Semester classes fetched: ${response.data.data.length}`);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] Failed to fetch semester classes:', error);
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
      console.log(`[classApi] Teacher classes fetched: ${response.data.data.length}`);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] Failed to fetch teacher classes:', error);
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
      console.log(`[classApi] Subject classes fetched: ${response.data.data.length}`);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] Failed to fetch subject classes:', error);
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
      console.log(`[classApi] Search results: ${response.data.data.totalElements} found`);
      return response.data.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('[classApi] Failed to search classes:', error);
      throw error;
    }
  },
};

export default classApi;