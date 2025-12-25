/**
 * Semester API Service
 * File: frontend/src/services/api/semesterApi.ts
 * FIXED: Use apiClient like Subject API
 */

import apiClient from './apiClient';

export enum SemesterStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}

export interface Semester {
  semesterId: number;
  semesterCode: string;
  semesterName: string;
  startDate: string;
  endDate: string;
  status: SemesterStatus;
  registrationEnabled: boolean;
  registrationStartDate?: string;
  registrationEndDate?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SemesterCreateRequest {
  semesterCode: string;
  semesterName: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface SemesterUpdateRequest {
  semesterName: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface RegistrationParams {
  enabled: boolean;
  startDate?: string;
  endDate?: string;
}

const semesterApi = {
  /**
   * Get all semesters
   */
  getAll: () => {
    return apiClient.get<Semester[]>('/api/admin/semesters');
  },

  /**
   * Get semester by ID
   */
  getById: (id: number) => {
    return apiClient.get<Semester>(`/api/admin/semesters/${id}`);
  },

  /**
   * Create new semester
   */
  create: (data: SemesterCreateRequest) => {
    return apiClient.post<Semester>('/api/admin/semesters', data);
  },

  /**
   * Update semester
   */
  update: (id: number, data: SemesterUpdateRequest) => {
    return apiClient.put<Semester>(`/api/admin/semesters/${id}`, data);
  },

  /**
   * Delete semester
   */
  delete: (id: number) => {
    return apiClient.delete(`/api/admin/semesters/${id}`);
  },

  /**
   * Activate semester
   */
  activate: (id: number) => {
    return apiClient.put<Semester>(`/api/admin/semesters/${id}/activate`);
  },

  /**
   * Complete semester
   */
  complete: (id: number) => {
    return apiClient.put<Semester>(`/api/admin/semesters/${id}/complete`);
  },

  /**
   * Toggle registration
   */
  toggleRegistration: (
    id: number,
    enabled: boolean,
    startDate?: string,
    endDate?: string
  ) => {
    const params: RegistrationParams = { enabled };
    if (enabled && startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }
    return apiClient.put<Semester>(`/api/admin/semesters/${id}/registration`, null, { params });
  },

  /**
   * Get current active semester
   */
  getCurrent: () => {
    return apiClient.get<Semester>(`/api/admin/semesters/current`);
  },

  /**
   * Check if registration is open
   */
  isRegistrationOpen: () => {
    return apiClient.get<boolean>(`/api/admin/semesters/registration-status`);
  },
};

export default semesterApi;