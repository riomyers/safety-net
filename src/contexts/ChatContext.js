// src/contexts/ChatContext.js
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
		const response = await axios.get('http://localhost:8000/api/chat/status');
		setIsChatEnabled(response.data.isChatEnabled);
	  } catch (error) {
		console.error('Error fetching chat status:', error);
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
	  await axios.post('http://localhost:8000/api/chat/status', { isChatEnabled: status });
	  setIsChatEnabled(status);
	  toast.success(`Chat ${status ? 'enabled' : 'disabled'} successfully!`);
	} catch (error) {
	  console.error('Error updating chat status:', error);
	  toast.error('Error updating chat status.');
	}
  };

  return (
	<ChatContext.Provider value={{ isChatEnabled, toggleChat }}>
	  {children}
	</ChatContext.Provider>
  );
};
