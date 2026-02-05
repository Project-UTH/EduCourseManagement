import apiClient from './apiClient';

/**
 * Teacher API Service
 * * @updated 2026-01-28 - Added exportGradeStatisticsExcel method
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

// ==================== STUDENT ENROLLMENT DTO ====================

/**
 * StudentEnrollmentDto
 * * Response DTO for displaying students enrolled in a class
 * Used by Teacher to view their class roster with grades
 * * @since 2026-01-28
 */
export interface StudentEnrollmentDto {
  // Student info
  studentId: number;
  studentCode: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  email?: string;
  phone?: string;
  
  // Academic info
  majorName?: string;
  majorCode?: string;
  academicYear?: string;
  educationLevel?: string;
  
  // Enrollment info
  enrollmentId: number;
  registrationDate: string;
  enrollmentStatus: 'REGISTERED' | 'COMPLETED' | 'DROPPED';
  enrollmentType: 'NORMAL' | 'RETAKE' | 'IMPROVE';
  
  // Performance info (optional)
  regularScore?: number;
  midtermScore?: number;
  finalScore?: number;
  totalScore?: number;
  letterGrade?: string;
  gradeStatus?: 'PASSED' | 'FAILED' | 'IN_PROGRESS';
}

export interface ImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  identifier?: string; // studentCode or citizenId
  field?: string;
  message: string;
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
    status?: number;
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
  },

  /**
   * Import teachers from Excel file
   * POST /api/admin/teachers/import
   */
  importFromExcel: async (file: File): Promise<ApiResponse<ImportResult>> => {
    console.log('[teacherApi] Importing teachers from Excel:', file.name);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<ApiResponse<ImportResult>>(
        '/api/admin/teachers/import',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('[teacherApi] Import completed:', response.data.data);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherApi] Import failed:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Download Excel template for import
   * GET /api/admin/teachers/import/template
   */
  downloadTemplate: async (): Promise<Blob> => {
    console.log('[teacherApi] Downloading import template');
    
    try {
      const response = await apiClient.get('/api/admin/teachers/import/template', {
        responseType: 'blob',
      });
      
      console.log('[teacherApi] Template downloaded');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherApi] Failed to download template:', apiError.message);
      throw error;
    }
  },

  // ==================== PROFILE METHODS ====================

  /**
   * Get current teacher profile
   * GET /api/teacher/profile
   */
  getProfile: async (): Promise<TeacherResponse> => {
    console.log('[teacherApi] Fetching current teacher profile');
    
    try {
      const response = await apiClient.get<ApiResponse<TeacherResponse>>(
        '/api/teacher/profile'
      );
      
      console.log('[teacherApi] Profile fetched:', response.data.data.fullName);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherApi] Failed to fetch profile:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Update current teacher profile
   * PUT /api/teacher/profile
   */
  updateProfile: async (data: {
    email?: string;
    phone?: string;
    address?: string;
  }): Promise<ApiResponse<TeacherResponse>> => {
    console.log('[teacherApi] Updating profile');
    
    try {
      const response = await apiClient.put<ApiResponse<TeacherResponse>>(
        '/api/teacher/profile',
        data
      );
      
      console.log('[teacherApi] Profile updated successfully');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherApi] Failed to update profile:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Change password
   * POST /api/teacher/change-password
   */
  changePassword: async (data: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<null>> => {
    console.log('[teacherApi] Changing password');
    
    try {
      const response = await apiClient.post<ApiResponse<null>>(
        '/api/teacher/change-password',
        data
      );
      
      console.log('[teacherApi] Password changed successfully');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[teacherApi] Failed to change password:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // ==================== CLASS ROSTER MANAGEMENT ====================

  /**
   * Get list of students enrolled in a class
   * GET /api/teacher/classes/{classId}/students
   * * Returns list of students with their information and current grades
   * Only accessible if teacher owns this class
   * * @param classId Class ID
   * @returns List of enrolled students with their info and grades
   * @throws Error if teacher doesn't own the class or class not found
   * * @author ECMS Team
   * @since 2026-01-28
   */
  getEnrolledStudents: async (classId: number): Promise<StudentEnrollmentDto[]> => {
    console.log('[teacherApi] Fetching enrolled students for class:', classId);
    
    try {
      const response = await apiClient.get<StudentEnrollmentDto[]>(
        `/api/teacher/classes/${classId}/students`
      );
      
      console.log('[teacherApi] Enrolled students fetched:', response.data.length);
      return response.data;
      
    } catch (error) {
      const err = error as ApiError;
      console.error('[teacherApi] Failed to fetch enrolled students:', error);
      
      if (err.response?.status === 403) {
        throw new Error('Bạn không có quyền xem danh sách sinh viên của lớp này');
      } else if (err.response?.status === 404) {
        throw new Error('Không tìm thấy lớp học');
      }
      
      throw error;
    }
  },

  // ==================== EXCEL EXPORT ====================

  /**
   * Export grade statistics to Excel
   * GET /api/teacher/classes/{classId}/grades/export-excel
   * * Downloads an Excel file containing:
   * - Sheet 1: Overview statistics (average, pass rate, distribution)
   * - Sheet 2: Detailed student list with all scores
   * * @param classId Class ID
   * @returns Excel file as blob (auto-download in browser)
   * @throws Error if teacher doesn't own the class or class not found
   * * @author ECMS Team
   * @since 2026-01-28
   */
  exportGradeStatisticsExcel: async (classId: number) => {
    console.log('[teacherApi] Exporting grade statistics to Excel for class:', classId);
    
    try {
      const response = await apiClient.get(
        `/api/teacher/classes/${classId}/grades/export-excel`,
        {
          responseType: 'blob', // CRITICAL: Must be 'blob' to receive binary data
        }
      );
      
      console.log('[teacherApi] Excel file downloaded successfully');
      return response;
      
    } catch (error) {
      const err = error as ApiError;
      console.error('[teacherApi] Failed to export Excel:', error);
      
      if (err.response?.status === 403) {
        throw new Error('Bạn không có quyền xuất báo cáo của lớp này');
      } else if (err.response?.status === 404) {
        throw new Error('Không tìm thấy lớp học');
      }
      
      throw error;
    }
  },
};

export default teacherApi;