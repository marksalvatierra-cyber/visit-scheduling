import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import firebaseService from '../firebase-services.js';
import VisitRequests from './VisitRequests';
import Scan from './Scan';
import Records from './Records';
import LogTrails from './LogTrails';
import OfficerProfile from './OfficerProfile.jsx';
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
    cancelled: 0,
    total: 0
  });

  // Load officer-specific dashboard stats
  const loadOfficerDashboardStats = async (officerName) => {
    try {
      // Get all visit requests
      const allRequests = await firebaseService.getVisitRequests();
      
      console.log('📊 All requests loaded:', allRequests.length);
      console.log('👮 Filtering for officer:', officerName);
      
      // Filter requests processed by this officer or assigned to them
      const officerRequests = allRequests.filter(req => {
        const isOfficerRequest = req.reviewedBy === officerName || 
          req.processedBy === officerName || 
          req.handledBy === officerName ||
          req.officerName === officerName ||
          req.assignedOfficer === officerName;
        
        if (isOfficerRequest) {
          console.log('🎯 Found officer request:', {
            id: req.id,
            status: req.status,
            reviewedBy: req.reviewedBy,
            processedBy: req.processedBy,
            clientName: req.clientName
          });
        }
        
        return isOfficerRequest;
      });
      
      console.log('📋 Officer requests found:', officerRequests.length);
      
      // Calculate officer-specific statistics
      const approved = officerRequests.filter(req => req.status === 'approved').length;
      const pending = officerRequests.filter(req => req.status === 'pending').length;
      const rescheduled = officerRequests.filter(req => req.status === 'rescheduled' || req.status === 'reschedule').length;
      const rejected = officerRequests.filter(req => req.status === 'rejected').length;
      const cancelled = officerRequests.filter(req => req.status === 'cancelled').length;
      const total = officerRequests.length;
      
      console.log('🔍 Officer dashboard stats:', { approved, pending, rescheduled, rejected, cancelled, total });
      
      return { approved, pending, rescheduled, rejected, cancelled, total };
    } catch (error) {
      console.error('Error loading officer dashboard stats:', error);
      // Return default stats on error
      return { approved: 0, pending: 0, rescheduled: 0, rejected: 0, cancelled: 0, total: 0 };
    }
  };

  // Function to refresh dashboard stats
  const refreshDashboardStats = async () => {
    if (userProfile) {
      const constructedName = userProfile.name || 
        (userProfile.firstName && userProfile.lastName ? `${userProfile.firstName} ${userProfile.lastName}` : null);
      
      if (constructedName) {
        console.log('🔄 Refreshing officer dashboard stats for:', constructedName);
        const officerStats = await loadOfficerDashboardStats(constructedName);
        setDashboardStats(officerStats);
        console.log('✅ Dashboard stats refreshed:', officerStats);
      }
    }
  };

  // Load user data and dashboard stats
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        const currentUser = await firebaseService.getCurrentUser();
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
            
            // Load officer-specific dashboard stats
            if (constructedName) {
              const officerStats = await loadOfficerDashboardStats(constructedName);
              setDashboardStats(officerStats);
            }
          } else {
            setUserProfile({
              profilePicture: "/image/Logo.png"
            });
          }
        }
        
      } catch (error) {
        console.error('Error loading officer dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Auto-refresh dashboard stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshDashboardStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [userProfile]);

  // Listen for page focus to refresh stats
  useEffect(() => {
    const handleFocus = () => {
      refreshDashboardStats();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userProfile]);

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

  // Listen to admin notifications (officers receive admin notifications)
  useEffect(() => {
    const unsubscribe = firebaseService.listenToAdminNotifications((newNotifications) => {
      setNotifications(newNotifications);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

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
            <h1>Admin Dashboard</h1>
            <p>Central Prison Camp Sablayan Penal Farm Admin Portal</p>
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
            <img src="/image/12.png" alt="Central Prison Camp Sablayan Penal Farm Logo" className="sidebar-logo" />
            <div className="logo-text">
              <h2 className="logo-title">Central Prison Camp</h2>
              <h2 className="logo-subtitle">Sablayan</h2>
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
            <>
              {/* Modern Welcome Section */}
              <div className="modern-records-header">
                <div className="modern-records-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 1h6v6H1z"></path>
                    <path d="M17 1h6v6h-6z"></path>
                    <path d="M1 17h6v6H1z"></path>
                    <path d="M17 17h6v6h-6z"></path>
                  </svg>
                  Welcome back, Admin! 👮‍♂️
                </div>
                <button 
                  onClick={refreshDashboardStats}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    border: '2px solid #10b981',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    background: 'white',
                    color: '#10b981',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#f0fdf4';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'white';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6"></path>
                    <path d="M1 20v-6h6"></path>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                  </svg>
                  Refresh Stats
                </button>
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
                      <div className="modern-stat-status">
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#10b981'
                        }}></div>
                      </div>
                    </div>
                    <div className="modern-stat-content">
                      <div className="modern-stat-value">{dashboardStats.approved}</div>
                      <div className="modern-stat-label">Approved</div>
                      <div className="modern-stat-change positive">+12% from last month</div>
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
                      <div className="modern-stat-status">
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#f59e0b'
                        }}></div>
                      </div>
                    </div>
                    <div className="modern-stat-content">
                      <div className="modern-stat-value">{dashboardStats.pending}</div>
                      <div className="modern-stat-label">Pending Review</div>
                      <div className="modern-stat-change neutral">Requires attention</div>
                    </div>
                  </div>

                  <div className="modern-stat-card reschedule">
                    <div className="modern-stat-header">
                      <div className="modern-stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </div>
                      <div className="modern-stat-status">
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#8b5cf6'
                        }}></div>
                      </div>
                    </div>
                    <div className="modern-stat-content">
                      <div className="modern-stat-value">{dashboardStats.rescheduled}</div>
                      <div className="modern-stat-label">Rescheduled</div>
                      <div className="modern-stat-change negative">-3% from last month</div>
                    </div>
                  </div>

                  <div className="modern-stat-card rejected">
                    <div className="modern-stat-header">
                      <div className="modern-stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </div>
                      <div className="modern-stat-status">
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#ef4444'
                        }}></div>
                      </div>
                    </div>
                    <div className="modern-stat-content">
                      <div className="modern-stat-value">{dashboardStats.rejected}</div>
                      <div className="modern-stat-label">Rejected</div>
                      <div className="modern-stat-change negative">+8% from last month</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Officer Quick Actions Section */}
              <section className="modern-activity-section">
                <div className="modern-activity-header">
                  <div className="modern-activity-title">
                    <h2>Quick Actions</h2>
                    <p>Frequently used officer tools and shortcuts</p>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(4, 1fr)', 
                  gap: '16px' 
                }}>
                  <div className="modern-chart-card" style={{ cursor: 'pointer' }} onClick={() => handleNavigation('visit')}>
                    <div className="modern-chart-header">
                      <div className="modern-chart-title">
                        <div className="modern-chart-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                          </svg>
                        </div>
                        <div className="modern-chart-info">
                          <h3>Review Visit Requests</h3>
                          <p>Process pending visit applications</p>
                        </div>
                      </div>
                    </div>
                    <div className="modern-chart-container" style={{ 
                      height: '1px'
                    }}>
                    </div>
                  </div>

                  <div className="modern-chart-card" style={{ cursor: 'pointer' }} onClick={() => handleNavigation('scan')}>
                    <div className="modern-chart-header">
                      <div className="modern-chart-title">
                        <div className="modern-chart-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 1h6v6H1z"></path>
                            <path d="M17 1h6v6h-6z"></path>
                            <path d="M1 17h6v6H1z"></path>
                            <path d="M17 17h6v6h-6z"></path>
                          </svg>
                        </div>
                        <div className="modern-chart-info">
                          <h3>Scan Visitor ID</h3>
                          <p>Verify visitor identification</p>
                        </div>
                      </div>
                    </div>
                    <div className="modern-chart-container" style={{ 
                      height: '1px'
                    }}>
                    </div>
                  </div>

                  <div className="modern-chart-card" style={{ cursor: 'pointer' }} onClick={() => handleNavigation('records')}>
                    <div className="modern-chart-header">
                      <div className="modern-chart-title">
                        <div className="modern-chart-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                          </svg>
                        </div>
                        <div className="modern-chart-info">
                          <h3>View Records</h3>
                          <p>Access inmate and visit records</p>
                        </div>
                      </div>
                    </div>
                    <div className="modern-chart-container" style={{ 
                      height: '1px'
                    }}>
                    </div>
                  </div>

                  <div className="modern-chart-card" style={{ cursor: 'pointer' }} onClick={() => handleNavigation('log')}>
                    <div className="modern-chart-header">
                      <div className="modern-chart-title">
                        <div className="modern-chart-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14,2 14,8 20,8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <line x1="10" y1="9" x2="9" y2="9"></line>
                            <line x1="8" y1="9" x2="7" y2="9"></line>
                          </svg>
                        </div>
                        <div className="modern-chart-info">
                          <h3>Activity Logs</h3>
                          <p>Review system activity trails</p>
                        </div>
                      </div>
                    </div>
                    <div className="modern-chart-container" style={{ 
                      height: '1px'
                    }}>
                    </div>
                  </div>
                </div>
              </section>

              {/* Officer Recent Activity */}
              <section className="modern-activity-section">
                <div className="modern-activity-header">
                  <div className="modern-activity-title">
                    <h2>Recent Activity</h2>
                    <p>Your latest actions and system updates</p>
                  </div>
                </div>
                
                <div className="modern-activity-list">
                  <div className="modern-activity-item">
                    <div className="modern-activity-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"></polyline>
                      </svg>
                    </div>
                    <div className="modern-activity-content">
                      <div className="modern-activity-title">Approved Visit Request</div>
                      <div className="modern-activity-description">Approved visit for Inmate #12345 - Maria Santos</div>
                      <div className="modern-activity-time">2 hours ago</div>
                    </div>
                    <div className="modern-activity-status">
                      <span className="status-badge approved">Approved</span>
                    </div>
                  </div>

                  <div className="modern-activity-item">
                    <div className="modern-activity-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 1h6v6H1z"></path>
                        <path d="M17 1h6v6h-6z"></path>
                        <path d="M1 17h6v6H1z"></path>
                        <path d="M17 17h6v6h-6z"></path>
                      </svg>
                    </div>
                    <div className="modern-activity-content">
                      <div className="modern-activity-title">Visitor ID Scanned</div>
                      <div className="modern-activity-description">Verified visitor identification - John Doe</div>
                      <div className="modern-activity-time">3 hours ago</div>
                    </div>
                    <div className="modern-activity-status">
                      <span className="status-badge approved">Verified</span>
                    </div>
                  </div>

                  <div className="modern-activity-item">
                    <div className="modern-activity-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                      </svg>
                    </div>
                    <div className="modern-activity-content">
                      <div className="modern-activity-title">Record Updated</div>
                      <div className="modern-activity-description">Updated visit log for Inmate #98765</div>
                      <div className="modern-activity-time">5 hours ago</div>
                    </div>
                    <div className="modern-activity-status">
                      <span className="status-badge rescheduled">Updated</span>
                    </div>
                  </div>

                  <div className="modern-activity-item">
                    <div className="modern-activity-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                    <div className="modern-activity-content">
                      <div className="modern-activity-title">Visit Request Rejected</div>
                      <div className="modern-activity-description">Rejected visit for Inmate #54321 - Invalid documentation</div>
                      <div className="modern-activity-time">1 day ago</div>
                    </div>
                    <div className="modern-activity-status">
                      <span className="status-badge rejected">Rejected</span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          } />
          
          <Route path="/visit" element={<VisitRequests currentOfficer={userProfile?.name || (userProfile?.firstName && userProfile?.lastName ? `${userProfile.firstName} ${userProfile.lastName}` : null)} onStatsChange={refreshDashboardStats} />} />
          <Route path="/visit/:requestId" element={<VisitRequests currentOfficer={userProfile?.name || (userProfile?.firstName && userProfile?.lastName ? `${userProfile.firstName} ${userProfile.lastName}` : null)} onStatsChange={refreshDashboardStats} />} />
          <Route path="/scan" element={<Scan currentOfficer={userProfile?.name || (userProfile?.firstName && userProfile?.lastName ? `${userProfile.firstName} ${userProfile.lastName}` : null)} />} />
          <Route path="/records" element={<Records />} />
          <Route path="/log" element={<LogTrails officerFilter={userProfile?.name || (userProfile?.firstName && userProfile?.lastName ? `${userProfile.firstName} ${userProfile.lastName}` : null)} />} />
          <Route path="/profile" element={<OfficerProfile onProfilePictureUpdate={updateProfilePicture} />} />
          <Route path="/" element={<Navigate to="/officer/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default OfficerDashboard;