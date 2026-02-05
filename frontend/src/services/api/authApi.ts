import apiClient from './apiClient';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    email: string;
    role: string;
    firstLogin: boolean;
  };
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
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

const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    console.log(' [authApi] Login request for:', credentials.username);
    
    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>(
        '/api/auth/login',
        credentials
      );
      
      console.log(' [authApi] Login successful:', response.data);
      
      //  SAVE TOKEN TO LOCALSTORAGE
      if (response.data.success && response.data.data.token) {
        const { token, user } = response.data.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log('[authApi] Token saved to localStorage');
        console.log('[authApi] Token preview:', token.substring(0, 30) + '...');
      }
      
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[authApi] Login failed:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Change Password
  changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse<null>> => {
    console.log('[authApi] Change password request');
    
    try {
      const response = await apiClient.post<ApiResponse<null>>(
        '/api/auth/change-password',
        data
      );
      
      console.log('[authApi] Password changed successfully');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('[authApi] Change password failed:', apiError.response?.data || apiError.message);
      throw error;
    }
  },

  // Logout
  logout: () => {
    console.log('[authApi] Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('[authApi] Logout successful - Token cleared');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        console.error('[authApi] Failed to parse user from localStorage');
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const hasToken = !!token;
    console.log('🔍 [authApi] Is authenticated:', hasToken);
    return hasToken;
  },
};

export default authApi;