import React, { useState, useEffect } from 'react';
import firebaseService from '../firebase-services';
import './VerifyUsers.css';

const VerifyUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'verified', 'rejected'
  const [searchTerm, setSearchTerm] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await firebaseService.getAllUsers();
      // Filter to only show client users (not admins/officers)
      const clientUsers = allUsers.filter(user => user.role === 'client' || user.userType === 'client');
      setUsers(clientUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setRejectionReason('');
  };

  const handleOpenRejectModal = () => {
    setShowRejectModal(true);
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
  };

  const handleVerifyUser = async (userId, action, reason = '') => {
    try {
      const newStatus = action === 'approve' ? 'verified' : 'rejected';
      
      const updateData = {
        profileStatus: newStatus,
        verifiedAt: new Date().toISOString(),
        verifiedBy: firebaseService.auth.currentUser.uid
      };

      // Add rejection reason if rejecting
      if (action === 'reject' && reason) {
        updateData.rejectionReason = reason;
      }

      await firebaseService.updateUserProfile(userId, updateData);

      // Create notification for the user
      await firebaseService.createNotification({
        userId: userId,
        title: action === 'approve' ? 'Account Verified' : 'Account Verification Rejected',
        message: action === 'approve' 
          ? 'Your account has been verified. You can now submit visit requests.'
          : reason 
            ? `Your account verification was rejected. Reason: ${reason}`
            : 'Your account verification was rejected. Please contact support for more information.',
        type: action === 'approve' ? 'success' : 'error',
        read: false
      });

      // Refresh users list
      await fetchUsers();
      handleCloseModal();
      handleCloseRejectModal();
      
      alert(`User ${action === 'approve' ? 'verified' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  const getFilteredUsers = () => {
    let filtered = users;

    // Filter by status
    if (filter === 'pending') {
      filtered = filtered.filter(user => user.profileStatus === 'pending_verification');
    } else if (filter === 'verified') {
      filtered = filtered.filter(user => user.profileStatus === 'verified');
    } else if (filter === 'rejected') {
      filtered = filtered.filter(user => user.profileStatus === 'rejected');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobileNumber?.includes(searchTerm)
      );
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsers();

  const getStatusBadge = (status) => {
    const badges = {
      'pending_verification': { label: 'Pending', color: '#f59e0b' },
      'verified': { label: 'Verified', color: '#10b981' },
      'rejected': { label: 'Rejected', color: '#ef4444' }
    };
    const badge = badges[status] || { label: status, color: '#6b7280' };
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: `${badge.color}15`,
        color: badge.color
      }}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="verify-users-container">
        <div className="loading-spinner">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="verify-users-container">
      {/* Header */}
      <div className="verify-header">
        <div className="verify-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h2>User Verification</h2>
        </div>
        <button className="refresh-btn" onClick={fetchUsers}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="verify-filters">
        <div className="filter-tabs">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({users.length})
          </button>
          <button 
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending ({users.filter(u => u.profileStatus === 'pending_verification').length})
          </button>
          <button 
            className={filter === 'verified' ? 'active' : ''}
            onClick={() => setFilter('verified')}
          >
            Verified ({users.filter(u => u.profileStatus === 'verified').length})
          </button>
          <button 
            className={filter === 'rejected' ? 'active' : ''}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({users.filter(u => u.profileStatus === 'rejected').length})
          </button>
        </div>
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input 
            type="text" 
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="verify-table-container">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <p>No users found</p>
          </div>
        ) : (
          <table className="verify-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Registration Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-name">
                      <div className="avatar">
                        {user.fullName?.charAt(0) || 'U'}
                      </div>
                      <span>{user.fullName || 'N/A'}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.mobileNumber || 'N/A'}</td>
                  <td>{new Date(user.registrationDate).toLocaleDateString()}</td>
                  <td>{getStatusBadge(user.profileStatus)}</td>
                  <td>
                    <button 
                      className="view-btn"
                      onClick={() => handleViewUser(user)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for viewing user details */}
      {showModal && selectedUser && (
        <div style={{
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
        }} onClick={handleCloseModal}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '700px',
            width: '90vw',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            maxHeight: '80vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                User Verification Details
              </h3>
              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                color: '#6b7280'
              }} onClick={handleCloseModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px',
              margin: '0 0 24px 0'
            }}>
              Review user information and submitted documents
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Full Name
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {selectedUser.fullName || 'N/A'}
                </div>
              </div>
              
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Email Address
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {selectedUser.email}
                </div>
              </div>
              
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Mobile Number
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {selectedUser.mobileNumber || 'N/A'}
                </div>
              </div>
              
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Country
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {selectedUser.country || 'N/A'}
                </div>
              </div>
              
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                gridColumn: '1 / -1'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Complete Address
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {selectedUser.completeAddress || 'N/A'}
                </div>
              </div>
              
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Affiliation
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {selectedUser.affiliation || 'N/A'}
                </div>
              </div>
              
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  ID Type
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {selectedUser.idType?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
                </div>
              </div>
              
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                gridColumn: '1 / -1'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px'
                }}>
                  Verification Status
                </div>
                <div>
                  {getStatusBadge(selectedUser.profileStatus)}
                </div>
              </div>
            </div>

            {/* ID Document Section */}
            {selectedUser.idFile?.base64 && (
              <div style={{
                marginBottom: '24px',
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '12px'
                }}>
                  Submitted ID Document
                </div>
                <img 
                  src={selectedUser.idFile.base64} 
                  alt="User ID" 
                  style={{ 
                    width: '100%',
                    maxWidth: '100%', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb',
                    marginBottom: '12px'
                  }}
                />
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  display: 'grid',
                  gap: '4px'
                }}>
                  <div><strong>File Name:</strong> {selectedUser.idFile.fileName}</div>
                  <div><strong>File Size:</strong> {(selectedUser.idFile.fileSize / 1024).toFixed(2)} KB</div>
                  <div><strong>Uploaded:</strong> {new Date(selectedUser.idFile.uploadedAt).toLocaleString()}</div>
                </div>
              </div>
            )}

            {!selectedUser.idFile?.base64 && (
              <div style={{
                marginBottom: '24px',
                background: '#fef2f2',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                No ID document submitted
              </div>
            )}
            
            {/* Actions */}
            {selectedUser.profileStatus === 'pending_verification' && (
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#fef2f2',
                    color: '#dc2626'
                  }}
                  onClick={handleOpenRejectModal}
                  onMouseOver={(e) => e.target.style.background = '#fee2e2'}
                  onMouseOut={(e) => e.target.style.background = '#fef2f2'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                  Reject
                </button>
                <button
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#10b981',
                    color: 'white'
                  }}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to verify this user?')) {
                      handleVerifyUser(selectedUser.id, 'approve');
                    }
                  }}
                  onMouseOver={(e) => e.target.style.background = '#059669'}
                  onMouseOut={(e) => e.target.style.background = '#10b981'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Approve & Verify
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: '1001'
        }} onClick={handleCloseRejectModal}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '90vw',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Reject Verification
              </h3>
              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                color: '#6b7280'
              }} onClick={handleCloseRejectModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px',
              margin: '0 0 24px 0'
            }}>
              Please provide a reason for rejecting <strong>{selectedUser.fullName}'s</strong> verification. This will be sent to the user.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="E.g., ID document is unclear, expired ID, information mismatch..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              {rejectionReason.trim() && (
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '8px',
                  margin: '8px 0 0 0'
                }}>
                  {rejectionReason.length} characters
                </p>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f1f5f9',
                  color: '#374151'
                }}
                onClick={handleCloseRejectModal}
                onMouseOver={(e) => e.target.style.background = '#e2e8f0'}
                onMouseOut={(e) => e.target.style.background = '#f1f5f9'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
                Cancel
              </button>
              <button
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: rejectionReason.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: rejectionReason.trim() ? '#dc2626' : '#9ca3af',
                  color: 'white',
                  opacity: rejectionReason.trim() ? 1 : 0.6
                }}
                onClick={() => {
                  if (rejectionReason.trim()) {
                    handleVerifyUser(selectedUser.id, 'reject', rejectionReason.trim());
                  }
                }}
                disabled={!rejectionReason.trim()}
                onMouseOver={(e) => rejectionReason.trim() && (e.target.style.background = '#b91c1c')}
                onMouseOut={(e) => rejectionReason.trim() && (e.target.style.background = '#dc2626')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Reject & Send Reason
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyUsers;
