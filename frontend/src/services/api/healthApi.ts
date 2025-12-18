import axiosInstance from './axiosInstance';

export const healthApi = {
  check: async () => {
    return axiosInstance.get('/health');
  },
  
  welcome: async () => {
    return axiosInstance.get('/');
  },
};