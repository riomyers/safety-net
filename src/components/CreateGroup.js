import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './GroupManagement.css'; // Ensure the CSS file is correctly named and imported

const createGroup = async () => {
  try {
	if (!groupName) {
	  throw new Error('Group name is required');
	}

	const res = await axios.post('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth/group', { name: groupName, members: [] }, {
	  headers: { 'Authorization': `Bearer ${authState.token}` }
	});

	setGroups([...groups, res.data]);
	setGroupName('');
	console.log('Group created successfully:', res.data);
  } catch (err) {
	if (err.response) {
	  console.error('Error creating group:', err.response.data);
	  console.error('Status code:', err.response.status);
	  console.error('Headers:', err.response.headers);
	  alert('Error creating group: ' + (err.response.data.message || 'An unexpected error occurred.'));
	} else if (err.request) {
	  console.error('No response received from server:', err.request);
	  alert('Error creating group: No response received from server. Please check your network connection.');
	} else {
	  console.error('Error creating group:', err.message);
	  alert('Error creating group: ' + err.message);
	}
  }
};

  return (
	<form className="group-form" onSubmit={handleSubmit}>
	  <input
		type="text"
		value={name}
		onChange={(e) => setName(e.target.value)}
		placeholder="Group Name"
		required
	  />
	  <button type="submit">Create</button>
	</form>
  );
};

export default CreateGroup;
