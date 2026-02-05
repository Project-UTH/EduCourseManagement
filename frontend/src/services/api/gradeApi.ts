import apiClient from './apiClient';

/**
 * Grade API Service
 * * Handles grade CRUD, auto-calculations, class statistics, and transcripts
 * Maps to TeacherGradeController endpoints
 */

// ==================== INTERFACES (from backend DTOs) ====================

export interface GradeRequest {
  studentId: number;
  classId: number;
  regularScore?: number; // Read-only (auto from REGULAR homework average)
  midtermScore?: number; // From MIDTERM homework
  finalScore?: number; // From FINAL homework
  attendanceRate?: number;
  teacherComment?: string;
}

export interface GradeResponse {
  gradeId: number;
  
  studentInfo: {
    studentId: number;
    studentCode: string;
    fullName: string;
  };
  
  classInfo: {
    classId: number;
    classCode: string;
    subjectName: string;
    subjectCode: string;
    credits: number;
  };
  
  // Score components
  regularScore?: number; // 20% weight (auto-calculated)
  midtermScore?: number; // 30% weight
  finalScore?: number; // 50% weight
  totalScore?: number; // Auto-calculated
  
  // Derived
  letterGrade?: string; // A, B+, B, C+, C, D+, D, F
  status: 'PASSED' | 'FAILED' | 'IN_PROGRESS';
  statusDisplay: string;
  
  // Additional
  attendanceRate?: number;
  teacherComment?: string;
  gradePoint?: number; // 4.0 scale
  isComplete: boolean;
  isPassed: boolean;
  scoreBreakdown?: string;
  
  createdAt: string;
  updatedAt?: string;
}

export interface GradeStatsResponse {
  classId: number;
  classCode: string;
  
  overall: {
    totalStudents: number;
    gradedStudents: number;
    inProgress: number;
    completionRate: number;
  };
  
  scores: {
    average: number;
    median: number;
    highest: number;
    lowest: number;
    standardDeviation: number;
  };
  
  distribution: {
    countA: number;
    countBPlus: number;
    countB: number;
    countCPlus: number;
    countC: number;
    countDPlus: number;
    countD: number;
    countF: number;
  };
  
  passFail: {
    passedCount: number;
    failedCount: number;
    passRate: number;
  };
}

export interface TranscriptResponse {
  studentInfo: {
    studentId: number;
    studentCode: string;
    fullName: string;
    majorName: string;
    currentYear: number;
  };
  
  summary: {
    overallGPA: number;
    averageScore: number;
    totalCredits: number;
    completedCredits: number;
    passedCredits: number;
    failedCredits: number;
    totalCourses: number;
    passedCourses: number;
    failedCourses: number;
    passRate: number;
  };
  
