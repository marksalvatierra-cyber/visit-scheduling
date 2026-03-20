import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  required = false,
  options = []
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
        ) : type === 'select' ? (
          <select
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="inline-input"
            autoFocus
            onBlur={handleSave}
            disabled={isLoading}
          >
            <option value="">Select {label}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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

// ID Upload Section Component
const IDUploadSection = ({ onUpload, uploading, currentIdType, isReupload }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [idType, setIdType] = useState(currentIdType || '');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !idType) {
      alert('Please select a file and ID type');
      return;
    }

    await onUpload(selectedFile, idType);
    
    // Reset form
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const idTypes = [
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'passport', label: 'Passport' },
    { value: 'national_id', label: 'National ID' },
    { value: 'voters_id', label: "Voter's ID" },
    { value: 'other', label: 'Other Government ID' }
  ];

  return (
    <div>
      <label className="field-label" style={{ fontSize: '13px' }}>
        {isReupload ? 'Upload New ID Document' : 'Upload ID Document'}
      </label>
      
      <div style={{ marginBottom: '8px' }}>
        <select
          value={idType}
          onChange={(e) => setIdType(e.target.value)}
          disabled={uploading}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '13px',
            marginBottom: '8px'
          }}
        >
          <option value="">Select ID Type</option>
          {idTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <div style={{
          border: '2px dashed #d1d5db',
          borderRadius: '6px',
          padding: '16px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          cursor: uploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s'
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) {
            const event = { target: { files: [file] } };
            handleFileChange(event);
          }
        }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            id="id-upload"
            style={{ display: 'none' }}
          />
          <label htmlFor="id-upload" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
            {previewUrl ? (
              <div>
                <img 
                  src={previewUrl} 
                  alt="ID Preview" 
                  style={{
                    maxWidth: '200px',
                    maxHeight: '120px',
                    borderRadius: '4px',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {selectedFile?.name}
                </div>
              </div>
            ) : (
              <div>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1" style={{ margin: '0 auto 8px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17,8 12,3 7,8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '2px' }}>
                  Click to upload or drag and drop
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  PNG, JPG up to 5MB
                </div>
              </div>
            )}
          </label>
        </div>
      </div>

      {selectedFile && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCancel}
            disabled={uploading}
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              background: 'white',
              color: '#374151',
              fontSize: '13px',
              fontWeight: '600',
              cursor: uploading ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !idType}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              background: uploading || !idType ? '#9ca3af' : '#3b82f6',
              color: 'white',
              fontSize: '13px',
              fontWeight: '600',
              cursor: uploading || !idType ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {uploading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                {isReupload ? 'Resubmit ID' : 'Submit ID'}
              </>
            )}
          </button>
        </div>
      )}
      
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

