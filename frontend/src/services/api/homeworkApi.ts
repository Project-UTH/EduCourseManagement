import apiClient from './apiClient';
import { AxiosError } from 'axios';

/**
 * Homework API Service
 * * Handles homework CRUD operations and statistics
 * Maps to TeacherHomeworkController endpoints
 * * FIXED: Backend returns data directly, NOT wrapped in {data: {...}}
 * NEW: Support FormData for file upload
 * FIXED: Datetime formatting for backend compatibility (yyyy-MM-ddTHH:mm:ss)
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
  submissions: unknown[]; // Changed from any[] to unknown[]
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

// Interface helper để extract data an toàn mà không dùng any
interface ResponseWrapper<T> {
  data?: T;
  [key: string]: unknown;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format datetime to backend format: yyyy-MM-ddTHH:mm:ss
 * Handles various input formats and ensures consistent output
 * * @param datetime - Date string or Date object
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
    console.log('[homeworkApi] Formatted datetime:', datetime, '->', formatted);
    
    return formatted;
  } catch (error) {
    console.error('[homeworkApi] Date format error:', error);
    return '';
  }
};

/**
 * Prepare homework data for backend submission
 * Ensures all datetime fields are properly formatted
 * * @param data - Raw homework request data
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
   * FIXED: Create new homework with file upload
   * POST /api/teacher/homework
   * * Accepts either:
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
        
        // FIX: Format deadline in FormData if present
        const deadline = data.get('deadline');
        if (deadline && typeof deadline === 'string') {
          const formattedDeadline = formatDatetimeForBackend(deadline);
          data.set('deadline', formattedDeadline);
          console.log('[homeworkApi] FormData deadline formatted:', deadline, '->', formattedDeadline);
        }
        
        // Send as multipart/form-data
        response = await apiClient.post('/api/teacher/homework', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // FIX: Prepare data before sending (JSON)
        const preparedData = prepareHomeworkData(data);
        console.log('[homeworkApi] Creating without file');
        console.log('[homeworkApi] Type:', preparedData.homeworkType, 'Deadline:', preparedData.deadline);
        
        response = await apiClient.post('/api/teacher/homework', preparedData);
      }
      
      // FIX: Backend returns {success, message, data: {...}}
      // Logic cũ: const homework = response.data.data || response.data;
      const body = response.data as ResponseWrapper<HomeworkResponse>;
      const homework = body.data || (response.data as HomeworkResponse);
      
      console.log('[homeworkApi] Homework created:', homework.homeworkId);
      return homework;
    } catch (error: unknown) {
      // Cast error để truy cập thuộc tính mà không dùng any
      const err = error as AxiosError<{ message: string }>;
      console.error('[homeworkApi] Failed to create homework:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * FIXED: Update homework with proper datetime format
   * PUT /api/teacher/homework/{id}
   */
  updateHomework: async (id: number, data: HomeworkRequest): Promise<HomeworkResponse> => {
    console.log('[homeworkApi] Updating homework ID:', id);
    console.log('[homeworkApi] Original deadline:', data.deadline);
    
    try {
      // FIX: Prepare data with formatted deadline
      const preparedData = prepareHomeworkData(data);
      console.log('[homeworkApi] Formatted deadline:', preparedData.deadline);
      
      const response = await apiClient.put(`/api/teacher/homework/${id}`, preparedData);
      
      // FIX: Extract data
      // Logic cũ: const homework = response.data.data || response.data;
      const body = response.data as ResponseWrapper<HomeworkResponse>;
      const homework = body.data || (response.data as HomeworkResponse);
      
      console.log('[homeworkApi] Homework updated successfully');
      return homework;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>;
      console.error('[homeworkApi] Failed to update homework:', err.response?.data?.message || err.message);
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
      console.log('[homeworkApi] Homework deleted');
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>;
      console.error('[homeworkApi] Failed to delete homework:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * FIXED: Get homework by ID
   * GET /api/teacher/homework/{id}
   */
  getHomeworkById: async (id: number): Promise<HomeworkResponse> => {
    console.log('[homeworkApi] Fetching homework ID:', id);
    
    try {
      const response = await apiClient.get(`/api/teacher/homework/${id}`);
      
      // FIX: Extract data
      // Logic cũ: const homework = response.data.data || response.data;
      const body = response.data as ResponseWrapper<HomeworkResponse>;
      const homework = body.data || (response.data as HomeworkResponse);
      
      return homework;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>;
      console.error('[homeworkApi] Failed to fetch homework:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * FIXED: Get homework detail with submissions
   * GET /api/teacher/homework/{id}/detail
   */
  getHomeworkDetail: async (id: number): Promise<HomeworkDetailResponse> => {
    console.log('[homeworkApi] Fetching homework detail ID:', id);
    
    try {
      const response = await apiClient.get(`/api/teacher/homework/${id}/detail`);
      
      // FIX: Extract data
      // Logic cũ: const detail = response.data.data || response.data;
      const body = response.data as ResponseWrapper<HomeworkDetailResponse>;
      const detail = body.data || (response.data as HomeworkDetailResponse);
      
      console.log('[homeworkApi] Detail loaded:', detail.submissions?.length || 0, 'submissions');
      return detail;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>;
      console.error('[homeworkApi] Failed to fetch detail:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * FIXED: Get all homework for a class
   * GET /api/teacher/homework/class/{classId}
   * * CRITICAL FIX: Backend returns ARRAY directly, NOT wrapped!
   * Backend response: [{homeworkId: 1, ...}, {homeworkId: 2, ...}]
   * OR: [] (empty array if no homework)
   */
  getHomeworkByClass: async (classId: number): Promise<HomeworkResponse[]> => {
    console.log('[homeworkApi] Fetching homework for class:', classId);
    
    try {
      const response = await apiClient.get(`/api/teacher/homework/class/${classId}`);
      
      // FIX: Handle both wrapped and direct array
      // Logic cũ: if (response.data.data) { ... } else if ...
      // Để giữ logic cũ mà không dùng any, ta cast kiểu
      const body = response.data as ResponseWrapper<HomeworkResponse[]>;
      let homework: HomeworkResponse[];
      
      if (body.data) {
        // Wrapped format
        homework = body.data;
      } else if (Array.isArray(response.data)) {
        // Direct array format
        homework = response.data as HomeworkResponse[];
      } else {
        // Unknown format, assume empty
        console.warn('[homeworkApi] Unexpected response format:', response.data);
        homework = [];
      }
      
      console.log('[homeworkApi] Found', homework.length, 'homework');
      return homework;
      
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>;
      console.error('[homeworkApi] Failed to fetch homework:', err.response?.data?.message || err.message);
      
      // If 404 or no data, return empty array instead of throwing
      if (err.response?.status === 404) {
        console.log('[homeworkApi] Class has no homework yet (404)');
        return [];
      }
      
      throw error;
    }
  },
  
  /**
   * FIXED: Get all homework for current teacher
   * GET /api/teacher/homework/my
   */
  getMyHomework: async (): Promise<HomeworkResponse[]> => {
    console.log('[homeworkApi] Fetching all my homework');
    
    try {
      const response = await apiClient.get('/api/teacher/homework/my');
      
      // FIX: Handle both wrapped and direct array
      const body = response.data as ResponseWrapper<HomeworkResponse[]>;
      let homework: HomeworkResponse[];
      
      if (body.data) {
        homework = body.data;
      } else if (Array.isArray(response.data)) {
        homework = response.data as HomeworkResponse[];
      } else {
        homework = [];
      }
      
      console.log('[homeworkApi] Found', homework.length, 'homework');
      return homework;
      
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>;
      console.error('[homeworkApi] Failed to fetch homework:', err.response?.data?.message || err.message);
      
      if (err.response?.status === 404) {
        return [];
      }
      
      throw error;
    }
  },
  
  /**
   * FIXED: Get homework with pagination
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
      
      // FIX: Extract data
      // Logic cũ: const pageData = response.data.data || response.data;
      const body = response.data as ResponseWrapper<PageResponse<HomeworkResponse>>;
      const pageData = body.data || (response.data as PageResponse<HomeworkResponse>);
      
      console.log('[homeworkApi] Page loaded:', pageData.totalElements, 'total');
      return pageData;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>;
      console.error('[homeworkApi] Failed to fetch page:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * FIXED: Filter homework
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
      
      // FIX: Extract data
      // Logic cũ: const pageData = response.data.data || response.data;
      const body = response.data as ResponseWrapper<PageResponse<HomeworkResponse>>;
      const pageData = body.data || (response.data as PageResponse<HomeworkResponse>);
      
      return pageData;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>;
      console.error('[homeworkApi] Filter failed:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * FIXED: Get homework statistics
   * GET /api/teacher/homework/{id}/stats
   */
  getHomeworkStats: async (id: number): Promise<HomeworkStatsResponse> => {
    console.log('[homeworkApi] Fetching stats for homework:', id);
    
    try {
      const response = await apiClient.get(`/api/teacher/homework/${id}/stats`);
      
      // FIX: Extract data
      // Logic cũ: const stats = response.data.data || response.data;
      const body = response.data as ResponseWrapper<HomeworkStatsResponse>;
      const stats = body.data || (response.data as HomeworkStatsResponse);
      
      console.log('[homeworkApi] Stats loaded');
      return stats;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message: string }>;
      console.error('[homeworkApi] Failed to fetch stats:', err.response?.data?.message || err.message);
      throw error;
    }
  },
};

export default homeworkApi;