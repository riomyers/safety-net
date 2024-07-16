import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import AlertModal from '../components/AlertModal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EmergencyAlertContext = createContext();

export const useEmergencyAlert = () => {
  return useContext(EmergencyAlertContext);
};

export const EmergencyAlertProvider = ({ children }) => {
  const { authState } = useAuth();
  const socket = useSocket();
  const alertSound = useMemo(() => new Audio('/emergency-alert.mp3'), []);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
	if (socket && authState.user) {
	  const handleEmergencyAlert = (data) => {
		if (data.userId !== authState.user._id) {
		  console.log('Emergency alert received:', data);
		  alertSound.play().catch(error => console.error('Error playing alert sound:', error));
		  setCurrentLocation({ lat: data.lat, lng: data.lng });
		  setAlertMessage(`Emergency alert from user: ${data.userName}`);
		}
	  };

	  socket.on('emergencyAlert', handleEmergencyAlert);

	  return () => {
		socket.off('emergencyAlert', handleEmergencyAlert);
	  };
	}
  }, [socket, alertSound, authState.user]);

  const triggerAlert = useCallback(() => {
	if (navigator.geolocation) {
	  navigator.geolocation.getCurrentPosition(
		(position) => {
		  const { latitude, longitude } = position.coords;
		  console.log('Geolocation position:', position);
		  setCurrentLocation({ lat: latitude, lng: longitude });
		  socket.emit('emergencyAlert', {
			userId: authState.user._id,
			userName: authState.user.name,
			lat: latitude,
			lng: longitude,
		  });
		  alertSound.play().catch(error => console.error('Error playing alert sound:', error));
		  toast.info('Sending emergency alert...', {
			position: "top-right",
			autoClose: 5000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
		  });
		},
		(error) => {
		  console.error('Error getting user location:', error);
		  switch (error.code) {
			case error.PERMISSION_DENIED:
			  toast.error('User denied the request for Geolocation.');
			  break;
			case error.POSITION_UNAVAILABLE:
			  toast.error('Location information is unavailable.');
			  break;
			case error.TIMEOUT:
			  toast.error('The request to get user location timed out.');
			  break;
			case error.UNKNOWN_ERROR:
			  toast.error('An unknown error occurred.');
			  break;
			default:
			  toast.error('An error occurred while fetching location.');
		  }
		},
		{
		  enableHighAccuracy: true,
		  timeout: 5000,
		  maximumAge: 0,
		}
	  );
	} else {
	  console.error('Geolocation is not supported by this browser.');
	  toast.error('Geolocation is not supported by this browser.');
	}
  }, [authState.user, socket, alertSound]);

  const handleCloseAlert = () => {
	console.log('Closing alert:', alertMessage);
	setAlertMessage(null);
  };

  return (
	<EmergencyAlertContext.Provider value={{ triggerAlert, currentLocation }}>
	  {children}
	  {alertMessage && <AlertModal message={alertMessage} onClose={handleCloseAlert} />}
	</EmergencyAlertContext.Provider>
  );
};

export default EmergencyAlertContext;
