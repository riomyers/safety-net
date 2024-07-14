import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { useSocket } from '../contexts/SocketContext';
import "./NearbyUsers.css";

const NearbyUsers = ({
  currentLocation = { lat: 0, lng: 0 },
  onSelectUser,
  unreadMessages = {},
  locationShared = false,
  isChatEnabled = true
}) => {
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const socket = useSocket();

  const fetchNearbyUsers = async (lat, lng) => {
    try {
      const res = await axios.get('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth/nearby', {
        params: {
          lat: lat,
          lng: lng
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Filter out users who have hidden their location
      const filteredUsers = res.data.filter(user => !user.locationHidden);
      setNearbyUsers(filteredUsers);
    } catch (err) {
      console.error('Error fetching nearby users:', err);
    }
  };

  useEffect(() => {
    if (currentLocation && currentLocation.lat && currentLocation.lng && locationShared) {
      fetchNearbyUsers(currentLocation.lat, currentLocation.lng);
    }
  }, [currentLocation, locationShared]);

  useEffect(() => {
    if (socket) {
      socket.on('nearbyUsersUpdate', (data) => {
        // Filter out users who have hidden their location
        const filteredUsers = data.filter(user => !user.locationHidden);
        setNearbyUsers(filteredUsers);
      });

      return () => {
        socket.off('nearbyUsersUpdate');
      };
    }
  }, [socket]);

  if (!locationShared) {
    return null;
  }

  return (
    <div className="nearby-users-container">
      <h2>Nearby Users</h2>
      <ul>
        {nearbyUsers.map(user => (
          <li key={user._id}>
            <button
              onClick={() => {
                if (isChatEnabled) {
                  console.log("Selecting user:", user);
                  onSelectUser(user);
                } else {
                  alert('Chat functionality is currently disabled.');
                }
              }}
              className="nearby-user-btn"
              disabled={!isChatEnabled}
            >
              {user.name}
              {unreadMessages[user._id] > 0 && (
                <span className="unread-badge">{unreadMessages[user._id]}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

NearbyUsers.propTypes = {
  currentLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  onSelectUser: PropTypes.func.isRequired,
  unreadMessages: PropTypes.object,
  locationShared: PropTypes.bool.isRequired,
  isChatEnabled: PropTypes.bool.isRequired
};

export default NearbyUsers;
