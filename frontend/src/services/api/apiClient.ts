import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

//  REQUEST INTERCEPTOR - Add JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    console.log(' [apiClient] Request:', config.method?.toUpperCase(), config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[apiClient] Token added to request');
    } else {
      console.warn(' [apiClient] No token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error(' [apiClient] Request error:', error);
    return Promise.reject(error);
  }
);

// ✅ RESPONSE INTERCEPTOR - Handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => {
    console.log(' [apiClient] Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error(' [apiClient] Response error:', error.response?.status, error.config?.url);
    
    if (error.response?.status === 401) {
      console.warn(' [apiClient] Unauthorized - Clearing token and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;