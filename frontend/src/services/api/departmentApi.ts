import apiClient from './apiClient.ts';

/**
 * Department API Service
 * Phase 3 Sprint 3.1
 */

export interface DepartmentCreateRequest {
  departmentCode: string;
  departmentName: string;
  knowledgeType: 'TECHNOLOGY' | 'SOCIAL_SCIENCE' | 'NATURAL_SCIENCE' | 'ENGINEERING' | 'MEDICAL' | 'ARTS';
  description?: string;
}

export interface DepartmentUpdateRequest {
  departmentCode: string;
  departmentName: string;
  knowledgeType: 'TECHNOLOGY' | 'SOCIAL_SCIENCE' | 'NATURAL_SCIENCE' | 'ENGINEERING' | 'MEDICAL' | 'ARTS';
  description?: string;
}

export interface DepartmentResponse {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  knowledgeType: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  totalMajors?: number;
  totalTeachers?: number;
  totalStudents?: number;
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

const departmentApi = {
  /**
   * Create a new department
   */
  createDepartment: async (data: DepartmentCreateRequest): Promise<DepartmentResponse> => {
    const response = await apiClient.post<ApiResponse<DepartmentResponse>>(
      '/api/admin/departments',
      data
    );
    return response.data.data!;
  },

  /**
   * Update an existing department
   */
  updateDepartment: async (id: number, data: DepartmentUpdateRequest): Promise<DepartmentResponse> => {
    const response = await apiClient.put<ApiResponse<DepartmentResponse>>(
      `/api/admin/departments/${id}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Delete a department
   */
  deleteDepartment: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/departments/${id}`);
  },

  /**
   * Get department by ID
   */
  getDepartmentById: async (id: number): Promise<DepartmentResponse> => {
    const response = await apiClient.get<ApiResponse<DepartmentResponse>>(
      `/api/admin/departments/${id}`
    );
    return response.data.data!;
  },

  /**
   * Get all departments with pagination
   */
  getAllDepartments: async (params: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<DepartmentResponse>> => {
    const response = await apiClient.get<PaginatedResponse<DepartmentResponse>>(
      '/api/admin/departments',
      { params }
    );
    return response.data;
  },

  /**
   * Get all departments without pagination (for dropdown)
   */
  getAllDepartmentsNoPaging: async (): Promise<DepartmentResponse[]> => {
    const response = await apiClient.get<ApiResponse<DepartmentResponse[]>>(
      '/api/admin/departments/all'
    );
    return response.data.data!;
  },

  /**
   * Search departments by keyword
   */
  searchDepartments: async (keyword: string, params: {
    page?: number;
    size?: number;
  } = {}): Promise<PaginatedResponse<DepartmentResponse>> => {
    const response = await apiClient.get<PaginatedResponse<DepartmentResponse>>(
      '/api/admin/departments/search',
      { params: { keyword, ...params } }
    );
    return response.data;
  },

  /**
   * Check if department code exists
   */
  checkDepartmentCode: async (code: string): Promise<boolean> => {
    const response = await apiClient.get<{ exists: boolean }>(
      '/api/admin/departments/check-code',
      { params: { code } }
    );
    return response.data.exists;
  },
};

export default departmentApi;