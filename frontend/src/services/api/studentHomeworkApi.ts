import apiClient from './apiClient';

/**
 * Student Homework API Service - MULTI-FILE SUPPORT
 * 
 * Handles:
 * - Get class homeworks
 * - Get homework detail
 * - Submit homework (multi-file)
 * - Update homework (add more files)
 * - Delete specific file by ID
 * - Get my submissions
 */

// ==================== INTERFACES ====================

export interface SubmissionFileResponse {
  fileId: number;
  submissionId: number;
  originalFilename: string;
  storedFilename: string;
  fileUrl: string;
  fileSize: number;
  formattedFileSize: string;
  mimeType?: string;
  fileExtension: string;
  uploadedAt: string;
  isImage: boolean;
  isDocument: boolean;
}

export interface StudentHomeworkResponse {
  homeworkId: number;
  title: string;
  description?: string;
  homeworkType: 'REGULAR' | 'MIDTERM' | 'FINAL';
  maxScore: number;
  deadline: string;
  attachmentUrl?: string;
  classId: number;
  className: string;
  subjectName: string;
  teacherName: string;
  createdAt: string;
  
  // Student-specific fields
  hasSubmitted: boolean;
  submissionDate?: string;
  submissionId?: number;
  score?: number;
  teacherFeedback?: string;
  status?: 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED' | 'LATE';
  isOverdue: boolean;
  daysUntilDeadline?: number;
}

export interface HomeworkDetailResponse {
  homeworkId: number;
  title: string;
  description?: string;
  homeworkType: 'REGULAR' | 'MIDTERM' | 'FINAL';
  maxScore: number;
  deadline: string;
  attachmentUrl?: string;
  attachmentName?: string;
  classId: number;
  className: string;
  subjectName: string;
  teacher: {
    teacherId: number;
    fullName: string;
    email?: string;
  };
  createdAt: string;
  
  // Submission info (if exists)
  submission?: {
    submissionId: number;
    // NEW: Multiple files support
    submissionFiles?: SubmissionFileResponse[];
    // Legacy single-file fields (deprecated)
    submissionFileUrl?: string;
    submissionFileName?: string;
    submissionText?: string;
    submissionDate: string;
    score?: number;
    teacherFeedback?: string;
    status: 'SUBMITTED' | 'GRADED' | 'LATE';
    isLate: boolean;
  };
  
  isOverdue: boolean;
  canSubmit: boolean;
}

export interface SubmitHomeworkRequest {
  submissionText?: string;
  file?: File;
}

export interface StudentSubmissionResponse {
  submissionId: number;
  homeworkId: number;
  homeworkTitle: string;
  homeworkType: 'REGULAR' | 'MIDTERM' | 'FINAL';
  className: string;
  subjectName: string;
  // NEW: Multiple files
  submissionFiles?: SubmissionFileResponse[];
  // Legacy fields
  submissionFileUrl?: string;
  submissionFileName?: string;
  submissionText?: string;
  submissionDate: string;
  score?: number;
  scorePercentage?: number;
  teacherFeedback?: string;
  status: 'SUBMITTED' | 'GRADED' | 'LATE';
  isLate: boolean;
  deadline: string;
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

const studentHomeworkApi = {
  /**
   * Get all homeworks for a class
   * GET /api/student/classes/{classId}/homeworks
   */
  getClassHomeworks: async (classId: number): Promise<StudentHomeworkResponse[]> => {
    console.log('[studentHomeworkApi] Fetching homeworks for class:', classId);
    
    try {
      const response = await apiClient.get<ApiResponse<StudentHomeworkResponse[]>>(
        `/api/student/classes/${classId}/homeworks`
      );
      
      console.log('[studentHomeworkApi] Homeworks fetched:', response.data.data.length);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentHomeworkApi] Failed to fetch homeworks:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get homework detail
   * GET /api/student/homeworks/{id}
   */
  getHomeworkDetail: async (homeworkId: number): Promise<HomeworkDetailResponse> => {
    console.log('[studentHomeworkApi] Fetching homework detail:', homeworkId);
    
    try {
      const response = await apiClient.get<ApiResponse<HomeworkDetailResponse>>(
        `/api/student/homeworks/${homeworkId}`
      );
      
      console.log('[studentHomeworkApi] Homework detail fetched:', response.data.data.title);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentHomeworkApi] Failed to fetch homework detail:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Submit homework (first time)
   * POST /api/student/homeworks/{id}/submit
   * 
   * Multipart form data with optional file and text
   */
  submitHomework: async (
    homeworkId: number,
    data: SubmitHomeworkRequest
  ): Promise<StudentSubmissionResponse> => {
    console.log('[studentHomeworkApi] Submitting homework:', homeworkId);
    
    try {
      const formData = new FormData();
      
      if (data.file) {
        formData.append('file', data.file);
      }
      
      if (data.submissionText) {
        formData.append('submissionText', data.submissionText);
      }
      
      const response = await apiClient.post<ApiResponse<StudentSubmissionResponse>>(
        `/api/student/homeworks/${homeworkId}/submit`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      console.log('[studentHomeworkApi] Homework submitted successfully');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentHomeworkApi] Failed to submit homework:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Update homework (add more files or edit text)
   * PUT /api/student/homeworks/{id}/update
   */
  updateHomework: async (
    homeworkId: number,
    request: SubmitHomeworkRequest
  ): Promise<StudentSubmissionResponse> => {
    console.log('[studentHomeworkApi] Updating homework:', homeworkId);

    const formData = new FormData();

    if (request.submissionText) {
      formData.append('submissionText', request.submissionText);
    }

    if (request.file) {
      formData.append('file', request.file);
    }

    const response = await apiClient.put<ApiResponse<StudentSubmissionResponse>>(
      `/api/student/homeworks/${homeworkId}/update`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('[studentHomeworkApi] Homework updated successfully');

    return response.data.data;
  },

  /**
   * Delete all submission files (legacy - deletes all files)
   * DELETE /api/student/homeworks/{id}/file
   */
  deleteSubmissionFile: async (homeworkId: number): Promise<void> => {
    console.log('[studentHomeworkApi] Deleting ALL files for homework:', homeworkId);

    await apiClient.delete(`/api/student/homeworks/${homeworkId}/file`);

    console.log('[studentHomeworkApi] All files deleted successfully');
  },

  /**
   * NEW: Delete a specific file by fileId
   * DELETE /api/student/homeworks/{homeworkId}/files/{fileId}
   */
  deleteSubmissionFileById: async (homeworkId: number, fileId: number): Promise<void> => {
    console.log('[studentHomeworkApi] Deleting specific file:', fileId, 'for homework:', homeworkId);

    await apiClient.delete(`/api/student/homeworks/${homeworkId}/files/${fileId}`);

    console.log('[studentHomeworkApi] File deleted successfully');
  },

  /**
   * Get my submissions
   * GET /api/student/submissions/my
   */
  getMySubmissions: async (): Promise<StudentSubmissionResponse[]> => {
    console.log('[studentHomeworkApi] Fetching my submissions');
    
    try {
      const response = await apiClient.get<ApiResponse<StudentSubmissionResponse[]>>(
        '/api/student/submissions/my'
      );
      
      console.log('[studentHomeworkApi] Submissions fetched:', response.data.data.length);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentHomeworkApi] Failed to fetch submissions:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Download homework attachment
   * Helper method to download file
   */
  downloadAttachment: (url: string, filename: string) => {
    console.log('[studentHomeworkApi] Downloading attachment:', filename);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

export default studentHomeworkApi;