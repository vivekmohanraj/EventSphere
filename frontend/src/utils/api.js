import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

// Use the existing API URL from the project
const apiUrl = "http://127.0.0.1:8000/";

// Export the base URL for use in components that need to construct full URLs
export const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : apiUrl;
};

// Export a function to get the full media URL
export const getMediaUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;
  
  const baseUrl = getBaseUrl();
  // Ensure proper path joining with slash handling
  const baseWithTrailingSlash = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const pathWithoutLeadingSlash = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  return `${baseWithTrailingSlash}${pathWithoutLeadingSlash}`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for handling auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      // Try both common auth header formats based on token format
      if (token.split('.').length === 3) {
        // Looks like a JWT token
        config.headers['Authorization'] = `Bearer ${token}`;
      } else {
        // Might be a simple token
        config.headers['Authorization'] = `Token ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor with original refresh token functionality
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Log error details for debugging
    console.error('API Error:', error.response ? `Status: ${error.response.status}` : error.message);
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${getBaseUrl()}token/refresh/`, {
          refresh: refreshToken,
        });

        if (response.status === 200) {
          localStorage.setItem(ACCESS_TOKEN, response.data.access);
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
          originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
          return api(originalRequest);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        window.location.href = '/login_reg';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Function to send reset password link
export const sendResetLink = async (email) => {
  try {
    const response = await api.post("/forgot-password/", { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Function to reset password
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post("/reset-password/", {
      token,
      new_password: newPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};


// Add these functions to your api.js
export const checkUsernameAvailability = async (username) => {
  try {
    const response = await api.post('users/check-username/', { username });
    return response.data.available;
  } catch (error) {
    console.error('Error checking username:', error);
    throw error;
  }
};

export const checkEmailAvailability = async (email) => {
  try {
    const response = await api.post('users/check-email/', { email });
    return response.data.available;
  } catch (error) {
    console.error('Error checking email:', error);
    throw error;
  }
};

export default api;
