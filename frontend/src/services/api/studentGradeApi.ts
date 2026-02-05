import apiClient from './apiClient';

/**
 * Student Grade API Service
 * 
 * Handles:
 * - Get my grades
 * - Get class grades
 * - Get transcript
 */

// ==================== INTERFACES ====================

export interface StudentGradeResponse {
  gradeId: number;
  classId: number;
  className: string;
  classCode: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  teacherName: string;
  semesterName: string;
  academicYear: string;
  
  // Scores
  regularScore?: number;
  midtermScore?: number;
  finalScore?: number;
  totalScore?: number;
  
  // Grade info
  letterGrade?: string; // A, B+, B, C+, C, D+, D, F
  status?: 'PASSED' | 'FAILED' | 'IN_PROGRESS';
  
  // Metadata
  updatedAt?: string;
}

export interface ClassGradeDetailResponse {
  classId: number;
  className: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  teacherName: string;
  
  // Grade breakdown
  grade: {
    gradeId: number;
    regularScore?: number;
    midtermScore?: number;
    finalScore?: number;
    totalScore?: number;
    letterGrade?: string;
    status?: 'PASSED' | 'FAILED' | 'IN_PROGRESS';
  };
  
  // Component scores (from submissions)
  regularHomeworks: {
    homeworkId: number;
    title: string;
    score?: number;
    maxScore: number;
    percentage?: number;
  }[];
  
  midtermHomework?: {
    homeworkId: number;
    title: string;
    score?: number;
    maxScore: number;
    percentage?: number;
  };
  
  finalHomework?: {
    homeworkId: number;
    title: string;
    score?: number;
    maxScore: number;
    percentage?: number;
  };
}

export interface TranscriptResponse {
  student: {
    studentId: number;
    studentCode: string;
    fullName: string;
    majorCode: string;
    majorName: string;
    academicYear: number;
  };
  
  // Overall stats
  gpa: number;
  totalCredits: number;
  totalCreditsEarned: number;
  passedClasses: number;
  failedClasses: number;
  inProgressClasses: number;
  
  // Grades by semester
  semesters: {
    semesterName: string;
    academicYear: string;
    semesterGpa: number;
    semesterCredits: number;
    classes: StudentGradeResponse[];
  }[];
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

const studentGradeApi = {
  /**
   * Get all my grades
   * GET /api/student/grades
   */
  getMyGrades: async (): Promise<StudentGradeResponse[]> => {
    console.log('[studentGradeApi] Fetching my grades');
    
    try {
      const response = await apiClient.get<ApiResponse<StudentGradeResponse[]>>(
        '/api/student/grades'
      );
      
      console.log('[studentGradeApi] Grades fetched:', response.data.data.length);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentGradeApi] Failed to fetch grades:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get grades for a specific class
   * GET /api/student/classes/{classId}/grades
   */
  getClassGrades: async (classId: number): Promise<ClassGradeDetailResponse> => {
    console.log('[studentGradeApi] Fetching grades for class:', classId);
    
    try {
      const response = await apiClient.get<ApiResponse<ClassGradeDetailResponse>>(
        `/api/student/classes/${classId}/grades`
      );
      
      console.log('[studentGradeApi] Class grades fetched');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentGradeApi] Failed to fetch class grades:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Get full transcript
   * GET /api/student/transcript
   */
  getTranscript: async (): Promise<TranscriptResponse> => {
    console.log('[studentGradeApi] Fetching transcript');
    
    try {
      const response = await apiClient.get<ApiResponse<TranscriptResponse>>(
        '/api/student/transcript'
      );
      
      console.log('[studentGradeApi] Transcript fetched - GPA:', response.data.data.gpa);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[studentGradeApi] Failed to fetch transcript:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  /**
   * Helper: Format letter grade with color
   */
  getGradeColor: (letterGrade?: string): string => {
    if (!letterGrade) return '#6b7280'; // gray
    
    const gradeColors: Record<string, string> = {
      'A': '#10b981',   // green
      'B+': '#059669',  // green-dark
      'B': '#3b82f6',   // blue
      'C+': '#0ea5e9',  // blue-light
      'C': '#f59e0b',   // yellow
      'D+': '#f97316',  // orange
      'D': '#ef4444',   // red
      'F': '#dc2626',   // red-dark
    };
    
    return gradeColors[letterGrade] || '#6b7280';
  },

  /**
   * Helper: Format status badge
   */
  getStatusBadge: (status?: string): { text: string; color: string } => {
    const badges: Record<string, { text: string; color: string }> = {
      'PASSED': { text: 'Đạt', color: '#10b981' },
      'FAILED': { text: 'Không đạt', color: '#ef4444' },
      'IN_PROGRESS': { text: 'Đang học', color: '#3b82f6' },
    };
    
    return badges[status || 'IN_PROGRESS'] || { text: 'Chưa có', color: '#6b7280' };
  },
};

export default studentGradeApi;