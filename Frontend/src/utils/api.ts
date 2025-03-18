import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost',
  withCredentials: true, // This is crucial for sending cookies
  headers: {
    'Content-Type': 'application/json',
  }
});

// Response interceptor for handling authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Try to refresh the token
        const refreshResponse = await axios.post('/api/auth/refresh-token', {}, { 
          withCredentials: true // Important for cookies
        });
        
        // Only proceed if refresh was successful
        if (refreshResponse.status === 200) {
          // Retry the original request
          return api(originalRequest);
        } else {
          // If refresh doesn't return 200, clear user data and redirect
          localStorage.removeItem('user_id');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // If refresh fails, clear user data and redirect
        localStorage.removeItem('user_id');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api; 