  semesters: Array<{
    semesterName: string;
    semesterGPA: number;
    semesterAverage: number;
    semesterCredits: number;
    courses: Array<{
      classCode: string;
      subjectCode: string;
      subjectName: string;
      credits: number;
      regularScore: number;
      midtermScore: number;
      finalScore: number;
      totalScore: number;
      letterGrade: string;
      gradePoint: number;
      status: string;
      teacherComment?: string;
    }>;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Interface helper để định nghĩa cấu trúc lỗi từ API (thường là từ Axios)
interface ApiError {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
}

// ==================== API METHODS ====================

const gradeApi = {
  
  /**
   * Create or update grade
   * POST /api/teacher/grades
   * * Note: regularScore is auto-calculated from REGULAR homework average
   */
  createOrUpdateGrade: async (data: GradeRequest): Promise<GradeResponse> => {
    console.log('[gradeApi] Creating/updating grade for student:', data.studentId);
    
    try {
      const response = await apiClient.post<GradeResponse>(
        '/api/teacher/grades',
        data
      );
      
      console.log('[gradeApi] Grade saved');
      return response.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[gradeApi] Failed to save grade:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * Bulk update grades
   * POST /api/teacher/grades/bulk
   */
  bulkUpdateGrades: async (requests: GradeRequest[]): Promise<GradeResponse[]> => {
    console.log('[gradeApi] Bulk updating', requests.length, 'grades');
    
    try {
      const response = await apiClient.post<GradeResponse[]>(
        '/api/teacher/grades/bulk',
        requests
      );
      
      console.log('[gradeApi] Bulk update complete');
      return response.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[gradeApi] Bulk update failed:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * Get grade for a student in a class
   * GET /api/teacher/grades/student/{studentId}/class/{classId}
   */
  getGrade: async (studentId: number, classId: number): Promise<GradeResponse> => {
    console.log('[gradeApi] Fetching grade:', { studentId, classId });
    
    try {
      const response = await apiClient.get<GradeResponse>(
        `/api/teacher/grades/student/${studentId}/class/${classId}`
      );
      
      return response.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[gradeApi] Failed to fetch grade:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * Get all grades for a class
   * GET /api/teacher/grades/class/{classId}
   */
  getGradesByClass: async (classId: number): Promise<GradeResponse[]> => {
    console.log('[gradeApi] Fetching all grades for class:', classId);
    
    try {
      const response = await apiClient.get<GradeResponse[]>(
        `/api/teacher/grades/class/${classId}`
      );
      
      console.log('[gradeApi] Found', response.data.length, 'grades');
      return response.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[gradeApi] Failed to fetch grades:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * Get student's transcript (all grades across all classes)
   * GET /api/teacher/grades/student/{studentId}/transcript
   */
  getTranscript: async (studentId: number): Promise<TranscriptResponse> => {
    console.log('[gradeApi] Fetching transcript for student:', studentId);
    
    try {
      const response = await apiClient.get<TranscriptResponse>(
        `/api/teacher/grades/student/${studentId}/transcript`
      );
      
      console.log('[gradeApi] Transcript loaded:', response.data.summary.totalCourses, 'courses');
      return response.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[gradeApi] Failed to fetch transcript:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * Recalculate regular score (average of REGULAR homework)
   * POST /api/teacher/grades/calculate/regular
   */
  calculateRegularScore: async (studentId: number, classId: number): Promise<void> => {
    console.log('[gradeApi] Recalculating regular score:', { studentId, classId });
    
    try {
      await apiClient.post('/api/teacher/grades/calculate/regular', null, {
        params: { studentId, classId }
      });
      
      console.log('[gradeApi] Regular score updated');
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[gradeApi] Failed to calculate:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * Calculate student's GPA (weighted by credits)
   * GET /api/teacher/grades/student/{studentId}/gpa
   * * Formula: Σ(totalScore * credits) / Σ(credits)
   */
  calculateGPA: async (studentId: number): Promise<number> => {
    console.log('[gradeApi] Calculating GPA for student:', studentId);
    
    try {
      const response = await apiClient.get<number>(
        `/api/teacher/grades/student/${studentId}/gpa`
      );
      
      console.log('[gradeApi] GPA:', response.data);
      return response.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[gradeApi] Failed to calculate GPA:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * Get class statistics
   * GET /api/teacher/grades/class/{classId}/stats
   */
  getClassStats: async (classId: number): Promise<GradeStatsResponse> => {
    console.log('[gradeApi] Fetching class stats:', classId);
    
    try {
      const response = await apiClient.get<GradeStatsResponse>(
        `/api/teacher/grades/class/${classId}/stats`
      );
      
      console.log('[gradeApi] Stats loaded');
      return response.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[gradeApi] Failed to fetch stats:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * Get student's rank in class
   * GET /api/teacher/grades/student/{studentId}/class/{classId}/rank
   */
  getStudentRank: async (studentId: number, classId: number): Promise<number> => {
    console.log('[gradeApi] Fetching rank for student:', studentId);
    
    try {
      const response = await apiClient.get<number>(
        `/api/teacher/grades/student/${studentId}/class/${classId}/rank`
      );
      
      console.log('[gradeApi] Rank:', response.data);
      return response.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[gradeApi] Failed to fetch rank:', err.response?.data?.message || err.message);
      throw error;
    }
  },
  
  /**
   * Initialize grade table for a class
   * POST /api/teacher/grades/class/{classId}/initialize
   * * Creates grade records for all enrolled students
   */
  initializeGrades: async (classId: number): Promise<void> => {
    console.log('[gradeApi] Initializing grades for class:', classId);
    
    try {
      await apiClient.post(`/api/teacher/grades/class/${classId}/initialize`);
      console.log('[gradeApi] Grades initialized');
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error('[gradeApi] Failed to initialize:', err.response?.data?.message || err.message);
      throw error;
    }
  },
};

export default gradeApi;