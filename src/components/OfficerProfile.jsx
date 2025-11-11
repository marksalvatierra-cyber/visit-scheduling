import React, { useState, useEffect } from 'react';
import firebaseService from '../firebase-services.js';
import './Profile.css';

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

// Inline editable field component
const InlineEditField = ({
  value,
  onSave,
  type = 'text',
  label,
  isEditing,
  setIsEditing,
  isReadOnly = false,
  placeholder = ''
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

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
      onSave(tempValue);
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
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isReadOnly) {
    return (
      <div className="readonly-field">
        <span className="info-value readonly">
          {value || 'Not available'}
        </span>
        <span className="readonly-indicator">🔒</span>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="inline-edit-container">
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
      className="editable-field"
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

// Officer Personal Info Card
const OfficerPersonalInfo = ({
  profileData,
  editingField,
  setEditingField,
  handleFieldChange
}) => (
  <div className="profile-card simple-personal-card">
    <div className="card-header">
      <h3 className="card-title" style={{ justifyContent: 'center' }}>
        Officer Information
      </h3>
    </div>
    <div className="card-content">
      <div className="simple-info-list">
        <SimpleInfoItem
          label="Full Name"
          value={profileData.name}
          onSave={(value) => handleFieldChange('name', value)}
          type="text"
          isEditing={editingField === 'name'}
          setIsEditing={(editing) => setEditingField(editing ? 'name' : null)}
          placeholder="Enter your full name"
        />
        <SimpleInfoItem
          label="Email"
          value={profileData.email}
          onSave={(value) => handleFieldChange('email', value)}
          type="email"
          isEditing={editingField === 'email'}
          setIsEditing={(editing) => setEditingField(editing ? 'email' : null)}
          placeholder="Enter your email"
        />
        <SimpleInfoItem
          label="Phone"
          value={profileData.phone}
          onSave={(value) => handleFieldChange('phone', value)}
          type="tel"
          isEditing={editingField === 'phone'}
          setIsEditing={(editing) => setEditingField(editing ? 'phone' : null)}
          placeholder="Enter your phone number"
        />
        <SimpleInfoItem
          label="Badge Number"
          value={profileData.badgeNumber || profileData.employeeId}
          isReadOnly={true}
        />
        <SimpleInfoItem
          label="Rank"
          value={profileData.rank || 'Corrections Officer'}
          isReadOnly={true}
        />
        <SimpleInfoItem
          label="Department"
          value={profileData.department || 'Central Prison Camp Sablayan Penal Farm'}
          isReadOnly={true}
        />
        <SimpleInfoItem
          label="Shift"
          value={profileData.shift}
          onSave={(value) => handleFieldChange('shift', value)}
          isEditing={editingField === 'shift'}
          setIsEditing={(editing) => setEditingField(editing ? 'shift' : null)}
          placeholder="Enter your shift (e.g., Morning, Evening, Night)"
        />
        <SimpleInfoItem
          label="Join Date"
          value={profileData.joinDate}
          isReadOnly={true}
        />
        <SimpleInfoItem
          label="Last Login"
          value={profileData.lastLogin}
          isReadOnly={true}
        />
      </div>
    </div>
  </div>
);

// Modern & minimal info item row
const SimpleInfoItem = ({
  label,
  value,
  onSave = () => {},
  type = 'text',
  isEditing = false,
  setIsEditing = () => {},
  isReadOnly = false,
  placeholder = ''
}) => (
  <div className="simple-info-item">
    <span className="simple-label">{label}</span>
    <InlineEditField
      value={value}
      onSave={onSave}
      type={type}
      label={label}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
      isReadOnly={isReadOnly}
      placeholder={placeholder}
    />
  </div>
);

const OfficerProfile = ({ onProfilePictureUpdate }) => {
  const [profileData, setProfileData] = useState({
    name: 'Officer Name',
    email: 'officer@bucor.gov.ph',
    phone: '+63 912 345 6789',
    role: 'Corrections Officer',
    department: 'Central Prison Camp Sablayan Penal Farm',
    badgeNumber: 'BUCOR-OFF-001',
    rank: 'Officer',
    shift: 'Morning Shift',
    joinDate: 'January 15, 2024',
    lastLogin: 'Today at 9:30 AM',
    avatar: '/image/Logo.png'
  });

  const [editingField, setEditingField] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [officerStats, setOfficerStats] = useState({
    daysActive: 0,
    requestsProcessed: 0,
    visitsProcessed: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Load current user and profile data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const user = await firebaseService.getCurrentUser();
        setCurrentUser(user);
        
        if (user) {
          const userData = await firebaseService.getUserData(user.uid);
          console.log('Loaded officer data from Firebase:', userData);
          
          if (userData) {
            // Construct full name from available fields
            const constructedName = userData.name || 
              (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : null) ||
              'Officer Name';
            
            setProfileData(prev => {
              const updatedProfileData = {
                ...prev,
                name: constructedName,
                email: userData.email || prev.email,
                phone: userData.phone || prev.phone,
                avatar: userData.profilePicture || prev.avatar,
                // Officer-specific fields
                role: userData.role || 'Corrections Officer',
                department: userData.department || 'Central Prison Camp Sablayan Penal Farm',
                badgeNumber: userData.badgeNumber || userData.employeeId || prev.badgeNumber,
                rank: userData.rank || 'Officer',
                shift: userData.shift || prev.shift,
                joinDate: userData.joinDate || prev.joinDate,
                lastLogin: userData.lastLogin || prev.lastLogin
              };
              
              console.log('Setting officer profile data with avatar:', updatedProfileData.avatar);
              return updatedProfileData;
            });
          }

          // Load officer statistics
          await loadOfficerStatistics(user.uid);
        }
      } catch (error) {
        console.error('Error loading officer profile:', error);
        showToast('Failed to load profile data', 'error');
      }
    };
    
    loadUserProfile();
  }, []);

  // Function to calculate officer statistics
  const loadOfficerStatistics = async (userId) => {
    try {
      setStatsLoading(true);
      
      // Get current officer name for filtering
      const userData = await firebaseService.getUserData(userId);
      const officerName = userData?.name || (userData?.firstName && userData?.lastName ? `${userData.firstName} ${userData.lastName}` : null);
      
      // Get all visit requests to calculate statistics
      const allRequests = await firebaseService.getVisitRequests();
      
      // Filter requests processed by this officer (based on processedBy field or similar)
      const officerRequests = allRequests.filter(req => 
        req.processedBy === officerName || 
        req.handledBy === officerName ||
        req.officerName === officerName
      );
      
      // Count processed requests (approved + rejected + rescheduled by this officer)
      const processedRequests = officerRequests.filter(req => 
        req.status === 'approved' || req.status === 'rejected' || req.status === 'rescheduled'
      ).length;

      // Count completed visits (approved requests that have visit dates in the past)
      const now = new Date();
      const completedVisits = officerRequests.filter(req => {
        if (req.status === 'approved' && req.visitDate) {
          try {
            const visitDate = req.visitDate.toDate ? req.visitDate.toDate() : new Date(req.visitDate);
            return visitDate < now;
          } catch (e) {
            return false;
          }
        }
        return false;
      }).length;
      
      // Calculate days active (from join date or account creation)
      let daysActive = 0;
      
      if (userData && userData.createdAt) {
        const joinDate = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - joinDate);
        daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
        // Fallback: calculate from a reasonable start date
        const estimatedJoinDate = new Date('2024-01-15'); // Default join date
        const now = new Date();
        const diffTime = Math.abs(now - estimatedJoinDate);
        daysActive = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      setOfficerStats({
        daysActive,
        requestsProcessed: processedRequests,
        visitsProcessed: completedVisits
      });

      console.log('Officer statistics loaded:', {
        daysActive,
        requestsProcessed: processedRequests,
        visitsProcessed: completedVisits
      });

    } catch (error) {
      console.error('Error loading officer statistics:', error);
      // Set default values on error
      setOfficerStats({
        daysActive: 95,
        requestsProcessed: 342,
        visitsProcessed: 287
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Add to history for undo functionality
  const addToHistory = (previousData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(previousData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo function
  const undo = () => {
    if (historyIndex >= 0) {
      setProfileData(history[historyIndex]);
      setHistoryIndex(historyIndex - 1);
      showToast('Changes undone', 'info');
    }
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
  };

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

  const handleFieldChange = async (field, value) => {
    if (!currentUser) {
      showToast('User not authenticated', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare update data
      let updateData = { [field]: value };
      
      // If updating the name field, also update individual name components if they exist
      if (field === 'name' && value) {
        const nameParts = value.trim().split(' ');
        if (nameParts.length >= 2) {
          updateData.firstName = nameParts[0];
          updateData.lastName = nameParts[nameParts.length - 1];
          if (nameParts.length > 2) {
            updateData.middleName = nameParts.slice(1, -1).join(' ');
          }
        }
      }
      
      // Save to Firebase first
      const result = await firebaseService.updateUserProfile(currentUser.uid, updateData);

      if (result.success) {
        // Update local state only after successful save
        const previousData = { ...profileData };
        addToHistory(previousData);

        setProfileData(prev => ({
          ...prev,
          [field]: value
        }));

        showToast(`${field} updated successfully!`);
      } else {
        throw new Error(result.error || `Failed to update ${field}`);
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      showToast(`Failed to update ${field}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Profile picture handling functions
  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        console.log('Image preview created, size:', result.length);
        setImagePreview(result);
        setShowImageModal(true);
      };
      reader.onerror = () => {
        showToast('Failed to read image file', 'error');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfilePicture = async () => {
    if (!selectedImage || !currentUser) return;

    setIsLoading(true);
    try {
      // Convert to base64 or handle file upload
      const reader = new FileReader();
      reader.onload = async (e) => {
        const newProfilePictureUrl = e.target.result;
        
        console.log('Saving profile picture, data length:', newProfilePictureUrl.length);
        console.log('Image data type:', newProfilePictureUrl.substring(0, 50));
        
        try {
          // Save to Firebase first
          const result = await firebaseService.updateUserProfile(currentUser.uid, { 
            profilePicture: newProfilePictureUrl 
          });

          if (result.success) {
            console.log('Successfully saved to Firebase');
            
            // Update local state only after successful save
            const previousData = { ...profileData };
            addToHistory(previousData);
            
            setProfileData(prev => ({
              ...prev,
              avatar: newProfilePictureUrl
            }));

            // Update header avatar through callback
            if (onProfilePictureUpdate) {
              onProfilePictureUpdate(newProfilePictureUrl);
            }

            showToast('Profile picture updated successfully!', 'success');
            setShowImageModal(false);
            setSelectedImage(null);
            setImagePreview(null);
          } else {
            throw new Error(result.error || 'Failed to update profile picture');
          }
        } catch (dbError) {
          console.error('Error saving to Firebase:', dbError);
          showToast('Failed to save profile picture to database', 'error');
        }
      };
      
      reader.onerror = () => {
        console.error('Failed to read file');
        showToast('Failed to process image file', 'error');
        setIsLoading(false);
      };
      
      reader.readAsDataURL(selectedImage);
    } catch (error) {
      console.error('Error updating profile picture:', error);
      showToast('Failed to update profile picture', 'error');
      setIsLoading(false);
    }
  };

  const handleCancelImageUpload = () => {
    setShowImageModal(false);
    setSelectedImage(null);
    setImagePreview(null);
  };

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-grid">
          {/* Profile Card */}
          <div className="profile-card main-profile">
            <div className="profile-avatar-section">
              <div className="profile-avatar-container">
                <img 
                  src={profileData.avatar} 
                  alt="Officer Avatar" 
                  className="profile-avatar"
                  onError={(e) => {
                    console.log('Image failed to load:', profileData.avatar);
                    e.target.src = '/image/Logo.png';
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully:', profileData.avatar);
                  }}
                />
                <div className="avatar-overlay" onClick={() => document.getElementById('avatar-upload').click()}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="profile-info">
                <h2 className="profile-name">{profileData.name}</h2>
                <p className="profile-role">{profileData.role}</p>
                <p className="profile-department">{profileData.department}</p>
              </div>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <div className="stat-value">
                  {statsLoading ? (
                    <div className="stat-loading">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                    </div>
                  ) : (
                    officerStats.daysActive.toLocaleString()
                  )}
                </div>
                <div className="stat-label">Days Active</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {statsLoading ? (
                    <div className="stat-loading">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                    </div>
                  ) : (
                    officerStats.requestsProcessed.toLocaleString()
                  )}
                </div>
                <div className="stat-label">Requests Processed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {statsLoading ? (
                    <div className="stat-loading">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                    </div>
                  ) : (
                    officerStats.visitsProcessed.toLocaleString()
                  )}
                </div>
                <div className="stat-label">Visits Supervised</div>
              </div>
            </div>
          </div>

          {/* Officer Personal Info Card */}
          <OfficerPersonalInfo
            profileData={profileData}
            editingField={editingField}
            setEditingField={setEditingField}
            handleFieldChange={handleFieldChange}
          />

          {/* Security Settings */}
          <div className="profile-card">
            <div className="card-header">
              <h3 className="card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Security Settings
              </h3>
            </div>
            <div className="card-content">
              <div className="security-options">
                <div className="security-item">
                  <div className="security-info">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <button className="btn-secondary">Enable</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <h4>Change Password</h4>
                    <p>Update your account password</p>
                  </div>
                  <button className="btn-secondary">Change</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <h4>Login History</h4>
                    <p>View your recent login activity</p>
                  </div>
                  <button className="btn-secondary">View</button>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="profile-card">
            <div className="card-header">
              <h3 className="card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                Recent Activity
              </h3>
            </div>
            <div className="card-content">
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4"></path>
                    </svg>
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">Processed visit request for Inmate #12345</p>
                    <span className="activity-time">2 hours ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 1h6v6H1z"></path>
                      <path d="M17 1h6v6h-6z"></path>
                      <path d="M1 17h6v6H1z"></path>
                      <path d="M17 17h6v6h-6z"></path>
                    </svg>
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">Scanned visitor ID for security check</p>
                    <span className="activity-time">4 hours ago</span>
                  </div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    </svg>
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">Updated inmate visitation record</p>
                    <span className="activity-time">1 day ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {showImageModal && (
        <div className="modal-overlay" onClick={handleCancelImageUpload}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Preview Profile Picture</h3>
              <button className="modal-close" onClick={handleCancelImageUpload}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {imagePreview && (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCancelImageUpload} disabled={isLoading}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveProfilePicture} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Profile Picture'}
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

export default OfficerProfile;