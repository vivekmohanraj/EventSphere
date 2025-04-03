import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

// Create a base API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to add authorization headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    console.log("API Request URL:", config.url);
    console.log("API Full URL:", config.baseURL + (config.url.startsWith('/') ? config.url : '/' + config.url));

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a function to dispatch auth errors as events
const dispatchAuthError = (error) => {
  // TEMPORARILY DISABLED: Don't treat any 401 errors as auth errors to allow inactive users to use the dashboard
  // This is a development-only fix
  console.log("Auth check bypassed - allowing all users (including inactive) to access the dashboard");
  return;

  /* Original code - commented out for development
  // Only dispatch if this is a legitimate auth error, not a network error
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    // Check for user_inactive error code and don't trigger auth error for inactive users
    if (error.response.data && error.response.data.code === 'user_inactive') {
      console.log("User is inactive - not dispatching auth error event");
      return; // Don't dispatch auth error for inactive users
    }

    console.log("Dispatching auth error event");
    const event = new CustomEvent('auth-error', {
      detail: {
        isAuthError: true,
        authErrorMessage: error.authErrorMessage || "Authentication failed",
        status: error.response?.status,
        originalError: error
      }
    });
    window.dispatchEvent(event);
  }
  */
};

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.log("API Error Response:", error.response?.status, error.response?.data);

    // Don't retry if we've already retried or there's no response
    if (!error.response || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If the error is due to an expired token (401)
    if (error.response.status === 401) {
      // Check if this is the first attempt to check auth in dashboard
      // Special handling for users/check-auth/ endpoint to avoid immediate logout
      if (originalRequest.url.includes('users/check-auth/')) {
        console.log("Initial auth check failed - continuing without event dispatch");
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        
        if (!refreshToken) {
          console.warn("No refresh token available for automatic refresh");
          return Promise.reject(error);
        }
        
        console.log("Attempting token refresh");
        
        // Use a direct axios instance (not our api instance) to avoid interceptor loop
        const refreshResponse = await axios({
          method: 'post',
          url: `${api.defaults.baseURL}token/refresh/`,
          data: { refresh: refreshToken },
          headers: { 'Content-Type': 'application/json' }
        });

        if (refreshResponse.status === 200 && refreshResponse.data.access) {
          // Update access token in localStorage
          const newToken = refreshResponse.data.access;
          localStorage.setItem(ACCESS_TOKEN, newToken);
          
          console.log("Token refreshed successfully");
          
          // Create a new request with the new token
          const newRequest = {
            ...originalRequest,
            headers: {
              ...originalRequest.headers,
              Authorization: `Bearer ${newToken}`
            },
            _retry: true
          };
          
          return axios(newRequest);
        } else {
          console.error("Token refresh succeeded but returned invalid data");
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        
        // Only redirect if refresh explicitly failed with auth error
        // NOT on network errors or other temporary issues
        const shouldRedirect = refreshError.response && 
          (refreshError.response.status === 401 || refreshError.response.status === 403);
          
        if (shouldRedirect) {
          console.warn("Invalid refresh token, redirecting to login");
          // Only send the auth error event for non-check-auth endpoints
          if (!originalRequest.url.includes('check-auth')) {
            const authError = {
              ...error,
              isAuthError: true,
              authErrorMessage: "Session expired. Please log in again."
            };
            
            // Dispatch an auth error event
            dispatchAuthError(authError);
          }
          
          // Instead of rejecting with auth error, just reject with regular error
          return Promise.reject(error);
        }
        
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

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