const ClientProfile = ({ onProfilePictureUpdate }) => {
  const [profile, setProfile] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    dateOfBirth: '',
    gender: '',
    occupation: '',
    relationship: '',
    profilePicture: '',
    country: '',
    affiliation: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [verificationStatus, setVerificationStatus] = useState({
    profileStatus: 'pending_verification',
    idFile: null,
    idType: '',
    rejectionReason: ''
  });
  const [uploadingId, setUploadingId] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ password: '', newEmail: '', confirmEmail: '' });
  const [emailErrors, setEmailErrors] = useState({});
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [profilePreferences, setProfilePreferences] = useState({
    inAppNotifications: true,
    twoFactorEnabled: false,
    loginNotifications: true
  });
  const location = useLocation();
  const isProfileCompletionRequired = new URLSearchParams(location.search).get('completeProfile') === '1';

  useEffect(() => {
    const runLoadProfile = async () => {
      setLoading(true);
      try {
        const user = await firebaseService.getCurrentUser();
        if (!user) {
          setToast({ message: 'You must be logged in to view your profile.', type: 'error', isVisible: true });
          return;
        }

        setCurrentUser(user);
        const userData = await firebaseService.getUserData(user.uid);
        
        if (userData) {
          setProfile({
            firstName: userData.firstName || '',
            middleName: userData.middleName || '',
            lastName: userData.lastName || userData.surname || '',
            email: userData.email || user.email,
            phone: userData.phone || userData.mobileNumber || '',
            address: userData.address || userData.completeAddress || '',
            emergencyContact: userData.emergencyContact || '',
            emergencyPhone: userData.emergencyPhone || '',
            dateOfBirth: userData.dateOfBirth || '',
            gender: userData.gender === 'not_specified' ? '' : (userData.gender || ''),
            occupation: userData.occupation || userData.affiliation || '',
            relationship: userData.relationship || '',
            profilePicture: userData.profilePicture || '',
            country: userData.country || 'Philippines',
            affiliation: userData.affiliation || ''
          });
          
          setVerificationStatus({
            profileStatus: userData.profileStatus || 'pending_verification',
            idFile: userData.idFile || null,
            idType: userData.idType || '',
            rejectionReason: userData.rejectionReason || ''
          });
        } else {
          setProfile(prev => ({
            ...prev,
            email: user.email
          }));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setToast({ message: 'Failed to load profile data. Please try again.', type: 'error', isVisible: true });
      } finally {
        setLoading(false);
      }
    };

    runLoadProfile();
  }, []);

  useEffect(() => {
    const storedPreferences = localStorage.getItem('client-profile-preferences');
    if (storedPreferences) {
      try {
        const parsedPreferences = JSON.parse(storedPreferences);
        setProfilePreferences(prev => ({ ...prev, ...parsedPreferences }));
      } catch (error) {
        console.error('Failed to parse stored client preferences:', error);
      }
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyIndex >= 0) {
          setProfile(history[historyIndex]);
          setHistoryIndex(historyIndex - 1);
          setToast({ message: 'Changes undone', type: 'info', isVisible: true });
        }
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

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const handlePreferenceToggle = (key) => {
    setProfilePreferences(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('client-profile-preferences', JSON.stringify(updated));
      return updated;
    });
    showToast('Preference updated successfully!', 'success');
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
  const handleIdReupload = async (file, idType) => {
    if (!currentUser) return;
    
    setUploadingId(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const base64Data = await base64Promise;
      
      const idFileData = {
        base64: base64Data,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString()
      };
      
      // Update user profile with new ID and reset status to pending
      await firebaseService.updateUserProfile(currentUser.uid, {
        idFile: idFileData,
        idType: idType,
        profileStatus: 'pending_verification',
        rejectionReason: '', // Clear previous rejection reason
        resubmittedAt: new Date().toISOString()
      });
      
      // Update local state
      setVerificationStatus({
        profileStatus: 'pending_verification',
        idFile: idFileData,
        idType: idType,
        rejectionReason: ''
      });
      
      showToast('ID document uploaded successfully! Your account is now pending verification.', 'success');
    } catch (error) {
      console.error('Error uploading ID:', error);
      showToast('Failed to upload ID document. Please try again.', 'error');
    } finally {
      setUploadingId(false);
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
      gender: 'Gender',
      occupation: 'Occupation',
      relationship: 'Relationship'
    };
    return labels[fieldName] || fieldName;
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
      gender: 'Select your gender',
      relationship: 'e.g., Spouse, Parent, Sibling'
    };
    return placeholders[fieldName] || '';
  };

  // Email change handlers
  const handleOpenEmailModal = () => {
    setShowEmailModal(true);
    setEmailForm({ password: '', newEmail: '', confirmEmail: '' });
    setEmailErrors({});
    setShowEmailPassword(false);
  };

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setEmailForm({ password: '', newEmail: '', confirmEmail: '' });
    setEmailErrors({});
    setShowEmailPassword(false);
  };

  const handleEmailFormChange = (field, value) => {
    setEmailForm(prev => ({ ...prev, [field]: value }));
    if (emailErrors[field]) {
      setEmailErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateEmailForm = () => {
    const errors = {};
    if (!emailForm.password) errors.password = 'Password is required to change email';
    if (!emailForm.newEmail) {
      errors.newEmail = 'New email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.newEmail)) {
      errors.newEmail = 'Please enter a valid email address';
    } else if (emailForm.newEmail === profile.email) {
      errors.newEmail = 'New email must be different from current email';
    }
    if (!emailForm.confirmEmail) {
      errors.confirmEmail = 'Please confirm your new email';
    } else if (emailForm.newEmail !== emailForm.confirmEmail) {
      errors.confirmEmail = 'Email addresses do not match';
    }
    setEmailErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangeEmail = async () => {
    if (!validateEmailForm()) return;
    setIsChangingEmail(true);
    try {
      const result = await firebaseService.changeEmail(emailForm.password, emailForm.newEmail);
      if (result.success) {
        // Email will update after the user verifies the new email via the link sent
        showToast(result.message || 'A verification link has been sent to your new email. Your email will update after verification.', 'success');
        handleCloseEmailModal();
      } else {
        showToast(result.error || 'Failed to change email', 'error');
        if (result.error && result.error.includes('Password')) {
          setEmailErrors({ password: result.error });
        }
      }
    } catch (error) {
      console.error('Error changing email:', error);
      showToast('Failed to change email', 'error');
    } finally {
      setIsChangingEmail(false);
    }
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

  const fullName = `${profile.firstName}${profile.middleName ? ' ' + profile.middleName : ''} ${profile.lastName}`.trim();

  return (
    <div className="settings-page">
      <div className="profile-content">
        {isProfileCompletionRequired && (!profile.gender || !profile.dateOfBirth) && (
          <div style={{
            marginBottom: '16px',
            padding: '14px 16px',
            borderRadius: '10px',
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            color: '#9a3412',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Please complete your gender and date of birth to continue using the dashboard.
          </div>
        )}
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
                  <h4 className="profile-name-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {fullName || 'Your Name'}
                    {verificationStatus.profileStatus === 'verified' && (
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#3b82f6',
                        background: '#eff6ff',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ✓ Verified
                      </span>
                    )}
                    {verificationStatus.profileStatus === 'pending_verification' && (
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#f59e0b',
                        background: '#fffbeb',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ⏳ Pending
                      </span>
                    )}
                    {verificationStatus.profileStatus === 'rejected' && (
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#ef4444',
                        background: '#fef2f2',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ✗ Rejected
                      </span>
                    )}
                  </h4>
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
                  <label className="field-label">Middle Name</label>
                  <InlineEditField
                    value={profile.middleName}
                    onSave={(value) => handleFieldSave('middleName', value)}
                    type="text"
                    label="Middle Name"
                    isEditing={editingField === 'middleName'}
                    setIsEditing={(editing) => setEditingField(editing ? 'middleName' : null)}
                    placeholder="Middle name (optional)"
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <InlineEditField
                      value={profile.email}
                      onSave={() => {}}
                      type="email"
                      label="Email Address"
                      isEditing={false}
                      setIsEditing={() => {}}
                      isReadOnly={true}
                    />
                    <button
                      onClick={handleOpenEmailModal}
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: 'white',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      Change
                    </button>
                  </div>
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
                  <label className="field-label">Gender</label>
                  <InlineEditField
                    value={profile.gender}
                    onSave={(value) => handleFieldSave('gender', value)}
                    type="select"
                    label="Gender"
                    isEditing={editingField === 'gender'}
                    setIsEditing={(editing) => setEditingField(editing ? 'gender' : null)}
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'other', label: 'Other' }
                    ]}
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

              <div className="field-item">
                <label className="field-label">Country</label>
                <InlineEditField
                  value={profile.country}
                  onSave={(value) => handleFieldSave('country', value)}
                  type="text"
                  label="Country"
                  isEditing={editingField === 'country'}
                  setIsEditing={(editing) => setEditingField(editing ? 'country' : null)}
                  placeholder="Country"
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

          {/* ID Verification Section */}
          <div className="profile-section">
            <div className="section-header">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                ID Verification
              </h3>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: verificationStatus.profileStatus === 'verified' ? '#dcfce7' : 
                               verificationStatus.profileStatus === 'rejected' ? '#fee2e2' : '#fef3c7',
                color: verificationStatus.profileStatus === 'verified' ? '#166534' : 
                       verificationStatus.profileStatus === 'rejected' ? '#991b1b' : '#854d0e'
              }}>
                {verificationStatus.profileStatus === 'verified' ? '✓ Verified' : 
                 verificationStatus.profileStatus === 'rejected' ? '✕ Rejected' : '⏳ Pending'}
              </div>
            </div>
            <div className="section-content">
              {/* Status Message */}
              {verificationStatus.profileStatus === 'rejected' && verificationStatus.rejectionReason && (
                <div style={{
                  padding: '12px',
                  marginBottom: '12px',
                  borderRadius: '6px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#991b1b', marginBottom: '2px', fontSize: '13px' }}>
                        Verification Rejected
                      </div>
                      <div style={{ fontSize: '12px', color: '#991b1b' }}>
                        <strong>Reason:</strong> {verificationStatus.rejectionReason}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {verificationStatus.profileStatus === 'pending_verification' && (
                <div style={{
                  padding: '12px',
                  marginBottom: '12px',
                  borderRadius: '6px',
                  backgroundColor: '#fef9c3',
                  border: '1px solid #fef08a'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#854d0e', marginBottom: '2px', fontSize: '13px' }}>
                        Verification Pending
                      </div>
                      <div style={{ fontSize: '12px', color: '#854d0e' }}>
                        Your ID document is being reviewed by an administrator.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {verificationStatus.profileStatus === 'verified' && (
                <div style={{
                  padding: '12px',
                  marginBottom: '12px',
                  borderRadius: '6px',
                  backgroundColor: '#dcfce7',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '6px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#166534', marginBottom: '2px', fontSize: '13px' }}>
                        Account Verified
                      </div>
                      <div style={{ fontSize: '12px', color: '#166534' }}>
                        Your account has been successfully verified. You can now submit visit requests.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Current ID Document */}
              {verificationStatus.idFile && (
                <div style={{ marginBottom: '12px' }}>
                  <label className="field-label" style={{ fontSize: '13px' }}>Current ID Document</label>
                  <div style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb'
                  }}>
                    <img 
                      src={verificationStatus.idFile.base64} 
                      alt="ID Document" 
                      style={{
                        width: '100%',
                        maxWidth: '250px',
                        borderRadius: '4px',
                        marginBottom: '6px'
                      }}
                    />
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      <div><strong>Type:</strong> {verificationStatus.idType?.replace(/_/g, ' ').toUpperCase()}</div>
                      <div><strong>Uploaded:</strong> {new Date(verificationStatus.idFile.uploadedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload/Reupload ID */}
              {verificationStatus.profileStatus !== 'verified' && (
                <IDUploadSection 
                  onUpload={handleIdReupload}
                  uploading={uploadingId}
                  currentIdType={verificationStatus.idType}
                  isReupload={!!verificationStatus.idFile}
                />
              )}
            </div>
          </div>

          <div className="profile-section">
            <div className="section-header">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                Alerts & Privacy
              </h3>
            </div>
            <div className="section-content">
              <div className="field-grid">
                <div className="field-item">
                  <label className="field-label">In-App Alerts</label>
                  <button
                    type="button"
                    onClick={() => handlePreferenceToggle('inAppNotifications')}
                    style={{
                      minHeight: '38px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid #dbe3f0',
                      background: profilePreferences.inAppNotifications ? '#e0e7ff' : '#ffffff',
                      color: profilePreferences.inAppNotifications ? '#3730a3' : '#4b5563',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {profilePreferences.inAppNotifications ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="field-item">
                  <label className="field-label">Two-Factor Authentication</label>
                  <button
                    type="button"
                    onClick={() => handlePreferenceToggle('twoFactorEnabled')}
                    style={{
                      minHeight: '38px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid #dbe3f0',
                      background: profilePreferences.twoFactorEnabled ? '#e0e7ff' : '#ffffff',
                      color: profilePreferences.twoFactorEnabled ? '#3730a3' : '#4b5563',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {profilePreferences.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <div className="field-item">
                  <label className="field-label">Login Notifications</label>
                  <button
                    type="button"
                    onClick={() => handlePreferenceToggle('loginNotifications')}
                    style={{
                      minHeight: '38px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid #dbe3f0',
                      background: profilePreferences.loginNotifications ? '#e0e7ff' : '#ffffff',
                      color: profilePreferences.loginNotifications ? '#3730a3' : '#4b5563',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {profilePreferences.loginNotifications ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Email Modal */}
      {showEmailModal && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <h4>Change Email Address</h4>
              <button className="modal-close" onClick={handleCloseEmailModal} aria-label="Close">✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: '#f3f4f6', fontSize: '0.85rem', color: '#6b7280' }}>
                Current email: <strong>{profile.email}</strong>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="field-label" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showEmailPassword ? 'text' : 'password'}
                    className={emailErrors.password ? 'form-input error' : 'form-input'}
                    value={emailForm.password}
                    onChange={(e) => handleEmailFormChange('password', e.target.value)}
                    placeholder="Enter your current password"
                    disabled={isChangingEmail}
                    style={{ width: '100%', padding: '8px 36px 8px 8px', borderRadius: '6px', border: emailErrors.password ? '1px solid #ef4444' : '1px solid #d1d5db', fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword(prev => !prev)}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                    tabIndex={-1}
                  >
                    {showEmailPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    )}
                  </button>
                </div>
                {emailErrors.password && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{emailErrors.password}</span>}
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="field-label" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>New Email Address</label>
                <input
                  type="email"
                  className={emailErrors.newEmail ? 'form-input error' : 'form-input'}
                  value={emailForm.newEmail}
                  onChange={(e) => handleEmailFormChange('newEmail', e.target.value)}
                  placeholder="Enter new email address"
                  disabled={isChangingEmail}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: emailErrors.newEmail ? '1px solid #ef4444' : '1px solid #d1d5db', fontSize: '13px' }}
                />
                {emailErrors.newEmail && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{emailErrors.newEmail}</span>}
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label className="field-label" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Confirm New Email</label>
                <input
                  type="email"
                  className={emailErrors.confirmEmail ? 'form-input error' : 'form-input'}
                  value={emailForm.confirmEmail}
                  onChange={(e) => handleEmailFormChange('confirmEmail', e.target.value)}
                  placeholder="Re-enter new email address"
                  disabled={isChangingEmail}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: emailErrors.confirmEmail ? '1px solid #ef4444' : '1px solid #d1d5db', fontSize: '13px' }}
                />
                {emailErrors.confirmEmail && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{emailErrors.confirmEmail}</span>}
              </div>

              <div style={{ fontSize: '12px', color: '#6b7280', padding: '8px', background: '#f9fafb', borderRadius: '6px' }}>
                <p style={{ fontWeight: '600', marginBottom: '4px' }}>Requirements:</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ color: emailForm.newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.newEmail) ? '#10b981' : '#9ca3af' }}>
                    {emailForm.newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.newEmail) ? '✓' : '○'} Valid email format
                  </li>
                  <li style={{ color: emailForm.newEmail && emailForm.newEmail !== profile.email ? '#10b981' : '#9ca3af' }}>
                    {emailForm.newEmail && emailForm.newEmail !== profile.email ? '✓' : '○'} Different from current email
                  </li>
                  <li style={{ color: emailForm.newEmail && emailForm.newEmail === emailForm.confirmEmail ? '#10b981' : '#9ca3af' }}>
                    {emailForm.newEmail && emailForm.newEmail === emailForm.confirmEmail ? '✓' : '○'} Email addresses match
                  </li>
                </ul>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleCloseEmailModal} disabled={isChangingEmail}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleChangeEmail} disabled={isChangingEmail}>
                {isChangingEmail ? 'Changing Email...' : 'Change Email'}
              </button>
            </div>
          </div>
        </div>
      )}

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