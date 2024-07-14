import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Messages.css';

const Messages = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await axios.get('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/messages/conversations', {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        });
        setConversations(res.data);
      } catch (err) {
        console.error('Error fetching conversations:', err);
      }
    };

    fetchConversations();
  }, []);

  return (
    <div className="messages-page">
      <h2>Conversations</h2>
      <ul>
        {conversations.map((conversation) => (
          <li key={conversation._id}>
            <Link to={`/chat/${conversation._id}`}>
              {conversation.recipientName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Messages;
