import apiClient from './apiClient';

/**
 * Submission API Service
 * * Xu ly cac thao tac voi bai nop: xem, cham diem, thong ke
 * Map toi TeacherSubmissionController endpoints
 * MULTI-FILE SUPPORT
 */

// ==================== INTERFACES (tu backend DTOs) ====================

// Interface phu tro de xu ly loi ma khong dung 'any'
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

// NEW: Multi-file support
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

export interface SubmissionResponse {
  submissionId: number;
  homeworkId: number;
  homeworkTitle: string;
  
  studentInfo: {
    studentId: number;
    studentCode: string;
    fullName: string;
    email?: string;
  };
  
  // Legacy single file (deprecated)
  submissionFileUrl?: string;
  submissionFileName?: string;
  
  // NEW: Multiple files support
  submissionFiles?: SubmissionFileResponse[];
  
  submissionText?: string;
  submissionDate: string;
  
  score?: number;
  teacherFeedback?: string;
  gradedDate?: string;
  
  status: 'SUBMITTED' | 'GRADED' | 'LATE';
  statusDisplay: string;
  
  isLate: boolean;
  isGraded: boolean;
  submissionTiming?: string;
  scorePercentage?: number;
  
  createdAt: string;
  updatedAt?: string;
}

export interface GradeSubmissionRequest {
  submissionId: number;
  score: number; // Phai tu 0-10
  teacherFeedback?: string;
}

export interface SubmissionStatsResponse {
  overall: {
    totalStudents: number;
    totalSubmissions: number;
    notSubmitted: number;
    submissionRate: number;
  };
  
  scores: {
    average: number;
    median: number;
    highest: number;
    lowest: number;
    standardDeviation: number;
    passCount: number;
    failCount: number;
    passRate: number;
  };
  
  grading: {
    gradedCount: number;
    ungradedCount: number;
    completionRate: number;
  };
  
  late: {
    lateCount: number;
    lateRate: number;
    avgLateScore: number;
    avgOnTimeScore: number;
  };
  
