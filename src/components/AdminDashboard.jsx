import React, { useState, useEffect, useCallback } from 'react'; // Update this existing import
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Filler } from 'chart.js/auto';
import { Line, Bar } from 'react-chartjs-2';
import firebaseService from '../firebase-services.js';
import VisitRequests from './VisitRequests';
import Scan from './Scan';
import AddInmate from './AddInmate';
import Records from './Records';
import LogTrails from './LogTrails';
import Settings from './AdminSettings';
import Profile from './AdminProfile.jsx';
import AddAdmin from './AddAdmin.jsx';
import VerifyUsers from './VerifyUsers.jsx';
import PastRecords from './PastRecords.jsx';
import './AdminDashboard.css';


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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState('light');
  const [unsubscribeNotifications, setUnsubscribeNotifications] = useState(null);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipTimeout, setTooltipTimeout] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    approved: 0,
    pending: 0,
    rescheduled: 0,
    rejected: 0,
    cancelled: 0,
    total: 0
  });
  const [inmateStats, setInmateStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });
  const [chartData, setChartData] = useState({ labels: [], data: [] });
  const [chartMode, setChartMode] = useState('daily'); // 'daily' or 'weekly'
  // Helper to group daily data into weeks
  const groupDataByWeeks = (labels, data) => {
    const weeks = [];
    const weekLabels = [];
    let weekSum = 0;
    let weekStart = 0;
    for (let i = 0; i < data.length; i++) {
      weekSum += data[i];
      // If end of week or last day
      if ((i + 1) % 7 === 0 || i === data.length - 1) {
        weeks.push(weekSum);
        // Label: e.g. "Aug 1-7"
        const startLabel = labels[weekStart];
        const endLabel = labels[i];
        weekLabels.push(`${startLabel} - ${endLabel}`);
        weekSum = 0;
        weekStart = i + 1;
      }
    }
    return { labels: weekLabels, data: weeks };
  };
  // Helper to group daily data into months (for last 3 months)
  const groupDataByMonths = (labels, data) => {
    const months = [];
    const monthLabels = [];
    let currentMonth = '';
    let monthSum = 0;
    for (let i = 0; i < labels.length; i++) {
      // Parse month from label (e.g., 'Aug 1')
      const [month] = labels[i].split(' ');
      if (currentMonth === '') currentMonth = month;
      if (month !== currentMonth) {
        months.push(monthSum);
        monthLabels.push(currentMonth);
        currentMonth = month;
        monthSum = 0;
      }
      monthSum += data[i];
    }
    // Push last month
    if (monthSum > 0) {
      months.push(monthSum);
      monthLabels.push(currentMonth);
    }
    return { labels: monthLabels, data: months };
  };
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('7');
  const [showChartMenu, setShowChartMenu] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  // Weekly stats for reporting export
  const [weeklyRequestData, setWeeklyRequestData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

 // NEW: Real-time data states
const [lastUpdated, setLastUpdated] = useState(new Date());
const [isLiveMode, setIsLiveMode] = useState(true);
const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
const [todayRequestsCount, setTodayRequestsCount] = useState(0);
const [realtimeStats, setRealtimeStats] = useState({
  newRequestsToday: 0,
  processingTime: 0,
  approvalRate: 0
});
const [toastNotifications, setToastNotifications] = useState([]);
// Simple toast helper
const showToast = useCallback((message, type = 'info', durationMs = 4000) => {
  const id = Date.now() + Math.random();
  const toast = { id, message, type };
  setToastNotifications(prev => [...prev, toast]);
  setTimeout(() => {
    setToastNotifications(prev => prev.filter(t => t.id !== id));
  }, durationMs);
}, []);
// NEW: Real-time data refresh function
const refreshDashboardData = useCallback(async () => {
  try {
    console.log('🔄 Refreshing dashboard data...');
    
    const [stats, inmateData, chartDataResult, activityData] = await Promise.all([
      firebaseService.getDashboardStats(),
      firebaseService.getInmateStats(),
      firebaseService.getRequestStatsByDays(parseInt(chartPeriod)),
      firebaseService.getRecentActivity(8)
    ]);
    
    setDashboardStats(stats);
    setInmateStats(inmateData);
    setChartData(chartDataResult);
    setRecentActivity(activityData);
    setLastUpdated(new Date());
    setPendingRequestsCount(stats.pending);
    
    // Calculate today's requests
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const requests = await firebaseService.getVisitRequests();
    const todayRequests = requests.filter(req => {
      const reqDate = new Date(req.createdAt?.toDate ? req.createdAt.toDate() : req.createdAt);
      return reqDate >= todayStart;
    });
    setTodayRequestsCount(todayRequests.length);
    
    const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
    setRealtimeStats({
      newRequestsToday: todayRequests.length,
      approvalRate: approvalRate,
      processingTime: Math.floor(Math.random() * 24) + 1
    });
    
    console.log('✅ Dashboard data refreshed successfully');
  } catch (error) {
    console.error('❌ Error refreshing dashboard data:', error);
  }
}, [chartPeriod]);

  // load data when chartPeriod changes
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setChartLoading(true);
        let result;
        if (chartMode === 'weekly') {
          result = await firebaseService.getRequestStatsByDays(30);
          setChartData(groupDataByWeeks(result.labels, result.data));
        } else if (chartMode === 'monthly') {
          result = await firebaseService.getRequestStatsByDays(90);
          setChartData(groupDataByMonths(result.labels, result.data));
        } else {
          result = await firebaseService.getRequestStatsByDays(parseInt(chartPeriod));
          setChartData(result);
        }
      } catch (error) {
        console.error('❌ Failed to fetch request stats:', error);
        setChartData({ labels: [], data: [] });
      } finally {
        setChartLoading(false);
      }
    };
    fetchStats();
  }, [chartPeriod, chartMode]);


  // Listen for theme changes from localStorage, or read from settings
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

