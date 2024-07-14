// src/api.js
import axios from 'axios';

export const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    const res = await axios.put('http://localhost:8000/api/auth/profile', profileData, config);
    return res.data;
  } catch (err) {
    console.error('Error updating profile:', err);
    throw err;
  }
};
