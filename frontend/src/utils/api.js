import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

// Create API instance with default configuration
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, ''),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem(ACCESS_TOKEN);
    
    // Log request details in development
    if (import.meta.env.DEV) {
      console.debug(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    }
    
    // Set authorization header if token exists
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // Log response details in development
    if (import.meta.env.DEV) {
      console.debug(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Log errors in development
    if (import.meta.env.DEV) {
      console.error(`API Error: ${originalRequest.url}`, error.response?.status, error.message);
    }
    
    // Handle 401 errors (unauthorized) - token might be expired
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Check if on login or register page - don't redirect to login in this case
      const path = window.location.pathname;
      if (!path.includes('login') && !path.includes('register')) {
        console.warn("Authentication failed. Redirecting to login.");
        
        // Clear localStorage and redirect to login
        localStorage.removeItem(ACCESS_TOKEN);
        window.location.href = "/login_reg";
      }
    }
    
    return Promise.reject(error);
  }
);

// Create a helper function to try multiple endpoints
api.tryMultipleEndpoints = async (endpoints, method = 'get', data = null, config = {}) => {
  let lastError = null;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying ${method.toUpperCase()} request to ${endpoint}`);
      let response;
      
      if (method.toLowerCase() === 'get') {
        response = await api.get(endpoint, config);
      } else if (method.toLowerCase() === 'post') {
        response = await api.post(endpoint, data, config);
      } else if (method.toLowerCase() === 'put') {
        response = await api.put(endpoint, data, config);
      } else if (method.toLowerCase() === 'patch') {
        response = await api.patch(endpoint, data, config);
      } else if (method.toLowerCase() === 'delete') {
        response = await api.delete(endpoint, config);
      }
      
      console.log(`Success with ${endpoint}`);
      return response;
    } catch (error) {
      console.log(`Failed to ${method} ${endpoint}: ${error.message}`);
      lastError = error;
      // Continue to next endpoint
    }
  }
  
  // If all endpoints failed, throw the last error
  throw lastError || new Error(`All ${endpoints.length} endpoints failed`);
};

// Helper function to get correct media URL
export const getMediaUrl = (relativeUrl) => {
  if (!relativeUrl) return null;
  
  // If it's already an absolute URL, return it as is
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  
  // If it has a leading slash, remove it
  const cleanUrl = relativeUrl.startsWith('/') ? relativeUrl.substring(1) : relativeUrl;
  
  // Combine with the API base URL
  return `${api.defaults.baseURL}${cleanUrl}`;
};

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
export const tryMultipleEndpoints = async (endpoints, method = 'get', data = null, config = {}) => {
  let lastError = null;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying ${method.toUpperCase()} request to ${endpoint}`);
      let response;
      
      switch (method.toLowerCase()) {
        case 'get':
          response = await api.get(endpoint, config);
          break;
        case 'post':
          response = await api.post(endpoint, data, config);
          break;
        case 'put':
          response = await api.put(endpoint, data, config);
          break;
        case 'patch':
          response = await api.patch(endpoint, data, config);
          break;
        case 'delete':
          response = await api.delete(endpoint, config);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      
      console.log(`Success with ${endpoint}`);
      return response.data;
    } catch (error) {
      console.warn(`Failed with ${endpoint}:`, error.response?.status || error.message);
      lastError = error;
    }
  }
  
  throw lastError || new Error(`All endpoints failed for ${method} request`);
};

// Add this function for better direct fetch handling with CORS
export const directFetch = async (endpoint, method = 'GET', body = null) => {
  const token = localStorage.getItem(ACCESS_TOKEN);
  const baseUrl = api.defaults.baseURL;
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
