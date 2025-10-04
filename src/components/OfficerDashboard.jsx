import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import firebaseService from '../firebase-services.js';
import VisitRequests from './VisitRequests';
import Scan from './Scan';
import Records from './Records';
import LogTrails from './LogTrails';
import AdminProfile from './AdminProfile.jsx';
import './AdminDashboard.css'; // Reuse admin styles for now

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState('light');
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    approved: 0,
    pending: 0,
    rescheduled: 0,
    rejected: 0,
    total: 0
  });

  // Load user data and dashboard stats
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        const [stats, currentUser] = await Promise.all([
          firebaseService.getDashboardStats(),
          firebaseService.getCurrentUser()
        ]);
        
        setCurrentUser(currentUser);
        
        // Load user profile data
        if (currentUser) {
          const userData = await firebaseService.getUserData(currentUser.uid);
          if (userData) {
            console.log('🔍 DEBUG: Officer profile data:', userData);
            const constructedName = userData.name || (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : null);
            console.log('🔍 DEBUG: Constructed officer name:', `"${constructedName}"`);
            
            setUserProfile({
              ...userData,
              profilePicture: userData.profilePicture || "/image/Logo.png"
            });
          } else {
            setUserProfile({
              profilePicture: "/image/Logo.png"
            });
          }
        }
        
        setDashboardStats(stats);
        
      } catch (error) {
        console.error('Error loading officer dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Theme management
  useEffect(() => {
    const storedTheme = localStorage.getItem('dashboard-theme');
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.setAttribute('data-theme', storedTheme);
    } else {
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleSignOut = async () => {
    try {
      console.log('Sign out successful');
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
      alert('Sign out failed: ' + error.message);
    }
  };

  const toggleAvatarDropdown = () => {
    setShowAvatarDropdown(!showAvatarDropdown);
    setShowBellDropdown(false);
  };

  const toggleBellDropdown = (e) => {
    e.stopPropagation();
    setShowBellDropdown(!showBellDropdown);
    setShowAvatarDropdown(false);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNavigation = (page) => {
    navigate(`/officer/${page}`);
  };

  const updateProfilePicture = (newProfilePictureUrl) => {
    setUserProfile(prev => ({
      ...prev,
      profilePicture: newProfilePictureUrl
    }));
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('/visit')) return 'visit';
    if (path.includes('/scan')) return 'scan';
    if (path.includes('/records')) return 'records';
    if (path.includes('/log')) return 'log';
    if (path.includes('/profile')) return 'profile';
    return 'dashboard';
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const profileDropdown = document.querySelector('.profile-dropdown');
      const profileBtn = document.querySelector('.profile-btn');
      const notificationDropdown = document.querySelector('.notification-dropdown');
      const notificationBtn = document.querySelector('.notification-btn');

      if (showAvatarDropdown && 
          profileDropdown && 
          !profileDropdown.contains(event.target) && 
          profileBtn && 
          !profileBtn.contains(event.target)) {
        setShowAvatarDropdown(false);
      }

      if (showBellDropdown && 
          notificationDropdown && 
          !notificationDropdown.contains(event.target) && 
          notificationBtn && 
          !notificationBtn.contains(event.target)) {
        setShowBellDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showAvatarDropdown, showBellDropdown]);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className={`dashboard-header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="header-left">
          <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
          </button>
          <div className="header-title">
            <h1>Officer Dashboard</h1>
            <p>Bureau of Corrections Officer Portal</p>
          </div>
        </div>
        
        <div className="header-right">
          {/* Notifications */}
          <div className="notification-wrapper">
            <button className="notification-btn" onClick={toggleBellDropdown}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </button>
            
            <div className={`notification-dropdown ${showBellDropdown ? 'show' : ''}`}>
              <div className="dropdown-header">
                <h3>Notifications</h3>
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="empty-notifications">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <p>No new notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="notification-item">
                      <div className="notification-content">
                        <p className="notification-title">{notification.title}</p>
                        <p className="notification-message">{notification.message}</p>
                        <span className="notification-time">
                          {notification.createdAt?.toDate
                            ? notification.createdAt.toDate().toLocaleDateString()
                            : "Recently"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="user-profile">
            <button className="profile-btn" onClick={toggleAvatarDropdown}>
              <img 
                src={userProfile?.profilePicture || "/image/Logo.png"} 
                alt="Officer Avatar" 
                className="profile-avatar" 
              />
            </button>
            
            <div className={`profile-dropdown ${showAvatarDropdown ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="dropdown-item" onClick={() => handleNavigation('profile')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                View Profile
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item logout" onClick={handleSignOut}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16,17 21,12 16,7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/image/Logo.png" alt="Bureau of Corrections Logo" className="sidebar-logo" />
            <div className="logo-text">
              <h2 className="logo-title">Bureau of</h2>
              <h2 className="logo-subtitle">Corrections</h2>
            </div>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3 className="nav-title">Main Menu</h3>
            <ul className="nav-list">
              <li className={`nav-item ${getCurrentPage() === 'dashboard' ? 'active' : ''}`}>
                <button 
                  className="nav-link"
                  onClick={() => handleNavigation('dashboard')}
                  title="Dashboard"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span className="nav-text">Dashboard</span>
                </button>
              </li>
              <li className={`nav-item ${getCurrentPage() === 'visit' ? 'active' : ''}`}>
                <button 
                  className="nav-link"
                  onClick={() => handleNavigation('visit')}
                  title="Visit Requests"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                  </svg>
                  <span className="nav-text">Visit Requests</span>
                </button>
              </li>
              <li className={`nav-item ${getCurrentPage() === 'scan' ? 'active' : ''}`}>
                <button 
                  className="nav-link"
                  onClick={() => handleNavigation('scan')}
                  title="Scan"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 1h6v6H1z"></path>
                    <path d="M17 1h6v6h-6z"></path>
                    <path d="M1 17h6v6H1z"></path>
                    <path d="M17 17h6v6h-6z"></path>
                  </svg>
                  <span className="nav-text">Scan</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="nav-section">
            <h3 className="nav-title">Management</h3>
            <ul className="nav-list">
              <li className={`nav-item ${getCurrentPage() === 'records' ? 'active' : ''}`}>
                <button 
                  className="nav-link"
                  onClick={() => handleNavigation('records')}
                  title="Records"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                  </svg>
                  <span className="nav-text">Records</span>
                </button>
              </li>
              <li className={`nav-item ${getCurrentPage() === 'log' ? 'active' : ''}`}>
                <button 
                  className="nav-link"
                  onClick={() => handleNavigation('log')}
                  title="Log Trails"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <line x1="10" y1="9" x2="9" y2="9"></line>
                    <line x1="8" y1="9" x2="7" y2="9"></line>
                  </svg>
                  <span className="nav-text">Log Trails</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Routes>
          <Route path="/dashboard" element={
            <div className="modern-records-header">
              <div className="modern-records-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 1h6v6H1z"></path>
                  <path d="M17 1h6v6h-6z"></path>
                  <path d="M1 17h6v6H1z"></path>
                  <path d="M17 17h6v6h-6z"></path>
                </svg>
                Welcome back, Officer! 👮‍♂️
              </div>
              
              {/* Officer Stats */}
              <section className="modern-stats-section">
                <div className="modern-stats-grid">
                  <div className="modern-stat-card approved">
                    <div className="modern-stat-header">
                      <div className="modern-stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                      </div>
                    </div>
                    <div className="modern-stat-content">
                      <div className="modern-stat-value">{dashboardStats.approved}</div>
                      <div className="modern-stat-label">Processed</div>
                    </div>
                  </div>

                  <div className="modern-stat-card pending">
                    <div className="modern-stat-header">
                      <div className="modern-stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12,6 12,12 16,14"></polyline>
                        </svg>
                      </div>
                    </div>
                    <div className="modern-stat-content">
                      <div className="modern-stat-value">{dashboardStats.pending}</div>
                      <div className="modern-stat-label">Pending Review</div>
                    </div>
                  </div>

                  <div className="modern-stat-card reschedule">
                    <div className="modern-stat-header">
                      <div className="modern-stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14,2 14,8 20,8"></polyline>
                        </svg>
                      </div>
                    </div>
                    <div className="modern-stat-content">
                      <div className="modern-stat-value">{dashboardStats.total}</div>
                      <div className="modern-stat-label">Total Requests</div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          } />
          
          <Route path="/visit" element={<VisitRequests currentOfficer={userProfile?.name || (userProfile?.firstName && userProfile?.lastName ? `${userProfile.firstName} ${userProfile.lastName}` : null)} />} />
          <Route path="/visit/:requestId" element={<VisitRequests currentOfficer={userProfile?.name || (userProfile?.firstName && userProfile?.lastName ? `${userProfile.firstName} ${userProfile.lastName}` : null)} />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/records" element={<Records />} />
          <Route path="/log" element={<LogTrails officerFilter={userProfile?.name || (userProfile?.firstName && userProfile?.lastName ? `${userProfile.firstName} ${userProfile.lastName}` : null)} />} />
          <Route path="/profile" element={<AdminProfile onProfilePictureUpdate={updateProfilePicture} />} />
          <Route path="/" element={<Navigate to="/officer/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default OfficerDashboard;