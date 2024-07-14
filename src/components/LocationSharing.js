import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles.css';

const LocationSharing = ({ userId, setCurrentLocation }) => {
  const [location, setLocation] = useState({ lat: '', lng: '' });
  const [message, setMessage] = useState('');

  const updateLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setCurrentLocation({ lat: latitude, lng: longitude }); // Update current location in parent
        try {
          const config = {
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': localStorage.getItem('token')
            }
          };
          const res = await axios.put('http://localhost:8000/api/users/location', {
            lat: latitude,
            lng: longitude
          }, config);
          setMessage({ text: 'Location updated successfully', type: 'success' });
        } catch (err) {
          console.error(err);
          setMessage({ text: 'Error updating location', type: 'error' });
        }
      }, (error) => {
        console.error(error);
        setMessage({ text: 'Error getting location', type: 'error' });
      });
    } else {
      setMessage({ text: 'Geolocation is not supported by this browser', type: 'error' });
    }
  };

  useEffect(() => {
    updateLocation();
  }, []);

  return (
    <div className="location-sharing-container">
      <h1>Location Sharing</h1>
      <p>Current Location: Lat: {location.lat}, Lng: {location.lng}</p>
      {message.text && <p className={`message ${message.type}`}>{message.text}</p>}
      <button onClick={updateLocation}>Update Location</button>
    </div>
  );
};

export default LocationSharing;
