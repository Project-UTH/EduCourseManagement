import apiClient from './apiClient';

/**
 * Teacher-Subject API Service
 */

export interface TeacherSubjectRequest {
  subjectId: number;
  isPrimary?: boolean;
  yearsOfExperience?: number;
  notes?: string;
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

interface ApiError {
  response?: {
    data?: unknown;
  };
  message: string;
}

const teacherSubjectApi = {
  /**
   * Get all subjects taught by a teacher
   */
  getTeacherSubjects: async (teacherId: number): Promise<ApiResponse<TeacherSubjectResponse[]>> => {
    console.log(`[teacherSubjectApi] Fetching subjects for teacher ${teacherId}`);
    
    try {
      const response = await apiClient.get<ApiResponse<TeacherSubjectResponse[]>>(
        `/api/admin/teachers/${teacherId}/subjects`
      );
      
      console.log('[teacherSubjectApi] Subjects fetched:', response.data.data.length);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherSubjectApi] Failed to fetch subjects:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Add a subject to a teacher
   */
  addSubject: async (teacherId: number, request: TeacherSubjectRequest): Promise<ApiResponse<TeacherSubjectResponse>> => {
    console.log(`[teacherSubjectApi] Adding subject ${request.subjectId} to teacher ${teacherId}`);
    
    try {
      const response = await apiClient.post<ApiResponse<TeacherSubjectResponse>>(
        `/api/admin/teachers/${teacherId}/subjects`,
        request
      );
      
      console.log('[teacherSubjectApi] Subject added');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherSubjectApi] Failed to add subject:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Add multiple subjects to a teacher
   */
  addSubjectsBatch: async (teacherId: number, requests: TeacherSubjectRequest[]): Promise<ApiResponse<TeacherSubjectResponse[]>> => {
    console.log(`[teacherSubjectApi] Adding ${requests.length} subjects to teacher ${teacherId}`);
    
    try {
      const response = await apiClient.post<ApiResponse<TeacherSubjectResponse[]>>(
        `/api/admin/teachers/${teacherId}/subjects/batch`,
        requests
      );
      
      console.log('[teacherSubjectApi] Subjects added in batch');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherSubjectApi] Failed to add subjects in batch:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Replace all subjects for a teacher
   */
  replaceSubjects: async (teacherId: number, requests: TeacherSubjectRequest[]): Promise<ApiResponse<TeacherSubjectResponse[]>> => {
    console.log(`[teacherSubjectApi] Replacing all subjects for teacher ${teacherId}`);
    
    try {
      const response = await apiClient.put<ApiResponse<TeacherSubjectResponse[]>>(
        `/api/admin/teachers/${teacherId}/subjects`,
        requests
      );
      
      console.log('[teacherSubjectApi] Subjects replaced');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherSubjectApi] Failed to replace subjects:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Update teacher-subject relationship
   */
  updateSubject: async (
    teacherId: number, 
    subjectId: number, 
    request: TeacherSubjectRequest
  ): Promise<ApiResponse<TeacherSubjectResponse>> => {
    console.log(`[teacherSubjectApi] Updating subject ${subjectId} for teacher ${teacherId}`);
    
    try {
      const response = await apiClient.put<ApiResponse<TeacherSubjectResponse>>(
        `/api/admin/teachers/${teacherId}/subjects/${subjectId}`,
        request
      );
      
      console.log('[teacherSubjectApi] Subject updated');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherSubjectApi] Failed to update subject:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Remove a subject from a teacher
   */
  removeSubject: async (teacherId: number, subjectId: number): Promise<ApiResponse<null>> => {
    console.log(`[teacherSubjectApi] Removing subject ${subjectId} from teacher ${teacherId}`);
    
    try {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/api/admin/teachers/${teacherId}/subjects/${subjectId}`
      );
      
      console.log('[teacherSubjectApi] Subject removed');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherSubjectApi] Failed to remove subject:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get all teachers who can teach a subject
   */
  getTeachersBySubject: async (subjectId: number): Promise<ApiResponse<TeacherSubjectResponse[]>> => {
    console.log(`[teacherSubjectApi] Fetching teachers for subject ${subjectId}`);
    
    try {
      const response = await apiClient.get<ApiResponse<TeacherSubjectResponse[]>>(
        `/api/admin/teachers/by-subject/${subjectId}`
      );
      
      console.log('[teacherSubjectApi] Teachers fetched:', response.data.data.length);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherSubjectApi] Failed to fetch teachers:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get qualified teachers for a subject (sorted by priority)
   */
  getQualifiedTeachers: async (subjectId: number): Promise<ApiResponse<TeacherSubjectResponse[]>> => {
    console.log(`[teacherSubjectApi] Fetching qualified teachers for subject ${subjectId}`);
    
    try {
      const response = await apiClient.get<ApiResponse<TeacherSubjectResponse[]>>(
        `/api/admin/teachers/by-subject/${subjectId}/qualified`
      );
      
      console.log('[teacherSubjectApi] Qualified teachers fetched:', response.data.data.length);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherSubjectApi] Failed to fetch qualified teachers:', apiError.response?.data || apiError.message);
      throw error;
    }
  }
};

export default teacherSubjectApi;