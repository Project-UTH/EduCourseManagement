import apiClient from './apiClient';

// ==================== INTERFACES ====================

export interface RoomResponse {
  // Basic info
  roomId: number;
  roomCode: string;
  roomName: string;
  building: string;
  floor: number;
  roomType: string;              // "LECTURE_HALL", "LAB", etc.
  roomTypeDisplay: string;       // "Giảng đường", "Phòng thực hành"
  capacity: number;
  
  // Admin status
  isActive: boolean;
  adminStatus: string;           // "ACTIVE" / "INACTIVE"
  adminStatusDisplay: string;    // "Hoạt động" / "Ngừng hoạt động"
  
  // Real-time status
  currentStatus: string;         // "IN_USE" / "AVAILABLE" / "INACTIVE"
  currentStatusDisplay: string;  // "Đang sử dụng" / "Trống" / "Ngừng hoạt động"
  currentSession: CurrentSessionInfo | null;
  
  // Statistics
  totalSessionsInSemester: number;
  completedSessions: number;
  upcomingSessions: number;
  utilizationPercentage: number;
  
  // Location
  fullLocation: string;          // "Tòa A - Tầng 2 - A201"
  capacityInfo: string;          // "50 chỗ ngồi" or "Không giới hạn"
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface CurrentSessionInfo {
  sessionId: number;
  classId: number;
  classCode: string;
  subjectName: string;
  teacherName: string;
  timeSlot: string;              // "CA1"
  timeSlotDisplay: string;       // "Ca 1 (06:45-09:15)"
  startTime: string;             // "06:45"
  endTime: string;               // "09:15"
  minutesRemaining: number;      // Minutes until session ends
}

export interface RoomScheduleResponse {
  // Session info
  sessionId: number;
  sessionNumber: number;
  sessionType: string;           // "IN_PERSON", "E_LEARNING"
  category: string | null;       // "FIXED", "EXTRA"
  
  // Schedule
  sessionDate: string;           // "2024-12-26"
  dayOfWeek: string | null;      // "THURSDAY"
  dayOfWeekDisplay: string | null;
  timeSlot: string | null;       // "CA1"
  timeSlotDisplay: string | null;
  startTime: string | null;
  endTime: string | null;
  
  // Class info
  classId: number;
  classCode: string;
  subjectName: string;
  credits: number;
  
  // Teacher info
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
  
