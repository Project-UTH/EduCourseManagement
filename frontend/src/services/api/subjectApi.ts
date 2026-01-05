import apiClient from './apiClient';

/**
 * Subject API Service - Version 2
 * Thêm Major và Sessions
 */

export interface Subject {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  
  // Số buổi học
  totalSessions: number;
  elearningSessions: number;
  inpersonSessions: number;
  
  // Department
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  departmentKnowledgeType?: string; 
  
  // Major (nullable)
  majorId?: number;
  majorCode?: string;
  majorName?: string;
  
  description?: string;
  createdAt: string;
  updatedAt: string;
  totalClasses?: number;
  totalStudents?: number;
}

export interface SubjectCreateRequest {
  subjectCode: string;
  subjectName: string;
  credits: number;
  totalSessions: number;
  elearningSessions: number;
  inpersonSessions: number;
  departmentId: number;
  majorId?: number;
  description?: string;
}

export interface SubjectUpdateRequest {
  subjectName: string;
  credits: number;
  totalSessions: number;
  elearningSessions: number;
  inpersonSessions: number;
  departmentId: number;
  majorId?: number;
  description?: string;
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

const subjectApi = {
  getAll: async (
    page: number = 0,
    size: number = 10,
    sortBy: string = 'subjectName',
    sortDir: string = 'asc'
  ): Promise<ApiResponse<Subject[]>> => {
    console.log(`[subjectApi] Fetching subjects - page: ${page}, size: ${size}`);
    
    try {
      const response = await apiClient.get<ApiResponse<Subject[]>>(
        '/api/admin/subjects',
        { params: { page, size, sortBy, sortDir } }
      );
      
      console.log('[subjectApi] Subjects fetched:', response.data.totalItems || 0, 'total');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[subjectApi] Failed to fetch subjects:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  getById: async (id: number): Promise<ApiResponse<Subject>> => {
    console.log(`[subjectApi] Fetching subject ID: ${id}`);
    
    try {
      const response = await apiClient.get<ApiResponse<Subject>>(
        `/api/admin/subjects/${id}`
      );
      
      console.log('[subjectApi] Subject fetched:', response.data.data.subjectName);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[subjectApi] Failed to fetch subject:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  create: async (data: SubjectCreateRequest): Promise<ApiResponse<Subject>> => {
    console.log('[subjectApi] Creating subject:', data.subjectName);
    
    try {
      const response = await apiClient.post<ApiResponse<Subject>>(
        '/api/admin/subjects',
        data
      );
      
      console.log('[subjectApi] Subject created:', response.data.data.subjectName);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[subjectApi] Failed to create subject:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  update: async (id: number, data: SubjectUpdateRequest): Promise<ApiResponse<Subject>> => {
    console.log(`[subjectApi] Updating subject ID: ${id}`);
    
    try {
      const response = await apiClient.put<ApiResponse<Subject>>(
        `/api/admin/subjects/${id}`,
        data
      );
      
      console.log('[subjectApi] Subject updated:', response.data.data.subjectName);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[subjectApi] Failed to update subject:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    console.log(`[subjectApi] Deleting subject ID: ${id}`);
    
    try {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/api/admin/subjects/${id}`
      );
      
      console.log('[subjectApi] Subject deleted');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[subjectApi] Failed to delete subject:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  search: async (
    keyword: string,
    page: number = 0,
    size: number = 10
  ): Promise<ApiResponse<Subject[]>> => {
    console.log(`[subjectApi] Searching subjects: "${keyword}"`);
    
    try {
      const response = await apiClient.get<ApiResponse<Subject[]>>(
        '/api/admin/subjects/search',
        { params: { keyword, page, size } }
      );
      
      console.log('[subjectApi] Search results:', response.data.totalItems || 0, 'found');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[subjectApi] Search failed:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  getByDepartment: async (departmentId: number): Promise<ApiResponse<Subject[]>> => {
    console.log(`[subjectApi] Fetching subjects for department ID: ${departmentId}`);
    
    try {
      const response = await apiClient.get<ApiResponse<Subject[]>>(
        `/api/admin/subjects/by-department/${departmentId}`
      );
      
      console.log('[subjectApi] Subjects fetched for department:', response.data.totalItems || 0);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[subjectApi] Failed to fetch subjects by department:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Add to subjectApi object:

  addPrerequisite: async (subjectId: number, prerequisiteId: number) => {
    console.log(`[subjectApi] Adding prerequisite ${prerequisiteId} to subject ${subjectId}`);
    
    const response = await apiClient.post(
      `/api/admin/subjects/${subjectId}/prerequisites`,
      null,
      { params: { prerequisiteId } }
    );
    
    console.log('[subjectApi] Prerequisite added');
    return response.data;
  },

  removePrerequisite: async (subjectId: number, prerequisiteId: number) => {
    console.log(`[subjectApi] Removing prerequisite ${prerequisiteId} from subject ${subjectId}`);
    
    const response = await apiClient.delete(
      `/api/admin/subjects/${subjectId}/prerequisites/${prerequisiteId}`
    );
    
    console.log('[subjectApi] Prerequisite removed');
    return response.data;
  },

  getPrerequisites: async (subjectId: number) => {
    console.log(`[subjectApi] Fetching prerequisites for subject ${subjectId}`);
    
    const response = await apiClient.get<ApiResponse<Subject[]>>(
      `/api/admin/subjects/${subjectId}/prerequisites`
    );
    
    console.log('[subjectApi] Prerequisites fetched:', response.data.data.length);
    return response.data;
  },
  getAvailableSubjects: async (): Promise<ApiResponse<Subject[]>> => {
    console.log('[subjectApi] Fetching available subjects for student');
    
    try {
      const response = await apiClient.get<ApiResponse<Subject[]>>(
        '/api/student/subjects/available'
      );
      
      console.log('[subjectApi] Available subjects fetched:', response.data.data?.length || 0);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[subjectApi] Failed to fetch available subjects:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Get classes for a subject (student)
  getClassesBySubject: async (subjectId: number) => {
    console.log(`[subjectApi] Fetching classes for subject ID: ${subjectId}`);
    
    try {
      const response = await apiClient.get(
        `/api/student/classes/by-subject/${subjectId}`
      );
      
      console.log('[subjectApi] Classes fetched:', response.data.data?.length || 0);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[subjectApi] Failed to fetch classes:', apiError.response?.data || apiError.message);
      throw error;
    }
  },
};

export default subjectApi;