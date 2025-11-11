import React, { useState } from 'react';
import './TermsModal.css';

const TermsModal = ({ isOpen, onAccept, onClose }) => {
  const [isAccepted, setIsAccepted] = useState(false);

  const handleAccept = () => {
    if (isAccepted) {
      onAccept();
    }
  };

  const handleCheckboxChange = (e) => {
    setIsAccepted(e.target.checked);
  };

  if (!isOpen) return null;

  // Prevent modal from closing when clicking inside the modal content
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="terms-modal-overlay">
      <div className="terms-modal" onClick={handleModalContentClick}>
        <div className="terms-modal-header">
          <h2>Terms and Conditions</h2>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        
        <div className="terms-modal-content">
          <div className="terms-text">
            <h3>Prison Visit Scheduling System - Terms and Conditions</h3>
            
            <h4>1. Acceptance of Terms</h4>
            <p>By accessing and using the Prison Visit Scheduling System, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.</p>
            
            <h4>2. User Responsibilities</h4>
            <ul>
              <li>You must provide accurate and complete information during registration</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You must comply with all prison facility rules and regulations</li>
              <li>You agree to use the system only for its intended purpose of scheduling prison visits</li>
            </ul>
            
            <h4>3. Visit Scheduling</h4>
            <ul>
              <li>Visit schedules are subject to prison facility availability and approval</li>
              <li>The system reserves the right to cancel or reschedule visits due to security concerns or facility requirements</li>
              <li>You must arrive on time for scheduled visits; late arrivals may result in visit cancellation</li>
            </ul>
            
            <h4>4. Privacy and Data Protection</h4>
            <ul>
              <li>Your personal information will be handled in accordance with our Privacy Policy</li>
              <li>Information may be shared with relevant prison authorities for security purposes</li>
              <li>We implement appropriate security measures to protect your data</li>
            </ul>
            
            <h4>5. Prohibited Activities</h4>
            <ul>
              <li>Attempting to bypass security measures or access unauthorized areas</li>
              <li>Providing false information or impersonating others</li>
              <li>Using the system for any illegal or unauthorized purposes</li>
              <li>Interfering with the system's operation or other users' access</li>
            </ul>
            
            <h4>6. System Availability</h4>
            <p>While we strive to maintain system availability, we do not guarantee uninterrupted access. The system may be temporarily unavailable for maintenance or updates.</p>
            
            <h4>7. Account Suspension</h4>
            <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in suspicious activities.</p>
            
            <h4>8. Changes to Terms</h4>
            <p>These Terms and Conditions may be updated periodically. Continued use of the system constitutes acceptance of any changes.</p>
            
            <h4>9. Contact Information</h4>
            <p>For questions regarding these terms or the system, please contact the prison administration.</p>
            
            <p><strong>Last Updated:</strong> November 2025</p>
          </div>
          
          <div className="terms-acceptance">
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                checked={isAccepted} 
                onChange={handleCheckboxChange}
              />
              <span className="checkmark"></span>
              I have read and agree to the Terms and Conditions
            </label>
          </div>
        </div>
        
        <div className="terms-modal-footer">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className={`btn-primary ${!isAccepted ? 'disabled' : ''}`}
            onClick={handleAccept}
            disabled={!isAccepted}
          >
            Proceed to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;