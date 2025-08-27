import React, { useState, useEffect } from 'react';
import firebaseService from '../firebase-services';
import './ClientProfile.css';

// Toast notification component
const Toast = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <span className="toast-icon">
          {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
        </span>
        <span className="toast-message">{message}</span>
      </div>
    </div>
  );
};

// Profile Picture Component
const ProfilePictureUpload = ({ currentImage, onImageChange, userName, isCompact = false }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(currentImage); // shown in avatar
  const [selectedFile, setSelectedFile] = useState(null); // pending file
  const [tempPreview, setTempPreview] = useState(null); // modal preview
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setPreviewImage(currentImage);
  }, [currentImage]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Create preview and open modal (do not upload yet)
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempPreview(e.target.result);
      setSelectedFile(file);
      setIsModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !tempPreview) return;
    setIsUploading(true);
    try {
      await onImageChange(selectedFile, tempPreview);
      // Optimistically update local avatar
      setPreviewImage(tempPreview);
      setIsModalOpen(false);
      setSelectedFile(null);
      setTempPreview(null);
    } catch (error) {
      console.error('Error saving profile picture:', error);
      alert('Failed to save profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelSelection = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setTempPreview(null);
  };

  const getInitials = () => {
    if (!userName) return '?';
    return userName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const size = isCompact ? 80 : 120;

  return (
    <div className="profile-picture-upload">
      <div 
        className="profile-picture-wrapper" 
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {previewImage ? (
          <img 
            src={previewImage} 
            alt="Profile" 
            className="profile-picture"
          />
        ) : (
          <div className="profile-picture-placeholder">
            <span className="profile-initials">{getInitials()}</span>
          </div>
        )}
        
        <div className="profile-picture-overlay">
          <label htmlFor="profile-picture-input" className="upload-trigger">
            {isUploading ? (
              <div className="upload-spinner">⏳</div>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            )}
          </label>
          <input
            id="profile-picture-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="preview-title">
            <div className="modal-header">
              <h4 id="preview-title">Preview Photo</h4>
              <button className="modal-close" onClick={handleCancelSelection} aria-label="Close">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-image-wrap">
                <img src={tempPreview} alt="Preview" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleCancelSelection} disabled={isUploading}>Cancel</button>
              <button className="btn-primary" onClick={handleConfirmUpload} disabled={isUploading}>
                {isUploading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!isCompact && (
        <div className="profile-picture-info">
          <p className="upload-hint">Click photo to change</p>
          <p className="upload-requirements">JPG, PNG (max 5MB)</p>
        </div>
      )}
    </div>
  );
};