// Listen for theme changes from Settings
useEffect(() => {
  const handleStorage = () => {
    const storedTheme = localStorage.getItem('dashboard-theme');
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.setAttribute('data-theme', storedTheme);
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}, []);

  // Load dashboard data from Firebase
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load all dashboard data in parallel
        const [stats, inmateData, weeklyData, activityData, currentUser] = await Promise.all([
          firebaseService.getDashboardStats(),
          firebaseService.getInmateStats(),
          firebaseService.getWeeklyRequestStats(),
          firebaseService.getRecentActivity(8),
          firebaseService.getCurrentUser()
        ]);
        
        setCurrentUser(currentUser);
        
        // Load user profile data if user exists
        if (currentUser) {
          const userData = await firebaseService.getUserData(currentUser.uid);
          if (userData) {
            setUserProfile({
              ...userData,
              profilePicture: userData.profilePicture || "/image/Logo.png"
            });
          } else {
            // Set default profile if no user data exists
            setUserProfile({
              profilePicture: "/image/Logo.png"
            });
          }
        }
        
        setDashboardStats(stats);
  setInmateStats(inmateData);
  setRecentActivity(activityData);
  setWeeklyRequestData(weeklyData);

        const showRealtimeNotification = (message, type = 'info') => {
  const id = Date.now();
  const notification = { id, message, type, timestamp: new Date() };
  setToastNotifications(prev => [...prev, notification]);
  setTimeout(() => {
    setToastNotifications(prev => prev.filter(n => n.id !== id));
  }, 5000);
};
        
       // Load admin notifications using the admin's actual user ID
const userNotifications = await firebaseService.getAdminNotifications();
setNotifications(userNotifications);

// Real-time listener for admin notifications
const unsubscribe = firebaseService.listenToAdminNotifications((newNotifications) => {
  console.log('Real-time admin notification update:', newNotifications);
  setNotifications(newNotifications);
});
setUnsubscribeNotifications(() => unsubscribe);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  loadDashboardData();

  // Cleanup notification listener on unmount
  return () => {
    if (unsubscribeNotifications) {
      unsubscribeNotifications();
    }
  };
}, []);

const requestsChartData = {
  labels: chartData.labels,
  datasets: [{
    label: 'Requests',
    data: chartData.data,
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    tension: 0.4,
    pointBackgroundColor: '#6366f1',
    pointRadius: 6,
    pointHoverRadius: 8,
    fill: true,
    borderWidth: 2,
  }]
};

