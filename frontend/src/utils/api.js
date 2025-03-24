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

// Add this helper function for trying multiple endpoints
export const tryMultipleEndpoints = async (endpoints, method = 'get', data = null) => {
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying ${method.toUpperCase()} request to ${endpoint}`);
      let response;
      
      switch (method.toLowerCase()) {
        case 'get':
          response = await api.get(endpoint);
          break;
        case 'post':
          response = await api.post(endpoint, data);
          break;
        case 'put':
          response = await api.put(endpoint, data);
          break;
        case 'patch':
          response = await api.patch(endpoint, data);
          break;
        case 'delete':
          response = await api.delete(endpoint);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      
      console.log(`Success with ${endpoint}`);
      return response.data;
    } catch (error) {
      console.warn(`Failed with ${endpoint}:`, error.response?.status || error.message);
    }
  }
  
  throw new Error(`All endpoints failed for ${method} request`);
};

// Add this function for better direct fetch handling with CORS
export const directFetch = async (endpoint, method = 'GET', body = null) => {
  const token = localStorage.getItem(ACCESS_TOKEN);
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;
  
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  
  if (token) {
    // Try both common auth header formats
    if (token.split('.').length === 3) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Authorization'] = `Token ${token}`;
    }
  }
  
  const options = {
    method,
    headers,
    credentials: 'include', // Include cookies for cross-origin requests if needed
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  // Check if response is JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return await response.text();
};

export default api;
