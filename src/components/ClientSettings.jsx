import React, { useState, useEffect } from 'react';
import './Settings.css';
import './shared.css';

const getInitialClientSettings = () => {
  const storedTheme = localStorage.getItem('dashboard-theme') || 'light';
  return {
    profile: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      profilePicture: null,
      accountCreated: '2024-01-15',
      lastLogin: '2024-08-06 09:30:00',
      totalVisitRequests: 15,
      approvedVisits: 12
    },
    visitPreferences: {
      preferredTimeSlots: ['09:00-11:00', '14:00-16:00'],
      autoFillBookingForms: true,
      saveFrequentInmates: true,
      defaultVisitDuration: 60,
      reminderBeforeVisit: 24,
      preferredNotificationMethod: 'email'
    },
    notificationSettings: {
      emailAlerts: true,
      inAppNotifications: true,
      smsNotifications: false,
      visitApprovalAlerts: true,
      visitRejectionAlerts: true,
      visitReminderAlerts: true,
      systemAnnouncementAlerts: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    },
    privacySecurity: {
      showActivityLog: true,
      allowDataSharing: false,
      twoFactorEnabled: false,
      loginNotifications: true,
      autoLogoutMinutes: 30,
      hidePersonalInfoFromStaff: false,
      dataRetentionPeriod: 365
    },
    appearance: {
      theme: storedTheme,
      language: 'english',
      fontSize: 'medium',
      compactMode: false,
      showAnimations: true,
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12-hour'
    }
  };
};

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
const InlineEditField = ({ value, onSave, type, options, label, isEditing, setIsEditing, isReadOnly }) => {
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
      <span className="setting-value readonly">
        {value || 'Not available'}
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="inline-edit-container">
        {type === 'select' ? (
          <select 
            value={tempValue} 
            onChange={(e) => setTempValue(e.target.value)}
            className="inline-select"
            autoFocus
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : type === 'number' ? (
          <input
            type="number"
            value={tempValue}
            onChange={(e) => setTempValue(parseInt(e.target.value) || 0)}
            className="inline-input"
            autoFocus
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        ) : type === 'time' ? (
          <input
            type="time"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="inline-input"
            autoFocus
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
        ) : (
          <input
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="inline-input"
            autoFocus
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
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
      className="editable-field" 
      onClick={() => setIsEditing(true)}
      title={`Click to edit ${label.toLowerCase()}`}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
    >
      <span className="field-value">
        {type === 'select' && options ? 
          options.find(opt => opt.value === value)?.label || value :
          value?.toString() || 'Not set'
        }
      </span>
      <span className="edit-indicator">✏️</span>
    </div>
  );
};

// Slide-out panel component
const SlideoutPanel = ({ isOpen, onClose, setting, onSave, getTimeSlotOptions }) => {
  const [tempValue, setTempValue] = useState(setting?.currentValue || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (setting) {
      setTempValue(setting.currentValue || '');
    }
  }, [setting]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      onSave(tempValue);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen || !setting) return null;

  return (
    <div 
      className="slideout-overlay" 
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="slideout-panel">
        <div className="slideout-header">
          <h3>Edit {setting.label}</h3>
          <button 
            className="slideout-close" 
            onClick={onClose}
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>
        
        <div className="slideout-content">
          <div className="form-group">
            <label className="form-label">{setting.label}</label>
            
            {setting.type === 'multiselect' ? (
              <div className="multiselect-container">
                {getTimeSlotOptions().map(slot => (
                  <label key={slot.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={Array.isArray(tempValue) ? tempValue.includes(slot.value) : false}
                      onChange={(e) => {
                        let currentSlots = Array.isArray(tempValue) ? [...tempValue] : [];
                        if (e.target.checked) {
                          currentSlots.push(slot.value);
                        } else {
                          currentSlots = currentSlots.filter(s => s !== slot.value);
                        }
                        setTempValue(currentSlots);
                      }}
                    />
                    <span className="checkbox-custom"></span>
                    {slot.label}
                  </label>
                ))}
              </div>
            ) : setting.type === 'file' ? (
              <div className="file-upload-container">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTempValue(e.target.files[0]?.name || '')}
                  className="form-input"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="file-upload-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Choose Profile Picture
                </label>
                {tempValue && (
                  <div className="file-preview">
                    Selected: {tempValue}
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="form-input"
                placeholder="Enter value..."
              />
            )}
          </div>
          
          <div className="slideout-actions">
            <button 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientSettings = () => {
  const [settings, setSettings] = useState(getInitialClientSettings);
  const [selectedCategory, setSelectedCategory] = useState('visitPreferences');
  const [slideoutSetting, setSlideoutSetting] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const categories = [
    { id: 'visitPreferences', name: 'Visit Preferences', icon: '📅' },
    { id: 'notificationSettings', name: 'Notifications', icon: '🔔' },
    { id: 'privacySecurity', name: 'Privacy & Security', icon: '🔒' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' }
  ];

  // Add to history for undo functionality
  const addToHistory = (previousSettings) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(previousSettings);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo function
  const undo = () => {
    if (historyIndex >= 0) {
      setSettings(history[historyIndex]);
      setHistoryIndex(historyIndex - 1);
      showToast('Changes undone', 'info');
    }
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  useEffect(() => {
    const handleStorage = () => {
      const storedTheme = localStorage.getItem('dashboard-theme');
      if (storedTheme && storedTheme !== settings.appearance.theme) {
        setSettings(prev => ({
          ...prev,
          appearance: {
            ...prev.appearance,
            theme: storedTheme
          }
        }));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [settings.appearance.theme]);

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

  const handleSettingChange = (category, key, value) => {
    const previousSettings = { ...settings };
    addToHistory(previousSettings);

    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    
    if (category === 'appearance' && key === 'theme') {
      localStorage.setItem('dashboard-theme', value);
      window.dispatchEvent(new Event('storage'));
    }

    showToast(`${getSettingLabel(key)} updated successfully`);
  };

  const openSlideout = (category, key, currentValue) => {
    setSlideoutSetting({
      category,
      key,
      currentValue,
      label: getSettingLabel(key),
      type: getSettingType(key, currentValue)
    });
  };

  const closeSlideout = () => {
    setSlideoutSetting(null);
  };

  const saveSlideoutSetting = (newValue) => {
    if (slideoutSetting) {
      handleSettingChange(slideoutSetting.category, slideoutSetting.key, newValue);
    }
  };

  const getSettingLabel = (key) => {
    const labels = {
      // Profile
      name: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      profilePicture: 'Profile Picture',
      accountCreated: 'Account Created',
      lastLogin: 'Last Login',
      totalVisitRequests: 'Total Visit Requests',
      approvedVisits: 'Approved Visits',
      
      // Visit Preferences
      preferredTimeSlots: 'Preferred Time Slots',
      autoFillBookingForms: 'Auto-Fill Booking Forms',
      saveFrequentInmates: 'Save Frequent Inmate Info',
      defaultVisitDuration: 'Default Visit Duration (minutes)',
      reminderBeforeVisit: 'Reminder Before Visit (hours)',
      preferredNotificationMethod: 'Preferred Notification Method',
      
      // Notification Settings
      emailAlerts: 'Email Alerts',
      inAppNotifications: 'In-App Notifications',
      smsNotifications: 'SMS Notifications',
      visitApprovalAlerts: 'Visit Approval Alerts',
      visitRejectionAlerts: 'Visit Rejection Alerts',
      visitReminderAlerts: 'Visit Reminder Alerts',
      systemAnnouncementAlerts: 'System Announcement Alerts',
      quietHoursEnabled: 'Quiet Hours Enabled',
      quietHoursStart: 'Quiet Hours Start',
      quietHoursEnd: 'Quiet Hours End',
      
      // Privacy & Security
      showActivityLog: 'Show Activity Log',
      allowDataSharing: 'Allow Data Sharing',
      twoFactorEnabled: 'Two-Factor Authentication',
      loginNotifications: 'Login Notifications',
      autoLogoutMinutes: 'Auto Logout (minutes)',
      hidePersonalInfoFromStaff: 'Hide Personal Info from Staff',
      dataRetentionPeriod: 'Data Retention Period (days)',
      
      // Appearance
      theme: 'Theme',
      language: 'Language',
      fontSize: 'Font Size',
      compactMode: 'Compact Mode',
      showAnimations: 'Show Animations',
      dateFormat: 'Date Format',
      timeFormat: 'Time Format'
    };
    return labels[key] || key;
  };

  const getSettingType = (key, value) => {
    if (typeof value === 'boolean') return 'toggle';
    if (typeof value === 'number') return 'number';
    if (key === 'preferredNotificationMethod' || key === 'theme' || key === 'language' || 
        key === 'fontSize' || key === 'dateFormat' || key === 'timeFormat') return 'select';
    if (key === 'preferredTimeSlots') return 'multiselect';
    if (key === 'quietHoursStart' || key === 'quietHoursEnd') return 'time';
    if (key === 'accountCreated' || key === 'lastLogin' || key === 'totalVisitRequests' || key === 'approvedVisits') return 'readonly';
    if (key === 'profilePicture') return 'file';
    return 'text';
  };

  const getSelectOptions = (key) => {
    const options = {
      preferredNotificationMethod: [
        { value: 'email', label: 'Email' },
        { value: 'sms', label: 'SMS' },
        { value: 'both', label: 'Both Email & SMS' },
        { value: 'app', label: 'In-App Only' }
      ],
      theme: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'auto', label: 'Auto' }
      ],
      language: [
        { value: 'english', label: 'English' },
        { value: 'spanish', label: 'Spanish' },
        { value: 'french', label: 'French' }
      ],
      fontSize: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' }
      ],
      dateFormat: [
        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
      ],
      timeFormat: [
        { value: '12-hour', label: '12-hour (AM/PM)' },
        { value: '24-hour', label: '24-hour' }
      ]
    };
    return options[key] || [];
  };

  const getTimeSlotOptions = () => [
    { value: '09:00-11:00', label: '9:00 AM - 11:00 AM' },
    { value: '11:00-13:00', label: '11:00 AM - 1:00 PM' },
    { value: '14:00-16:00', label: '2:00 PM - 4:00 PM' },
    { value: '16:00-18:00', label: '4:00 PM - 6:00 PM' }
  ];

  // Determine if setting should use slideout (complex) or inline editing
  const isComplexSetting = (key, value) => {
    const type = getSettingType(key, value);
    return ['multiselect', 'file'].includes(type);
  };

  const isReadOnly = (key) => {
    const readOnlyFields = ['accountCreated', 'lastLogin', 'totalVisitRequests', 'approvedVisits'];
    return readOnlyFields.includes(key);
  };

  return (
    <div className="settings-page">
      <div className="modern-records-header">
        <div className="modern-records-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Client Settings
        </div>
        <div className="header-actions">
          {historyIndex >= 0 && (
            <button 
              className="undo-btn"
              onClick={undo}
              title="Undo last change (Ctrl+Z)"
            >
              ↶ Undo
            </button>
          )}
          <div className="client-badge">
            👤 Client Account
          </div>
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <div className="sidebar-title">Settings Categories</div>
          
          <div className="category-list">
            {categories.map(category => (
              <div
                key={category.id}
                className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="category-icon">{category.icon}</div>
                <div className="category-info">
                  <div className="category-name">{category.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-main">
          <div className="settings-header">
            <h2 className="settings-title">
              {categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <p className="settings-description">
              Click on any value to edit it directly, or use complex controls for advanced settings.
            </p>
          </div>
          
          <div className="settings-grid">
            {Object.entries(settings[selectedCategory])
              .filter(([key]) =>
                selectedCategory !== 'appearance' || (key !== 'theme' && key !== 'language')
              )
              .map(([key, value]) => (
                <div key={key} className={`setting-item modern ${isReadOnly(key) ? 'readonly' : ''}`}>
                  <div className="setting-info">
                    <div className="setting-label">{getSettingLabel(key)}</div>
                    <div className="setting-description">
                      {getSettingType(key, value) === 'toggle' 
                        ? `Currently ${value ? 'enabled' : 'disabled'}`
                        : getSettingType(key, value) === 'readonly'
                        ? 'Read-only information'
                        : 'Click to edit'
                      }
                    </div>
                  </div>
                  <div className="setting-controls">
                    {getSettingType(key, value) === 'toggle' ? (
                      <button
                        className={`modern-toggle ${value ? 'active' : ''}`}
                        onClick={() => handleSettingChange(selectedCategory, key, !value)}
                      >
                        <div className="toggle-slider"></div>
                        <span className="toggle-label">{value ? 'ON' : 'OFF'}</span>
                      </button>
                    ) : isComplexSetting(key, value) ? (
                      <div className="complex-setting">
                        <div className="complex-value">
                          {Array.isArray(value) ? value.join(', ') : 
                           key === 'profilePicture' ? (value ? 'Image uploaded' : 'No image') :
                           value?.toString() || 'Not set'}
                        </div>
                        <button
                          className="complex-edit-btn"
                          onClick={() => openSlideout(selectedCategory, key, value)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Edit
                        </button>
                      </div>
                    ) : (
                      <InlineEditField
                        value={value}
                        onSave={(newValue) => handleSettingChange(selectedCategory, key, newValue)}
                        type={getSettingType(key, value)}
                        options={getSelectOptions(key)}
                        label={getSettingLabel(key)}
                        isEditing={editingField === `${selectedCategory}.${key}`}
                        setIsEditing={(editing) => 
                          setEditingField(editing ? `${selectedCategory}.${key}` : null)
                        }
                        isReadOnly={isReadOnly(key)}
                      />
                    )}
                  </div>
                </div>
              ))}
          </div>

          {selectedCategory === 'privacySecurity' && (
            <div className="security-actions">
              <h3>Security Actions</h3>
              <div className="action-buttons">
                <button className="action-btn danger">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1 2-2h4a2,2 0 0,1 2,2v2"></path>
                  </svg>
                  Request Account Deletion
                </button>
                <button className="action-btn secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                  </svg>
                  Download My Data
                </button>
                <button className="action-btn secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"></path>
                    <circle cx="12" cy="12" r="9"></circle>
                  </svg>
                  View Activity Log
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <SlideoutPanel
        isOpen={!!slideoutSetting}
        onClose={closeSlideout}
        setting={slideoutSetting}
        onSave={saveSlideoutSetting}
        getTimeSlotOptions={getTimeSlotOptions}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
};

export default ClientSettings;