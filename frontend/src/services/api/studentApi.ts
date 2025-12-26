import apiClient from './apiClient';

/**
 * Student API Service
 */

export interface StudentCreateRequest {
  studentCode: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string; // ISO date format: YYYY-MM-DD
  academicYear: number;
  educationLevel: 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'DOCTOR';
  trainingType: 'REGULAR' | 'DISTANCE' | 'PART_TIME';
  majorId: number;
  email?: string;
  phone?: string;
  placeOfBirth?: string;
}

export interface StudentUpdateRequest {
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  academicYear: number;
  educationLevel: 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'DOCTOR';
  trainingType: 'REGULAR' | 'DISTANCE' | 'PART_TIME';
  majorId: number;
  email?: string;
  phone?: string;
  placeOfBirth?: string;
}

export interface StudentResponse {
  studentId: number;
  studentCode: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  academicYear: number;
  educationLevel: 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'DOCTOR';
  trainingType: 'REGULAR' | 'DISTANCE' | 'PART_TIME';
  email?: string;
  phone?: string;
  placeOfBirth?: string;
  majorId: number;
  majorCode: string;
  majorName: string;
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  avatarUrl?: string;
  isFirstLogin: boolean;
  isActive: boolean;
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

const studentApi = {
  /**
   * Get all students with pagination
   */
  getAll: async (
    page: number = 0,
    size: number = 10,
    sortBy: string = 'fullName',
    sortDir: string = 'asc'
  ): Promise<ApiResponse<PageResponse<StudentResponse>>> => {
    console.log(`[studentApi] Fetching students - page: ${page}, size: ${size}`);
    
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<StudentResponse>>>(
        '/api/admin/students',
        { params: { page, size, sortBy, sortDir } }
      );
      
      console.log('[studentApi] Students fetched:', response.data.data.totalElements || 0, 'total');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentApi] Failed to fetch students:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get student by ID
   */
  getById: async (id: number): Promise<ApiResponse<StudentResponse>> => {
    console.log(`[studentApi] Fetching student ID: ${id}`);
    
    try {
      const response = await apiClient.get<ApiResponse<StudentResponse>>(
        `/api/admin/students/${id}`
      );
      
      console.log('[studentApi] Student fetched:', response.data.data.fullName);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentApi] Failed to fetch student:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get students by major
   */
  getByMajor: async (majorId: number): Promise<ApiResponse<StudentResponse[]>> => {
    console.log(`[studentApi] Fetching students for major ID: ${majorId}`);
    
    try {
      const response = await apiClient.get<ApiResponse<StudentResponse[]>>(
        `/api/admin/students/by-major/${majorId}`
      );
      
      console.log('[studentApi] Students fetched for major:', response.data.data.length);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentApi] Failed to fetch students by major:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get students by department
   */
  getByDepartment: async (departmentId: number): Promise<ApiResponse<StudentResponse[]>> => {
    console.log(`[studentApi] Fetching students for department ID: ${departmentId}`);
    
    try {
      const response = await apiClient.get<ApiResponse<StudentResponse[]>>(
        `/api/admin/students/by-department/${departmentId}`
      );
      
      console.log('[studentApi] Students fetched for department:', response.data.data.length);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentApi] Failed to fetch students by department:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get students by academic year
   */
  getByAcademicYear: async (
    academicYear: number,
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PageResponse<StudentResponse>>> => {
    console.log(`[studentApi] Fetching students for academic year: ${academicYear}`);
    
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<StudentResponse>>>(
        `/api/admin/students/by-year/${academicYear}`,
        { params: { page, size } }
      );
      
      console.log('[studentApi] Students fetched for year:', response.data.data.totalElements);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentApi] Failed to fetch students by year:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Create a new student
   */
  create: async (data: StudentCreateRequest): Promise<ApiResponse<StudentResponse>> => {
    console.log('[studentApi] Creating student:', data.studentCode);
    
    try {
      const response = await apiClient.post<ApiResponse<StudentResponse>>(
        '/api/admin/students',
        data
      );
      
      console.log('[studentApi] Student created:', response.data.data.studentCode);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentApi] Failed to create student:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Update an existing student
   */
  update: async (id: number, data: StudentUpdateRequest): Promise<ApiResponse<StudentResponse>> => {
    console.log(`[studentApi] Updating student ID: ${id}`);
    
    try {
      const response = await apiClient.put<ApiResponse<StudentResponse>>(
        `/api/admin/students/${id}`,
        data
      );
      
      console.log('[studentApi] Student updated:', response.data.data.studentCode);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentApi] Failed to update student:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Delete a student (soft delete)
   */
  delete: async (id: number): Promise<ApiResponse<null>> => {
    console.log(`[studentApi] Deleting student ID: ${id}`);
    
    try {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/api/admin/students/${id}`
      );
      
      console.log('[studentApi] Student deleted');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentApi] Failed to delete student:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Search students by keyword
   */
  search: async (
    keyword: string,
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PageResponse<StudentResponse>>> => {
    console.log(`[studentApi] Searching students: "${keyword}"`);
    
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<StudentResponse>>>(
        '/api/admin/students/search',
        { params: { keyword, page, size } }
      );
      
      console.log('[studentApi] Search results:', response.data.data.totalElements);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentApi] Search failed:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get active students only
   */
  getActive: async (
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<PageResponse<StudentResponse>>> => {
    console.log(`[studentApi] Fetching active students - page: ${page}, size: ${size}`);
    
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<StudentResponse>>>(
        '/api/admin/students/active',
        { params: { page, size } }
      );
      
      console.log('[studentApi] Active students fetched:', response.data.data.totalElements);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentApi] Failed to fetch active students:', apiError.response?.data || apiError.message);
      throw error;
    }
  },
};

export default studentApi;