// Debug logging for chart data
console.log('📊 Current chart data being rendered:', {
  chartPeriod,
  chartData,
  requestsChartData,
  labels: chartData.labels,
  data: chartData.data
});
  const requestsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          stepSize: 5,
          color: '#6b7280'
        },
        grid: {
          color: '#f3f4f6'
        }
      },
      x: {
        ticks: {
          color: '#6b7280'
        },
        grid: {
          color: '#f3f4f6'
        }
      }
    }
  };

  // Chart data for Request Categories
  const categoriesChartData = {
    labels: ['Approved', 'Pending', 'Reschedule', 'Rejected', 'Cancelled'],
    datasets: [{
      label: 'Requests',
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
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          stepSize: 20,
          color: '#6b7280'
        },
        grid: {
          color: '#f3f4f6'
        }
      },
      x: {
        ticks: {
          color: '#6b7280'
        },
        grid: {
          display: false
        }
      }
    }
  };

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
    navigate(`/admin/${page}`);
  };

  // Function to update profile picture from Profile component
  const updateProfilePicture = (newProfilePictureUrl) => {
    setUserProfile(prev => ({
      ...prev,
      profilePicture: newProfilePictureUrl
    }));
  };

  const handleTooltipShow = (tooltipId) => {
    if (sidebarCollapsed) {
      // Clear any existing timeout
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
      }
      const timeout = setTimeout(() => {
        setActiveTooltip(tooltipId);
      }, 300);
      setTooltipTimeout(timeout);
    }
  };

  const handleTooltipHide = () => {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
      setTooltipTimeout(null);
    }
    setActiveTooltip(null);
  };

  const handleStatCardClick = (status) => {
    navigate(`/admin/visit?filter=${status}`);
  };

  const handleChartPeriodChange = async (period) => {
    console.log('🔄 Chart period change initiated:', period);
    setChartPeriod(period);
    setChartLoading(true);
    
    // Add visual feedback
    const selectElement = document.querySelector('.modern-chart-period');
    if (selectElement) {
      selectElement.style.transform = 'scale(1.02)';
      setTimeout(() => {
        selectElement.style.transform = 'scale(1)';
      }, 150);
    }

    // Fetch new data for the selected period
    try {
      console.log('📡 Fetching data for period:', period, 'days');
      const result = await firebaseService.getRequestStatsByDays(parseInt(period));
      console.log('✅ Updated chart data for', period, 'days:', result);
      console.log('📊 Chart data structure:', {
        labels: result.labels,
        data: result.data,
        labelsLength: result.labels?.length,
        dataLength: result.data?.length
      });
      setChartData(result);
    } catch (error) {
      console.error('❌ Failed to fetch chart data for', period, 'days:', error);
    } finally {
      setChartLoading(false);
      console.log('🏁 Chart period change completed');
    }
  };

  const handleChartMenuToggle = () => {
    setShowChartMenu(!showChartMenu);
    setShowCategoriesMenu(false);
  };

  const handleCategoriesMenuToggle = () => {
    setShowCategoriesMenu(!showCategoriesMenu);
    setShowChartMenu(false);
  };

  const handleExportData = (type) => {
    try {
      if (type === 'time') {
        // Export only Requests Over Time chart
        const csvHeader = 'Requests Over Time\n';
        const periodLine = `Period: Last ${chartPeriod} days\n\n`;
        let csv = csvHeader + periodLine + 'Date,Requests\n';
        (chartData.labels || []).forEach((label, i) => {
          csv += `${label},${chartData.data?.[i] ?? 0}\n`;
        });
        const filename = `requests-over-time-last-${chartPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Exported Requests Over Time.', 'success');
      } else if (type === 'categories') {
        // Export only Request Categories chart
        let csv = 'Request Categories\n\n';
        csv += 'Category,Count\n';
        csv += `Approved,${dashboardStats.approved}\n`;
        csv += `Pending,${dashboardStats.pending}\n`;
        csv += `Rescheduled,${dashboardStats.rescheduled}\n`;
        csv += `Rejected,${dashboardStats.rejected}\n`;
        csv += `Cancelled,${dashboardStats.cancelled}\n`;
        const filename = `request-categories-${new Date().toISOString().split('T')[0]}.csv`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Exported Request Categories.', 'success');
      } else {
        console.warn('Unknown export type:', type);
        showToast('Unknown export type.', 'error');
      }
    } catch (e) {
      console.error('Export failed:', e);
      showToast('Export failed. Please try again.', 'error');
    }
  };

  const handleRefreshChart = async () => {
    // Refresh chart and dashboard data
    console.log('Refreshing chart data...');
    await refreshDashboardData();
  };

  // Report Generation Function
  const generateReport = async () => {
    if (isGeneratingReport) return;
    
    setIsGeneratingReport(true);
    
    try {
      // Collect additional time-series for 30 days and 90 days
      const [last7, last30, last90] = await Promise.all([
        firebaseService.getRequestStatsByDays(7),
        firebaseService.getRequestStatsByDays(30),
        firebaseService.getRequestStatsByDays(90)
      ]);

      // Create comprehensive report data
      const reportData = {
  title: 'Central Prison Camp Sablayan Penal Farm - System Report',
        generatedAt: new Date().toLocaleString(),
        period: `Last ${chartPeriod} days`,
        summary: {
          totalRequests: dashboardStats.total,
          approved: dashboardStats.approved,
          pending: dashboardStats.pending,
          rescheduled: dashboardStats.rescheduled,
          rejected: dashboardStats.rejected,
          approvalRate: dashboardStats.total > 0 ? Math.round((dashboardStats.approved / dashboardStats.total) * 100) : 0
        },
        inmates: {
          total: inmateStats.total,
          active: inmateStats.active,
          inactive: inmateStats.inactive
        },
        weeklyData: weeklyRequestData,
        timeSeries: {
          last7,
          last30,
          last90
        },
        recentActivity: recentActivity.slice(0, 10) // Last 10 activities
      };

      // Generate CSV content
      const csvContent = generateCSVReport(reportData);
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `corrections-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
  // Show success toast
  showToast('Report generated successfully. Check your downloads folder.', 'success');
      
    } catch (error) {
  console.error('Error generating report:', error);
  showToast('Failed to generate report. Please try again.', 'error');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Helper function to generate CSV content
  const generateCSVReport = (data) => {
  let csv = 'Central Prison Camp Sablayan Penal Farm - System Report\n';
    csv += `Generated: ${data.generatedAt}\n`;
    csv += `Period: ${data.period}\n\n`;
    
    // Summary Section
    csv += 'SUMMARY STATISTICS\n';
    csv += 'Metric,Value\n';
    csv += `Total Requests,${data.summary.totalRequests}\n`;
    csv += `Approved,${data.summary.approved}\n`;
    csv += `Pending,${data.summary.pending}\n`;
    csv += `Rescheduled,${data.summary.rescheduled}\n`;
    csv += `Rejected,${data.summary.rejected}\n`;
    csv += `Approval Rate,${data.summary.approvalRate}%\n\n`;
    
    // Inmate Statistics
    csv += 'INMATE STATISTICS\n';
    csv += 'Metric,Value\n';
    csv += `Total Inmates,${data.inmates.total}\n`;
    csv += `Active,${data.inmates.active}\n`;
    csv += `Inactive,${data.inmates.inactive}\n\n`;
    
    // Weekly Data
    csv += 'WEEKLY REQUEST DATA\n';
    csv += 'Day,Requests\n';
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    data.weeklyData.forEach((count, index) => {
      csv += `${days[index]},${count}\n`;
    });
    csv += '\n';

    // Time Series: Last 7, 30, and 90 days
    if (data.timeSeries?.last90) {
      const series = data.timeSeries.last90;
      const total90 = (series.data || []).reduce((sum, val) => sum + (Number(val) || 0), 0);
      const daysCount = (series.data || []).length || 0;
      const avg90 = daysCount ? (total90 / daysCount).toFixed(2) : '0';

      csv += 'LAST 3 MONTHS (90 DAYS) - SUMMARY\\n';
      csv += 'Metric,Value\\n';
      csv += `Total Requests (90 days),${total90}\\n`;
      csv += `Average per day,${avg90}\\n\\n`;
    }

    if (data.timeSeries?.last30) {
      csv += 'LAST 30 DAYS (DAILY)\n';
      csv += 'Date,Requests\n';
      data.timeSeries.last30.labels.forEach((label, i) => {
        csv += `${label},${data.timeSeries.last30.data[i] ?? 0}\n`;
      });
      csv += '\n';
    }

    if (data.timeSeries?.last90) {
      csv += 'LAST 3 MONTHS (90 DAYS, DAILY)\n';
      csv += 'Date,Requests\n';
      data.timeSeries.last90.labels.forEach((label, i) => {
        csv += `${label},${data.timeSeries.last90.data[i] ?? 0}\n`;
      });
      csv += '\n';
    }
    
    // Recent Activity
    if (data.recentActivity.length > 0) {
      csv += 'RECENT ACTIVITY\n';
      csv += 'Type,Title,Description,Timestamp\n';
      data.recentActivity.forEach(activity => {
        const timestamp = activity.timestamp ? 
          (activity.timestamp.toDate ? activity.timestamp.toDate().toLocaleString() : activity.timestamp) : 
          'Unknown';
        csv += `"${activity.type || 'N/A'}","${activity.title || 'N/A'}","${activity.description || 'N/A'}","${timestamp}"\n`;
      });
    }
    
    return csv;
  };

  const getTooltipText = (tooltipId) => {
    const tooltipMap = {
      'dashboard': 'Dashboard',
      'visit': 'Visit Requests',
      'scan': 'Scan',
      'addadmin': 'Manage Officers',
      'inmate': 'Add Inmate',
      'verify': 'Verify Users',
      'records': 'Records',
      'log': 'Log Trails',
      'settings': 'Settings'
    };
    return tooltipMap[tooltipId] || '';
  };

  const getTooltipPosition = (tooltipId) => {
    const positionMap = {
      'dashboard': '120px',
      'visit': '180px',
      'scan': '240px',
      'addadmin': '300px',
      'inmate': '380px',
      'verify': '440px',
      'records': '500px',
      'log': '560px',
      'settings': '620px'
    };
    return positionMap[tooltipId] || '0px';
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path.includes('/visit')) return 'visit';
    if (path.includes('/scan')) return 'scan';
    if (path.includes('/addadmin')) return 'addadmin';
    if (path.includes('/inmate')) return 'inmate';
    if (path.includes('/records')) return 'records';
    if (path.includes('/pastrecords')) return 'pastrecords';
    if (path.includes('/log')) return 'log';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/profile')) return 'profile';
    return 'dashboard';
  };

  // Add this function:
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const profileDropdown = document.querySelector('.profile-dropdown');
      const profileBtn = document.querySelector('.profile-btn');
      const notificationDropdown = document.querySelector('.notification-dropdown');
      const notificationBtn = document.querySelector('.notification-btn');

      // Check if click is outside profile dropdown and profile button
      if (showAvatarDropdown && 
          profileDropdown && 
          !profileDropdown.contains(event.target) && 
          profileBtn && 
          !profileBtn.contains(event.target)) {
        setShowAvatarDropdown(false);
      }

      // Check if click is outside notification dropdown and notification button
      if (showBellDropdown && 
          notificationDropdown && 
          !notificationDropdown.contains(event.target) && 
          notificationBtn && 
          !notificationBtn.contains(event.target)) {
        setShowBellDropdown(false);
      }

      // Close chart menus when clicking outside
      if (showChartMenu || showCategoriesMenu) {
        const chartMenus = document.querySelectorAll('.chart-menu-wrapper');
        let clickedInside = false;
        
        chartMenus.forEach(menu => {
          if (menu.contains(event.target)) {
            clickedInside = true;
          }
        });
        
        if (!clickedInside) {
          setShowChartMenu(false);
          setShowCategoriesMenu(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showAvatarDropdown, showBellDropdown, showChartMenu, showCategoriesMenu]);

  // Cleanup tooltip timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
      }
    };
  }, [tooltipTimeout]);

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
            <h1>Superadmin Dashboard</h1>
            <p>Central Prison Camp Sablayan Penal Farm Management System</p>
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
  {notifications.length > 0 && (
    <button className="mark-all-read" onClick={markAllNotificationsRead}>
      Mark all read
    </button>
  )}
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
        style={{ cursor: notification.relatedRequestId ? "pointer" : "default" }}
        onClick={() => {
          if (notification.relatedRequestId) {
            navigate(`/admin/visit/${notification.relatedRequestId}`);
            setTimeout(() => {
              firebaseService.markNotificationAsRead(notification.id);
              setShowBellDropdown(false);
            }, 500);
          }
        }}
      >
        <div className="notification-content">
          <p className="notification-title">{notification.title}</p>
          <p className="notification-message">{notification.message}</p>
          <span className="notification-time">
            {notification.createdAt?.toDate
              ? notification.createdAt.toDate().toLocaleDateString()
              : "Recently"}
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
              <img 
                src={userProfile?.profilePicture || "/image/Logo.png"} 
                alt="Admin Avatar" 
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
        
        {/* Tooltip Container */}
        {sidebarCollapsed && activeTooltip && (
          <div className="tooltip-container" style={{ top: getTooltipPosition(activeTooltip) }}>
            <div className="sidebar-tooltip">
              {getTooltipText(activeTooltip)}
            </div>
          </div>
        )}
        <nav className="sidebar-nav">
                      <div className="nav-section">
              <h3 className="nav-title">Main Menu</h3>
              <ul className="nav-list">
                <li className={`nav-item ${getCurrentPage() === 'dashboard' ? 'active' : ''}`}>
                  <button 
                    className="nav-link"
                    onClick={() => handleNavigation('dashboard')}
                    title="Dashboard"
                    data-tooltip="Dashboard"
                    onMouseEnter={() => handleTooltipShow('dashboard')}
                    onMouseLeave={handleTooltipHide}
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
                    data-tooltip="Visit Requests"
                    onMouseEnter={() => handleTooltipShow('visit')}
                    onMouseLeave={handleTooltipHide}
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
                    data-tooltip="Scan"
                    onMouseEnter={() => handleTooltipShow('scan')}
                    onMouseLeave={handleTooltipHide}
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
                <li className={`nav-item ${getCurrentPage() === 'addadmin' ? 'active' : ''}`}>
                  <button 
                    className="nav-link"
                    onClick={() => handleNavigation('addadmin')}
                    title="Manage Officers"
                    data-tooltip="Manage Officers"
                    onMouseEnter={() => handleTooltipShow('addadmin')}
                    onMouseLeave={handleTooltipHide}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      <line x1="20" y1="8" x2="24" y2="8"></line>
                      <line x1="22" y1="6" x2="22" y2="10"></line>
                    </svg>
                    <span className="nav-text">Manage Officers</span>
                  </button>
                </li>
              </ul>
            </div>

          <div className="nav-section">
            <h3 className="nav-title">Management</h3>
            <ul className="nav-list">
              <li className={`nav-item ${getCurrentPage() === 'inmate' ? 'active' : ''}`}>
                <button 
                  className="nav-link"
                  onClick={() => handleNavigation('inmate')}
                  title="Add Inmate"
                  data-tooltip="Add Inmate"
                  onMouseEnter={() => handleTooltipShow('inmate')}
                  onMouseLeave={handleTooltipHide}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span className="nav-text">Add Inmate</span>
                </button>
              </li>
              <li className={`nav-item ${getCurrentPage() === 'verify' ? 'active' : ''}`}>
                <button 
                  className="nav-link"
                  onClick={() => handleNavigation('verify')}
                  title="Verify Users"
                  data-tooltip="Verify Users"
                  onMouseEnter={() => handleTooltipShow('verify')}
                  onMouseLeave={handleTooltipHide}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span className="nav-text">Verify Users</span>
                </button>
              </li>
              <li className={`nav-item ${getCurrentPage() === 'records' ? 'active' : ''}`}>
                <button 
                  className="nav-link"
                  onClick={() => handleNavigation('records')}
                  title="Records"
                  data-tooltip="Records"
                  onMouseEnter={() => handleTooltipShow('records')}
                  onMouseLeave={handleTooltipHide}
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
              <li className={`nav-item ${getCurrentPage() === 'pastrecords' ? 'active' : ''}`}>
                <button 
                  className="nav-link"
                  onClick={() => handleNavigation('pastrecords')}
                  title="Past Records"
                  data-tooltip="Past Records"
                  onMouseEnter={() => handleTooltipShow('pastrecords')}
                  onMouseLeave={handleTooltipHide}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12,6 12,12 16,14"></polyline>
                  </svg>
                  <span className="nav-text">Past Records</span>
                </button>
              </li>
              <li className={`nav-item ${getCurrentPage() === 'log' ? 'active' : ''}`}>
                <button 
                  className="nav-link"
                  onClick={() => handleNavigation('log')}
                  title="Log Trails"
                  data-tooltip="Log Trails"
                  onMouseEnter={() => handleTooltipShow('log')}
                  onMouseLeave={handleTooltipHide}
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
              <li className={`nav-item ${getCurrentPage() === 'settings' ? 'active' : ''}`}>
                <button 
                  className="nav-link"
                  onClick={() => handleNavigation('settings')}
                  title="Settings"
                  data-tooltip="Settings"
                  onMouseEnter={() => handleTooltipShow('settings')}
                  onMouseLeave={handleTooltipHide}
                >
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
             {/* Modern Welcome Section - Matching Visit Request Style */}
