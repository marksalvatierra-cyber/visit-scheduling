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
  };

  const handleVerifyUser = async (userId, action) => {
    try {
      const newStatus = action === 'approve' ? 'verified' : 'rejected';
      
      await firebaseService.updateUserProfile(userId, {
        profileStatus: newStatus,
        verifiedAt: new Date().toISOString(),
        verifiedBy: firebaseService.auth.currentUser.uid
      });

      // Create notification for the user
      await firebaseService.createNotification({
        userId: userId,
        title: action === 'approve' ? 'Account Verified' : 'Account Verification Rejected',
        message: action === 'approve' 
          ? 'Your account has been verified. You can now submit visit requests.'
          : 'Your account verification was rejected. Please contact support for more information.',
        type: action === 'approve' ? 'success' : 'error',
        read: false
      });

      // Refresh users list
      await fetchUsers();
      handleCloseModal();
      
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
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Verification Details</h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="modal-body">
              {/* User Information */}
              <div className="info-section">
                <h4>Personal Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name:</label>
                    <span>{selectedUser.fullName}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Phone:</label>
                    <span>{selectedUser.mobileNumber}</span>
                  </div>
                  <div className="info-item">
                    <label>Country:</label>
                    <span>{selectedUser.country}</span>
                  </div>
                  <div className="info-item">
                    <label>Address:</label>
                    <span>{selectedUser.completeAddress}</span>
                  </div>
                  <div className="info-item">
                    <label>Affiliation:</label>
                    <span>{selectedUser.affiliation}</span>
                  </div>
                  <div className="info-item">
                    <label>ID Type:</label>
                    <span>{selectedUser.idType?.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                  <div className="info-item">
                    <label>Status:</label>
                    {getStatusBadge(selectedUser.profileStatus)}
                  </div>
                </div>
              </div>

              {/* ID Document */}
              <div className="info-section">
                <h4>Submitted ID Document</h4>
                {selectedUser.idFile?.base64 ? (
                  <div className="id-preview">
                    <img 
                      src={selectedUser.idFile.base64} 
                      alt="User ID" 
                      style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                    <div className="id-info">
                      <p><strong>File Name:</strong> {selectedUser.idFile.fileName}</p>
                      <p><strong>File Size:</strong> {(selectedUser.idFile.fileSize / 1024).toFixed(2)} KB</p>
                      <p><strong>Uploaded:</strong> {new Date(selectedUser.idFile.uploadedAt).toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="no-id">
                    <p>No ID document submitted</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {selectedUser.profileStatus === 'pending_verification' && (
              <div className="modal-actions">
                <button 
                  className="reject-btn"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reject this user?')) {
                      handleVerifyUser(selectedUser.id, 'reject');
                    }
                  }}
                >
                  Reject
                </button>
                <button 
                  className="approve-btn"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to verify this user?')) {
                      handleVerifyUser(selectedUser.id, 'approve');
                    }
                  }}
                >
                  Approve & Verify
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyUsers;
