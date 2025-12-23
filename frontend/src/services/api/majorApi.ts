import apiClient from './apiClient';

/**
 * Major API Service
 * Phase 3 Sprint 3.1
 */

export interface MajorCreateRequest {
  majorCode: string;
  majorName: string;
  departmentId: number;
  description?: string;
}

export interface MajorUpdateRequest {
  majorCode: string;
  majorName: string;
  departmentId: number;
  description?: string;
}

export interface MajorResponse {
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

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

const majorApi = {
  /**
   * Create a new major
   */
  createMajor: async (data: MajorCreateRequest): Promise<MajorResponse> => {
    const response = await apiClient.post<ApiResponse<MajorResponse>>(
      '/api/admin/majors',
      data
    );
    return response.data.data!;
  },

  /**
   * Update an existing major
   */
  updateMajor: async (id: number, data: MajorUpdateRequest): Promise<MajorResponse> => {
    const response = await apiClient.put<ApiResponse<MajorResponse>>(
      `/api/admin/majors/${id}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Delete a major
   */
  deleteMajor: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/majors/${id}`);
  },

  /**
   * Get major by ID
   */
  getMajorById: async (id: number): Promise<MajorResponse> => {
    const response = await apiClient.get<ApiResponse<MajorResponse>>(
      `/api/admin/majors/${id}`
    );
    return response.data.data!;
  },

  /**
   * Get all majors with pagination
   */
  getAllMajors: async (params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<MajorResponse>> => {
    const response = await apiClient.get<PaginatedResponse<MajorResponse>>(
      '/api/admin/majors',
      { params }
    );
    return response.data;
  },

  /**
   * Get all majors without pagination (for dropdown)
   */
  getAllMajorsNoPaging: async (): Promise<MajorResponse[]> => {
    const response = await apiClient.get<ApiResponse<MajorResponse[]>>(
      '/api/admin/majors/all'
    );
    return response.data.data!;
  },

  /**
   * Get majors by department ID
   */
  getMajorsByDepartment: async (departmentId: number): Promise<MajorResponse[]> => {
    const response = await apiClient.get<ApiResponse<MajorResponse[]>>(
      `/api/admin/majors/by-department/${departmentId}`
    );
    return response.data.data!;
  },

  /**
   * Search majors by keyword
   */
  searchMajors: async (keyword: string, params: {
    page?: number;
    size?: number;
  } = {}): Promise<PaginatedResponse<MajorResponse>> => {
    const response = await apiClient.get<PaginatedResponse<MajorResponse>>(
      '/api/admin/majors/search',
      { params: { keyword, ...params } }
    );
    return response.data;
  },

  /**
   * Check if major code exists
   */
  checkMajorCode: async (code: string): Promise<boolean> => {
    const response = await apiClient.get<{ exists: boolean }>(
      '/api/admin/majors/check-code',
      { params: { code } }
    );
    return response.data.exists;
  },
};

export default majorApi;