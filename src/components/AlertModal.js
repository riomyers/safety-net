import React from 'react';
import './AlertModal.css';

const AlertModal = ({ message, onClose }) => {
  return (
	<div className="alert-modal">
	  <div className="alert-modal-content">
		<h2>Emergency Alert</h2>
		<p>{message}</p>
		<button onClick={onClose} className="alert-modal-button">Dismiss</button>
	  </div>
	</div>
  );
};

export default AlertModal;
