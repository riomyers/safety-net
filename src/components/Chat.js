import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSocket } from "../contexts/SocketContext";
import "./Chat.css"; // Ensure this import matches the correct path

const Chat = ({ currentUser, selectedUser, onClose, inputRef }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showNewMessageNotification, setShowNewMessageNotification] = useState(false);
  const messagesEndRef = useRef(null);
  const socket = useSocket();

  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const res = await axios.get('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/messages', {
          params: {
            senderId: currentUser._id,
            receiverId: selectedUser._id
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setMessages(res.data);
        scrollToBottom(); // Scroll to bottom after fetching messages
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [currentUser._id, selectedUser]);

  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleMessage = (message) => {
      if (message.sender === selectedUser._id || message.receiver === selectedUser._id) {
        setMessages((prevMessages) => [...prevMessages, message]);
        if (document.visibilityState === 'hidden') {
          setShowNewMessageNotification(true); // Only show notification if tab is not active
        }
        scrollToBottom(); // Scroll to bottom when a new message is received
      }
    };

    socket.on('receiveMessage', handleMessage);

    return () => {
      socket.off('receiveMessage', handleMessage);
    };
  }, [socket, currentUser._id, selectedUser]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100); // Small delay to ensure the DOM is updated
    setShowNewMessageNotification(false); // Hide the notification after scrolling
  };

  const onMessageSend = async (e) => {
    e.preventDefault();
    const messageData = {
      sender: currentUser._id,
      receiver: selectedUser._id,
      content: newMessage,
      timestamp: new Date(),
    };

    try {
      await axios.post('https://safety-net-innov8r-1f5b89760363.herokuapp.com/api/messages', messageData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage("");
      socket.emit('sendMessage', messageData); // Emit message to the server
      scrollToBottom(); // Scroll to bottom only when a new message is sent
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedUser, inputRef]);

  return (
    <div className="chat">
      <div className="chat-header">
        <h3>{selectedUser ? selectedUser.name : "Select a user to chat"}</h3>
        <button className="close-btn" onClick={onClose}>
          X
        </button>
      </div>
      <div className="messages-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.sender === currentUser._id ? "sent" : "received"}`}
            >
              {message.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {showNewMessageNotification && (
        <div className="new-message-notification" onClick={scrollToBottom}>
          New message received. Click to view.
        </div>
      )}
      <form onSubmit={onMessageSend} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!selectedUser}
          ref={inputRef}
        />
        <button type="submit" disabled={!selectedUser}>Send</button>
      </form>
    </div>
  );
};

export default Chat;
