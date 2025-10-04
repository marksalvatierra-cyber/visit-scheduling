import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import firebaseService from '../firebase-services.js';
import './AddInmate.css'; // Reuse the same CSS for consistent styling

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AddAdmin = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin'
  });
  const [admins, setAdmins] = useState([]);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addedAdmin, setAddedAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setListLoading(true);
      // Get all users with officer role
      const users = await firebaseService.getAllUsers();
      const adminUsers = users.filter(user => user.role === 'officer');
      setAdmins(adminUsers);
      setTotalAdmins(adminUsers.length);
    } catch (error) {
      console.error('Error loading officers:', error);
      setError('Failed to load officer list');
      // Fallback mock data
      setAdmins([
        {
          id: '1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com',
          createdAt: '2024-08-15T10:30:00Z',
          status: 'active'
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@example.com',
          createdAt: '2024-09-20T14:45:00Z',
          status: 'active'
        }
      ]);
      setTotalAdmins(2);
    } finally {
      setListLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      throw new Error('Please fill in all required fields');
    }

    if (formData.password !== formData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (formData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      throw new Error('Please enter a valid email address');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate form data
      validateForm();

      // Check if email already exists
      const existingUsers = await firebaseService.getAllUsers();
      const emailExists = existingUsers.some(user => user.email === formData.email);
      
      if (emailExists) {
        throw new Error('An account with this email already exists');
      }

      // Create officer account
      const result = await firebaseService.signUp(
        formData.email,
        formData.password,
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          middleName: formData.middleName,
          role: 'officer'
        }
      );

      if (result.success) {
        const newAdmin = {
          ...formData,
          id: result.userId,
          createdAt: new Date().toISOString()
        };
        
        setAddedAdmin(newAdmin);
        setShowSuccessModal(true);
        setFormData({
          firstName: '',
          lastName: '',
          middleName: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'admin'
        });
        
        // Update admin list
        await loadAdmins();
        setShowAddModal(false);
      } else {
        throw new Error(result.error || 'Failed to create admin account');
      }
    } catch (error) {
      console.error('Error adding officer:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setAddedAdmin(null);
  };

  const openAddModal = () => {
    setShowAddModal(true);
    setError('');
    setFormData({
      firstName: '',
      lastName: '',
      middleName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'admin'
    });
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setError('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter admins based on search term
  const filteredAdmins = admins.filter(admin => {
    const fullName = `${admin.firstName || ''} ${admin.middleName || ''} ${admin.lastName || ''}`.toLowerCase();
    const email = (admin.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  // Action handlers
  const handleDropdownToggle = (adminId) => {
    setActiveDropdown(activeDropdown === adminId ? null : adminId);
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setEditFormData({
      firstName: admin.firstName || '',
      lastName: admin.lastName || '',
      middleName: admin.middleName || '',
      email: admin.email || ''
    });
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const handleResetPassword = (admin) => {
    setSelectedAdmin(admin);
    setShowResetPasswordModal(true);
    setActiveDropdown(null);
  };

  const handleToggleStatus = async (admin) => {
    try {
      // Toggle admin status logic here
      const newStatus = admin.status === 'active' ? 'inactive' : 'active';
      // Update admin status in your backend
      console.log(`Toggling admin ${admin.id} to ${newStatus}`);
      await loadAdmins(); // Reload the list
    } catch (error) {
      console.error('Error toggling admin status:', error);
    }
    setActiveDropdown(null);
  };

  const handleDeleteAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
    setActiveDropdown(null);
  };

  const handleViewActivity = (admin) => {
    setSelectedAdmin(admin);
    setShowActivityModal(true);
    setActiveDropdown(null);
  };

  const handleSendEmail = (admin) => {
    // Open default email client
    window.location.href = `mailto:${admin.email}?subject=Admin Account - Visit Scheduling System`;
    setActiveDropdown(null);
  };

  const handleViewLoginHistory = (admin) => {
    setSelectedAdmin(admin);
    setShowLoginHistoryModal(true);
    setActiveDropdown(null);
  };

  const closeAllModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowResetPasswordModal(false);
    setShowActivityModal(false);
    setShowLoginHistoryModal(false);
    setSelectedAdmin(null);
    setError('');
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#10b981',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context) {
            return `Month: ${context[0].label}`;
          },
          label: function(context) {
            return `Total Admins: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { 
          stepSize: 1,
          color: '#6b7280',
          font: {
            size: 12
          }
        },
        grid: {
          color: '#f3f4f6',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: '#6b7280',
          font: {
            size: 12
          }
        },
        grid: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      point: {
        hoverRadius: 8,
        hoverBorderWidth: 2
      }
    }
  };

  // Custom styles
  const styles = {
    page: {
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    },
    header: {
      marginBottom: '32px'
    },
    headerTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      margin: '0'
    },
    mainLayout: {
      display: 'grid',
      gridTemplateColumns: '1fr 400px',
      gap: '32px',
      alignItems: 'start'
    },
    formCard: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden'
    },
    formContainer: {
      padding: '32px'
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '18px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '24px',
      paddingBottom: '12px',
      borderBottom: '2px solid #f1f5f9'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '24px',
      marginBottom: '32px'
    },
    fullWidth: {
      gridColumn: '1 / -1'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    input: {
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      backgroundColor: 'white',
      outline: 'none'
    },
    submitButton: {
      width: '100%',
      padding: '16px 24px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    statsColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    modal: {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '1000'
    },
    modalContent: {
      background: 'white',
      borderRadius: '20px',
      padding: '32px',
      maxWidth: '500px',
      width: '90vw',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
    },
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px'
    },
    modalTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '20px',
      fontWeight: '600',
      color: '#059669'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      color: '#6b7280'
    },
    modalGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    },
    infoCard: {
      background: '#f8fafc',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    },
    infoLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#6b7280',
      marginBottom: '4px'
    },
    infoValue: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f2937'
    },
    modalFooter: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end'
    },
    modalButton: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    primaryButton: {
      background: '#10b981',
      color: 'white'
    },
    secondaryButton: {
      background: '#f1f5f9',
      color: '#374151'
    }
  };

  return (
    <div className="records-page">
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}
      </style>
      
      {/* Modern Header - Admin Management */}
      <div className="modern-records-header">
        <div className="modern-records-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Admin Management
        </div>
        <button 
          onClick={openAddModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="m22 21-2-2"></path>
            <path d="M16 16h6"></path>
          </svg>
          Add Admin
        </button>
      </div>

      {/* Search Bar */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e2e8f0',
        marginBottom: '24px'
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6b7280'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search officers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease',
              backgroundColor: '#f8fafc'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#10b981';
              e.target.style.backgroundColor = 'white';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
              e.target.style.backgroundColor = '#f8fafc';
            }}
          />
        </div>
      </div>

      {/* Admin List */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <h3 style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: '#374151'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            Officer List ({filteredAdmins.length} {searchTerm ? `of ${admins.length}` : ''})
          </h3>
        </div>

        {listLoading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px',
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
            Loading officers...
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            color: '#6b7280',
            textAlign: 'center'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '16px', opacity: 0.5 }}>
              {searchTerm ? (
                <>
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </>
              ) : (
                <>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </>
              )}
            </svg>
            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              {searchTerm ? 'No administrators match your search' : 'No administrators found'}
            </div>
            <div style={{ fontSize: '14px' }}>
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first administrator'}
            </div>
          </div>
        ) : (
          <div style={{ padding: '0' }}>
            {filteredAdmins.map((admin, index) => (
              <div key={admin.id || index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: index < filteredAdmins.length - 1 ? '1px solid #f1f5f9' : 'none',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    {admin.firstName ? admin.firstName.charAt(0).toUpperCase() : 'A'}
                    {admin.lastName ? admin.lastName.charAt(0).toUpperCase() : 'D'}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '4px'
                    }}>
                      {`${admin.firstName || 'Unknown'} ${admin.middleName ? admin.middleName + ' ' : ''}${admin.lastName || 'Admin'}`}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      {admin.email || 'No email provided'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: '#dcfce7',
                    color: '#166534',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#22c55e'
                    }}></div>
                    Active
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    Added {formatDate(admin.createdAt)}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => handleDropdownToggle(admin.id)}
                      style={{
                        padding: '6px',
                        border: 'none',
                        background: activeDropdown === admin.id ? '#f1f5f9' : 'none',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        color: activeDropdown === admin.id ? '#374151' : '#6b7280',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        if (activeDropdown !== admin.id) {
                          e.target.style.backgroundColor = '#f1f5f9';
                          e.target.style.color = '#374151';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (activeDropdown !== admin.id) {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#6b7280';
                        }
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {activeDropdown === admin.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                        border: '1px solid #e2e8f0',
                        minWidth: '180px',
                        zIndex: 1000,
                        marginTop: '4px'
                      }}>
                        <div style={{ padding: '8px 0' }}>
                          <button
                            onClick={() => handleEditAdmin(admin)}
                            style={{
                              width: '100%',
                              padding: '8px 16px',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '14px',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                            Edit Details
                          </button>
                          
                          <button
                            onClick={() => handleResetPassword(admin)}
                            style={{
                              width: '100%',
                              padding: '8px 16px',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '14px',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                              <circle cx="12" cy="16" r="1"></circle>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Reset Password
                          </button>
                          
                          <button
                            onClick={() => handleToggleStatus(admin)}
                            style={{
                              width: '100%',
                              padding: '8px 16px',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '14px',
                              color: admin.status === 'active' ? '#dc2626' : '#059669',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            {admin.status === 'active' ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="6" y="4" width="4" height="16"></rect>
                                <rect x="14" y="4" width="4" height="16"></rect>
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5,3 19,12 5,21 5,3"></polygon>
                              </svg>
                            )}
                            {admin.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          
                          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
                          
                          <button
                            onClick={() => handleViewActivity(admin)}
                            style={{
                              width: '100%',
                              padding: '8px 16px',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '14px',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14,2 14,8 20,8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                            View Activity Log
                          </button>
                          
                          <button
                            onClick={() => handleSendEmail(admin)}
                            style={{
                              width: '100%',
                              padding: '8px 16px',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '14px',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                              <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            Send Email
                          </button>
                          
                          <button
                            onClick={() => handleViewLoginHistory(admin)}
                            style={{
                              width: '100%',
                              padding: '8px 16px',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '14px',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12,6 12,12 16,14"></polyline>
                            </svg>
                            View Login History
                          </button>
                          
                          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }}></div>
                          
                          <button
                            onClick={() => handleDeleteAdmin(admin)}
                            style={{
                              width: '100%',
                              padding: '8px 16px',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '14px',
                              color: '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Delete Admin
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click outside handler */}
      {activeDropdown && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 999
          }}
          onClick={() => setActiveDropdown(null)}
        />
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div style={styles.modal} onClick={closeAllModals}>
          <div style={{
            ...styles.modalContent,
            maxWidth: '500px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '20px',
                fontWeight: '600',
                color: '#374151',
                margin: 0
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
                Edit Officer
              </h3>
              <button style={styles.closeButton} onClick={closeAllModals}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px',
              marginBottom: '24px'
            }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>First Name</label>
                <input
                  type="text"
                  value={editFormData.firstName || ''}
                  onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                  style={styles.input}
                  placeholder="Enter first name"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Last Name</label>
                <input
                  type="text"
                  value={editFormData.lastName || ''}
                  onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                  style={styles.input}
                  placeholder="Enter last name"
                />
              </div>
              <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                <label style={styles.label}>Middle Name</label>
                <input
                  type="text"
                  value={editFormData.middleName || ''}
                  onChange={(e) => setEditFormData({...editFormData, middleName: e.target.value})}
                  style={styles.input}
                  placeholder="Enter middle name (optional)"
                />
              </div>
              <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  style={styles.input}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={closeAllModals} style={{...styles.modalButton, ...styles.secondaryButton}}>Cancel</button>
              <button style={{...styles.modalButton, ...styles.primaryButton}}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAdmin && (
        <div style={styles.modal} onClick={closeAllModals}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '20px',
                fontWeight: '600',
                color: '#dc2626',
                margin: 0
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Delete Officer
              </h3>
              <button style={styles.closeButton} onClick={closeAllModals}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: '#374151', marginBottom: '16px' }}>
                Are you sure you want to delete <strong>{selectedAdmin.firstName} {selectedAdmin.lastName}</strong>?
              </p>
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                color: '#dc2626',
                fontSize: '14px'
              }}>
                <strong>Warning:</strong> This action cannot be undone. The administrator will lose access immediately.
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={closeAllModals} style={{...styles.modalButton, ...styles.secondaryButton}}>Cancel</button>
              <button style={{...styles.modalButton, background: '#dc2626', color: 'white'}}>Delete Officer</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedAdmin && (
        <div style={styles.modal} onClick={closeAllModals}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '20px',
                fontWeight: '600',
                color: '#374151',
                margin: 0
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Reset Password
              </h3>
              <button style={styles.closeButton} onClick={closeAllModals}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: '#374151', marginBottom: '16px' }}>
                Reset password for <strong>{selectedAdmin.firstName} {selectedAdmin.lastName}</strong>?
              </p>
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                padding: '12px',
                color: '#92400e',
                fontSize: '14px'
              }}>
                A new temporary password will be generated and sent to {selectedAdmin.email}
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={closeAllModals} style={{...styles.modalButton, ...styles.secondaryButton}}>Cancel</button>
              <button style={{...styles.modalButton, background: '#f59e0b', color: 'white'}}>Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Modal */}
      {showActivityModal && selectedAdmin && (
        <div style={styles.modal} onClick={closeAllModals}>
          <div style={{
            ...styles.modalContent,
            maxWidth: '700px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '20px',
                fontWeight: '600',
                color: '#374151',
                margin: 0
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                </svg>
                Activity Log - {selectedAdmin.firstName} {selectedAdmin.lastName}
              </h3>
              <button style={styles.closeButton} onClick={closeAllModals}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {/* Mock activity data */}
                {[
                  { action: 'Logged in', time: '2 hours ago', ip: '192.168.1.1' },
                  { action: 'Approved visit request #1234', time: '3 hours ago', ip: '192.168.1.1' },
                  { action: 'Updated inmate record', time: '1 day ago', ip: '192.168.1.1' },
                  { action: 'Logged in', time: '2 days ago', ip: '192.168.1.1' }
                ].map((activity, index) => (
                  <div key={index} style={{
                    padding: '12px 16px',
                    borderBottom: index < 3 ? '1px solid #f1f5f9' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#374151' }}>{activity.action}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>IP: {activity.ip}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={closeAllModals} style={{...styles.modalButton, ...styles.primaryButton}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Login History Modal */}
      {showLoginHistoryModal && selectedAdmin && (
        <div style={styles.modal} onClick={closeAllModals}>
          <div style={{
            ...styles.modalContent,
            maxWidth: '600px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '20px',
                fontWeight: '600',
                color: '#374151',
                margin: 0
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                Login History - {selectedAdmin.firstName} {selectedAdmin.lastName}
              </h3>
              <button style={styles.closeButton} onClick={closeAllModals}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {/* Mock login history */}
                {[
                  { date: 'Oct 3, 2025 2:30 PM', location: 'Manila, Philippines', device: 'Chrome on Windows', status: 'Success' },
                  { date: 'Oct 3, 2025 8:15 AM', location: 'Manila, Philippines', device: 'Chrome on Windows', status: 'Success' },
                  { date: 'Oct 2, 2025 5:45 PM', location: 'Manila, Philippines', device: 'Chrome on Windows', status: 'Success' },
                  { date: 'Oct 2, 2025 9:20 AM', location: 'Manila, Philippines', device: 'Chrome on Windows', status: 'Failed' }
                ].map((login, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    borderBottom: index < 3 ? '1px solid #f1f5f9' : 'none'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{ fontWeight: '500', color: '#374151' }}>{login.date}</div>
                      <div style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: login.status === 'Success' ? '#dcfce7' : '#fef2f2',
                        color: login.status === 'Success' ? '#166534' : '#dc2626'
                      }}>
                        {login.status}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                      📍 {login.location}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      💻 {login.device}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={closeAllModals} style={{...styles.modalButton, ...styles.primaryButton}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddModal && (
        <div style={styles.modal} onClick={closeAddModal}>
          <div style={{
            ...styles.modalContent,
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '20px',
                fontWeight: '600',
                color: '#374151',
                margin: 0
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="m22 21-2-2"></path>
                  <path d="M16 16h6"></path>
                </svg>
                Add New Officer
              </h3>
              <button style={styles.closeButton} onClick={closeAddModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '20px',
                marginBottom: '24px'
              }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    style={styles.input}
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    style={styles.input}
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    required
                  />
                </div>
                
                <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                  <label style={styles.label}>Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    style={styles.input}
                    placeholder="Enter middle name (optional)"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                
                <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                  <label style={styles.label}>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    style={styles.input}
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Password *</label>
                  <input
                    type="password"
                    name="password"
                    style={styles.input}
                    placeholder="Enter password (min. 6 characters)"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    required
                    minLength={6}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    style={styles.input}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.style.borderColor = '#10b981'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    required
                  />
                </div>
              </div>
              
              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '24px',
                  color: '#dc2626',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  {error}
                </div>
              )}
              
              <div style={styles.modalFooter}>
                <button 
                  type="button"
                  onClick={closeAddModal} 
                  style={{...styles.modalButton, ...styles.secondaryButton}}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{
                    ...styles.modalButton,
                    ...styles.primaryButton,
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                          <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Add Officer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && addedAdmin && (
        <div style={styles.modal} onClick={closeSuccessModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
                Administrator Added Successfully!
              </h3>
              <button style={styles.closeButton} onClick={closeSuccessModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div style={styles.modalGrid}>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Full Name</div>
                <div style={styles.infoValue}>
                  {`${addedAdmin.firstName} ${addedAdmin.middleName ? addedAdmin.middleName + ' ' : ''}${addedAdmin.lastName}`}
                </div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Email Address</div>
                <div style={styles.infoValue}>{addedAdmin.email}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Role</div>
                <div style={styles.infoValue}>Administrator</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Status</div>
                <div style={styles.infoValue}>Active</div>
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button 
                onClick={closeSuccessModal} 
                style={{...styles.modalButton, ...styles.secondaryButton}}
              >
                Close
              </button>
              <button 
                onClick={() => {
                  closeSuccessModal();
                  openAddModal();
                }} 
                style={{...styles.modalButton, ...styles.primaryButton}}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Add Another Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddAdmin;