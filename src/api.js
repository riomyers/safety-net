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
    const res = await axios.put('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth/profile', profileData, config);
    return res.data;
  } catch (err) {
    console.error('Error updating profile:', err);
    throw err;
  }
};
