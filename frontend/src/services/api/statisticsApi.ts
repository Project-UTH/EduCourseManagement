import apiClient from './apiClient';

/**
 * Statistics API Service for Admin Dashboard
 */

export interface DashboardStatistics {
  // User counts
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  
  // Academic counts
  totalDepartments: number;
  totalMajors: number;
  totalSubjects: number;
  totalRooms: number;
  totalClasses: number;
  
  // Current semester info
  currentSemester: {
    semesterId: number;
    semesterCode: string;
    semesterName: string;
    status: string;
    startDate: string;
    endDate: string;
  } | null;
  
  // Additional metrics
  totalEnrollments: number;
  utilizationRate: number;
}

export interface QuickStats {
  label: string;
  value: number;
  icon: string;
  color: string;
  change?: number;
  route?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

const statisticsApi = {
  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<DashboardStatistics> => {
    console.log('[statisticsApi] Fetching dashboard statistics');
    
    try {
      const response = await apiClient.get<ApiResponse<DashboardStatistics>>(
        '/api/admin/statistics/dashboard'
      );
      
      console.log('[statisticsApi] ✅ Dashboard stats fetched');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[statisticsApi] ❌ Failed to fetch dashboard stats:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * Get student statistics
   */
  getStudentStats: async (): Promise<{
    total: number;
    active: number;
    byMajor: { majorName: string; count: number }[];
    byYear: { year: number; count: number }[];
  }> => {
    console.log('[statisticsApi] Fetching student statistics');
    
    try {
      const response = await apiClient.get('/api/admin/statistics/students');
      console.log('[statisticsApi] ✅ Student stats fetched');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[statisticsApi] ❌ Failed to fetch student stats:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * Get teacher statistics
   */
  getTeacherStats: async (): Promise<{
    total: number;
    active: number;
    byDepartment: { departmentName: string; count: number }[];
    byDegree: { degree: string; count: number }[];
  }> => {
    console.log('[statisticsApi] Fetching teacher statistics');
    
    try {
      const response = await apiClient.get('/api/admin/statistics/teachers');
      console.log('[statisticsApi] ✅ Teacher stats fetched');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[statisticsApi] ❌ Failed to fetch teacher stats:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * Get class statistics
   */
  getClassStats: async (semesterId?: number): Promise<{
    total: number;
    byStatus: { status: string; count: number }[];
    totalEnrollments: number;
    averageEnrollment: number;
  }> => {
    console.log('[statisticsApi] Fetching class statistics');
    
    try {
      const response = await apiClient.get('/api/admin/statistics/classes', {
        params: semesterId ? { semesterId } : {}
      });
      console.log('[statisticsApi] ✅ Class stats fetched');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[statisticsApi] ❌ Failed to fetch class stats:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },

  /**
   * Get Departments statistics
   */
  getDepartmentStats: async (): Promise<{
    total: number;
    withTeacherCount: { departmentName: string; teacherCount: number }[];
    withMajorCount: { departmentName: string; majorCount: number }[];
  }> => {
    console.log('[statisticsApi] Fetching department statistics');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiClient.get<ApiResponse<any>>('/api/admin/statistics/departments');
      console.log('[statisticsApi] ✅ Department stats fetched');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[statisticsApi] ❌ Failed to fetch department stats:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },

  /**
   * Get Subjects statistics
   */
  getSubjectStats: async (): Promise<{
    total: number;
    byCredits: { credits: number; count: number }[];
    byDepartment: { departmentName: string; count: number }[];
  }> => {
    console.log('[statisticsApi] Fetching subject statistics');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiClient.get<ApiResponse<any>>('/api/admin/statistics/subjects');
      console.log('[statisticsApi] ✅ Subject stats fetched');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[statisticsApi] ❌ Failed to fetch subject stats:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },

  /**
   * Get Majors statistics
   */
  getMajorStats: async (): Promise<{
    total: number;
    byDepartment: { departmentName: string; count: number }[];
    studentDistribution: { majorName: string; studentCount: number }[];
  }> => {
    console.log('[statisticsApi] Fetching major statistics');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiClient.get<ApiResponse<any>>('/api/admin/statistics/majors');
      console.log('[statisticsApi] ✅ Major stats fetched');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[statisticsApi] ❌ Failed to fetch major stats:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
};

export default statisticsApi;

 