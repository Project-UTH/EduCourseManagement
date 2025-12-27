import apiClient from './apiClient';

// ==================== INTERFACES ====================

export interface RescheduleSessionRequest {
  newDate: string;       // "2024-10-15"
  newDayOfWeek: string;  // "TUESDAY"
  newTimeSlot: string;   // "CA2"
  newRoom: string;       // "B105"
  reason: string;        // Required (was optional)
}

export interface BatchRescheduleRequest {
  sessionIds: number[];
  rescheduleDetails: RescheduleSessionRequest;
}

export interface ClassSessionResponse {
  sessionId: number;
  classId: number;
  classCode: string;
  sessionNumber: number;
  sessionType: string;  // "IN_PERSON", "E_LEARNING"
  
  // Original schedule
  originalDate: string | null;
  originalDayOfWeek: string | null;
  originalDayOfWeekDisplay: string | null;
  originalTimeSlot: string | null;
  originalTimeSlotDisplay: string | null;
  originalRoom: string | null;
  
  // Actual schedule (if rescheduled)
  actualDate: string | null;
  actualDayOfWeek: string | null;
  actualDayOfWeekDisplay: string | null;
  actualTimeSlot: string | null;
  actualTimeSlotDisplay: string | null;
  actualRoom: string | null;
  
  // Effective schedule (what to display)
  effectiveDate: string | null;
  effectiveDayOfWeek: string | null;
  effectiveDayOfWeekDisplay: string | null;
  effectiveTimeSlot: string | null;
  effectiveTimeSlotDisplay: string | null;
  effectiveRoom: string | null;
  
  // Reschedule info
  isRescheduled: boolean;
  rescheduleReason: string | null;
  
