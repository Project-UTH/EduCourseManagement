import apiClient from './apiClient';

/**
 * Semester API Service
 * FIXED: Correct endpoint path (POST not GET)
 */

export interface SemesterCreateRequest {
  semesterCode: string;
  semesterName: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  registrationStartDate?: string;
  registrationEndDate?: string;
  description?: string;
}

export interface SemesterUpdateRequest {
  semesterName: string;
  startDate: string;
  endDate: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  description?: string;
}

export interface SemesterResponse {
  semesterId: number;
  semesterCode: string;
  semesterName: string;
  startDate: string;
  endDate: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  registrationEnabled: boolean;
  isRegistrationOpen: boolean;
  durationInDays: number;
  durationInWeeks: number;
  isRegistrationPeriodValid: boolean;
  totalClasses?: number;
  totalStudentsEnrolled?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

interface ApiError {
  response?: {
    data?: unknown;
  };
  message: string;
}

const semesterApi = {
  getAll: async (
    page: number = 0,
    size: number = 10,
    sortBy: string = 'startDate',
    sortDir: string = 'desc'
  ): Promise<ApiResponse<PageResponse<SemesterResponse>>> => {
    console.log(`[semesterApi] Fetching semesters - page: ${page}, size: ${size}`);
    
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<SemesterResponse>>>(
        '/api/admin/semesters',
        { params: { page, size, sortBy, sortDir } }
      );
      
      console.log('[semesterApi] Semesters fetched:', response.data.data.totalElements || 0, 'total');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[semesterApi] Failed to fetch semesters:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  getById: async (id: number): Promise<ApiResponse<SemesterResponse>> => {
    console.log(`[semesterApi] Fetching semester ID: ${id}`);
    
    try {
      const response = await apiClient.get<ApiResponse<SemesterResponse>>(
        `/api/admin/semesters/${id}`
      );
      
      console.log('[semesterApi] Semester fetched:', response.data.data.semesterName);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[semesterApi] Failed to fetch semester:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  create: async (data: SemesterCreateRequest): Promise<ApiResponse<SemesterResponse>> => {
    console.log('[semesterApi] Creating semester:', data.semesterCode);
    
    try {
      const response = await apiClient.post<ApiResponse<SemesterResponse>>(
        '/api/admin/semesters',
        data
      );
      
      console.log('[semesterApi] Semester created:', response.data.data.semesterCode);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[semesterApi] Failed to create semester:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  update: async (id: number, data: SemesterUpdateRequest): Promise<ApiResponse<SemesterResponse>> => {
    console.log(`[semesterApi] Updating semester ID: ${id}`);
    
    try {
      const response = await apiClient.put<ApiResponse<SemesterResponse>>(
        `/api/admin/semesters/${id}`,
        data
      );
      
      console.log('[semesterApi] Semester updated:', response.data.data.semesterCode);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[semesterApi] Failed to update semester:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    console.log(`[semesterApi] Deleting semester ID: ${id}`);
    
    try {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/api/admin/semesters/${id}`
      );
      
      console.log('[semesterApi] Semester deleted');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[semesterApi] Failed to delete semester:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  search: async (
    keyword: string,
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PageResponse<SemesterResponse>>> => {
    console.log(`[semesterApi] Searching semesters: "${keyword}"`);
    
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<SemesterResponse>>>(
        '/api/admin/semesters/search',
        { params: { keyword, page, size } }
      );
      
      console.log('[semesterApi] Search results:', response.data.data.totalElements);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[semesterApi] Search failed:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * FIXED: Activate uses PUT (not POST)
   * Endpoint: PUT /api/admin/semesters/{id}/activate
   */
  activate: async (id: number): Promise<ApiResponse<SemesterResponse>> => {
    console.log(`[semesterApi] Activating semester ID: ${id}`);
    
    try {
      const response = await apiClient.put<ApiResponse<SemesterResponse>>(
        `/api/admin/semesters/${id}/activate`
      );
      
      console.log('[semesterApi] Semester activated - extra sessions auto-scheduled');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[semesterApi] Failed to activate semester:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * FIXED: Complete uses PUT (not POST)
   */
  complete: async (id: number): Promise<ApiResponse<SemesterResponse>> => {
    console.log(`[semesterApi] Completing semester ID: ${id}`);
    
    try {
      const response = await apiClient.put<ApiResponse<SemesterResponse>>(
        `/api/admin/semesters/${id}/complete`
      );
      
      console.log('[semesterApi] Semester completed');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[semesterApi] Failed to complete semester:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  getCurrent: async (): Promise<ApiResponse<SemesterResponse>> => {
    console.log('[semesterApi] Fetching current ACTIVE semester');
    
    try {
      const response = await apiClient.get<ApiResponse<SemesterResponse>>(
        '/api/admin/semesters/current'
      );
      
      console.log('[semesterApi] Current semester:', response.data.data?.semesterCode || 'None');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[semesterApi] Failed to fetch current semester:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  getRegistrationOpen: async (): Promise<ApiResponse<SemesterResponse>> => {
    console.log('[semesterApi] Fetching semester with OPEN registration');
    
    try {
      const response = await apiClient.get<ApiResponse<SemesterResponse>>(
        '/api/admin/semesters/registration-open'
      );
      
      console.log('[semesterApi] Registration open semester:', response.data.data?.semesterCode || 'None');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[semesterApi] Failed to fetch registration-open semester:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * FIXED: enableRegistration uses PUT (not POST)
   */
  enableRegistration: async (id: number): Promise<ApiResponse<SemesterResponse>> => {
    console.log(`[semesterApi] Enabling registration for semester ID: ${id}`);
    
    try {
      const response = await apiClient.put<ApiResponse<SemesterResponse>>(
        `/api/admin/semesters/${id}/enable-registration`
      );
      
      console.log('[semesterApi] Registration enabled');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[semesterApi] Failed to enable registration:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * FIXED: disableRegistration uses PUT (not POST)
   */
  disableRegistration: async (id: number): Promise<ApiResponse<SemesterResponse>> => {
    console.log(`[semesterApi] Disabling registration for semester ID: ${id}`);
    
    try {
      const response = await apiClient.put<ApiResponse<SemesterResponse>>(
        `/api/admin/semesters/${id}/disable-registration`
      );
      
      console.log('[semesterApi] Registration disabled');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[semesterApi] Failed to disable registration:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  updateRegistrationPeriod: async (
    id: number,
    registrationStartDate: string,
    registrationEndDate: string
  ): Promise<ApiResponse<SemesterResponse>> => {
    console.log(`[semesterApi] Updating registration period for semester ID: ${id}`);
    
    try {
      const response = await apiClient.put<ApiResponse<SemesterResponse>>(
        `/api/admin/semesters/${id}/registration-period`,
        null,
        { params: { registrationStartDate, registrationEndDate } }
      );
      
      console.log('[semesterApi] Registration period updated');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[semesterApi] Failed to update registration period:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  isRegistrationOpen: async (id: number): Promise<ApiResponse<boolean>> => {
    console.log(`[semesterApi] Checking if registration is open for semester ID: ${id}`);
    
    try {
      const response = await apiClient.get<ApiResponse<boolean>>(
        `/api/admin/semesters/${id}/is-registration-open`
      );
      
      console.log('[semesterApi] Registration open:', response.data.data);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[semesterApi] Failed to check registration status:', apiError.response?.data || apiError.message);
      throw error;
    }
  },
};

export default semesterApi;