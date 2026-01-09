import apiClient from './apiClient';

/**
 * Submission API Service
 * 
 * Xử lý các thao tác với bài nộp: xem, chấm điểm, thống kê
 * Map tới TeacherSubmissionController endpoints
 */

// ==================== INTERFACES (từ backend DTOs) ====================

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
  
  submissionFileUrl?: string;
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
  score: number; // Phải từ 0-10
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
   * Lấy tất cả bài nộp của một bài tập
   * GET /api/teacher/submissions/homework/{homeworkId}
   */
  getSubmissionsByHomework: async (homeworkId: number): Promise<SubmissionResponse[]> => {
    console.log('[submissionApi] Đang tải bài nộp cho homework:', homeworkId);
    
    try {
      const response = await apiClient.get(
        `/api/teacher/submissions/homework/${homeworkId}`
      );
      
      // ✅ Backend trả về MẢNG TRỰC TIẾP, không có wrapper
      let data = response?.data;
      
      // Nếu có wrapper {data: ...}, unwrap nó
      if (data && typeof data === 'object' && 'data' in data) {
        data = data.data;
      }
      
      // Kiểm tra là mảng
      if (!Array.isArray(data)) {
        console.log('[submissionApi] ⚠️ Data không phải mảng:', typeof data);
        return [];
      }
      
      console.log('[submissionApi] ✅ Tìm thấy', data.length, 'bài nộp');
      return data;
      
    } catch (error: any) {
      console.error('[submissionApi] ❌ Lỗi khi tải bài nộp:', error.response?.data?.message || error.message);
      
      // Trả về mảng rỗng nếu 404 (không có bài nộp)
      if (error.response?.status === 404) {
        console.log('[submissionApi] ℹ️ Chưa có bài nộp nào (404)');
        return [];
      }
      
      throw error;
    }
  },
  
  /**
   * Lấy danh sách bài nộp cần chấm
   * GET /api/teacher/submissions/homework/{homeworkId}/needing-grading
   */
  getNeedingGrading: async (homeworkId: number): Promise<SubmissionResponse[]> => {
    console.log('[submissionApi] Đang tải bài nộp chưa chấm cho homework:', homeworkId);
    
    try {
      const response = await apiClient.get<ApiResponse<SubmissionResponse[]>>(
        `/api/teacher/submissions/homework/${homeworkId}/needing-grading`
      );
      
      const data = response?.data?.data;
      
      if (!data || !Array.isArray(data)) {
        console.log('[submissionApi] ⚠️ Không có bài nộp cần chấm');
        return [];
      }
      
      console.log('[submissionApi] ✅ Tìm thấy', data.length, 'bài nộp cần chấm');
      return data;
      
    } catch (error: any) {
      console.error('[submissionApi] ❌ Lỗi khi tải bài chưa chấm:', error.response?.data?.message || error.message);
      
      if (error.response?.status === 404) {
        return [];
      }
      
      throw error;
    }
  },
  
  /**
   * Chấm điểm một bài nộp
   * POST /api/teacher/submissions/{id}/grade
   * 
   * Tác động:
   * - Cập nhật submission.score và status
   * - Nếu REGULAR: tính lại grade.regularScore (trung bình)
   * - Nếu MIDTERM: cập nhật grade.midtermScore
   * - Nếu FINAL: cập nhật grade.finalScore
   * - Tự động tính lại bảng điểm
   */
  gradeSubmission: async (
    submissionId: number,
    score: number,
    feedback?: string
  ): Promise<SubmissionResponse> => {
    console.log('[submissionApi] Đang chấm bài nộp:', submissionId, 'Điểm:', score);
    
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
      
      console.log('[submissionApi] ✅ Đã chấm điểm thành công');
      return response.data.data;
      
    } catch (error: any) {
      console.error('[submissionApi] ❌ Lỗi khi chấm điểm:', error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  /**
   * Xóa điểm của một bài nộp
   * DELETE /api/teacher/submissions/{id}/grade
   */
  ungradeSubmission: async (submissionId: number): Promise<SubmissionResponse> => {
    console.log('[submissionApi] Đang xóa điểm bài nộp:', submissionId);
    
    try {
      const response = await apiClient.delete<ApiResponse<SubmissionResponse>>(
        `/api/teacher/submissions/${submissionId}/grade`
      );
      
      console.log('[submissionApi] ✅ Đã xóa điểm');
      return response.data.data;
      
    } catch (error: any) {
      console.error('[submissionApi] ❌ Lỗi khi xóa điểm:', error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  /**
   * Chấm nhiều bài nộp cùng lúc
   * POST /api/teacher/submissions/bulk-grade
   */
  bulkGrade: async (requests: GradeSubmissionRequest[]): Promise<SubmissionResponse[]> => {
    console.log('[submissionApi] Đang chấm hàng loạt', requests.length, 'bài nộp');
    
    try {
      const response = await apiClient.post<ApiResponse<SubmissionResponse[]>>(
        '/api/teacher/submissions/bulk-grade',
        requests
      );
      
      const data = response?.data?.data;
      
      if (!data || !Array.isArray(data)) {
        console.log('[submissionApi] ⚠️ Lỗi bulk grade, không có data');
        return [];
      }
      
      console.log('[submissionApi] ✅ Đã chấm hàng loạt thành công');
      return data;
      
    } catch (error: any) {
      console.error('[submissionApi] ❌ Lỗi khi chấm hàng loạt:', error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  /**
   * Lấy thống kê bài nộp
   * GET /api/teacher/submissions/homework/{homeworkId}/stats
   */
  getSubmissionStats: async (homeworkId: number): Promise<SubmissionStatsResponse> => {
    console.log('[submissionApi] Đang tải thống kê cho homework:', homeworkId);
    
    try {
      const response = await apiClient.get<ApiResponse<SubmissionStatsResponse>>(
        `/api/teacher/submissions/homework/${homeworkId}/stats`
      );
      
      console.log('[submissionApi] ✅ Đã tải thống kê');
      return response.data.data;
      
    } catch (error: any) {
      console.error('[submissionApi] ❌ Lỗi khi tải thống kê:', error.response?.data?.message || error.message);
      throw error;
    }
  },
  
  /**
   * Lấy bài nộp theo trang (phân trang)
   * GET /api/teacher/submissions/homework/{homeworkId}/page
   */
  getSubmissionsPaginated: async (
    homeworkId: number,
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<SubmissionResponse>> => {
    console.log(`[submissionApi] Đang tải trang ${page} của bài nộp`);
    
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<SubmissionResponse>>>(
        `/api/teacher/submissions/homework/${homeworkId}/page`,
        { params: { page, size } }
      );
      
      return response.data.data;
      
    } catch (error: any) {
      console.error('[submissionApi] ❌ Lỗi khi tải trang:', error.response?.data?.message || error.message);
      throw error;
    }
  },
};

export default submissionApi;