<div className="modern-records-header">
        <div className="modern-records-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 1h6v6H1z"></path>
            <path d="M17 1h6v6h-6z"></path>
            <path d="M1 17h6v6H1z"></path>
            <path d="M17 17h6v6h-6z"></path>
          </svg>
        Welcome back, Superadmin! 👋
        </div>

      
      {/* Generate Report Button */}
      <button 
        onClick={generateReport}
        disabled={isGeneratingReport}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          border: '2px solid #10b981',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          background: 'white',
          color: '#10b981',
          cursor: isGeneratingReport ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: isGeneratingReport ? 0.6 : 1
        }}
        onMouseOver={(e) => !isGeneratingReport && (e.target.style.background = '#f0fdf4')}
        onMouseOut={(e) => !isGeneratingReport && (e.target.style.background = 'white')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19,12 12,19 5,12"></polyline>
        </svg>
        {isGeneratingReport ? 'Generating...' : 'Generate Report'}
      </button>
    </div>
              {/* Modern Stats Cards */}
              <section className="modern-stats-section">
                <div className="modern-stats-grid">
                  <div 
                    className="modern-stat-card approved" 
                    onClick={() => handleStatCardClick('approved')}
                    style={{ cursor: 'pointer' }}
                  >
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
                      <div className="modern-stat-label"> Approved</div>
                      <div className="modern-stat-change positive">+12% from last month</div>
                    </div>
                  </div>

                  <div 
                    className="modern-stat-card pending" 
                    onClick={() => handleStatCardClick('pending')}
                    style={{ cursor: 'pointer' }}
                  >
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
                      <div className="modern-stat-label"> Pending</div>
                      <div className="modern-stat-change neutral">+5% from last month</div>
                    </div>
                  </div>

                  <div 
                    className="modern-stat-card reschedule" 
                    onClick={() => handleStatCardClick('rescheduled')}
                    style={{ cursor: 'pointer' }}
                  >
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
                      <div className="modern-stat-label"> Rescheduled</div>
                      <div className="modern-stat-change negative">-3% from last month</div>
                    </div>
                  </div>

                  <div 
                    className="modern-stat-card rejected" 
                    onClick={() => handleStatCardClick('rejected')}
                    style={{ cursor: 'pointer' }}
                  >
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
                      <div className="modern-stat-label"> Rejected</div>
                      <div className="modern-stat-change negative">+8% from last month</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Modern Charts Section */}
              <section className="modern-charts-section">
                <div className="modern-charts-header">
                  <div className="modern-charts-title">
                    <h2>Analytics Overview</h2>
                    <p>Track your system performance and request trends</p>
                  </div>
                  <div className="modern-charts-actions"></div>
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
                          <p>Daily request volume trends - Last {chartPeriod} {parseInt(chartPeriod) === 1 ? 'day' : parseInt(chartPeriod) === 7 ? 'days' : parseInt(chartPeriod) === 30 ? 'days' : 'months'}</p>
                        </div>
                      </div>
                      <div className="modern-chart-actions">
                        <select 
                          className="modern-chart-period"
                          value={chartMode === 'weekly' ? 'weekly' : chartMode === 'monthly' ? 'monthly' : chartPeriod}
                          onChange={(e) => {
                            if (e.target.value === 'weekly') {
                              setChartMode('weekly');
                            } else if (e.target.value === 'monthly') {
                              setChartMode('monthly');
                            } else {
                              setChartMode('daily');
                              handleChartPeriodChange(e.target.value);
                            }
                          }}
                        >
                          <option value="7">Last 7 days</option>
                          <option value="weekly">Last 30 days</option>
                          <option value="monthly">Last 3 months</option>
                        </select>
                        <div className="chart-menu-wrapper">
                          <button 
                            className="modern-chart-action-btn"
                            onClick={handleChartMenuToggle}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="19" cy="12" r="1"></circle>
                              <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                          </button>
                          {showChartMenu && (
                            <div className="chart-menu-dropdown">
                              <button onClick={handleRefreshChart}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M23 4v6h-6"></path>
                                  <path d="M1 20v-6h6"></path>
                                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                                </svg>
                                Refresh
                              </button>
                              <button onClick={() => handleExportData('time')}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7,10 12,15 17,10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Export
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="modern-chart-container">
                      {chartLoading ? (
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '300px',
                          fontSize: '16px',
                          color: '#6b7280'
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ 
                            animation: 'spin 1s linear infinite',
                            marginRight: '8px'
                          }}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                              <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                            </circle>
                          </svg>
                          Loading chart data...
                        </div>
                      ) : (
                        <Line 
                          key={`${chartPeriod}-${JSON.stringify(chartData)}`} 
                          data={requestsChartData} 
                          options={requestsChartOptions} 
                        />
                      )}
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
                      <div className="modern-chart-actions">
                        <button 
                          className="modern-btn-secondary"
                          onClick={() => handleExportData('categories')}
                        >
                          Export Data
                        </button>
                        <div className="chart-menu-wrapper">
                          <button 
                            className="modern-chart-action-btn"
                            onClick={handleCategoriesMenuToggle}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="19" cy="12" r="1"></circle>
                              <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                          </button>
                          {showCategoriesMenu && (
                            <div className="chart-menu-dropdown">
                              <button onClick={handleRefreshChart}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M23 4v6h-6"></path>
                                  <path d="M1 20v-6h6"></path>
                                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                                </svg>
                                Refresh
                              </button>
                              <button onClick={() => handleExportData('categories')}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7,10 12,15 17,10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Export
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="modern-chart-container">
                      <Bar data={categoriesChartData} options={categoriesChartOptions} />
                    </div>
                  </div>
                </div>
              </section>

              {/* Recent Activity Section */}
              <section className="modern-activity-section">
                <div className="modern-activity-header">
                  <div className="modern-activity-title">
                    <h2>Recent Activity</h2>
                    <p>Latest system activities and updates</p>
                  </div>
                  <div className="modern-activity-actions">
                    <button className="modern-btn-secondary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 4h22M1 8h22M1 12h22M1 16h22M1 20h22"></path>
                      </svg>
                      View All
                    </button>
                  </div>
                </div>
                
                <div className="modern-activity-list">
                  {loading ? (
                    <div className="modern-activity-loading">
                      <div className="loading-spinner"></div>
                      <p>Loading recent activity...</p>
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className="modern-activity-empty">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                      </svg>
                      <p>No recent activity</p>
                    </div>
                  ) : (
                    recentActivity.map((activity, index) => (
                      <div key={index} className="modern-activity-item">
                        <div className="modern-activity-icon">
                          {activity.type === 'visit_request' ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14,2 14,8 20,8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                          )}
                        </div>
                        <div className="modern-activity-content">
                          <div className="modern-activity-title">{activity.title}</div>
                          <div className="modern-activity-description">{activity.description}</div>
                          <div className="modern-activity-time">
                            {activity.timestamp ? (
                              new Date(activity.timestamp.toDate ? activity.timestamp.toDate() : activity.timestamp).toLocaleString()
                            ) : (
                              'Just now'
                            )}
                          </div>
                        </div>
                        <div className="modern-activity-status">
                          {activity.type === 'visit_request' && (
                            <span className={`status-badge ${activity.status}`}>
                              {activity.status}
                            </span>
                          )}
                          {activity.type === 'notification' && !activity.isRead && (
                            <div className="unread-indicator"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          } />
          
          <Route path="/visit" element={<VisitRequests />} />
          <Route path="/visit/:requestId" element={<VisitRequests />} />
          
          <Route path="/scan" element={<Scan currentOfficer={userProfile?.name || (userProfile?.firstName && userProfile?.lastName ? `${userProfile.firstName} ${userProfile.lastName}` : 'Admin User')} />} />
          
          <Route path="/inmate" element={<AddInmate />} />
          
          <Route path="/verify" element={<VerifyUsers />} />
          
          <Route path="/records" element={<Records />} />
          
          <Route path="/pastrecords" element={<PastRecords />} />
          
          <Route path="/log" element={<LogTrails />} />
          
          <Route path="/settings" element={<Settings />} />
          
          <Route path="/profile" element={<Profile onProfilePictureUpdate={updateProfilePicture} />} />
          
          <Route path="/addadmin" element={<AddAdmin />} />
          
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
        {/* Toasts */}
        {toastNotifications.length > 0 && (
          <div style={{
            position: 'fixed',
            right: '16px',
            bottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 9999
          }}>
            {toastNotifications.map(t => (
              <div key={t.id} style={{
                background: t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#111827',
                color: 'white',
                padding: '10px 12px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '240px',
                fontSize: '14px'
              }}>
                {t.message}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;