  // Status
  status: string;  // "SCHEDULED", "COMPLETED", "CANCELLED"
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ==================== API METHODS ====================

const sessionApi = {
  
  /**
   * Reschedule a single session
   * Only works for IN_PERSON sessions
   */
  rescheduleSession: async (
    sessionId: number,
    data: RescheduleSessionRequest
  ): Promise<ClassSessionResponse> => {
    console.log('[sessionApi] Rescheduling session ID:', sessionId);
    try {
      const response = await apiClient.put(
        `/api/admin/sessions/${sessionId}/reschedule`,  // ✅ Fixed: Added /api prefix
        data
      );
      console.log('[sessionApi] Session rescheduled successfully');
      return response.data.data;
    } catch (error) {
      console.error('[sessionApi] Failed to reschedule session:', error);
      throw error;
    }
  },
  
  /**
   * Reschedule multiple sessions at once
   * Continues on error (doesn't rollback all if one fails)
   */
  batchReschedule: async (
    data: BatchRescheduleRequest
  ): Promise<ClassSessionResponse[]> => {
    console.log('[sessionApi] Batch rescheduling:', data.sessionIds.length, 'sessions');
    try {
      const response = await apiClient.put('/api/admin/sessions/batch-reschedule', data);
      console.log('[sessionApi] Batch reschedule completed:', response.data.data.length, 'success');
      return response.data.data;
    } catch (error) {
      console.error('[sessionApi] Failed to batch reschedule:', error);
      throw error;
    }
  },
  
  /**
   * Reset session to original schedule
   */
  resetToOriginal: async (sessionId: number): Promise<ClassSessionResponse> => {
    console.log('[sessionApi] Resetting session to original:', sessionId);
    try {
      const response = await apiClient.put(`/api/admin/sessions/${sessionId}/reset`);  // ✅ Fixed: Added /api prefix
      console.log('[sessionApi] Session reset successfully');
      return response.data.data;
    } catch (error) {
      console.error('[sessionApi] Failed to reset session:', error);
      throw error;
    }
  },
  
  /**
   * Get all sessions for a class
   */
  getSessionsByClass: async (classId: number): Promise<ClassSessionResponse[]> => {
    console.log('[sessionApi] Fetching sessions for class:', classId);
    try {
      const response = await apiClient.get(`/api/admin/sessions/class/${classId}`);  // ✅ Fixed: Added /api prefix
      console.log('[sessionApi] Sessions fetched:', response.data.data.length);
      return response.data.data;
    } catch (error) {
      console.error('[sessionApi] Failed to fetch sessions:', error);
      throw error;
    }
  },
  
  /**
   * Get only IN_PERSON sessions
   */
  getInPersonSessions: async (classId: number): Promise<ClassSessionResponse[]> => {
    console.log('[sessionApi] Fetching in-person sessions for class:', classId);
    try {
      const response = await apiClient.get(`/api/admin/sessions/class/${classId}/in-person`);  // ✅ Fixed: Added /api prefix
      console.log('[sessionApi] In-person sessions fetched:', response.data.data.length);
      return response.data.data;
    } catch (error) {
      console.error('[sessionApi] Failed to fetch in-person sessions:', error);
      throw error;
    }
  },
  
  /**
   * Get only E_LEARNING sessions
   */
  getELearningSessions: async (classId: number): Promise<ClassSessionResponse[]> => {
    console.log('[sessionApi] Fetching e-learning sessions for class:', classId);
    try {
      const response = await apiClient.get(`/api/admin/sessions/class/${classId}/e-learning`);  // ✅ Fixed: Added /api prefix
      console.log('[sessionApi] E-learning sessions fetched:', response.data.data.length);
      return response.data.data;
    } catch (error) {
      console.error('[sessionApi] Failed to fetch e-learning sessions:', error);
      throw error;
    }
  },
  
  /**
   * Get only rescheduled sessions
   */
  getRescheduledSessions: async (classId: number): Promise<ClassSessionResponse[]> => {
    console.log('[sessionApi] Fetching rescheduled sessions for class:', classId);
    try {
      const response = await apiClient.get(`/api/admin/sessions/class/${classId}/rescheduled`);  // ✅ Fixed: Added /api prefix
      console.log('[sessionApi] Rescheduled sessions fetched:', response.data.data.length);
      return response.data.data;
    } catch (error) {
      console.error('[sessionApi] Failed to fetch rescheduled sessions:', error);
      throw error;
    }
  },
  
  /**
   * Get session by ID
   */
  getSessionById: async (sessionId: number): Promise<ClassSessionResponse> => {
    console.log('[sessionApi] Fetching session ID:', sessionId);
    try {
      const response = await apiClient.get(`/api/admin/sessions/${sessionId}`);  // ✅ Fixed: Added /api prefix
      return response.data.data;
    } catch (error) {
      console.error('[sessionApi] Failed to fetch session:', error);
      throw error;
    }
  },
  
  /**
   * Mark session as completed
   */
  markAsCompleted: async (sessionId: number): Promise<ClassSessionResponse> => {
    console.log('[sessionApi] Marking session as completed:', sessionId);
    try {
      const response = await apiClient.put(`/api/admin/sessions/${sessionId}/complete`);  // ✅ Fixed: Added /api prefix
      console.log('[sessionApi] Session marked as completed');
      return response.data.data;
    } catch (error) {
      console.error('[sessionApi] Failed to mark as completed:', error);
      throw error;
    }
  },
  
  /**
   * Mark session as cancelled
   */
  markAsCancelled: async (
    sessionId: number,
    reason?: string
  ): Promise<ClassSessionResponse> => {
    console.log('[sessionApi] Marking session as cancelled:', sessionId);
    try {
      const response = await apiClient.put(
        `/api/admin/sessions/${sessionId}/cancel`,  // ✅ Fixed: Added /api prefix
        null,
        { params: { reason } }
      );
      console.log('[sessionApi] Session marked as cancelled');
      return response.data.data;
    } catch (error) {
      console.error('[sessionApi] Failed to mark as cancelled:', error);
      throw error;
    }
  },
};

export default sessionApi;