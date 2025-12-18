import axiosInstance from './axiosInstance';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      username: string;
      fullName: string;
      email: string;
      role: string;
      isFirstLogin: boolean;
    };
    token: string;
    tokenType: string;
  };
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return axiosInstance.post('/auth/login', data);
  },

  changePassword: async (data: ChangePasswordRequest) => {
    return axiosInstance.post('/auth/change-password', data);
  },

  getCurrentUser: async () => {
    return axiosInstance.get('/auth/me');
  },

  logout: async () => {
    return axiosInstance.post('/auth/logout');
  },
};