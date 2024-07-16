import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Home.css';
import Chat from './Chat';
import NearbyUsers from './NearbyUsers';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { ChatContext } from '../contexts/ChatContext';
import { useEmergencyAlert } from '../contexts/EmergencyAlertContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Fix default icon issue with Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Home = () => {
  const { authState } = useAuth();
  const socket = useSocket();
  const { isChatEnabled } = useContext(ChatContext);
  const { triggerAlert } = useEmergencyAlert();
  const currentUser = authState.user;
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationShared, setLocationShared] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [messages, setMessages] = useState([]);

  const locationWatcherRef = useRef(null);
  const sharingTimeoutRef = useRef(null);
  const mapRef = useRef(null);
  const chatInputRef = useRef(null);

  const reconnectSocket = useCallback(() => {
    if (socket && !socket.connected) {
      socket.connect();
    }
  }, [socket]);

  const updateLocation = useCallback(async (latitude, longitude) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
        },
      };
      await axios.put('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth/location', {
        lat: latitude,
        lng: longitude,
      }, config);
      if (socket) {
        socket.emit('locationUpdated'); // Emit a socket event for location update
      }
    } catch (err) {
      console.error('Error updating location:', err);
    }
  }, [authState.token, socket]);

  const updateLocationHidden = useCallback(async (hidden) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
        },
      };
      await axios.put('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth/locationHidden', { locationHidden: hidden }, config);
      setLocationShared(!hidden); // Update the state to reflect the change
      if (socket) {
        socket.emit('locationUpdated'); // Emit a socket event for location update
      }
    } catch (err) {
      console.error('Error updating location hidden status:', err);
    }
  }, [authState.token, socket]);

  const requestLocation = useCallback(async (retryCount = 3) => {
    const getPosition = (retryCount, delay) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          setLocationShared(true);
          localStorage.setItem('locationShared', true);
          localStorage.setItem('currentLocation', JSON.stringify({ lat: latitude, lng: longitude }));
          await updateLocation(latitude, longitude);
          await updateLocationHidden(false); // Make the user visible again

          toast.success('Location acquired successfully.');
        },
        (err) => {
          console.error('Geolocation error:', err);
          if (retryCount > 0) {
            console.log(`Retrying... (${retryCount} attempts left)`);
            setTimeout(() => getPosition(retryCount - 1, delay * 2), delay); // Exponential backoff
          } else {
            toast.error('Failed to acquire location. Please try again later.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // Increase the timeout duration (in milliseconds)
          maximumAge: 0
        }
      );
    };

    if (navigator.geolocation) {
      getPosition(retryCount, 1000);
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }, [updateLocation, updateLocationHidden]);

  const hideLocation = useCallback(async () => {
    const watcherRef = locationWatcherRef.current;
    if (watcherRef) {
      navigator.geolocation.clearWatch(watcherRef);
    }
    await updateLocationHidden(true); // Call the function to update the hidden status
  }, [updateLocationHidden]);

  const fetchNearbyUsers = useCallback(async () => {
    try {
      const res = await axios.get('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth/nearby', {
        headers: {
          'Authorization': `Bearer ${authState.token}`
        }
      });
      if (currentUser) {
        setNearbyUsers(res.data.filter(user => user._id !== currentUser._id)); // Filter out the current user
      } else {
        setNearbyUsers(res.data);
      }
    } catch (err) {
      console.error('Error fetching nearby users:', err);
    }
  }, [authState.token, currentUser]);

  useEffect(() => {
    const savedLocationShared = localStorage.getItem('locationShared') === 'true';
    setLocationShared(savedLocationShared);

    const savedLocation = JSON.parse(localStorage.getItem('currentLocation'));
    if (savedLocation) {
      setCurrentLocation(savedLocation);
    }

    if (savedLocationShared) {
      fetchNearbyUsers(); // Initial load should not show user messages
    }

    const currentWatcherRef = locationWatcherRef.current;
    const currentSharingTimeoutRef = sharingTimeoutRef.current;

    return () => {
      if (currentWatcherRef) {
        navigator.geolocation.clearWatch(currentWatcherRef);
      }
      if (currentSharingTimeoutRef) {
        clearTimeout(currentSharingTimeoutRef);
      }
    };
  }, [fetchNearbyUsers]);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        if (authState.token) { // Ensure token is present
          const res = await axios.get('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/messages/unread', {
            headers: {
              'Authorization': `Bearer ${authState.token}`
            }
          });
          setUnreadMessages(res.data);
        }
      } catch (err) {
        if (err.response && err.response.status === 401) {
          console.error('Unauthorized request: ', err.response.data);
        } else {
          console.error('Error fetching unread messages:', err);
        }
      }
    };

    fetchUnreadMessages();

    const handleEmergencyAlert = (data) => {
      toast.error(`Emergency alert from ${data.userName}`);
      if (mapRef.current && data.lat && data.lng) {
        mapRef.current.setView([data.lat, data.lng], 13);
      }
    };

    if (socket) {
      socket.on('connect', () => {
        fetchUnreadMessages(); // Fetch unread messages on socket connection
      });

      socket.on('disconnect', () => {
        reconnectSocket();
      });

      socket.on('nearbyUsersUpdate', (data) => {
        setNearbyUsers(data);
      });

      socket.on('receiveMessage', async (message) => {
        if (!selectedUser || selectedUser._id !== message.sender) {
          setUnreadMessages((prevUnreadMessages) => ({
            ...prevUnreadMessages,
            [message.sender]: (prevUnreadMessages[message.sender] || 0) + 1
          }));
        } else {
          // Update chat messages
          setMessages((prevMessages) => [...prevMessages, message]);
          // Mark message as read in the backend
          try {
            await axios.put(`https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/messages/mark-read/${message.sender}`, {}, {
              headers: {
                'Authorization': `Bearer ${authState.token}`
              }
            });
          } catch (err) {
            console.error('Error marking messages as read:', err);
          }
        }
      });

      socket.on('locationUpdated', fetchNearbyUsers); // Fetch nearby users on location update
      socket.on('emergencyAlert', handleEmergencyAlert);

      return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('nearbyUsersUpdate');
        socket.off('receiveMessage');
        socket.off('locationUpdated');
        socket.off('emergencyAlert', handleEmergencyAlert);
      };
    }
  }, [socket, authState.token, selectedUser, fetchNearbyUsers, reconnectSocket]);

  const showMeOnMap = () => {
    if (mapRef.current && currentLocation) {
      mapRef.current.setView(currentLocation, 13);
    }
  };

  const handleUserSelect = async (user) => {
    if (isChatEnabled) {
      setSelectedUser(user);
      if (unreadMessages[user._id] > 0) {
        // Mark messages as read in the backend
        try {
          await axios.put(`https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/messages/mark-read/${user._id}`, {}, {
            headers: {
              'Authorization': `Bearer ${authState.token}`
            }
          });
          // Update unread messages in the state
          setUnreadMessages((prevUnreadMessages) => ({
            ...prevUnreadMessages,
            [user._id]: 0
          }));
        } catch (err) {
          console.error('Error marking messages as read:', err);
        }
      }

      // Focus on the chat input field
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }

      // Center the map on the selected user's location
      if (mapRef.current && user.location && user.location.coordinates) {
        mapRef.current.setView([user.location.coordinates[1], user.location.coordinates[0]], 13);
      }

      // Fetch chat messages
      try {
        const res = await axios.get(`https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/messages`, {
          params: { senderId: currentUser._id, receiverId: user._id },
          headers: {
            'Authorization': `Bearer ${authState.token}`
          }
        });
        setMessages(res.data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    }
  };

  return (
    <div className="home">
      <header className="app-header">
        <h1 className="app-name">SafetyNet</h1>
        <p className="app-description">
          Welcome to SafetyNet: Your Personal Safety Companion. Feel safe wherever you go with SafetyNet.
          If you ever find yourself in an unsafe situation, simply press a button in the app to instantly share your location
          and alert nearby users that you need help. In serious situations, SafetyNet can notify the police.
          An alert sound can scare off potential attackers while a notification, similar to an Amber Alert,
          lets others know you need assistance. Stay safe with SafetyNet, your community's safety network.
        </p>
      </header>
      {locationShared && currentLocation && (
        <MapContainer center={currentLocation} zoom={13} className="leaflet-container" ref={mapRef}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={currentLocation}>
            <Popup>
              You are here
            </Popup>
          </Marker>
          {nearbyUsers.map(user => (
            <Marker
              key={user._id}
              position={[user.location.coordinates[1], user.location.coordinates[0]]}
              onError={(e) => console.error('Error creating marker:', e)}
            >
              <Popup>
                {user.name}
                <br />
                <button onClick={() => handleUserSelect(user)}>Chat</button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
      {!currentUser ? (
        <div className="auth-buttons">
          <Link to="/register" className="btn">Register</Link>
          <Link to="/login" className="btn">Login</Link>
        </div>
      ) : (
        <>
          <h2 className="welcome-message">Welcome, {currentUser.name}</h2>
          <div className="location-sharing-options">
            {locationShared && (
              <button onClick={showMeOnMap} className="wide-btn show-me-btn">
                Show Me on the Map
              </button>
            )}
            {!locationShared && (
              <button onClick={() => requestLocation()} className="wide-btn share-location-btn">
                Share Location
              </button>
            )}
            <button onClick={triggerAlert} className="wide-btn emergency-btn">
              Emergency
            </button>
            <button className="wide-btn alert-police-btn" disabled style={{ backgroundColor: 'blue', color: 'white', border: '2px solid red' }}>
              Alert Police
            </button>
            {locationShared && (
              <button onClick={hideLocation} className="wide-btn hide-location-btn">
                Hide Location
              </button>
            )}
          </div>
          {!isChatEnabled && (
            <p className="chat-disabled-message">
              Chat is disabled. Please enable it in your <Link to="/profile">profile</Link>.
            </p>
          )}
          <NearbyUsers 
            currentLocation={currentLocation} 
            onSelectUser={handleUserSelect} 
            unreadMessages={unreadMessages}
            locationShared={locationShared} // Pass the locationShared prop
            isChatEnabled={isChatEnabled} // Pass the isChatEnabled prop
          />
          {locationShared && selectedUser && (
            <Chat 
              currentUser={currentUser} 
              selectedUser={selectedUser} 
              messages={messages} // Pass messages as a prop
              onClose={() => setSelectedUser(null)} 
              inputRef={chatInputRef}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Home;
