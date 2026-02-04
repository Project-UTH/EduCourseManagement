import apiClient from './apiClient';

/**
 * Homework API Service
 * 
 * Handles homework CRUD operations and statistics
 * Maps to TeacherHomeworkController endpoints
 * 
 * ✅ FIXED: Backend returns data directly, NOT wrapped in {data: {...}}
 * ✅ NEW: Support FormData for file upload
 * ✅ FIXED: Datetime formatting for backend compatibility (yyyy-MM-ddTHH:mm:ss)
 */

// ==================== INTERFACES (from backend DTOs) ====================

export interface HomeworkRequest {
  classId: number;
  title: string;
  description?: string;
  homeworkType: 'REGULAR' | 'MIDTERM' | 'FINAL';
  deadline: string; // ISO datetime: "2025-12-25T23:59:00"
  maxScore?: number; // Default 10.00
  attachmentUrl?: string;
}

export interface HomeworkResponse {
  homeworkId: number;
  classId: number;
  classCode: string;
  subjectName: string;
  title: string;
  description?: string;
  homeworkType: 'REGULAR' | 'MIDTERM' | 'FINAL';
  homeworkTypeDisplay: string;
  maxScore: number;
  deadline: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt?: string;
  
  // Status flags
  isOverdue: boolean;
  canSubmit: boolean;
  timeRemaining?: string;
  
  // Statistics (optional)
  submissionCount?: number;
  gradedCount?: number;
  ungradedCount?: number;
  averageScore?: number;
}

export interface HomeworkDetailResponse extends HomeworkResponse {
  classInfo: {
    classId: number;
    classCode: string;
    subjectName: string;
    subjectCode: string;
    totalStudents?: number;
  };
  statistics: {
    totalSubmissions: number;
    gradedCount: number;
    ungradedCount: number;
    lateCount: number;
    averageScore?: number;
    highestScore?: number;
    lowestScore?: number;
    submissionRate: number;
    completionRate: number;
  };
  submissions: any[]; // Will use SubmissionResponse type
}

export interface HomeworkStatsResponse {
  homeworkId: number;
  title: string;
  classCode: string;
  totalStudents: number;
  
  submissionStats: {
    totalSubmissions: number;
    gradedSubmissions: number;
    ungradedSubmissions: number;
    notSubmitted: number;
    submissionRate: number;
    gradingCompletion: number;
  };
  
  scoreStats: {
    averageScore: number;
    medianScore: number;
    highestScore: number;
    lowestScore: number;
    standardDeviation: number;
    passRate: number;
  };
  
  scoreDistribution: {
    range_0_4: number;
    range_4_5: number;
    range_5_6: number;
    range_6_7: number;
    range_7_8: number;
    range_8_9: number;
    range_9_10: number;
  };
  
