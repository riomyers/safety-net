import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [isChatEnabled, setIsChatEnabled] = useState(true);

  useEffect(() => {
	// Fetch the initial chat status from the backend
	const fetchChatStatus = async () => {
	  try {
		const response = await axios.get('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/chat/status', {
		  headers: {
			'Content-Type': 'application/json',
		  },
		  withCredentials: true,
		});
		setIsChatEnabled(response.data.isChatEnabled);
	  } catch (error) {
		console.error('Error fetching chat status:', error);
		if (error.response) {
		  // Server responded with a status other than 200 range
		  console.error('Server Error:', error.response.data);
		} else if (error.request) {
		  // Request was made but no response received
		  console.error('Network Error:', error.request);
		} else {
		  // Something else happened
		  console.error('Error:', error.message);
		}
		toast.error('Error fetching chat status.');
	  }
	};
	fetchChatStatus();

	// Cleanup effect (not necessary in this case but good practice)
	return () => {
	  // Any cleanup logic if required
	};
  }, []);

  const toggleChat = async (status) => {
	try {
	  await axios.post('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/chat/status', { isChatEnabled: status }, {
		headers: {
		  'Content-Type': 'application/json',
		},
		withCredentials: true,
	  });
	  setIsChatEnabled(status);
	  toast.success(`Chat ${status ? 'enabled' : 'disabled'} successfully!`);
	} catch (error) {
	  console.error('Error updating chat status:', error);
	  if (error.response) {
		console.error('Server Error:', error.response.data);
	  } else if (error.request) {
		console.error('Network Error:', error.request);
	  } else {
		console.error('Error:', error.message);
	  }
	  toast.error('Error updating chat status.');
	}
  };

  return (
	<ChatContext.Provider value={{ isChatEnabled, toggleChat }}>
	  {children}
	</ChatContext.Provider>
  );
};
