import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ChatContext } from '../contexts/ChatContext';
import { useSocket } from '../contexts/SocketContext';
import './GroupManagement.css';
import Chat from './Chat';
import AddUserToGroup from './AddUserToGroup';

const GroupManagement = () => {
  const { authState } = useAuth();
  const { isChatEnabled } = useContext(ChatContext);
  const socket = useSocket();
  const currentUser = authState.user;
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState({});
  const chatInputRef = useRef(null);

  const reconnectSocket = useCallback(() => {
	if (socket && !socket.connected) {
	  socket.connect();
	}
  }, [socket]);

  const fetchGroups = useCallback(async () => {
	try {
	  const res = await axios.get('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth/group', {
		headers: { 'Authorization': `Bearer ${authState.token}` }
	  });
	  setGroups(res.data);
	  console.log('Groups fetched successfully:', res.data);
	} catch (err) {
	  console.error('Error fetching groups:', err.response ? err.response.data : err.message);
	}
  }, [authState.token]);

  const fetchUnreadMessages = useCallback(async () => {
	try {
	  if (authState.token) {
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
  }, [authState.token]);

  const handleReceiveMessage = useCallback(async (message) => {
	if (!selectedUser || selectedUser._id !== message.sender) {
	  setUnreadMessages((prevUnreadMessages) => ({
		...prevUnreadMessages,
		[message.sender]: (prevUnreadMessages[message.sender] || 0) + 1
	  }));
	} else {
	  try {
		await axios.put(`https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/messages/mark-read/${message.sender}`, {}, {
		  headers: {
			'Authorization': `Bearer ${authState.token}`
		  }
		});
		setUnreadMessages((prevUnreadMessages) => ({
		  ...prevUnreadMessages,
		  [message.sender]: 0
		}));
	  } catch (err) {
		console.error('Error marking messages as read:', err);
	  }
	}
  }, [authState.token, selectedUser]);

  const handleGroupUpdated = useCallback((updatedGroup) => {
	setGroups((prevGroups) => prevGroups.map((group) => group._id === updatedGroup._id ? updatedGroup : group));
	if (selectedGroup && selectedGroup._id === updatedGroup._id) {
	  setSelectedGroup(updatedGroup);
	}
  }, [selectedGroup]);

  const handleGroupDeleted = useCallback((deletedGroupId) => {
	setGroups((prevGroups) => prevGroups.filter((group) => group._id !== deletedGroupId));
	if (selectedGroup && selectedGroup._id === deletedGroupId) {
	  setSelectedGroup(null);
	}
  }, [selectedGroup]);

  const handleUserAddedToGroup = useCallback((updatedGroup) => {
	setGroups((prevGroups) => prevGroups.map((group) => group._id === updatedGroup._id ? updatedGroup : group));
	if (selectedGroup && selectedGroup._id === updatedGroup._id) {
	  setSelectedGroup(updatedGroup);
	}
  }, [selectedGroup]);

  const handleUserRemovedFromGroup = useCallback((updatedGroup) => {
	setGroups((prevGroups) => prevGroups.map((group) => group._id === updatedGroup._id ? updatedGroup : group));
	if (selectedGroup && selectedGroup._id === updatedGroup._id) {
	  setSelectedGroup(updatedGroup);
	}
  }, [selectedGroup]);

  useEffect(() => {
	fetchGroups();
	fetchUnreadMessages();

	if (socket) {
	  socket.on('connect', fetchUnreadMessages);
	  socket.on('disconnect', reconnectSocket);
	  socket.on('receiveMessage', handleReceiveMessage);

	  // Listen for real-time updates
	  socket.on('groupUpdated', handleGroupUpdated);
	  socket.on('groupDeleted', handleGroupDeleted);
	  socket.on('userAddedToGroup', handleUserAddedToGroup);
	  socket.on('userRemovedFromGroup', handleUserRemovedFromGroup);

	  return () => {
		socket.off('connect', fetchUnreadMessages);
		socket.off('disconnect', reconnectSocket);
		socket.off('receiveMessage', handleReceiveMessage);
		socket.off('groupUpdated', handleGroupUpdated);
		socket.off('groupDeleted', handleGroupDeleted);
		socket.off('userAddedToGroup', handleUserAddedToGroup);
		socket.off('userRemovedFromGroup', handleUserRemovedFromGroup);
	  };
	}
  }, [
	socket,
	fetchGroups,
	fetchUnreadMessages,
	reconnectSocket,
	handleReceiveMessage,
	handleGroupUpdated,
	handleGroupDeleted,
	handleUserAddedToGroup,
	handleUserRemovedFromGroup,
	authState.token
  ]);

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
		alert('Error creating group: ' + err.response.data.message);
	  } else {
		console.error('Error creating group:', err.message);
		alert('Error creating group: ' + err.message);
	  }
	}
  };

  const deleteGroup = async (groupId) => {
	const confirmed = window.confirm('Are you sure you want to delete this group?');
	if (!confirmed) return;

	try {
	  const res = await axios.delete(`https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth/group/${groupId}`, {
		headers: { 'Authorization': `Bearer ${authState.token}` }
	  });

	  setGroups(groups.filter(group => group._id !== groupId));
	  setSelectedGroup(null);
	  console.log('Group deleted successfully:', res.data);
	} catch (err) {
	  if (err.response) {
		console.error('Error deleting group:', err.response.data);
		console.error('Status code:', err.response.status);
		console.error('Headers:', err.response.headers);
		alert('Error deleting group: ' + err.response.data.message);
	  } else {
		console.error('Error deleting group:', err.message);
		alert('Error deleting group: ' + err.message);
	  }
	}
  };

  const removeUserFromGroup = async (groupId, userId) => {
	try {
	  const res = await axios.delete(`https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth/group/${groupId}/remove-user/${userId}`, {
		headers: { 'Authorization': `Bearer ${authState.token}` }
	  });

	  setSelectedGroup(res.data);
	  console.log('User removed from group successfully:', res.data);
	} catch (err) {
	  if (err.response) {
		console.error('Error removing user from group:', err.response.data);
		console.error('Status code:', err.response.status);
		console.error('Headers:', err.response.headers);
		alert('Error removing user from group: ' + err.response.data.message);
	  } else {
		console.error('Error removing user from group:', err.message);
		alert('Error removing user from group: ' + err.message);
	  }
	}
  };

  const addUserToGroup = async (groupId) => {
	try {
	  const res = await axios.get(`https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth/group/${groupId}`, {
		headers: { 'Authorization': `Bearer ${authState.token}` }
	  });

	  const updatedGroup = res.data;
	  setGroups((prevGroups) =>
		prevGroups.map((group) => (group._id === updatedGroup._id ? updatedGroup : group))
	  );
	  setSelectedGroup(updatedGroup);
	  console.log('Group updated successfully:', updatedGroup);
	} catch (err) {
	  if (err.response) {
		console.error('Error fetching group:', err.response.data);
		console.error('Status code:', err.response.status);
		console.error('Headers:', err.response.headers);
		alert('Error fetching group: ' + err.response.data.message);
	  } else {
		console.error('Error fetching group:', err.message);
		alert('Error fetching group: ' + err.message);
	  }
	}
  };

  const handleGroupSelect = async (group) => {
	try {
	  const res = await axios.get(`https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/auth/group/${group._id}`, {
		headers: { 'Authorization': `Bearer ${authState.token}` }
	  });
	  setSelectedGroup(res.data);
	  console.log('Group details fetched successfully:', res.data);
	} catch (err) {
	  if (err.response) {
		console.error('Error fetching group details:', err.response.data);
		console.error('Status code:', err.response.status);
		console.error('Headers:', err.response.headers);
	  } else {
		console.error('Error fetching group details:', err.message);
	  }
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
	}
  };

  return (
	<div className="group-management">
	  <header className="app-header">
		<h1>Group Management</h1>
	  </header>

	  <div className="group-form">
		<input
		  type="text"
		  placeholder="New Group Name"
		  value={groupName}
		  onChange={(e) => setGroupName(e.target.value)}
		/>
		<button onClick={createGroup}>Create Group</button>
	  </div>

	  <ul className="group-list">
		{groups.map((group) => (
		  <li key={group._id} onClick={() => handleGroupSelect(group)} className="group-item">
			<span className="group-name">{group.name}</span>
			{currentUser._id === group.createdBy && (
			  <button
				onClick={(e) => { e.stopPropagation(); deleteGroup(group._id); }}
				className="delete-group-btn"
			  >
				Delete
			  </button>
			)}
		  </li>
		))}
	  </ul>

	  {selectedGroup && (
		<div className="group-details">
		  <h2>{selectedGroup.name}</h2>
		  <div className="add-user-form">
			{currentUser._id === selectedGroup.createdBy && (
			  <>
				<AddUserToGroup groupId={selectedGroup._id} onUserAdded={addUserToGroup} />
			  </>
			)}
		  </div>
		  <ul className="group-members">
			{selectedGroup.members && selectedGroup.members.map((member) => (
			  <li key={member._id} className="group-member-item">
				<span>{member.email}</span>
				{member._id !== currentUser._id && (
				  <>
					<button className="chat-btn" onClick={() => handleUserSelect(member)}>
					  Chat {unreadMessages[member._id] > 0 && `(${unreadMessages[member._id]})`}
					</button>
					{currentUser._id === selectedGroup.createdBy && (
					  <button className="remove-user-btn" onClick={() => removeUserFromGroup(selectedGroup._id, member._id)}>Remove</button>
					)}
				  </>
				)}
			  </li>
			))}
		  </ul>
		  {selectedUser && (
			<Chat
			  currentUser={currentUser}
			  selectedUser={selectedUser}
			  onClose={() => setSelectedUser(null)}
			  inputRef={chatInputRef}
			/>
		  )}
		</div>
	  )}
	</div>
  );
};

export default GroupManagement;
