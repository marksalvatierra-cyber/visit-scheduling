import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Filler } from 'chart.js/auto';
import { Line, Bar } from 'react-chartjs-2';
import Profile from './AdminProfile';
import ClientProfile from './ClientProfile';
import Settings from './ClientSettings';
import VisitRequests from './VisitRequests';
import Schedule from './Schedule';
import VisitLogs from './VisitLogs';
import ClientNotifications from './ClientNotifications';
import './ClientDashboard.css';
import firebaseService from '../firebase-services';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    approved: 0,
    pending: 0,
    rescheduled: 0,
    rejected: 0,
    cancelled: 0,
    total: 0
  });
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [unsubscribeNotifications, setUnsubscribeNotifications] = useState(null);

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
    return () => {
      // Cleanup notification listener
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const user = await firebaseService.getCurrentUser();
      if (!user) {
        navigate('/');
        return;
      }

      setCurrentUser(user);

      // Load user profile data
      const userData = await firebaseService.getUserData(user.uid);
      setUserProfile(userData);

      // Load dashboard stats
      const stats = await firebaseService.getDashboardStats(user.uid);
      setDashboardStats({
        approved: stats.approved || 0,
        pending: stats.pending || 0,
        rescheduled: stats.rescheduled || 0,
        rejected: stats.rejected || 0,
        cancelled: stats.cancelled || 0,
        total: stats.total || 0
      });

      // Load weekly request data
      const weeklyStats = await firebaseService.getWeeklyRequestStats(user.uid);
      setWeeklyData(weeklyStats);

      // Load notifications
      const userNotifications = await firebaseService.getNotifications(user.uid);
      setNotifications(userNotifications);

      // Set up real-time notification listener
      const unsubscribe = firebaseService.listenToNotifications(user.uid, (newNotifications) => {
        setNotifications(newNotifications);
      });
      setUnsubscribeNotifications(() => unsubscribe);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to update profile picture from ClientProfile
  const updateProfilePicture = (newProfilePictureUrl) => {
    setUserProfile(prev => ({
      ...prev,
      profilePicture: newProfilePictureUrl
    }));
  };

  // Chart data for Requests Over Time
  const requestsChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Visit Requests',
      data: weeklyData,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4,
      pointBackgroundColor: '#6366f1',
      pointRadius: 6,
      pointHoverRadius: 8,
      fill: true,
    }]
  };

  const requestsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#6b7280' },
        grid: { color: '#f3f4f6' }
      },
      x: {
        ticks: { color: '#6b7280' },
        grid: { color: '#f3f4f6' }
      }
    }
  };

  const categoriesChartData = {
    labels: ['Approved', 'Pending', 'Rescheduled', 'Rejected', 'Cancelled'],
    datasets: [{
      label: 'Visit Requests',
      data: [dashboardStats.approved, dashboardStats.pending, dashboardStats.rescheduled, dashboardStats.rejected, dashboardStats.cancelled],
      backgroundColor: [
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
        '#ef4444',
        '#6b7280'
      ],
      borderRadius: 8,
      barPercentage: 0.7,
    }]
  };

  const categoriesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, color: '#6b7280' }, grid: { color: '#f3f4f6' } },
      x: { ticks: { color: '#6b7280' }, grid: { display: false } }
    }
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleNavigation = (page, queryParams = '') => {
    if (queryParams) {
      navigate(`/client/${page}?${queryParams}`);
    } else {
      navigate(`/client/${page}`);
    }
  };
  const getCurrentPage = () => {
    const path = window.location.pathname;
    if (path.includes('/schedule')) return 'schedule';
    if (path.includes('/visitlogs')) return 'visitlogs';
    if (path.includes('/notifications')) return 'notifications';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/profile')) return 'profile';
    return 'dashboard';
  };

  const toggleBellDropdown = (e) => {
    e.stopPropagation();
    setShowBellDropdown(!showBellDropdown);
  };

  const toggleAvatarDropdown = () => {
    setShowAvatarDropdown(!showAvatarDropdown);
    setShowBellDropdown(false);
  };

  const markAllNotificationsRead = async () => {
    try {
      const promises = notifications.map(notification =>
        firebaseService.markNotificationAsRead(notification.id)
      );
      await Promise.all(promises);
      setNotifications([]);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      firebaseService.markNotificationAsRead(notification.id);
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      );
    }
    
    // Navigate to notifications page with the specific notification ID
    handleNavigation('notifications', `notification=${notification.id}`);
    setShowBellDropdown(false);
  };

  const handleSignOut = async () => {
    try {
      await firebaseService.signOut();
      navigate('/');
    } catch (error) {
      alert('Sign out failed: ' + error.message);
    }
  };

  // Add effect to close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      const profileDropdown = document.querySelector('.profile-dropdown');
      const profileBtn = document.querySelector('.profile-btn');
      if (
        showAvatarDropdown &&
        profileDropdown &&
        !profileDropdown.contains(event.target) &&
        profileBtn &&
        !profileBtn.contains(event.target)
      ) {
        setShowAvatarDropdown(false);
      }
      const notificationDropdown = document.querySelector('.notification-dropdown');
      const notificationBtn = document.querySelector('.notification-btn');
      if (
        showBellDropdown &&
        notificationDropdown &&
        !notificationDropdown.contains(event.target) &&
        notificationBtn &&
        !notificationBtn.contains(event.target)
      ) {
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
            <h1>Client Dashboard</h1>
            <p>Central Prison Camp Sablayan Penal Farm Visit System</p>
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
                <div className="dropdown-actions">
                  {notifications.length > 0 && (
                    <button className="mark-all-read" onClick={markAllNotificationsRead}>
                      Mark all read
                    </button>
                  )}
                  <button className="view-all-notifications" onClick={() => handleNavigation('notifications')}>
                    View All
                  </button>
                </div>
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
                    <div 
                      key={notification.id} 
                      className="notification-item"
                      onClick={() => handleNotificationClick(notification)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="notification-content">
                        <p className="notification-title">{notification.title}</p>
                        <p className="notification-message">{notification.message}</p>
                        <span className="notification-time">
                          {notification.createdAt?.toDate ?
                            notification.createdAt.toDate().toLocaleDateString() :
                            'Recently'
                          }
                        </span>
                        {!notification.isRead && (
                          <span className="unread-indicator" />
                        )}
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
              {userProfile?.profilePicture ? (
                <img 
                  src={userProfile.profilePicture} 
                  alt="Client Avatar" 
                  className="profile-avatar" 
                />
              ) : (
                <div 
                  className="profile-avatar"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '16px',
                    border: '2px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  {userProfile?.fullName?.charAt(0)?.toUpperCase() || userProfile?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              
            </button>
            <div className={`profile-dropdown ${showAvatarDropdown ? 'show' : ''}`} onClick={e => e.stopPropagation()}>
              <div className="dropdown-item" onClick={() => handleNavigation('profile')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                My Profile
              </div>
              <div className="dropdown-item" onClick={() => handleNavigation('settings')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Settings
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
                <button className="nav-link" onClick={() => handleNavigation('dashboard')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span className="nav-text">Dashboard</span>
                </button>
              </li>
              <li className={`nav-item ${getCurrentPage() === 'schedule' ? 'active' : ''}`}>
                <button className="nav-link" onClick={() => handleNavigation('schedule')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span className="nav-text">Schedule</span>
                </button>
              </li>
              <li className={`nav-item ${getCurrentPage() === 'visitlogs' ? 'active' : ''}`}>
                <button className="nav-link" onClick={() => handleNavigation('visitlogs')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                  </svg>
                  <span className="nav-text">Visit Logs</span>
                </button>
              </li>
              <li className={`nav-item ${getCurrentPage() === 'notifications' ? 'active' : ''}`}>
                <button className="nav-link" onClick={() => handleNavigation('notifications')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  <span className="nav-text">Notifications</span>
                  {notifications.length > 0 && (
                    <span className="nav-badge">{notifications.length}</span>
                  )}
                </button>
              </li>
              <li className={`nav-item ${getCurrentPage() === 'settings' ? 'active' : ''}`}>
                <button className="nav-link" onClick={() => handleNavigation('settings')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  <span className="nav-text">Settings</span>
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
                    Welcome back, {currentUser?.email?.split('@')[0] || 'Client'}! 👋
                  </div>
                  <div className="modern-welcome-actions">
                    <button
                      className="modern-btn-primary"
                      onClick={() => userProfile?.profileStatus === 'verified' ? handleNavigation('schedule') : null}
                      style={{
                        opacity: userProfile?.profileStatus === 'verified' ? 1 : 0.5,
                        cursor: userProfile?.profileStatus === 'verified' ? 'pointer' : 'not-allowed',
                        position: 'relative'
                      }}
                      title={userProfile?.profileStatus !== 'verified' ? 'Account verification required' : 'Schedule a visit'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      Schedule Visit
                      {userProfile?.profileStatus !== 'verified' && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', top: '8px', right: '8px' }}>
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                      )}
                    </button>
                    <button
                      className="modern-btn-secondary"
                      onClick={() => handleNavigation('visitlogs')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                      </svg>
                      View History
                    </button>
                  </div>
                </div>

              {/* Verification Status Banner */}
              {userProfile && userProfile.profileStatus !== 'verified' && (
                <div style={{
                  marginBottom: '24px',
                  padding: '20px',
                  borderRadius: '12px',
                  background: userProfile.profileStatus === 'rejected' ? '#fef2f2' : '#fef9c3',
                  border: `2px solid ${userProfile.profileStatus === 'rejected' ? '#fecaca' : '#fef08a'}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <div style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: userProfile.profileStatus === 'rejected' ? '#fee2e2' : '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={userProfile.profileStatus === 'rejected' ? '#dc2626' : '#ca8a04'} strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: userProfile.profileStatus === 'rejected' ? '#991b1b' : '#854d0e'
                    }}>
                      {userProfile.profileStatus === 'rejected' ? '❌ Account Verification Rejected' : '⏳ Account Pending Verification'}
                    </h3>
                    <p style={{
                      margin: '0 0 12px 0',
                      fontSize: '14px',
                      color: userProfile.profileStatus === 'rejected' ? '#991b1b' : '#854d0e',
                      lineHeight: '1.6'
                    }}>
                      {userProfile.profileStatus === 'rejected' ? (
                        userProfile.rejectionReason ? (
                          <>
                            Your account verification was rejected. <strong>Reason:</strong> {userProfile.rejectionReason}
                          </>
                        ) : (
                          'Your account verification was rejected. Please contact support for more information.'
                        )
                      ) : (
                        'Your account is currently under review. You cannot submit visit requests until your account is verified by an administrator.'
                      )}
                    </p>
                    {userProfile.profileStatus === 'rejected' && (
                      <button
                        onClick={() => handleNavigation('profile')}
                        style={{
                          padding: '8px 16px',
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#b91c1c'}
                        onMouseOut={(e) => e.target.style.background = '#dc2626'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        Update Profile & Resubmit
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Modern Stats Cards */}
              <section className="modern-stats-section">
                <div className="modern-stats-grid">
                  <div className="modern-stat-card approved" onClick={() => handleNavigation('visitlogs', 'filter=approved')}>
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
                      <div className="modern-stat-change positive">+5% from last month</div>
                    </div>
                  </div>

                  <div className="modern-stat-card pending" onClick={() => handleNavigation('visitlogs', 'filter=pending')}>
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
                      <div className="modern-stat-label">Pending</div>
                      <div className="modern-stat-change neutral">+2% from last month</div>
                    </div>
                  </div>

                  <div className="modern-stat-card reschedule" onClick={() => handleNavigation('visitlogs', 'filter=rescheduled')}>
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
                      <div className="modern-stat-change negative">-1% from last month</div>
                    </div>
                  </div>

                  <div className="modern-stat-card rejected" onClick={() => handleNavigation('visitlogs', 'filter=rejected')}>
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
                      <div className="modern-stat-change negative">+3% from last month</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Modern Charts Section */}
              <section className="modern-charts-section">
                <div className="modern-charts-header">
                  <div className="modern-charts-title">
                    <h2>Analytics Overview</h2>
                    <p>Track your visit request trends and patterns</p>
                  </div>
                </div>
                
                <div className="modern-charts-grid">
                  <div className="modern-chart-card">
                    <div className="modern-chart-header">
                      <div className="modern-chart-title">
                        <div className="modern-chart-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3v18h18"></path>
                            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
                          </svg>
                        </div>
                        <div className="modern-chart-info">
                          <h3>Requests Over Time</h3>
                          <p>Daily request volume trends</p>
                        </div>
                      </div>
                    </div>
                    <div className="modern-chart-container">
                      <Line data={requestsChartData} options={requestsChartOptions} />
                    </div>
                  </div>

                  <div className="modern-chart-card">
                    <div className="modern-chart-header">
                      <div className="modern-chart-title">
                        <div className="modern-chart-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                            <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                          </svg>
                        </div>
                        <div className="modern-chart-info">
                          <h3>Request Categories</h3>
                          <p>Distribution by request type</p>
                        </div>
                      </div>
                    </div>
                    <div className="modern-chart-container">
                      <Bar data={categoriesChartData} options={categoriesChartOptions} />
                    </div>
                  </div>
                </div>
              </section>
            </>
          } />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/visitlogs" element={<VisitLogs />} />
          <Route path="/notifications" element={<ClientNotifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<ClientProfile onProfilePictureUpdate={updateProfilePicture} />} />
          <Route path="/" element={<Navigate to="/client/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default ClientDashboard; 