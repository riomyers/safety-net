import React, { useState } from "react";
import Chat from "./Chat";
import NearbyUsers from "./NearbyUsers"; // Ensure this import matches the correct path
import "./ChatApp.css"; // Create a separate CSS file if needed

const ChatApp = ({ currentUser, currentLocation }) => {
  const [selectedUser, setSelectedUser] = useState(null);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  return (
    <div className="chat-app">
      <div className="sidebar">
        <NearbyUsers 
          currentLocation={currentLocation} 
          onSelectUser={handleUserSelect} 
          unreadMessages={{}} // Pass unreadMessages if needed
        />
      </div>
      <div className="chat-container">
        {selectedUser ? (
          <Chat 
            currentUser={currentUser} 
            selectedUser={selectedUser} 
            onClose={() => setSelectedUser(null)} 
            currentLocation={currentLocation}
          />
        ) : (
          <div className="chat-placeholder">
            <h3>Select a user to start chatting</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatApp;
