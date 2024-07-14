// src/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Axios interceptor to include token in headers of all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Function to update profile
export const updateProfile = async (profileData) => {
  try {
    const res = await api.put('/api/auth/profile', profileData);
    return res.data;
  } catch (err) {
    console.error('Error updating profile:', err);
    throw err;
  }
};

export default api;
