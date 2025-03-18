import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost',
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

    console.log('Response error status:', error.response?.status);
    console.log('Available cookies:', document.cookie);

    // If error is 401 (Unauthorized) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log('Attempting to refresh token...');
        
        // Try to refresh the token
        const refreshResponse = await axios.post('/api/auth/refresh', {}, { 
          withCredentials: true // Important for cookies
        });
        
        console.log('Refresh response:', refreshResponse.status);
        
        // Only proceed if refresh was successful
        if (refreshResponse.status === 200) {
          console.log('Token refreshed successfully, retrying original request');
          // Retry the original request
          return api(originalRequest);
        } else {
          // If refresh doesn't return 200, clear user data and redirect
          localStorage.removeItem('user_id');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('Refresh token error:', refreshError);
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