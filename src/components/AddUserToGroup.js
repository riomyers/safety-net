import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './GroupManagement.css'; // Import the new CSS file

const AddUserToGroup = ({ groupId, onUserAdded }) => {
  const [userId, setUserId] = useState('');
  const { authState } = useAuth();

  const handleSubmit = async (e) => {
	e.preventDefault();
	try {
	  const config = {
		headers: {
		  'Content-Type': 'application/json',
		  'Authorization': `Bearer ${authState.token}`
		}
	  };
	  const body = { email: userId }; // Assuming we are adding by email as in your backend
	  const res = await axios.post(`https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth/group/${groupId}/add-user`, body, config); // Updated endpoint
	  onUserAdded(groupId);
	  setUserId('');
	  console.log(res.data);
	} catch (err) {
	  console.error('Error adding user to group:', err.response ? err.response.data : err.message);
	}
  };

  return (
	<form className="add-user-form" onSubmit={handleSubmit}>
	  <input
		type="text"
		value={userId}
		onChange={(e) => setUserId(e.target.value)}
		placeholder="User Email" // Changed placeholder to Email since the backend uses email
		required
	  />
	  <button type="submit">Add</button>
	</form>
  );
};

export default AddUserToGroup;
