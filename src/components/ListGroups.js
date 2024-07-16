import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './GroupManagement.css'; // Import the new CSS file

const ListGroups = ({ onSelectGroup }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authState } = useAuth();

  useEffect(() => {
	const fetchGroups = async () => {
	  try {
		const config = {
		  headers: {
			'Authorization': `Bearer ${authState.token}`
		  }
		};
		const res = await axios.get('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth/group', config); // Updated endpoint
		setGroups(res.data);
		setLoading(false);
	  } catch (err) {
		setError(err.response ? err.response.data : err.message);
		setLoading(false);
	  }
	};

	fetchGroups();
  }, [authState.token]);

  if (loading) {
	return <div className="loading">Loading groups...</div>;
  }

  if (error) {
	return <div className="error">Error fetching groups: {error}</div>;
  }

  return (
	<div className="list-groups">
	  <h2>Your Groups</h2>
	  <ul className="group-list">
		{groups.map(group => (
		  <li key={group._id} onClick={() => onSelectGroup(group)} className="group-item">
			<span className="group-name">{group.name}</span>
		  </li>
		))}
	  </ul>
	</div>
  );
};

export default ListGroups;
