import React, { useEffect, useCallback, useState } from 'react';
import { Route, Routes, Link, Navigate, useNavigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Home from './components/Home';
import Profile from './components/Profile';
import PasswordResetRequest from './components/PasswordResetRequest';
import PasswordReset from './components/PasswordReset';
import ChatApp from './components/ChatApp';
import './styles.css';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from './contexts/AuthContext';
import { useSocket } from './contexts/SocketContext';
import { ChatProvider } from './contexts/ChatContext';
import { EmergencyAlertProvider } from './contexts/EmergencyAlertContext';

const App = () => {
  const { authState, setAuthState } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [lastKnownPosition, setLastKnownPosition] = useState(null);
  const distanceThreshold = 10; // Minimum distance in meters for location update

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const res = await axios.get('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth');
          setAuthState({ isAuthenticated: true, user: res.data, token });
        } catch (err) {
          console.error(err);
          setAuthState({ isAuthenticated: false, user: null, token: null });
          localStorage.removeItem('token');
          navigate('/login');
        }
      } else {
        delete axios.defaults.headers.common['Authorization'];
      }
    };

    fetchUser();
  }, [navigate, setAuthState]);

  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  const haversineDistance = (coords1, coords2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371e3; // Radius of the Earth in meters
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);
    const deltaLat = toRad(coords2.lat - coords1.lat);
    const deltaLon = toRad(coords2.lng - coords1.lng);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const shareLocation = useCallback(() => {
    if (navigator.geolocation && authState.user) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPosition = { lat: latitude, lng: longitude };

          if (!lastKnownPosition || haversineDistance(lastKnownPosition, newPosition) >= distanceThreshold) {
            setLastKnownPosition(newPosition);
            axios.put('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth/location', {
              lat: latitude,
              lng: longitude,
            }, {
              headers: {
                'Authorization': `Bearer ${authState.token}`
              }
            });
            socket.emit('updateLocation', { userId: authState.user._id, lat: latitude, lng: longitude });
          }
        },
        (error) => {
          console.error('Error getting user location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      console.error('Geolocation is not supported by this browser or user is not authenticated.');
    }
  }, [authState.user, authState.token, lastKnownPosition, socket]);

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({ isAuthenticated: false, user: null, token: null });
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  if (authState.user === null && localStorage.getItem('token')) {
    // Display a loading spinner or message while checking token
    return <div>Loading...</div>;
  }

  return (
    <ChatProvider>
      <EmergencyAlertProvider>
        <div className="App">
          <nav className="nav-bar">
            <ul className="nav-list">
              <li><Link to="/">Home</Link></li>
              {!authState.isAuthenticated && <li><Link to="/register">Register</Link></li>}
              {!authState.isAuthenticated && <li><Link to="/login">Login</Link></li>}
              {authState.isAuthenticated && <li><Link to="/profile">Profile</Link></li>}
              {authState.isAuthenticated && <li onClick={logout}>Logout</li>}
            </ul>
          </nav>
          <div className="container">
            <Routes>
              <Route path="/" element={<Home currentUser={authState.user} shareLocation={shareLocation} />} />
              {!authState.isAuthenticated && <Route path="/register" element={<Register />} />}
              {!authState.isAuthenticated && <Route path="/login" element={<Login />} />}
              {authState.isAuthenticated && <Route path="/profile" element={<Profile currentUser={authState.user} />} />}
              {authState.isAuthenticated && <Route path="/chat/*" element={<ChatApp currentUser={authState.user} />} />}
              <Route path="/reset-password-request" element={<PasswordResetRequest />} />
              <Route path="/reset-password/:token" element={<PasswordReset />} />
              <Route path="*" element={<Navigate to={authState.isAuthenticated ? "/" : "/login"} />} />
            </Routes>
          </div>
          <ToastContainer />
        </div>
      </EmergencyAlertProvider>
    </ChatProvider>
  );
};

export default App;
