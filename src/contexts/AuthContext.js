// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

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
        axios.defaults.headers.common['Authorization'] = `Bearer ${authState.token}`;
        try {
          const res = await axios.get('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth');
          setAuthState({ isAuthenticated: true, user: res.data, token: authState.token });
        } catch (err) {
          console.error(err);
          setAuthState({ isAuthenticated: false, user: null, token: null });
          localStorage.removeItem('token');
        }
      } else {
        delete axios.defaults.headers.common['Authorization'];
      }
    };

    fetchUser();
  }, [authState.token]);

  const updateProfile = (updatedUser) => {
    setAuthState((prevState) => ({
      ...prevState,
      user: updatedUser,
    }));
  };

  return (
    <AuthContext.Provider value={{ authState, setAuthState, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export { AuthContext };