  topSubmissions: Array<{
    studentName: string;
    studentCode: string;
    score: number;
    rank: number;
  }>;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ==================== API METHODS ====================

const submissionApi = {
  
  /**
   * Lay tat ca bai nop cua mot bai tap
   * GET /api/teacher/submissions/homework/{homeworkId}
   */
  getSubmissionsByHomework: async (homeworkId: number): Promise<SubmissionResponse[]> => {
    console.log('[submissionApi] Dang tai bai nop cho homework:', homeworkId);
    
    try {
      const response = await apiClient.get(
        `/api/teacher/submissions/homework/${homeworkId}`
      );
      
      // Backend tra ve MANG TRUC TIEP, khong co wrapper
      // Su dung 'unknown' sau do cast de tranh loi any
      let data = response?.data as unknown;
      
      // Neu co wrapper {data: ...}, unwrap no
      if (data && typeof data === 'object' && 'data' in data) {
        data = (data as { data: unknown }).data;
      }
      
      // Kiem tra la mang
      if (!Array.isArray(data)) {
        console.log('[submissionApi] Data khong phai mang:', typeof data);
        return [];
      }
      
      console.log('[submissionApi] Tim thay', data.length, 'bai nop');
      return data as SubmissionResponse[];
      
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[submissionApi] Loi khi tai bai nop:', err.response?.data?.message || err.message);
      
      // Tra ve mang rong neu 404 (khong co bai nop)
      if (err.response?.status === 404) {
        console.log('[submissionApi] Chua co bai nop nao (404)');
        return [];
      }
      
      throw error;
    }
  },
  
  /**
   * Lay danh sach bai nop can cham
   * GET /api/teacher/submissions/homework/{homeworkId}/needing-grading
   */
  getNeedingGrading: async (homeworkId: number): Promise<SubmissionResponse[]> => {
    console.log('[submissionApi] Dang tai bai nop chua cham cho homework:', homeworkId);
    
    try {
      const response = await apiClient.get<ApiResponse<SubmissionResponse[]>>(
        `/api/teacher/submissions/homework/${homeworkId}/needing-grading`
      );
      
      const data = response?.data?.data;
      
      if (!data || !Array.isArray(data)) {
        console.log('[submissionApi] Khong co bai nop can cham');
        return [];
      }
      
      console.log('[submissionApi] Tim thay', data.length, 'bai nop can cham');
      return data;
      
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[submissionApi] Loi khi tai bai chua cham:', err.response?.data?.message || err.message);
      
      if (err.response?.status === 404) {
        return [];
      }
      
      throw error;
    }
  },
  
  /**
   * Cham diem mot bai nop
   * POST /api/teacher/submissions/{id}/grade
   * * Tac dong:
   * - Cap nhat submission.score va status
   * - Neu REGULAR: tinh lai grade.regularScore (trung binh)
   * - Neu MIDTERM: cap nhat grade.midtermScore
   * - Neu FINAL: cap nhat grade.finalScore
   * - Tu dong tinh lai bang diem
   */
  gradeSubmission: async (
    submissionId: number,
    score: number,
    feedback?: string
  ): Promise<SubmissionResponse> => {
    console.log('[submissionApi] Dang cham bai nop:', submissionId, 'Diem:', score);
    
    try {
      const request: GradeSubmissionRequest = {
        submissionId,
        score,
        teacherFeedback: feedback
      };
      
      const response = await apiClient.post<ApiResponse<SubmissionResponse>>(
        `/api/teacher/submissions/${submissionId}/grade`,
        request
      );
      
      console.log('[submissionApi] Da cham diem thanh cong');
      return response.data.data;
      
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[submissionApi] Loi khi cham diem:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * Xoa diem cua mot bai nop
   * DELETE /api/teacher/submissions/{id}/grade
   */
  ungradeSubmission: async (submissionId: number): Promise<SubmissionResponse> => {
    console.log('[submissionApi] Dang xoa diem bai nop:', submissionId);
    
    try {
      const response = await apiClient.delete<ApiResponse<SubmissionResponse>>(
        `/api/teacher/submissions/${submissionId}/grade`
      );
      
      console.log('[submissionApi] Da xoa diem');
      return response.data.data;
      
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[submissionApi] Loi khi xoa diem:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * Cham nhieu bai nop cung luc
   * POST /api/teacher/submissions/bulk-grade
   */
  bulkGrade: async (requests: GradeSubmissionRequest[]): Promise<SubmissionResponse[]> => {
    console.log('[submissionApi] Dang cham hang loat', requests.length, 'bai nop');
    
    try {
      const response = await apiClient.post<ApiResponse<SubmissionResponse[]>>(
        '/api/teacher/submissions/bulk-grade',
        requests
      );
      
      const data = response?.data?.data;
      
      if (!data || !Array.isArray(data)) {
        console.log('[submissionApi] Loi bulk grade, khong co data');
        return [];
      }
      
      console.log('[submissionApi] Da cham hang loat thanh cong');
      return data;
      
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[submissionApi] Loi khi cham hang loat:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * Lay thong ke bai nop
   * GET /api/teacher/submissions/homework/{homeworkId}/stats
   */
  getSubmissionStats: async (homeworkId: number): Promise<SubmissionStatsResponse> => {
    console.log('[submissionApi] Dang tai thong ke cho homework:', homeworkId);
    
    try {
      const response = await apiClient.get<ApiResponse<SubmissionStatsResponse>>(
        `/api/teacher/submissions/homework/${homeworkId}/stats`
      );
      
      console.log('[submissionApi] Da tai thong ke');
      return response.data.data;
      
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[submissionApi] Loi khi tai thong ke:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * Lay bai nop theo trang (phan trang)
   * GET /api/teacher/submissions/homework/{homeworkId}/page
   */
  getSubmissionsPaginated: async (
    homeworkId: number,
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<SubmissionResponse>> => {
    console.log(`[submissionApi] Dang tai trang ${page} cua bai nop`);
    
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<SubmissionResponse>>>(
        `/api/teacher/submissions/homework/${homeworkId}/page`,
        { params: { page, size } }
      );
      
      return response.data.data;
      
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[submissionApi] Loi khi tai trang:', err.response?.data?.message || err.message);
      throw error;
    }
  },
};

export default submissionApi;