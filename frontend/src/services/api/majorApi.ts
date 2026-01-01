import apiClient from './apiClient';

/**
 * Major API Service
 * Phase 3 Sprint 3.1 - Fixed Version
 */

// ✅ ADD: Major type alias (matching Department pattern)
export interface Major {
  majorId: number;
  majorCode: string;
  majorName: string;
  description?: string;
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  createdAt: string;
  updatedAt: string;
  totalStudents?: number;
  totalTeachers?: number;
}

export interface MajorCreateRequest {
  majorCode: string;
  majorName: string;
  departmentId: number;
  description?: string;
}

export interface MajorUpdateRequest {
  majorName: string;
  departmentId: number;
  description?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  totalPages?: number;
  totalItems?: number;
  currentPage?: number;
}

interface ApiError {
  response?: {
    data?: unknown;
  };
  message: string;
}

const majorApi = {
  // ✅ FIX: Match departmentApi pattern
  getAll: async (
    page: number = 0,
    size: number = 10,
    sortBy: string = 'majorName',
    sortDir: string = 'asc'
  ): Promise<ApiResponse<Major[]>> => {
    console.log(`🎓 [majorApi] Fetching majors - page: ${page}, size: ${size}`);
    
    try {
      const response = await apiClient.get<ApiResponse<Major[]>>(
        '/api/admin/majors',
        {
          params: { page, size, sortBy, sortDir }
        }
      );
      
      console.log('✅ [majorApi] Majors fetched:', response.data.totalItems || 0, 'total');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('❌ [majorApi] Failed to fetch majors:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Get major by ID
  getById: async (id: number): Promise<ApiResponse<Major>> => {
    console.log(`🎓 [majorApi] Fetching major ID: ${id}`);
    
    try {
      const response = await apiClient.get<ApiResponse<Major>>(
        `/api/admin/majors/${id}`
      );
      
      console.log('✅ [majorApi] Major fetched:', response.data.data.majorName);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('❌ [majorApi] Failed to fetch major:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Create major
  create: async (data: MajorCreateRequest): Promise<ApiResponse<Major>> => {
    console.log('🎓 [majorApi] Creating major:', data.majorName);
    
    try {
      const response = await apiClient.post<ApiResponse<Major>>(
        '/api/admin/majors',
        data
      );
      
      console.log('✅ [majorApi] Major created:', response.data.data.majorName);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('❌ [majorApi] Failed to create major:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Update major
  update: async (id: number, data: MajorUpdateRequest): Promise<ApiResponse<Major>> => {
    console.log(`🎓 [majorApi] Updating major ID: ${id}`);
    
    try {
      const response = await apiClient.put<ApiResponse<Major>>(
        `/api/admin/majors/${id}`,
        data
      );
      
      console.log('✅ [majorApi] Major updated:', response.data.data.majorName);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('❌ [majorApi] Failed to update major:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Delete major
  delete: async (id: number): Promise<ApiResponse<null>> => {
    console.log(`🎓 [majorApi] Deleting major ID: ${id}`);
    
    try {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/api/admin/majors/${id}`
      );
      
      console.log('✅ [majorApi] Major deleted');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('❌ [majorApi] Failed to delete major:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Search majors
  search: async (
    keyword: string,
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<Major[]>> => {
    console.log(`🎓 [majorApi] Searching majors: "${keyword}"`);
    
    try {
      const response = await apiClient.get<ApiResponse<Major[]>>(
        '/api/admin/majors/search',
        {
          params: { keyword, page, size }
        }
      );
      
      console.log('✅ [majorApi] Search results:', response.data.totalItems || 0, 'found');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('❌ [majorApi] Search failed:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Get majors by department
  getByDepartment: async (departmentId: number): Promise<ApiResponse<Major[]>> => {
    console.log(`🎓 [majorApi] Fetching majors for department ID: ${departmentId}`);
    
    try {
      const response = await apiClient.get<ApiResponse<Major[]>>(
        `/api/admin/majors/by-department/${departmentId}`
      );
      
      console.log('✅ [majorApi] Majors fetched for department:', response.data.totalItems || 0);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('❌ [majorApi] Failed to fetch majors by department:', apiError.response?.data || apiError.message);
      throw error;
    }
  },
};

export default majorApi;