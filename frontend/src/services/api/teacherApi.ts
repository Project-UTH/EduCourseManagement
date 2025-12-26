import apiClient from './apiClient';

/**
 * Teacher API Service
 */

export interface TeacherCreateRequest {
  citizenId: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string; // ISO date format: YYYY-MM-DD
  email?: string;
  phone?: string;
  departmentId: number;
  majorId?: number;
  degree?: string;
  address?: string;
}

export interface TeacherUpdateRequest {
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  email?: string;
  phone?: string;
  departmentId: number;
  majorId?: number;
  degree?: string;
  address?: string;
}

export interface TeacherResponse {
  teacherId: number;
  citizenId: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  email?: string;
  phone?: string;
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  majorId?: number;
  majorCode?: string;
  majorName?: string;
  degree?: string;
  address?: string;
  avatarUrl?: string;
  isFirstLogin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subjects?: TeacherSubjectResponse[]; // List of subjects this teacher can teach
}

export interface TeacherSubjectResponse {
  teacherSubjectId: number;
  teacherId: number;
  teacherName: string;
  teacherCitizenId: string;
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  isPrimary: boolean;
  yearsOfExperience?: number;
  notes?: string;
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

const teacherApi = {
  /**
   * Get all teachers with pagination
   */
  getAll: async (
    page: number = 0,
    size: number = 10,
    sortBy: string = 'fullName',
    sortDir: string = 'asc'
  ): Promise<ApiResponse<PageResponse<TeacherResponse>>> => {
    console.log(`[teacherApi] Fetching teachers - page: ${page}, size: ${size}`);
    
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<TeacherResponse>>>(
        '/api/admin/teachers',
        { params: { page, size, sortBy, sortDir } }
      );
      
      console.log('[teacherApi] Teachers fetched:', response.data.data.totalElements || 0, 'total');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherApi] Failed to fetch teachers:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get teacher by ID
   */
  getById: async (id: number): Promise<ApiResponse<TeacherResponse>> => {
    console.log(`[teacherApi] Fetching teacher ID: ${id}`);
    
    try {
      const response = await apiClient.get<ApiResponse<TeacherResponse>>(
        `/api/admin/teachers/${id}`
      );
      
      console.log('[teacherApi] Teacher fetched:', response.data.data.fullName);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherApi] Failed to fetch teacher:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get teachers by department
   */
  getByDepartment: async (departmentId: number): Promise<ApiResponse<TeacherResponse[]>> => {
    console.log(`[teacherApi] Fetching teachers for department ID: ${departmentId}`);
    
    try {
      const response = await apiClient.get<ApiResponse<TeacherResponse[]>>(
        `/api/admin/teachers/by-department/${departmentId}`
      );
      
      console.log('[teacherApi] Teachers fetched for department:', response.data.data.length);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherApi] Failed to fetch teachers by department:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get teachers by major
   */
  getByMajor: async (majorId: number): Promise<ApiResponse<TeacherResponse[]>> => {
    console.log(`[teacherApi] Fetching teachers for major ID: ${majorId}`);
    
    try {
      const response = await apiClient.get<ApiResponse<TeacherResponse[]>>(
        `/api/admin/teachers/by-major/${majorId}`
      );
      
      console.log('[teacherApi] Teachers fetched for major:', response.data.data.length);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherApi] Failed to fetch teachers by major:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Search teachers by keyword
   */
  search: async (
    keyword: string,
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PageResponse<TeacherResponse>>> => {
    console.log(`[teacherApi] Searching teachers: "${keyword}"`);
    
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<TeacherResponse>>>(
        '/api/admin/teachers/search',
        { params: { keyword, page, size } }
      );
      
      console.log('[teacherApi] Search results:', response.data.data.totalElements || 0, 'found');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherApi] Search failed:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get active teachers only
   */
  getActive: async (): Promise<ApiResponse<TeacherResponse[]>> => {
    console.log('[teacherApi] Fetching active teachers');
    
    try {
      const response = await apiClient.get<ApiResponse<TeacherResponse[]>>(
        '/api/admin/teachers/active'
      );
      
      console.log('[teacherApi] Active teachers fetched:', response.data.data.length);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherApi] Failed to fetch active teachers:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Create new teacher
   */
  create: async (data: TeacherCreateRequest): Promise<ApiResponse<TeacherResponse>> => {
    console.log('[teacherApi] Creating teacher:', data.fullName);
    
    try {
      const response = await apiClient.post<ApiResponse<TeacherResponse>>(
        '/api/admin/teachers',
        data
      );
      
      console.log('[teacherApi] Teacher created:', response.data.data.fullName);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherApi] Failed to create teacher:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Update teacher
   */
  update: async (id: number, data: TeacherUpdateRequest): Promise<ApiResponse<TeacherResponse>> => {
    console.log(`[teacherApi] Updating teacher ID: ${id}`);
    
    try {
      const response = await apiClient.put<ApiResponse<TeacherResponse>>(
        `/api/admin/teachers/${id}`,
        data
      );
      
      console.log('[teacherApi] Teacher updated:', response.data.data.fullName);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherApi] Failed to update teacher:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Delete teacher (soft delete)
   */
  delete: async (id: number): Promise<ApiResponse<null>> => {
    console.log(`[teacherApi] Deleting teacher ID: ${id}`);
    
    try {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/api/admin/teachers/${id}`
      );
      
      console.log('[teacherApi] Teacher deleted');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherApi] Failed to delete teacher:', apiError.response?.data || apiError.message);
      throw error;
    }
  }
};

export default teacherApi;