// Inline editable field component (same as before)
const InlineEditField = ({ 
  value, 
  onSave, 
  type = 'text', 
  label, 
  isEditing, 
  setIsEditing, 
  isReadOnly = false,
  placeholder = '',
  required = false 
}) => {
  const [tempValue, setTempValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = async () => {
    if (tempValue === value || isReadOnly) {
      setIsEditing(false);
      return;
    }

    if (required && !tempValue.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(tempValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isReadOnly) {
    return (
      <div className="readonly-field">
        <span className="field-value readonly">
          {value || 'Not available'}
        </span>
        <span className="readonly-indicator">🔒</span>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="inline-edit-container">
        {type === 'textarea' ? (
          <textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="inline-textarea"
            autoFocus
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={placeholder}
            rows={3}
          />
        ) : (
          <input
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="inline-input"
            autoFocus
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={placeholder}
          />
        )}
        
        <div className="inline-actions">
          <button 
            onClick={handleSave} 
            className="inline-btn save-btn"
            disabled={isLoading}
            title="Save (Enter)"
          >
            {isLoading ? '⏳' : '✓'}
          </button>
          <button 
            onClick={handleCancel} 
            className="inline-btn cancel-btn"
            disabled={isLoading}
            title="Cancel (Escape)"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`editable-field ${required && !value ? 'required-empty' : ''}`}
      onClick={() => setIsEditing(true)}
      title={`Click to edit ${label.toLowerCase()}`}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
    >
      <span className="field-value">
        {value || (
          <span className="placeholder-text">
            {placeholder || `Enter ${label.toLowerCase()}`}
          </span>
        )}
      </span>
      <span className="edit-indicator">✏️</span>
    </div>
  );
};

const ClientProfile = ({ onProfilePictureUpdate }) => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    dateOfBirth: '',
    occupation: '',
    relationship: '',
    profilePicture: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    loadProfile();
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Add to history for undo functionality
  const addToHistory = (previousProfile) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(previousProfile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo function
  const undo = () => {
    if (historyIndex >= 0) {
      setProfile(history[historyIndex]);
      setHistoryIndex(historyIndex - 1);
      showToast('Changes undone', 'info');
    }
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const user = await firebaseService.getCurrentUser();
      if (!user) {
        showToast('You must be logged in to view your profile.', 'error');
        return;
      }

      setCurrentUser(user);
      const userData = await firebaseService.getUserData(user.uid);
      
      if (userData) {
        setProfile({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || user.email,
          phone: userData.phone || '',
          address: userData.address || '',
          emergencyContact: userData.emergencyContact || '',
          emergencyPhone: userData.emergencyPhone || '',
          dateOfBirth: userData.dateOfBirth || '',
          occupation: userData.occupation || '',
          relationship: userData.relationship || '',
          profilePicture: userData.profilePicture || ''
        });
      } else {
        setProfile(prev => ({
          ...prev,
          email: user.email
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast('Failed to load profile data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSave = async (fieldName, newValue) => {
    if (!currentUser) {
      showToast('You must be logged in to update your profile.', 'error');
      return;
    }

    // Validate required fields
    if ((fieldName === 'firstName' || fieldName === 'lastName') && !newValue.trim()) {
      showToast('First name and last name are required.', 'error');
      return;
    }

    const previousProfile = { ...profile };
    addToHistory(previousProfile);

    try {
      // Update local state immediately for better UX
      setProfile(prev => ({ ...prev, [fieldName]: newValue }));

      const result = await firebaseService.updateUserProfile(currentUser.uid, {
        [fieldName]: newValue
      });

      if (result.success) {
        showToast(`${getFieldLabel(fieldName)} updated successfully!`);
      } else {
        // Revert on error
        setProfile(previousProfile);
        showToast(result.error || 'Failed to update profile. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Revert on error
      setProfile(previousProfile);
      showToast('An unexpected error occurred. Please try again.', 'error');
    }
  };

  const handleProfilePictureChange = async (file, previewUrl) => {
    if (!currentUser) {
      showToast('You must be logged in to update your profile picture.', 'error');
      return;
    }

    const previousProfile = { ...profile };
    addToHistory(previousProfile);

    try {
      // Update local state with preview immediately
      setProfile(prev => ({ ...prev, profilePicture: previewUrl }));

      // Here you would upload to Firebase Storage and get the download URL
      // For now, we'll simulate this
      const result = await firebaseService.updateUserProfile(currentUser.uid, {
        profilePicture: previewUrl // In real implementation, use the Firebase Storage URL
      });

      if (result.success) {
        showToast('Profile picture updated successfully!');
        // Update the header avatar in ClientDashboard
        if (onProfilePictureUpdate) {
          onProfilePictureUpdate(previewUrl);
        }
      } else {
        // Revert on error
        setProfile(previousProfile);
        showToast('Failed to update profile picture. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      // Revert on error
      setProfile(previousProfile);
      showToast('Failed to update profile picture. Please try again.', 'error');
    }
  };

  const getFieldLabel = (fieldName) => {
    const labels = {
      firstName: 'First Name',
      lastName: 'Last Name',
      phone: 'Phone Number',
      address: 'Address',
      emergencyContact: 'Emergency Contact Name',
      emergencyPhone: 'Emergency Contact Phone',
      dateOfBirth: 'Date of Birth',
      occupation: 'Occupation',
      relationship: 'Relationship'
    };
    return labels[fieldName] || fieldName;
  };

  const getFieldType = (fieldName) => {
    if (fieldName === 'email') return 'email';
    if (fieldName === 'phone' || fieldName === 'emergencyPhone') return 'tel';
    if (fieldName === 'dateOfBirth') return 'date';
    if (fieldName === 'address') return 'textarea';
    return 'text';
  };

  const getFieldPlaceholder = (fieldName) => {
    const placeholders = {
      firstName: 'Enter your first name',
      lastName: 'Enter your last name',
      phone: '(123) 456-7890',
      address: 'Your full address',
      emergencyContact: 'Full name of emergency contact',
      emergencyPhone: '(123) 456-7890',
      occupation: 'Your occupation',
      relationship: 'e.g., Spouse, Parent, Sibling'
    };
    return placeholders[fieldName] || '';
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-message">
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h3>Loading your profile...</h3>
            <p>Please wait while we fetch your information.</p>
          </div>
        </div>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <div className="settings-page">
      <div className="profile-content">
        <div className="profile-grid">
          {/* Personal Information Section with Profile Picture */}
          <div className="profile-section">
            <div className="section-header">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Personal Information
              </h3>
            </div>
            <div className="section-content">
              {/* Profile Picture at the top */}
              <div className="profile-picture-section">
                <ProfilePictureUpload
                  currentImage={profile.profilePicture}
                  onImageChange={handleProfilePictureChange}
                  userName={fullName}
                  isCompact={true}
                />
                <div className="profile-summary-inline">
                  <h4 className="profile-name-inline">{fullName || 'Your Name'}</h4>
                  <p className="profile-email-inline">{profile.email}</p>
                </div>
              </div>

              <div className="field-grid">
                <div className="field-item">
                  <label className="field-label">First Name *</label>
                  <InlineEditField
                    value={profile.firstName}
                    onSave={(value) => handleFieldSave('firstName', value)}
                    type="text"
                    label="First Name"
                    isEditing={editingField === 'firstName'}
                    setIsEditing={(editing) => setEditingField(editing ? 'firstName' : null)}
                    placeholder={getFieldPlaceholder('firstName')}
                    required={true}
                  />
                </div>

                <div className="field-item">
                  <label className="field-label">Last Name *</label>
                  <InlineEditField
                    value={profile.lastName}
                    onSave={(value) => handleFieldSave('lastName', value)}
                    type="text"
                    label="Last Name"
                    isEditing={editingField === 'lastName'}
                    setIsEditing={(editing) => setEditingField(editing ? 'lastName' : null)}
                    placeholder={getFieldPlaceholder('lastName')}
                    required={true}
                  />
                </div>

                <div className="field-item">
                  <label className="field-label">Email Address</label>
                  <InlineEditField
                    value={profile.email}
                    onSave={() => {}}
                    type="email"
                    label="Email Address"
                    isEditing={false}
                    setIsEditing={() => {}}
                    isReadOnly={true}
                  />
                </div>

                <div className="field-item">
                  <label className="field-label">Phone Number</label>
                  <InlineEditField
                    value={profile.phone}
                    onSave={(value) => handleFieldSave('phone', value)}
                    type="tel"
                    label="Phone Number"
                    isEditing={editingField === 'phone'}
                    setIsEditing={(editing) => setEditingField(editing ? 'phone' : null)}
                    placeholder={getFieldPlaceholder('phone')}
                  />
                </div>

                <div className="field-item">
                  <label className="field-label">Date of Birth</label>
                  <InlineEditField
                    value={profile.dateOfBirth}
                    onSave={(value) => handleFieldSave('dateOfBirth', value)}
                    type="date"
                    label="Date of Birth"
                    isEditing={editingField === 'dateOfBirth'}
                    setIsEditing={(editing) => setEditingField(editing ? 'dateOfBirth' : null)}
                  />
                </div>

                <div className="field-item">
                  <label className="field-label">Occupation</label>
                  <InlineEditField
                    value={profile.occupation}
                    onSave={(value) => handleFieldSave('occupation', value)}
                    type="text"
                    label="Occupation"
                    isEditing={editingField === 'occupation'}
                    setIsEditing={(editing) => setEditingField(editing ? 'occupation' : null)}
                    placeholder={getFieldPlaceholder('occupation')}
                  />
                </div>
              </div>

              <div className="field-item full-width">
                <label className="field-label">Address</label>
                <InlineEditField
                  value={profile.address}
                  onSave={(value) => handleFieldSave('address', value)}
                  type="textarea"
                  label="Address"
                  isEditing={editingField === 'address'}
                  setIsEditing={(editing) => setEditingField(editing ? 'address' : null)}
                  placeholder={getFieldPlaceholder('address')}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="profile-section">
            <div className="section-header">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Emergency Contact
              </h3>
            </div>
            <div className="section-content">
              <div className="field-grid">
                <div className="field-item">
                  <label className="field-label">Emergency Contact Name</label>
                  <InlineEditField
                    value={profile.emergencyContact}
                    onSave={(value) => handleFieldSave('emergencyContact', value)}
                    type="text"
                    label="Emergency Contact Name"
                    isEditing={editingField === 'emergencyContact'}
                    setIsEditing={(editing) => setEditingField(editing ? 'emergencyContact' : null)}
                    placeholder={getFieldPlaceholder('emergencyContact')}
                  />
                </div>

                <div className="field-item">
                  <label className="field-label">Emergency Contact Phone</label>
                  <InlineEditField
                    value={profile.emergencyPhone}
                    onSave={(value) => handleFieldSave('emergencyPhone', value)}
                    type="tel"
                    label="Emergency Contact Phone"
                    isEditing={editingField === 'emergencyPhone'}
                    setIsEditing={(editing) => setEditingField(editing ? 'emergencyPhone' : null)}
                    placeholder={getFieldPlaceholder('emergencyPhone')}
                  />
                </div>

                <div className="field-item">
                  <label className="field-label">Relationship to You</label>
                  <InlineEditField
                    value={profile.relationship}
                    onSave={(value) => handleFieldSave('relationship', value)}
                    type="text"
                    label="Relationship"
                    isEditing={editingField === 'relationship'}
                    setIsEditing={(editing) => setEditingField(editing ? 'relationship' : null)}
                    placeholder={getFieldPlaceholder('relationship')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
};

export default ClientProfile;