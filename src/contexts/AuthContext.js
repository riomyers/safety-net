// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: localStorage.getItem('token') || null,
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (authState.token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${authState.token}`;
        try {
          const res = await api.get('/api/auth');
          setAuthState({ isAuthenticated: true, user: res.data, token: authState.token });
        } catch (err) {
          console.error(err);
          setAuthState({ isAuthenticated: false, user: null, token: null });
          localStorage.removeItem('token');
        }
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
    };

    fetchUser();
  }, [authState.token]);

  const login = async (username, password) => {
    try {
      const res = await api.post('/api/auth/login', { username, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      setAuthState({ isAuthenticated: true, user, token });
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({ isAuthenticated: false, user: null, token: null });
    delete api.defaults.headers.common['Authorization'];
  };

  const updateProfile = (updatedUser) => {
    setAuthState((prevState) => ({
      ...prevState,
      user: updatedUser,
    }));
  };

  return (
    <AuthContext.Provider value={{ authState, setAuthState, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export { AuthContext };
