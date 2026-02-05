import apiClient from './apiClient';

export interface Department {
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  knowledgeType: 'GENERAL' | 'SPECIALIZED';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentCreateRequest {
  departmentCode: string;
  departmentName: string;
  knowledgeType: 'GENERAL' | 'SPECIALIZED';
  description?: string;
}

export interface DepartmentUpdateRequest {
  departmentName: string;
  knowledgeType: 'GENERAL' | 'SPECIALIZED';
  description?: string;
}

// Backend actual response structure
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  data: T;  // Can be array or single object
}

interface ApiError {
  response?: {
    data?: unknown;
  };
  message: string;
}

const departmentApi = {
  // Get all departments with pagination
  // Backend returns: { success, totalItems, totalPages, currentPage, data: Department[] }
  getAll: async (
    page: number = 0,
    size: number = 10,
    sortBy: string = 'departmentName',
    sortDir: string = 'asc'
  ): Promise<ApiResponse<Department[]>> => {
    console.log(`[departmentApi] Fetching departments - page: ${page}, size: ${size}`);
    
    try {
      const response = await apiClient.get<ApiResponse<Department[]>>(
        '/api/admin/departments',
        {
          params: { page, size, sortBy, sortDir }
        }
      );
      
      console.log('[departmentApi] Departments fetched:', response.data.totalItems || response.data.data.length, 'total');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error(' [departmentApi] Failed to fetch departments:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Get department by ID
  getById: async (id: number): Promise<ApiResponse<Department>> => {
    console.log(`[departmentApi] Fetching department ID: ${id}`);
    
    try {
      const response = await apiClient.get<ApiResponse<Department>>(
        `/api/admin/departments/${id}`
      );
      
      console.log('[departmentApi] Department fetched:', response.data.data.departmentName);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error(' [departmentApi] Failed to fetch department:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Create department
  create: async (data: DepartmentCreateRequest): Promise<ApiResponse<Department>> => {
    console.log('[departmentApi] Creating department:', data.departmentName);
    
    try {
      const response = await apiClient.post<ApiResponse<Department>>(
        '/api/admin/departments',
        data
      );
      
      console.log('[departmentApi] Department created:', response.data.data.departmentName);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[departmentApi] Failed to create department:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Update department
  update: async (id: number, data: DepartmentUpdateRequest): Promise<ApiResponse<Department>> => {
    console.log(`[departmentApi] Updating department ID: ${id}`);
    
    try {
      const response = await apiClient.put<ApiResponse<Department>>(
        `/api/admin/departments/${id}`,
        data
      );
      
      console.log('[departmentApi] Department updated:', response.data.data.departmentName);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[departmentApi] Failed to update department:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Delete department
  delete: async (id: number): Promise<ApiResponse<null>> => {
    console.log(`[departmentApi] Deleting department ID: ${id}`);
    
    try {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/api/admin/departments/${id}`
      );
      
      console.log('[departmentApi] Department deleted');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[departmentApi] Failed to delete department:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Search departments
  search: async (
    keyword: string,
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<Department[]>> => {
    console.log(`[departmentApi] Searching departments: "${keyword}"`);
    
    try {
      const response = await apiClient.get<ApiResponse<Department[]>>(
        '/api/admin/departments/search',
        {
          params: { keyword, page, size }
        }
      );
      
      console.log('[departmentApi] Search results:', response.data.totalItems || response.data.data.length, 'found');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[departmentApi] Search failed:', apiError.response?.data || apiError.message);
      throw error;
    }
  },
};

export default departmentApi;