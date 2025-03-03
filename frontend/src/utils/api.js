import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const apiUrl = "http://127.0.0.1:8000/";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : apiUrl,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${apiUrl}token/refresh/`, {
          refresh: refreshToken,
        });

        if (response.status === 200) {
          localStorage.setItem(ACCESS_TOKEN, response.data.access);
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
          originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
          return api(originalRequest);
        }
      } catch (error) {
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
