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

// SIMPLIFIED & MODERN PERSONAL INFO CARD
const SimplePersonalInfo = ({
  profileData,
  editingField,
  setEditingField,
  handleFieldChange
}) => (
  <div className="profile-card simple-personal-card">
    <div className="card-header">
      <h3 className="card-title" style={{ justifyContent: 'center' }}>
        Personal Info
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
          label="Employee ID"
          value={profileData.employeeId}
          isReadOnly={true}
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

const AdminProfile = ({ onProfilePictureUpdate }) => {
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@bucor.gov.ph',
    phone: '+63 912 345 6789',
    role: 'System Administrator',
    department: 'Central Prison Camp Sablayan Penal Farm',
    employeeId: 'BUCOR-2024-001',
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(false);
  const [systemActivity, setSystemActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [togglingTwoFactor, setTogglingTwoFactor] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [emailForm, setEmailForm] = useState({
    password: '',
    newEmail: '',
    confirmEmail: ''
  });
  const [emailErrors, setEmailErrors] = useState({});
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminStats, setAdminStats] = useState({
    daysActive: 0,
    requestsProcessed: 0,
    approvalRate: 0
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
          console.log('Loaded user data from Firebase:', userData);
          
          if (userData) {
            setProfileData(prev => {
              const updatedProfileData = {
                ...prev,
                name: userData.name || prev.name,
                email: userData.email || prev.email,
                phone: userData.phone || prev.phone,
                avatar: userData.profilePicture || prev.avatar,
                // Add other fields from Firebase if available
                role: userData.role || prev.role,
                department: userData.department || prev.department,
                employeeId: userData.employeeId || prev.employeeId,
                joinDate: userData.joinDate || prev.joinDate,
                lastLogin: userData.lastLogin || prev.lastLogin
              };
              
              console.log('Setting profile data with avatar:', updatedProfileData.avatar);
              return updatedProfileData;
            });

            // Load 2FA status
            setTwoFactorEnabled(userData.twoFactorEnabled || false);
          }

          // Load admin statistics
          await loadAdminStatistics(user.uid);

          // Load system activity
          await loadSystemActivity(user.uid);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        showToast('Failed to load profile data', 'error');
      }
    };
    
    loadUserProfile();
  }, []);

  // Format timestamp to relative time string
  const getTimeAgo = (date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Load system activity (login, profile updates, password changes)
  const loadSystemActivity = async (uid) => {
    const userId = uid || currentUser?.uid;
    if (!userId) return;
    try {
      setActivityLoading(true);
      const activities = await firebaseService.getSystemActivity(userId, 10);
      setSystemActivity(activities.map(a => ({ ...a, timeAgo: getTimeAgo(a.timestamp) })));
    } catch (error) {
      console.error('Error loading system activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  // Function to calculate admin statistics
  const loadAdminStatistics = async (userId) => {
    try {
      setStatsLoading(true);
      
      // Get all visit requests to calculate statistics
      const allRequests = await firebaseService.getVisitRequests();
      
      // Calculate approval rate
      const totalRequests = allRequests.length;
      const approvedRequests = allRequests.filter(req => req.status === 'approved').length;
      const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;
      
      // Calculate days active (from join date or account creation)
      const userData = await firebaseService.getUserData(userId);
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

      // Count processed requests (approved + rejected + rescheduled)
      const processedRequests = allRequests.filter(req => 
        req.status === 'approved' || req.status === 'rejected' || req.status === 'rescheduled'
      ).length;

      setAdminStats({
        daysActive,
        requestsProcessed: processedRequests,
        approvalRate
      });

      console.log('Admin statistics loaded:', {
        daysActive,
        requestsProcessed: processedRequests,
        approvalRate
      });

    } catch (error) {
      console.error('Error loading admin statistics:', error);
      // Set default values on error
      setAdminStats({
        daysActive: 156,
        requestsProcessed: 1247,
        approvalRate: 98
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
      // Save to Firebase first
      const updateData = { [field]: value };
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

        // Record system activity
        try {
          await firebaseService.recordSystemActivity(currentUser.uid, {
            action: 'profile_update',
            title: `Updated ${field}`,
            icon: 'edit'
          });
          loadSystemActivity();
        } catch (e) {
          console.error('Failed to record activity:', e);
        }
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

            // Record system activity
            try {
              await firebaseService.recordSystemActivity(currentUser.uid, {
                action: 'profile_picture',
                title: 'Updated profile picture',
                icon: 'camera'
              });
              loadSystemActivity();
            } catch (e) {
              console.error('Failed to record activity:', e);
            }

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

  // Password change handlers
  const handleOpenPasswordModal = () => {
    setShowPasswordModal(true);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
    setShowPasswords({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await firebaseService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (result.success) {
        showToast('Password changed successfully', 'success');

        // Record system activity
        try {
          await firebaseService.recordSystemActivity(currentUser.uid, {
            action: 'password_change',
            title: 'Changed account password',
            icon: 'lock'
          });
          loadSystemActivity();
        } catch (e) {
          console.error('Failed to record activity:', e);
        }

        handleClosePasswordModal();
      } else {
        showToast(result.error || 'Failed to change password', 'error');
        if (result.error.includes('Current password')) {
          setPasswordErrors({ currentPassword: result.error });
        }
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('Failed to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePasswordFormChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field when user starts typing
    if (passwordErrors[field]) {
      setPasswordErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
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

    if (!emailForm.password) {
      errors.password = 'Password is required to change email';
    }

    if (!emailForm.newEmail) {
      errors.newEmail = 'New email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.newEmail)) {
      errors.newEmail = 'Please enter a valid email address';
    } else if (emailForm.newEmail === profileData.email) {
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
      const result = await firebaseService.changeEmail(
        emailForm.password,
        emailForm.newEmail
      );

      if (result.success) {
        // Update local profile data
        setProfileData(prev => ({ ...prev, email: emailForm.newEmail }));
        showToast('Email changed successfully. Please verify your new email.', 'success');

        // Record system activity
        try {
          await firebaseService.recordSystemActivity(currentUser.uid, {
            action: 'email_change',
            title: 'Changed account email address',
            icon: 'edit'
          });
          loadSystemActivity();
        } catch (e) {
          console.error('Failed to record activity:', e);
        }

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

  // Login history helpers
  const parseBrowserInfo = (userAgent) => {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };
    let browser = 'Unknown';
    if (userAgent.includes('Edg/')) browser = 'Microsoft Edge';
    else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) browser = 'Google Chrome';
    else if (userAgent.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Safari';
    else if (userAgent.includes('Opera') || userAgent.includes('OPR/')) browser = 'Opera';

    let os = 'Unknown';
    if (userAgent.includes('Windows NT 10')) os = 'Windows 10/11';
    else if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS X')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    return { browser, os };
  };

  const formatLoginDate = (date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleViewLoginHistory = async () => {
    if (!currentUser) {
      showToast('User not authenticated', 'error');
      return;
    }
    setShowLoginHistoryModal(true);
    setLoginHistoryLoading(true);
    try {
      const historyData = await firebaseService.getLoginHistory(currentUser.uid, 20);
      setLoginHistory(historyData);
    } catch (error) {
      console.error('Error loading login history:', error);
      showToast('Failed to load login history', 'error');
    } finally {
      setLoginHistoryLoading(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    if (!currentUser) {
      showToast('User not authenticated', 'error');
      return;
    }

    setTogglingTwoFactor(true);
    const newValue = !twoFactorEnabled;

    try {
      const result = await firebaseService.updateUserProfile(currentUser.uid, {
        twoFactorEnabled: newValue
      });

      if (result.success) {
        setTwoFactorEnabled(newValue);
        showToast(
          newValue ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled',
          'success'
        );

        // Record system activity
        try {
          await firebaseService.recordSystemActivity(currentUser.uid, {
            action: '2fa_toggle',
            title: newValue ? 'Enabled two-factor authentication' : 'Disabled two-factor authentication',
            icon: 'lock'
          });
          loadSystemActivity();
        } catch (e) {
          console.error('Failed to record activity:', e);
        }
      } else {
        throw new Error(result.error || 'Failed to update 2FA setting');
      }
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      showToast('Failed to update two-factor authentication', 'error');
    } finally {
      setTogglingTwoFactor(false);
    }
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
                  alt="Profile Avatar" 
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
                    adminStats.daysActive.toLocaleString()
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
                    adminStats.requestsProcessed.toLocaleString()
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
                    `${adminStats.approvalRate}%`
                  )}
                </div>
                <div className="stat-label">Approval Rate</div>
              </div>
            </div>
          </div>

          {/* Simple Personal Info Card */}
          <SimplePersonalInfo
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
                    <p>{twoFactorEnabled ? 'Two-factor authentication is enabled' : 'Add an extra layer of security to your account'}</p>
                  </div>
                  <button
                    className={`toggle-switch ${twoFactorEnabled ? 'active' : ''}`}
                    onClick={handleToggleTwoFactor}
                    disabled={togglingTwoFactor}
                    style={{
                      position: 'relative',
                      width: '50px',
                      height: '26px',
                      borderRadius: '13px',
                      border: 'none',
                      cursor: togglingTwoFactor ? 'wait' : 'pointer',
                      background: twoFactorEnabled ? '#10b981' : '#d1d5db',
                      transition: 'background 0.3s ease',
                      padding: 0,
                      flexShrink: 0
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '3px',
                      left: twoFactorEnabled ? '27px' : '3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#fff',
                      transition: 'left 0.3s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <h4>Change Email</h4>
                    <p>Update your account email address</p>
                  </div>
                  <button className="btn-secondary" onClick={handleOpenEmailModal}>Change</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <h4>Change Password</h4>
                    <p>Update your account password</p>
                  </div>
                  <button className="btn-secondary" onClick={handleOpenPasswordModal}>Change</button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <h4>Login History</h4>
                    <p>View your recent login activity</p>
                  </div>
                  <button className="btn-secondary" onClick={handleViewLoginHistory}>View</button>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="profile-card">
            <div className="card-header">
              <h3 className="card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Recent Activity
              </h3>
            </div>
            <div className="card-content">
              <div className="activity-list">
                {activityLoading ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                    <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary, #6b7280)', fontSize: '0.85rem' }}>Loading activity...</p>
                  </div>
                ) : systemActivity.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary, #6b7280)' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 0.5rem', opacity: 0.4, display: 'block' }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <p style={{ fontSize: '0.9rem' }}>No recent activity yet.</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Activity will appear after your next login.</p>
                  </div>
                ) : (
                  systemActivity.map((activity, index) => (
                    <div className="activity-item" key={activity.id || index}>
                      <div className="activity-icon" style={{
                        color: activity.icon === 'login' ? '#10b981'
                          : activity.icon === 'lock' ? '#ef4444'
                          : activity.icon === 'camera' ? '#8b5cf6'
                          : '#3b82f6'
                      }}>
                        {activity.icon === 'login' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                          </svg>
                        )}
                        {activity.icon === 'edit' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        )}
                        {activity.icon === 'camera' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                          </svg>
                        )}
                        {activity.icon === 'lock' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                        )}
                      </div>
                      <div className="activity-content">
                        <p className="activity-text">{activity.title}</p>
                        <span className="activity-time">{activity.timeAgo}</span>
                      </div>
                    </div>
                  ))
                )}
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

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={handleClosePasswordModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button className="modal-close" onClick={handleClosePasswordModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="password-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.currentPassword ? "text" : "password"}
                      id="currentPassword"
                      className={`form-input ${passwordErrors.currentPassword ? 'error' : ''}`}
                      value={passwordForm.currentPassword}
                      onChange={(e) => handlePasswordFormChange('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('currentPassword')}
                      tabIndex={-1}
                    >
                      {showPasswords.currentPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <span className="error-message">{passwordErrors.currentPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.newPassword ? "text" : "password"}
                      id="newPassword"
                      className={`form-input ${passwordErrors.newPassword ? 'error' : ''}`}
                      value={passwordForm.newPassword}
                      onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
                      placeholder="Enter new password (min. 6 characters)"
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('newPassword')}
                      tabIndex={-1}
                    >
                      {showPasswords.newPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <span className="error-message">{passwordErrors.newPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPasswords.confirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      className={`form-input ${passwordErrors.confirmPassword ? 'error' : ''}`}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
                      placeholder="Re-enter new password"
                      disabled={isChangingPassword}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => togglePasswordVisibility('confirmPassword')}
                      tabIndex={-1}
                    >
                      {showPasswords.confirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <span className="error-message">{passwordErrors.confirmPassword}</span>
                  )}
                </div>

                <div className="password-requirements">
                  <p className="requirements-title">Password Requirements:</p>
                  <ul>
                    <li className={passwordForm.newPassword.length >= 6 ? 'valid' : ''}>
                      At least 6 characters
                    </li>
                    <li className={passwordForm.newPassword && passwordForm.newPassword !== passwordForm.currentPassword ? 'valid' : ''}>
                      Different from current password
                    </li>
                    <li className={passwordForm.newPassword && passwordForm.newPassword === passwordForm.confirmPassword ? 'valid' : ''}>
                      Passwords match
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={handleClosePasswordModal} 
                disabled={isChangingPassword}
              >
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleChangePassword} 
                disabled={isChangingPassword}
              >
                {isChangingPassword ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={handleCloseEmailModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Email Address</h3>
              <button className="modal-close" onClick={handleCloseEmailModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="password-form">
                <div style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-secondary, #f3f4f6)', fontSize: '0.85rem', color: 'var(--text-secondary, #6b7280)' }}>
                  Current email: <strong>{profileData.email}</strong>
                </div>

                <div className="form-group">
                  <label htmlFor="emailPassword">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showEmailPassword ? "text" : "password"}
                      id="emailPassword"
                      className={`form-input ${emailErrors.password ? 'error' : ''}`}
                      value={emailForm.password}
                      onChange={(e) => handleEmailFormChange('password', e.target.value)}
                      placeholder="Enter your current password"
                      disabled={isChangingEmail}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowEmailPassword(prev => !prev)}
                      tabIndex={-1}
                    >
                      {showEmailPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      )}
                    </button>
                  </div>
                  {emailErrors.password && (
                    <span className="error-message">{emailErrors.password}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="newEmail">New Email Address</label>
                  <input
                    type="email"
                    id="newEmail"
                    className={`form-input ${emailErrors.newEmail ? 'error' : ''}`}
                    value={emailForm.newEmail}
                    onChange={(e) => handleEmailFormChange('newEmail', e.target.value)}
                    placeholder="Enter new email address"
                    disabled={isChangingEmail}
                  />
                  {emailErrors.newEmail && (
                    <span className="error-message">{emailErrors.newEmail}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmEmail">Confirm New Email</label>
                  <input
                    type="email"
                    id="confirmEmail"
                    className={`form-input ${emailErrors.confirmEmail ? 'error' : ''}`}
                    value={emailForm.confirmEmail}
                    onChange={(e) => handleEmailFormChange('confirmEmail', e.target.value)}
                    placeholder="Re-enter new email address"
                    disabled={isChangingEmail}
                  />
                  {emailErrors.confirmEmail && (
                    <span className="error-message">{emailErrors.confirmEmail}</span>
                  )}
                </div>

                <div className="password-requirements">
                  <p className="requirements-title">Requirements:</p>
                  <ul>
                    <li className={emailForm.newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.newEmail) ? 'valid' : ''}>
                      Valid email format
                    </li>
                    <li className={emailForm.newEmail && emailForm.newEmail !== profileData.email ? 'valid' : ''}>
                      Different from current email
                    </li>
                    <li className={emailForm.newEmail && emailForm.newEmail === emailForm.confirmEmail ? 'valid' : ''}>
                      Email addresses match
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={handleCloseEmailModal}
                disabled={isChangingEmail}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleChangeEmail}
                disabled={isChangingEmail}
              >
                {isChangingEmail ? 'Changing Email...' : 'Change Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login History Modal */}
      {showLoginHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowLoginHistoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Login History</h3>
              <button className="modal-close" onClick={() => setShowLoginHistoryModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {loginHistoryLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary, #6b7280)' }}>Loading login history...</p>
                </div>
              ) : loginHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary, #6b7280)' }}>
                  <p>No login history recorded yet.</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>History will appear after your next login.</p>
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {loginHistory.map((entry, index) => {
                    const { browser, os } = parseBrowserInfo(entry.userAgent);
                    return (
                      <div
                        key={entry.id || index}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          padding: '0.85rem 0',
                          borderBottom: index < loginHistory.length - 1 ? '1px solid var(--border-color, #e5e7eb)' : 'none'
                        }}
                      >
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: index === 0 ? 'var(--primary-color, #2563eb)' : 'var(--bg-secondary, #f3f4f6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={index === 0 ? '#fff' : 'currentColor'} strokeWidth="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              {index === 0 ? 'Current Session' : 'Login'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #6b7280)', whiteSpace: 'nowrap' }}>
                              {formatLoginDate(entry.timestamp)}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary, #6b7280)', marginTop: '0.2rem' }}>
                            {browser} &middot; {os}
                          </div>
                          {entry.screenResolution && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary, #9ca3af)', marginTop: '0.15rem' }}>
                              Screen: {entry.screenResolution}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowLoginHistoryModal(false)}>
                Close
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

export default AdminProfile;