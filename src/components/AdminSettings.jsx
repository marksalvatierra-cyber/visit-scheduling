import React, { useState, useEffect } from 'react';
import './Settings.css';
import './shared.css';

const getInitialAdminSettings = () => {
  const storedTheme = localStorage.getItem('dashboard-theme') || 'light';
  return {
    visitConfiguration: {
      visitDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      visitStartTime: '09:00',
      visitEndTime: '17:00',
      maxVisitsPerInmate: 2,
      maxVisitsPerDay: 50,
      bookingWindowDays: 7,
      allowWalkIns: false,
      visitDuration: 60
    },
    qrCodeSettings: {
      expiryTimeMinutes: 15,
      allowMultiUse: false,
      autoRefresh: true,
      securityLevel: 'high'
    },
    notifications: {
      emailNotifications: true,
      inAppNotifications: true,
      notificationRetentionDays: 30,
      silentHoursStart: '22:00',
      silentHoursEnd: '08:00'
    },
    appearance: {
      theme: storedTheme,
      primaryColor: '#205375',
      fontSize: 'medium',
      compactMode: false,
      showAnimations: true
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
const InlineEditField = ({ value, onSave, type, options, label, isEditing, setIsEditing }) => {
  const [tempValue, setTempValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = async () => {
    if (tempValue === value) {
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
const SlideoutPanel = ({ isOpen, onClose, setting, onSave, getDaysOptions }) => {
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
                {getDaysOptions().map(day => (
                  <label key={day.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={Array.isArray(tempValue) ? tempValue.includes(day.value) : false}
                      onChange={(e) => {
                        let currentDays = Array.isArray(tempValue) ? [...tempValue] : [];
                        if (e.target.checked) {
                          currentDays.push(day.value);
                        } else {
                          currentDays = currentDays.filter(d => d !== day.value);
                        }
                        setTempValue(currentDays);
                      }}
                    />
                    <span className="checkbox-custom"></span>
                    {day.label}
                  </label>
                ))}
              </div>
            ) : setting.type === 'color' ? (
              <div className="color-input-group">
                <div className="color-preview" style={{ backgroundColor: tempValue }}>
                  <input
                    type="color"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="color-picker"
                  />
                </div>
                <input
                  type="text"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="color-text-input"
                  placeholder="#000000"
                />
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

const AdminSettings = () => {
  const [settings, setSettings] = useState(getInitialAdminSettings);
  const [selectedCategory, setSelectedCategory] = useState('visitConfiguration');
  const [slideoutSetting, setSlideoutSetting] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const categories = [
    { id: 'visitConfiguration', name: 'Visit Configuration', icon: '📅' },
    { id: 'qrCodeSettings', name: 'QR Code Settings', icon: '📱' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
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

  // Reset to defaults
  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      const previousSettings = { ...settings };
      addToHistory(previousSettings);
      setSettings(getInitialAdminSettings());
      showToast('Settings reset to defaults', 'success');
    }
  };

  // Reset category to defaults
  const resetCategory = () => {
    if (window.confirm(`Reset ${categories.find(c => c.id === selectedCategory)?.name} to defaults?`)) {
      const previousSettings = { ...settings };
      addToHistory(previousSettings);
      const defaultSettings = getInitialAdminSettings();
      setSettings(prev => ({
        ...prev,
        [selectedCategory]: defaultSettings[selectedCategory]
      }));
      showToast('Category reset to defaults', 'success');
    }
  };

  // Export settings as JSON
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Settings exported successfully', 'success');
  };

  // Import settings from JSON
  const importSettings = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result);
          const previousSettings = { ...settings };
          addToHistory(previousSettings);
          setSettings(importedSettings);
          showToast('Settings imported successfully', 'success');
        } catch (error) {
          showToast('Invalid settings file', 'error');
        }
      };
      reader.readAsText(file);
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
      // Visit Configuration
      visitDays: 'Available Visit Days',
      visitStartTime: 'Visit Start Time',
      visitEndTime: 'Visit End Time',
      maxVisitsPerInmate: 'Max Visits Per Inmate',
      maxVisitsPerDay: 'Max Visits Per Day',
      bookingWindowDays: 'Booking Window (days)',
      allowWalkIns: 'Allow Walk-in Visits',
      visitDuration: 'Visit Duration (minutes)',
      
      // QR Code Settings
      expiryTimeMinutes: 'QR Code Expiry (minutes)',
      allowMultiUse: 'Allow Multi-Use QR Codes',
      autoRefresh: 'Auto-Refresh QR Codes',
      securityLevel: 'Security Level',
      
      // Notifications
      emailNotifications: 'Email Notifications',
      inAppNotifications: 'In-App Notifications',
      notificationRetentionDays: 'Notification Retention (days)',
      silentHoursStart: 'Silent Hours Start',
      silentHoursEnd: 'Silent Hours End',
      
      // Appearance
      theme: 'Theme',
      primaryColor: 'Primary Color',
      fontSize: 'Font Size',
      compactMode: 'Compact Mode',
      showAnimations: 'Show Animations'
    };
    return labels[key] || key;
  };

  const getSettingType = (key, value) => {
    if (typeof value === 'boolean') return 'toggle';
    if (typeof value === 'number') return 'number';
    if (key === 'securityLevel' || key === 'theme' || key === 'fontSize') return 'select';
    if (key === 'visitDays') return 'multiselect';
    if (key === 'primaryColor') return 'color';
    if (key === 'visitStartTime' || key === 'visitEndTime' || 
        key === 'silentHoursStart' || key === 'silentHoursEnd') return 'time';
    return 'text';
  };

  const getSelectOptions = (key) => {
    const options = {
      securityLevel: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
      ],
      theme: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'auto', label: 'Auto' }
      ],
      fontSize: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' }
      ]
    };
    return options[key] || [];
  };

  const getDaysOptions = () => [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  // Determine if setting should use slideout (complex) or inline editing
  const isComplexSetting = (key, value) => {
    const type = getSettingType(key, value);
    return ['multiselect', 'color', 'textarea'].includes(type);
  };

  return (
    <div className="settings-page">
      <div className="modern-records-header">
        <div className="modern-records-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Admin Settings
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
          <button 
            className="action-btn secondary"
            onClick={exportSettings}
            title="Export settings as JSON"
          >
            📥 Export
          </button>
          <label className="action-btn secondary" title="Import settings from JSON">
            📤 Import
            <input
              type="file"
              accept=".json"
              onChange={importSettings}
              style={{ display: 'none' }}
            />
          </label>
          <button 
            className="action-btn danger"
            onClick={resetToDefaults}
            title="Reset all settings to defaults"
          >
            🔄 Reset All
          </button>
          <div className="admin-badge">
            🔐 Administrator
          </div>
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <div className="sidebar-title">Admin Categories</div>
          
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
            <div>
              <h2 className="settings-title">
                {categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <p className="settings-description">
                Click on any value to edit it directly, or use complex controls for advanced settings.
              </p>
            </div>
            <button 
              className="action-btn secondary"
              onClick={resetCategory}
              title="Reset this category to defaults"
            >
              🔄 Reset Category
            </button>
          </div>
          
          <div className="settings-grid">
            {settings[selectedCategory] && Object.entries(settings[selectedCategory]).map(([key, value]) => (
              <div key={key} className="setting-item modern">
                  <div className="setting-info">
                    <div className="setting-label">{getSettingLabel(key)}</div>
                    <div className="setting-description">
                      {getSettingType(key, value) === 'toggle' 
                        ? `Currently ${value ? 'enabled' : 'disabled'}`
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
                           key === 'primaryColor' ? (
                            <div className="color-preview-small" style={{ backgroundColor: value }}>
                              {value}
                            </div>
                           ) : value?.toString() || 'Not set'}
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
                      />
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <SlideoutPanel
        isOpen={!!slideoutSetting}
        onClose={closeSlideout}
        setting={slideoutSetting}
        onSave={saveSlideoutSetting}
        getDaysOptions={getDaysOptions}
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

export default AdminSettings;