  // Status
  status: string;                // "SCHEDULED", "COMPLETED", "CANCELLED"
  statusDisplay: string;
  isRescheduled: boolean;
  rescheduleReason: string | null;
  isPending: boolean;
}

export interface RoomStatistics {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  cancelledSessions: number;
  utilizationPercentage: number;
}

export interface PageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiResponse<T> {
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

// ==================== API METHODS ====================

const roomApi = {
  
  // ==================== CORE ENDPOINTS ====================
  
  /**
   * 1. Get all rooms with real-time status (paginated)
   */
  getAllRooms: async (
    semesterId: number,
    page = 0,
    size = 10,
    sortBy = 'roomCode',
    sortDir = 'asc'
  ): Promise<PageData<RoomResponse>> => {
    console.log('[roomApi] Fetching all rooms - semester:', semesterId, 'page:', page);
    
    try {
      const response = await apiClient.get<ApiResponse<PageData<RoomResponse>>>(
        '/api/admin/rooms',
        {
          params: { semesterId, page, size, sortBy, sortDir }
        }
      );
      
      console.log('[roomApi] Rooms fetched:', response.data.data.totalElements);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch rooms:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * 2. Get room by ID with real-time status
   */
  getRoomById: async (
    roomId: number,
    semesterId: number
  ): Promise<RoomResponse> => {
    console.log('[roomApi] Fetching room ID:', roomId);
    
    try {
      const response = await apiClient.get<ApiResponse<RoomResponse>>(
        `/api/admin/rooms/${roomId}`,
        { params: { semesterId } }
      );
      
      console.log('[roomApi] Room fetched');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch room:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * 3. Get rooms by current real-time status
   * NEW FEATURE
   */
  getRoomsByStatus: async (
    status: 'IN_USE' | 'AVAILABLE' | 'INACTIVE',
    semesterId: number,
    page = 0,
    size = 10
  ): Promise<PageData<RoomResponse>> => {
    console.log('[roomApi] Fetching rooms by status:', status);
    
    try {
      const response = await apiClient.get<ApiResponse<PageData<RoomResponse>>>(
        '/api/admin/rooms/by-status',
        {
          params: { status, semesterId, page, size }
        }
      );
      
      console.log('[roomApi] Rooms by status fetched:', response.data.data.totalElements);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch rooms by status:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * 4. Search rooms by keyword
   */
  searchRooms: async (
    keyword: string,
    semesterId: number,
    page = 0,
    size = 10
  ): Promise<PageData<RoomResponse>> => {
    console.log('[roomApi] Searching rooms with keyword:', keyword);
    
    try {
      const response = await apiClient.get<ApiResponse<PageData<RoomResponse>>>(
        '/api/admin/rooms/search',
        {
          params: { keyword, semesterId, page, size }
        }
      );
      
      console.log('[roomApi] Search results:', response.data.data.totalElements);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Search failed:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * 5. Advanced filter (combine multiple criteria)
   */
  filterRooms: async (
    filters: {
      building?: string;
      floor?: number;
      roomType?: string;
      isActive?: boolean;
      currentStatus?: 'IN_USE' | 'AVAILABLE' | 'INACTIVE';
    },
    semesterId: number,
    page = 0,
    size = 10
  ): Promise<PageData<RoomResponse>> => {
    console.log('[roomApi] Filtering rooms:', filters);
    
    try {
      const response = await apiClient.get<ApiResponse<PageData<RoomResponse>>>(
        '/api/admin/rooms/filter',
        {
          params: {
            ...filters,
            semesterId,
            page,
            size
          }
        }
      );
      
      console.log('[roomApi] Filter results:', response.data.data.totalElements);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Filter failed:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  // ==================== FILTER ENDPOINTS ====================
  
  /**
   * 6. Get rooms by building
   */
  getRoomsByBuilding: async (
    building: string,
    semesterId: number,
    page = 0,
    size = 10
  ): Promise<PageData<RoomResponse>> => {
    console.log('[roomApi] Fetching rooms in building:', building);
    
    try {
      const response = await apiClient.get<ApiResponse<PageData<RoomResponse>>>(
        `/api/admin/rooms/building/${building}`,
        { params: { semesterId, page, size } }
      );
      
      console.log('[roomApi] Rooms in building fetched:', response.data.data.totalElements);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch rooms by building:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * 7. Get rooms by floor
   */
  getRoomsByFloor: async (
    floor: number,
    semesterId: number,
    page = 0,
    size = 10
  ): Promise<PageData<RoomResponse>> => {
    console.log('[roomApi] Fetching rooms on floor:', floor);
    
    try {
      const response = await apiClient.get<ApiResponse<PageData<RoomResponse>>>(
        `/api/admin/rooms/floor/${floor}`,
        { params: { semesterId, page, size } }
      );
      
      console.log('[roomApi] Rooms on floor fetched:', response.data.data.totalElements);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch rooms by floor:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * 8. Get rooms by type
   */
  getRoomsByType: async (
    roomType: string,
    semesterId: number,
    page = 0,
    size = 10
  ): Promise<PageData<RoomResponse>> => {
    console.log('[roomApi] Fetching rooms of type:', roomType);
    
    try {
      const response = await apiClient.get<ApiResponse<PageData<RoomResponse>>>(
        `/api/admin/rooms/type/${roomType}`,
        { params: { semesterId, page, size } }
      );
      
      console.log('[roomApi] Rooms of type fetched:', response.data.data.totalElements);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch rooms by type:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * 9. Get rooms by admin status (active/inactive)
   */
  getRoomsByAdminStatus: async (
    isActive: boolean,
    semesterId: number,
    page = 0,
    size = 10
  ): Promise<PageData<RoomResponse>> => {
    console.log('[roomApi] Fetching rooms - active:', isActive);
    
    try {
      const response = await apiClient.get<ApiResponse<PageData<RoomResponse>>>(
        `/api/admin/rooms/admin-status/${isActive}`,
        { params: { semesterId, page, size } }
      );
      
      console.log('[roomApi] Rooms by admin status fetched:', response.data.data.totalElements);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch rooms by admin status:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  // ==================== SCHEDULE ENDPOINTS ====================
  
  /**
   * 10. Get room schedule for semester
   */
  getRoomSchedule: async (
    roomId: number,
    semesterId: number
  ): Promise<RoomScheduleResponse[]> => {
    console.log('[roomApi] Fetching schedule for room:', roomId, 'semester:', semesterId);
    
    try {
      const response = await apiClient.get<ApiResponse<RoomScheduleResponse[]>>(
        `/api/admin/rooms/${roomId}/schedule`,
        { params: { semesterId } }
      );
      
      console.log('[roomApi] Schedule fetched:', response.data.data.length, 'sessions');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch schedule:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * 11. Get room schedule for TODAY
   * NEW FEATURE
   */
  getRoomScheduleToday: async (roomId: number): Promise<RoomScheduleResponse[]> => {
    console.log('[roomApi] Fetching today\'s schedule for room:', roomId);
    
    try {
      const response = await apiClient.get<ApiResponse<RoomScheduleResponse[]>>(
        `/api/admin/rooms/${roomId}/schedule/today`
      );
      
      console.log('[roomApi] Today\'s schedule fetched:', response.data.data.length, 'sessions');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch today\'s schedule:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * 12. Get room schedule for specific date
   */
  getRoomScheduleForDate: async (
    roomId: number,
    date: string  // "2024-12-26"
  ): Promise<RoomScheduleResponse[]> => {
    console.log('[roomApi] Fetching schedule for room:', roomId, 'date:', date);
    
    try {
      const response = await apiClient.get<ApiResponse<RoomScheduleResponse[]>>(
        `/api/admin/rooms/${roomId}/schedule/date`,
        { params: { date } }
      );
      
      console.log('[roomApi] Schedule for date fetched:', response.data.data.length, 'sessions');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch schedule for date:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  // ==================== STATISTICS ENDPOINTS ====================
  
  /**
   * 13. Get room statistics
   */
  getRoomStatistics: async (
    roomId: number,
    semesterId: number
  ): Promise<RoomStatistics> => {
    console.log('[roomApi] Fetching statistics for room:', roomId);
    
    try {
      const response = await apiClient.get<ApiResponse<RoomStatistics>>(
        `/api/admin/rooms/${roomId}/statistics`,
        { params: { semesterId } }
      );
      
      console.log('[roomApi] Statistics fetched');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch statistics:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * 14. Get room utilization percentage
   */
  getRoomUtilization: async (
    roomId: number,
    semesterId: number
  ): Promise<number> => {
    console.log('[roomApi] Fetching utilization for room:', roomId);
    
    try {
      const response = await apiClient.get<ApiResponse<number>>(
        `/api/admin/rooms/${roomId}/utilization`,
        { params: { semesterId } }
      );
      
      console.log('[roomApi] Utilization:', response.data.data, '%');
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch utilization:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  // ==================== LOOKUP ENDPOINTS ====================
  
  /**
   * 15. Get all buildings
   */
  getAllBuildings: async (): Promise<string[]> => {
    console.log('[roomApi] Fetching all buildings');
    
    try {
      const response = await apiClient.get<ApiResponse<string[]>>(
        '/api/admin/rooms/buildings'
      );
      
      console.log('[roomApi] Buildings fetched:', response.data.data.length);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch buildings:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * 16. Get floors in building
   */
  getFloorsByBuilding: async (building: string): Promise<number[]> => {
    console.log('[roomApi] Fetching floors in building:', building);
    
    try {
      const response = await apiClient.get<ApiResponse<number[]>>(
        `/api/admin/rooms/buildings/${building}/floors`
      );
      
      console.log('[roomApi] Floors fetched:', response.data.data.length);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch floors:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  // ==================== REAL-TIME STATUS ENDPOINTS ====================
  
  /**
   * 17. Check if room is currently in use
   * NEW FEATURE
   */
  isRoomInUse: async (roomId: number): Promise<boolean> => {
    console.log('[roomApi] Checking if room is in use:', roomId);
    
    try {
      const response = await apiClient.get<ApiResponse<boolean>>(
        `/api/admin/rooms/${roomId}/in-use`
      );
      
      console.log('[roomApi] Room in use:', response.data.data);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to check room usage:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * 18. Get current session using room
   * NEW FEATURE
   */
  getCurrentSession: async (roomId: number): Promise<CurrentSessionInfo | null> => {
    console.log('[roomApi] Fetching current session for room:', roomId);
    
    try {
      const response = await apiClient.get<ApiResponse<CurrentSessionInfo | null>>(
        `/api/admin/rooms/${roomId}/current-session`
      );
      
      if (response.data.data) {
        console.log('[roomApi] Current session:', response.data.data.classCode);
      } else {
        console.log('[roomApi] Room is available');
      }
      
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to fetch current session:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
  
  /**
   * 19. Calculate current status of room
   * NEW FEATURE
   */
  getCurrentStatus: async (roomId: number): Promise<string> => {
    console.log('[roomApi] Calculating current status for room:', roomId);
    
    try {
      const response = await apiClient.get<ApiResponse<string>>(
        `/api/admin/rooms/${roomId}/current-status`
      );
      
      console.log('[roomApi] Current status:', response.data.data);
      return response.data.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[roomApi] Failed to calculate status:', 
        apiError.response?.data?.message || apiError.message);
      throw error;
    }
  },
};

export default roomApi;