  lateStats: {
    totalLate: number;
    lateRate: number;
    averageLateScore: number;
    averageOnTimeScore: number;
    averageLateDuration: string;
  };
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format datetime to backend format: yyyy-MM-ddTHH:mm:ss
 * Handles various input formats and ensures consistent output
 * 
 * @param datetime - Date string or Date object
 * @returns Formatted string "2026-02-05T17:00:00" or empty string if invalid
 */
const formatDatetimeForBackend = (datetime: string | Date): string => {
  if (!datetime) {
    console.warn('[homeworkApi] Empty datetime provided');
    return '';
  }
  
  try {
    const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
    
    // Check if valid date
    if (isNaN(date.getTime())) {
      console.error('[homeworkApi] Invalid date:', datetime);
      return '';
    }
    
    // Format to: 2026-02-05T17:00:00
    // Using toISOString() gives: 2026-02-05T10:00:00.000Z
    // We take first 19 chars to get: 2026-02-05T10:00:00
    const formatted = date.toISOString().slice(0, 19);
    console.log('[homeworkApi] Formatted datetime:', datetime, '→', formatted);
    
    return formatted;
  } catch (error) {
    console.error('[homeworkApi] Date format error:', error);
    return '';
  }
};

/**
 * Prepare homework data for backend submission
 * Ensures all datetime fields are properly formatted
 * 
 * @param data - Raw homework request data
 * @returns Prepared data with formatted datetime
 */
const prepareHomeworkData = (data: HomeworkRequest): HomeworkRequest => {
  const prepared = {
    ...data,
    deadline: formatDatetimeForBackend(data.deadline),
  };
  
  console.log('[homeworkApi] Prepared data:', {
    title: prepared.title,
    type: prepared.homeworkType,
    originalDeadline: data.deadline,
    formattedDeadline: prepared.deadline,
  });
  
  return prepared;
};

// ==================== API METHODS ====================

const homeworkApi = {
  
  /**
   * ✅ FIXED: Create new homework with file upload
   * POST /api/teacher/homework
   * 
   * Accepts either:
   * 1. HomeworkRequest (JSON) - for backward compatibility
   * 2. FormData - for file upload
   */
  createHomework: async (data: HomeworkRequest | FormData): Promise<HomeworkResponse> => {
    console.log('[homeworkApi] Creating homework');
    
    try {
      let response;
      
      // Check if data is FormData (file upload)
      if (data instanceof FormData) {
        console.log('[homeworkApi] Uploading with file');
        
        // ✅ FIX: Format deadline in FormData if present
        const deadline = data.get('deadline');
        if (deadline && typeof deadline === 'string') {
          const formattedDeadline = formatDatetimeForBackend(deadline);
          data.set('deadline', formattedDeadline);
          console.log('[homeworkApi] FormData deadline formatted:', deadline, '→', formattedDeadline);
        }
        
        // Send as multipart/form-data
        response = await apiClient.post('/api/teacher/homework', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // ✅ FIX: Prepare data before sending (JSON)
        const preparedData = prepareHomeworkData(data);
        console.log('[homeworkApi] Creating without file');
        console.log('[homeworkApi] Type:', preparedData.homeworkType, 'Deadline:', preparedData.deadline);
        
        response = await apiClient.post('/api/teacher/homework', preparedData);
      }
      
      // ✅ FIX: Backend returns {success, message, data: {...}}
      // Extract data from response
      const homework = response.data.data || response.data;
      
      console.log('[homeworkApi] ✅ Homework created:', homework.homeworkId);
      return homework;
    } catch (error: any) {
      console.error('[homeworkApi] ❌ Failed to create homework:', error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  /**
   * ✅ FIXED: Update homework with proper datetime format
   * PUT /api/teacher/homework/{id}
   */
  updateHomework: async (id: number, data: HomeworkRequest): Promise<HomeworkResponse> => {
    console.log('[homeworkApi] Updating homework ID:', id);
    console.log('[homeworkApi] Original deadline:', data.deadline);
    
    try {
      // ✅ FIX: Prepare data with formatted deadline
      const preparedData = prepareHomeworkData(data);
      console.log('[homeworkApi] Formatted deadline:', preparedData.deadline);
      
      const response = await apiClient.put(`/api/teacher/homework/${id}`, preparedData);
      
      // ✅ FIX: Extract data
      const homework = response.data.data || response.data;
      
      console.log('[homeworkApi] ✅ Homework updated successfully');
      return homework;
    } catch (error: any) {
      console.error('[homeworkApi] ❌ Failed to update homework:', error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  /**
   * Delete homework
   * DELETE /api/teacher/homework/{id}
   */
  deleteHomework: async (id: number): Promise<void> => {
    console.log('[homeworkApi] Deleting homework ID:', id);
    
    try {
      await apiClient.delete(`/api/teacher/homework/${id}`);
      console.log('[homeworkApi] ✅ Homework deleted');
    } catch (error: any) {
      console.error('[homeworkApi] ❌ Failed to delete homework:', error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  /**
   * ✅ FIXED: Get homework by ID
   * GET /api/teacher/homework/{id}
   */
  getHomeworkById: async (id: number): Promise<HomeworkResponse> => {
    console.log('[homeworkApi] Fetching homework ID:', id);
    
    try {
      const response = await apiClient.get(`/api/teacher/homework/${id}`);
      
      // ✅ FIX: Extract data
      const homework = response.data.data || response.data;
      
      return homework;
    } catch (error: any) {
      console.error('[homeworkApi] ❌ Failed to fetch homework:', error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  /**
   * ✅ FIXED: Get homework detail with submissions
   * GET /api/teacher/homework/{id}/detail
   */
  getHomeworkDetail: async (id: number): Promise<HomeworkDetailResponse> => {
    console.log('[homeworkApi] Fetching homework detail ID:', id);
    
    try {
      const response = await apiClient.get(`/api/teacher/homework/${id}/detail`);
      
      // ✅ FIX: Extract data
      const detail = response.data.data || response.data;
      
      console.log('[homeworkApi] ✅ Detail loaded:', detail.submissions?.length || 0, 'submissions');
      return detail;
    } catch (error: any) {
      console.error('[homeworkApi] ❌ Failed to fetch detail:', error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  /**
   * ✅ FIXED: Get all homework for a class
   * GET /api/teacher/homework/class/{classId}
   * 
   * 🔧 CRITICAL FIX: Backend returns ARRAY directly, NOT wrapped!
   * Backend response: [{homeworkId: 1, ...}, {homeworkId: 2, ...}]
   * OR: [] (empty array if no homework)
   */
  getHomeworkByClass: async (classId: number): Promise<HomeworkResponse[]> => {
    console.log('[homeworkApi] Fetching homework for class:', classId);
    
    try {
      const response = await apiClient.get(`/api/teacher/homework/class/${classId}`);
      
      // ✅ FIX: Backend might return:
      // 1. {success: true, data: [...]} (wrapped)
      // 2. [...] (direct array)
      // Handle both cases
      let homework: HomeworkResponse[];
      
      if (response.data.data) {
        // Wrapped format
        homework = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Direct array format
        homework = response.data;
      } else {
        // Unknown format, assume empty
        console.warn('[homeworkApi] ⚠️ Unexpected response format:', response.data);
        homework = [];
      }
      
      console.log('[homeworkApi] ✅ Found', homework.length, 'homework');
      return homework;
      
    } catch (error: any) {
      console.error('[homeworkApi] ❌ Failed to fetch homework:', error.response?.data?.message || error.message);
      
      // If 404 or no data, return empty array instead of throwing
      if (error.response?.status === 404) {
        console.log('[homeworkApi] ℹ️ Class has no homework yet (404)');
        return [];
      }
      
      throw error;
    }
  },
  
  /**
   * ✅ FIXED: Get all homework for current teacher
   * GET /api/teacher/homework/my
   */
  getMyHomework: async (): Promise<HomeworkResponse[]> => {
    console.log('[homeworkApi] Fetching all my homework');
    
    try {
      const response = await apiClient.get('/api/teacher/homework/my');
      
      // ✅ FIX: Handle both wrapped and direct array
      let homework: HomeworkResponse[];
      
      if (response.data.data) {
        homework = response.data.data;
      } else if (Array.isArray(response.data)) {
        homework = response.data;
      } else {
        homework = [];
      }
      
      console.log('[homeworkApi] ✅ Found', homework.length, 'homework');
      return homework;
      
    } catch (error: any) {
      console.error('[homeworkApi] ❌ Failed to fetch homework:', error.response?.data?.message || error.message);
      
      if (error.response?.status === 404) {
        return [];
      }
      
      throw error;
    }
  },
  
  /**
   * ✅ FIXED: Get homework with pagination
   * GET /api/teacher/homework/my/page
   */
  getMyHomeworkPaginated: async (
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<HomeworkResponse>> => {
    console.log(`[homeworkApi] Fetching homework page ${page}, size ${size}`);
    
    try {
      const response = await apiClient.get('/api/teacher/homework/my/page', {
        params: { page, size }
      });
      
      // ✅ FIX: Extract data
      const pageData = response.data.data || response.data;
      
      console.log('[homeworkApi] ✅ Page loaded:', pageData.totalElements, 'total');
      return pageData;
    } catch (error: any) {
      console.error('[homeworkApi] ❌ Failed to fetch page:', error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  /**
   * ✅ FIXED: Filter homework
   * GET /api/teacher/homework/class/{classId}/filter
   */
  filterHomework: async (
    classId: number,
    type?: 'REGULAR' | 'MIDTERM' | 'FINAL',
    startDate?: string,
    endDate?: string,
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<HomeworkResponse>> => {
    console.log('[homeworkApi] Filtering homework:', { classId, type });
    
    try {
      const response = await apiClient.get(`/api/teacher/homework/class/${classId}/filter`, {
        params: { type, startDate, endDate, page, size }
      });
      
      // ✅ FIX: Extract data
      const pageData = response.data.data || response.data;
      
      return pageData;
    } catch (error: any) {
      console.error('[homeworkApi] ❌ Filter failed:', error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  /**
   * ✅ FIXED: Get homework statistics
   * GET /api/teacher/homework/{id}/stats
   */
  getHomeworkStats: async (id: number): Promise<HomeworkStatsResponse> => {
    console.log('[homeworkApi] Fetching stats for homework:', id);
    
    try {
      const response = await apiClient.get(`/api/teacher/homework/${id}/stats`);
      
      // ✅ FIX: Extract data
      const stats = response.data.data || response.data;
      
      console.log('[homeworkApi] ✅ Stats loaded');
      return stats;
    } catch (error: any) {
      console.error('[homeworkApi] ❌ Failed to fetch stats:', error.response?.data?.message || error.message);
      throw error;
    }
  },
};

export default homeworkApi;