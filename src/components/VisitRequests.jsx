import React, { useState, useEffect } from 'react';
import firebaseService from '../firebase-services.js';
import QRCode from 'qrcode';
import './VisitRequests.css';
import './shared.css';
import { useSearchParams } from 'react-router-dom';

const VisitRequests = ({ currentOfficer = null }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [visitRequests, setVisitRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [currentAction, setCurrentAction] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [qrCodeData, setQrCodeData] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const officers = [
    'Joshua M. Santos',
    'John L. Ramos',
    'Maria G. Cruz',
    'Pedro A. Martinez'
  ];

  // Read the filter from URL parameters on component mount
  useEffect(() => {
    const filterFromUrl = searchParams.get('filter');
    if (filterFromUrl && ['pending', 'approved', 'rejected', 'reschedule'].includes(filterFromUrl)) {
      setStatusFilter(filterFromUrl);
    }
  }, [searchParams]);

  // Helper functions for modal
  const getActionTitle = () => {
    switch (currentAction) {
      case 'approve': return 'Approve Visit Request';
      case 'reject': return 'Reject Visit Request';
      case 'reschedule': return 'Request Reschedule';
      default: return 'Officer Assignment';
    }
  };

  const getActionColor = () => {
    switch (currentAction) {
      case 'approve': return '#10b981';
      case 'reject': return '#ef4444';
      case 'reschedule': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  // Load visit requests from Firebase
  useEffect(() => {
    const loadVisitRequests = async () => {
      try {
        setLoading(true);
        
        // Check authentication before loading data
        const currentUser = await firebaseService.getCurrentUser();
        console.log('Current user authentication status:', currentUser ? 'Authenticated' : 'Not authenticated');
        
        if (!currentUser) {
          console.warn('User not authenticated, using fallback data');
          // Fallback to mock data if not authenticated
          setVisitRequests([
            {
              id: 1,
              clientName: 'Maria Santos',
              clientEmail: 'maria.santos@email.com',
              inmateName: 'Juan Santos',
              visitDate: '2024-01-15',
              visitTime: '14:00',
              status: 'pending',
              requestDate: '2024-01-10',
              submittedAt: '2024-01-10',
              relationship: 'Wife',
              purpose: 'Family Visit',
              reason: 'Family Visit'
            },
            {
              id: 2,
              clientName: 'Robert Johnson',
              clientEmail: 'robert.johnson@email.com',
              inmateName: 'Michael Johnson',
              visitDate: '2024-01-16',
              visitTime: '10:30',
              status: 'approved',
              requestDate: '2024-01-11',
              submittedAt: '2024-01-11',
              relationship: 'Father',
              purpose: 'Legal Consultation',
              reason: 'Legal Consultation'
            }
          ]);
          return;
        }
        
        const requests = await firebaseService.getVisitRequests();
        setVisitRequests(requests);
      } catch (error) {
        console.error('Error loading visit requests:', error);
        // Fallback to mock data if Firebase fails
        setVisitRequests([
          {
            id: 1,
            clientName: 'Maria Santos',
            clientEmail: 'maria.santos@email.com',
            inmateName: 'Juan Santos',
            visitDate: '2024-01-15',
            visitTime: '14:00',
            status: 'pending',
            requestDate: '2024-01-10',
            submittedAt: '2024-01-10',
            relationship: 'Wife',
            purpose: 'Family Visit',
            reason: 'Family Visit'
          },
          {
            id: 2,
            clientName: 'Robert Johnson',
            clientEmail: 'robert.johnson@email.com',
            inmateName: 'Michael Johnson',
            visitDate: '2024-01-16',
            visitTime: '10:30',
            status: 'approved',
            requestDate: '2024-01-11',
            submittedAt: '2024-01-11',
            relationship: 'Father',
            purpose: 'Legal Consultation',
            reason: 'Legal Consultation'
          },
          {
            id: 3,
            clientName: 'Sarah Williams',
            clientEmail: 'sarah.williams@email.com',
            inmateName: 'David Williams',
            visitDate: '2024-01-17',
            visitTime: '16:00',
            status: 'rejected',
            requestDate: '2024-01-12',
            submittedAt: '2024-01-12',
            relationship: 'Sister',
            purpose: 'Family Visit',
            reason: 'Family Visit'
          },
          {
            id: 4,
            clientName: 'Carlos Rodriguez',
            clientEmail: 'carlos.rodriguez@email.com',
            inmateName: 'Luis Rodriguez',
            visitDate: '2024-01-18',
            visitTime: '11:00',
            status: 'reschedule',
            requestDate: '2024-01-13',
            submittedAt: '2024-01-13',
            relationship: 'Brother',
            purpose: 'Legal Consultation',
            reason: 'Legal Consultation'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadVisitRequests();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'badge-approved';
      case 'pending': return 'badge-pending';
      case 'reschedule': return 'badge-reschedule';
      case 'rejected': return 'badge-rejected';
      case 'cancelled': return 'badge-cancelled';
      default: return 'badge-pending';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending';
      case 'reschedule': return 'Reschedule';
      case 'rejected': return 'Rejected';
      case 'cancelled': return 'Cancelled';
      default: return 'Pending';
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredRequests = visitRequests.filter(request => {
    const matchesSearch = 
      request.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.inmateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAction = (action, request) => {
    setCurrentAction(action);
    setSelectedRequest(request);
    
    // If currentOfficer is provided (officer dashboard), auto-select officer
    if (currentOfficer) {
      setSelectedOfficer(currentOfficer);
    }
    
    if (action === 'reject' || action === 'reschedule') {
      setShowOfficerModal(true);
    } else if (action === 'approve') {
      setShowOfficerModal(true);
    }
  };

  // FIXED confirmOfficerAction function
  const confirmOfficerAction = async () => {
    // For officer dashboard, use currentOfficer; for admin dashboard, require selection
    const officerName = currentOfficer || selectedOfficer;
    
    if (!officerName) {
      alert('Please select an officer');
      return;
    }

    if ((currentAction === 'reject' || currentAction === 'reschedule') && !actionReason.trim()) {
      alert('Please provide a reason');
      return;
    }

    setConfirmLoading(true);

    try {
      console.log('=== CONFIRM OFFICER ACTION START ===');
      
      // Check authentication status first
      const currentUser = await firebaseService.getCurrentUser();
      console.log('Current user authentication:', currentUser);
      
      if (!currentUser) {
        throw new Error('User not authenticated. Please log in again.');
      }
      
      console.log('Current action:', currentAction);
      console.log('Selected request:', selectedRequest);
      console.log('Selected officer:', selectedOfficer);
      console.log('Action reason:', actionReason);

      // Map the action to the correct status
      let newStatus;
      switch (currentAction) {
        case 'approve':
          newStatus = 'approved';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        case 'reschedule':
          newStatus = 'reschedule';
          break;
        default:
          newStatus = currentAction;
      }

      console.log('New status will be:', newStatus);

      // Prepare update data
      const updateData = {
        status: newStatus,
        reviewedBy: officerName,
        reviewedAt: new Date().toISOString()
      };

      console.log('🔍 DEBUG: Officer name being sent to Firebase:', officerName);
      console.log('🔍 DEBUG: Current officer prop:', currentOfficer);
      console.log('🔍 DEBUG: Selected officer:', selectedOfficer);

      // Add reason if provided — store admin notes in specific fields and avoid overwriting the user's original 'reason'
      if (actionReason.trim()) {
        if (currentAction === 'reject') {
          updateData.rejectionReason = actionReason.trim();
        } else if (currentAction === 'reschedule') {
          updateData.rescheduleReason = actionReason.trim();
        } else {
          // For other actions (if any) store in generic reason
          updateData.reason = actionReason.trim();
        }
      }

      console.log('Update data being sent:', updateData);

      // Update the request in Firebase
      const result = await firebaseService.updateVisitRequest(selectedRequest.id, updateData);
      console.log('Firebase update result:', result);

      if (result.success) {
        console.log('Firebase update successful, updating local state...');
        
        // Update local state immediately
        const updatedRequests = visitRequests.map(request => {
          if (request.id === selectedRequest.id) {
            const updated = { ...request, ...updateData };
            console.log('Updated request in local state:', updated);
            return updated;
          }
          return request;
        });

        console.log('Setting updated requests array');
        setVisitRequests(updatedRequests);
        
        // Reset modal state
        setShowOfficerModal(false);
        if (!currentOfficer) {
          setSelectedOfficer('');
        }
        setActionReason('');
        setCurrentAction('');
        setSelectedRequest(null);

        // Show QR code for approved requests
        if (currentAction === 'approve') {
          console.log('Generating QR code for approved request...');
          await generateAndShowQRCode(selectedRequest);
        }

        // Send notifications for rejected and rescheduled requests
        if (currentAction === 'reject') {
          console.log('Sending rejection notification...');
          await sendRejectionNotification(selectedRequest, actionReason);
        }

        if (currentAction === 'reschedule') {
          console.log('Sending reschedule notification...');
          await sendRescheduleNotification(selectedRequest, actionReason);
        }

        console.log('Action completed successfully');
        
        // Show success message
        const actionText = currentAction === 'approve' ? 'approved' : 
                          currentAction === 'reject' ? 'rejected' : 'scheduled for reschedule';
        alert(`Visit request has been ${actionText} successfully.`);
        
      } else {
        console.error('Firebase update failed:', result.error);
        throw new Error(result.error || 'Failed to update request');
      }
    } catch (error) {
      console.error('Error updating visit request:', error);
      alert(`Error updating request: ${error.message}`);
    } finally {
      setConfirmLoading(false);
      console.log('=== CONFIRM OFFICER ACTION END ===');
    }
  };

  const generateAndShowQRCode = async (request) => {
    try {
      console.log('🎫 Generating QR code for request:', request.id);
      
      // Create visit data for QR generation - include all relevant fields
      const visitData = {
        visitId: request.id,
        clientId: request.clientId,
        clientName: request.clientName,
        visitDate: request.visitDate,
        visitTime: request.visitTime,
        inmateName: request.inmateName,
        relationship: request.relationship,
        purpose: request.purpose || request.reason,
        reason: request.reason || request.purpose,
        clientEmail: request.clientEmail,
        approvedAt: new Date().toISOString(),
        expiresAt: new Date(new Date(request.visitDate).getTime() + 24 * 60 * 60 * 1000).toISOString()
      };

      // Generate and store QR code in Firebase
      const qrData = await firebaseService.generateVisitQRCode(visitData);
      
      if (!qrData) {
        throw new Error('Failed to generate QR code data');
      }

      console.log('✅ QR code stored in Firebase:', qrData);

      // Generate QR code image
      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeDataUrl(qrCodeUrl);
      setQrCodeData(qrData);
      setShowQrModal(true);

      // Send notification to client with QR code data
      await sendQRCodeNotification(request, qrData);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Error generating QR code: ' + error.message);
    }
  };

  const sendQRCodeNotification = async (request, qrData) => {
    try {
      const notificationData = {
        userId: request.clientId,
        title: 'Visit Request Approved! 🎉',
        message: `Great news! Your visit request for ${request.inmateName} on ${request.visitDate} has been approved. Your QR code is ready for entry verification.`,
        type: 'visit_approved',
        qrCodeData: qrData,
        visitDetails: {
          inmateName: request.inmateName,
          visitDate: request.visitDate,
          visitTime: request.visitTime,
          facility: 'Central Prison Camp Sablayan Penal Farm'
        },
        adminNotes: 'Please arrive 15 minutes early and bring valid ID. Show this QR code at the entrance.'
      };

      await firebaseService.createNotification(notificationData);
    } catch (error) {
      console.error('Error sending QR code notification:', error);
    }
  };

  const sendRejectionNotification = async (request, reason) => {
    try {
      const notificationData = {
        userId: request.clientId,
        title: 'Visit Request Update',
        message: `Your visit request for ${request.inmateName} on ${request.visitDate} could not be approved at this time.`,
        type: 'visit_rejected',
        rejectionReason: reason || 'Please contact administration for more details.',
        relatedRequestId: request.id,
        inmateName: request.inmateName,
        visitDate: request.visitDate,
        visitTime: request.visitTime,
        clientName: request.clientName
      };

      await firebaseService.createNotification(notificationData);
    } catch (error) {
      console.error('Error sending rejection notification:', error);
    }
  };

  const sendRescheduleNotification = async (request, reason) => {
    try {
      const notificationData = {
        userId: request.clientId,
        title: 'Visit Rescheduled',
        message: `Your visit for ${request.inmateName} needs to be rescheduled. Please contact administration for a new date.`,
        type: 'visit_rescheduled',
        rescheduleReason: reason || 'Administrative scheduling change.',
        relatedRequestId: request.id,
        inmateName: request.inmateName,
        visitDate: request.visitDate,
        visitTime: request.visitTime,
        clientName: request.clientName
      };

      await firebaseService.createNotification(notificationData);
    } catch (error) {
      console.error('Error sending reschedule notification:', error);
    }
  };

  const closeOfficerModal = () => {
    if (confirmLoading) return;
    setShowOfficerModal(false);
    if (!currentOfficer) {
      setSelectedOfficer('');
    }
    setActionReason('');
    setCurrentAction('');
    setSelectedRequest(null);
    setConfirmLoading(false);
  };

  const closeQrModal = () => {
    setShowQrModal(false);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRequest(null);
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  return (
    <div className="visit-requests-container">
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

        {/* Welcome Card - Just the top card */}
  <div className="modern-records-header">
        <div className="modern-records-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
<polyline points="14,2 14,8 20,8"></polyline>
<line x1="16" y1="13" x2="8" y2="13"></line>
<line x1="16" y1="17" x2="8" y2="17"></line>
<polyline points="10,9 9,9 8,9"></polyline>
          </svg>
          Visit Request
        </div>
          </div>

        {/* Compact Stats and Controls */}
        <div className="visit-controls">
          {/* Left side - Quick stats */}
          <div className="stats-summary">
            <div className="stat-item">
              <div className="stat-number">{filteredRequests.length}</div>
              <div className="stat-label">Total Requests</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{filteredRequests.filter(r => r.status === 'pending').length}</div>
              <div className="stat-label" >Pending Requests</div>
            </div>
          </div>

        {/* Right side - Search and Filter */}
        <div className="search-filter-group">
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="      Search by name, inmate, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="reschedule">Reschedule</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Visit Requests Table */}
      {loading ? (
        <div className="loading-container" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
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
          Loading visit requests...
        </div>
      ) : (
        <div className="visit-table-container">
          <div className="visit-table-header">
            <div className="header-cell">Visitor</div>
            <div className="header-cell">Inmate</div>
            <div className="header-cell">Visit Date</div>
            <div className="header-cell">Status</div>
            <div className="header-cell">Actions</div>
          </div>
          <div className="visit-table-body">
            {filteredRequests.map((request) => (
              <div key={request.id} className="visit-table-row">
                {/* Visitor Cell */}
                <div className="visitor-cell">
                  <div className="visitor-avatar">
                    {getInitials(request.clientName)}
                  </div>
                  <div className="visitor-info">
                    <div className="visitor-name">{request.clientName}</div>
                    <div className="visitor-email">{request.clientEmail}</div>
                    <div className="visitor-relationship">{request.relationship}</div>
                  </div>
                </div>
                
                {/* Inmate Cell */}
                <div className="inmate-cell">
                  <div className="inmate-name">{request.inmateName}</div>
                </div>
                
                {/* Visit Details */}
                <div className="visit-details-cell">
                  <div className="visit-date">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {new Date(request.visitDate).toLocaleDateString()}
                  </div>
                  <div className="visit-time">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                    {request.visitTime}
                  </div>
                  <div className="request-date">
                    Requested: {new Date(request.submittedAt).toLocaleDateString()}
                  </div>
                </div>
                
                {/* Status Cell */}
                <div className="status-cell">
                  <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </div>
                
                {/* Actions Cell */}
                <div className="actions-cell">
                  {request.status === 'pending' ? (
                    <div className="action-dropdown" style={{ position: "relative", display: "inline-block" }}>
                      <button className="action-btn view-btn">
                        <svg
                          className="action-arrow"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                        Actions
                      </button>
                      <div className="dropdown-menu">
                        <button className="dropdown-item approve" onClick={() => handleAction('approve', request)}>Accept</button>
                        <button className="dropdown-item reschedule" onClick={() => handleAction('reschedule', request)}>Reschedule</button>
                        <button className="dropdown-item reject" onClick={() => handleAction('reject', request)}>Reject</button>
                        <button className="dropdown-item view" onClick={() => viewDetails(request)}>View</button>
                      </div>
                    </div>
                  ) : (
                    <button className="action-btn view-btn" onClick={() => viewDetails(request)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      View
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredRequests.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
                No visit requests found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Modern Officer Selection Modal */}
      {showOfficerModal && (
        <div 
          className="modern-modal-overlay" 
          onClick={closeOfficerModal}
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000',
            backdropFilter: 'blur(4px)',
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              transform: 'scale(1)',
              transition: 'all 0.3s ease',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Fixed Header */}
            <div style={{
              padding: '24px 32px 16px 32px',
              borderBottom: '1px solid #f1f5f9',
              position: 'relative',
              flexShrink: 0
            }}>
              {/* Color indicator bar */}
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '4px',
                background: `linear-gradient(90deg, ${getActionColor()}, ${getActionColor()}dd)`,
                borderRadius: '20px 20px 0 0'
              }}></div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {/* Action Icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${getActionColor()}15, ${getActionColor()}25)`,
                    border: `2px solid ${getActionColor()}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: getActionColor()
                  }}>
                    {currentAction === 'approve' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4"></path>
                        <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z"></path>
                      </svg>
                    )}
                    {currentAction === 'reject' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    )}
                    {currentAction === 'reschedule' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12,6 12,12 16,14"></polyline>
                      </svg>
                    )}
                  </div>
                  
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#111827',
                      margin: '0 0 2px 0',
                      lineHeight: '1.2'
                    }}>
                      {getActionTitle()}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      margin: '0',
                      fontWeight: '500'
                    }}>
                      {selectedRequest && `${selectedRequest.clientName} → ${selectedRequest.inmateName}`}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={closeOfficerModal}
                  disabled={confirmLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: confirmLoading ? 'not-allowed' : 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    color: '#6b7280',
                    transition: 'all 0.2s ease',
                    opacity: confirmLoading ? 0.5 : 1
                  }}
                  onMouseOver={(e) => !confirmLoading && (e.target.style.background = '#f3f4f6')}
                  onMouseOut={(e) => !confirmLoading && (e.target.style.background = 'none')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Body Content */}
            <div style={{
              padding: '0 32px',
              overflow: 'auto',
              flexGrow: 1,
              minHeight: 0
            }}>
              {/* Officer Selection Section - Only show if no currentOfficer provided */}
              {!currentOfficer && (
              <div style={{
                marginBottom: '24px',
                paddingTop: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 1px 0'
                    }}>
                      Select Reviewing Officer
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      margin: '0'
                    }}>
                      Choose the officer who will process this request
                    </p>
                  </div>
                </div>
                
                <div style={{
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px',
                  transition: 'all 0.2s ease'
                }}>
                  <select
                    value={selectedOfficer}
                    onChange={(e) => setSelectedOfficer(e.target.value)}
                    disabled={confirmLoading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: 'white',
                      color: '#111827',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      opacity: confirmLoading ? 0.6 : 1,
                      cursor: confirmLoading ? 'not-allowed' : 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 12px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '14px',
                      paddingRight: '40px'
                    }}
                    onFocus={(e) => !confirmLoading && (e.target.style.borderColor = getActionColor())}
                    onBlur={(e) => !confirmLoading && (e.target.style.borderColor = '#e5e7eb')}
                  >
                    <option value="" disabled>-- Select an officer --</option>
                    {officers.map((officer, index) => (
                      <option key={index} value={officer}>{officer}</option>
                    ))}
                  </select>
                </div>
              </div>
              )}
              
              {/* Officer Info Display for Officer Dashboard */}
              {currentOfficer && (
                <div style={{
                  marginBottom: '24px',
                  paddingTop: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <div>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 1px 0'
                      }}>
                        Processing Officer
                      </h4>
                      <p style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        margin: '0'
                      }}>
                        This action will be recorded under your name
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {currentOfficer?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827'
                      }}>
                        {currentOfficer}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#6b7280'
                      }}>
                        Central Prison Camp Sablayan Penal Farm Officer
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Reason Section (for reject/reschedule) */}
              {(currentAction === 'reject' || currentAction === 'reschedule') && (
                <div style={{
                  marginBottom: '24px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: `linear-gradient(135deg, ${getActionColor()}, ${getActionColor()}cc)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                      </svg>
                    </div>
                    <div>
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827',
                        margin: '0 0 1px 0'
                      }}>
                        Provide Reason
                        <span style={{ color: getActionColor(), marginLeft: '4px' }}>*</span>
                      </h4>
                      <p style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        margin: '0'
                      }}>
                        Please explain the reason for this action
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px'
                  }}>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      rows="4"
                      placeholder={`Please provide a detailed reason for ${currentAction === 'reject' ? 'rejecting' : 'rescheduling'} this visit request...`}
                      disabled={confirmLoading}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        lineHeight: '1.4',
                        backgroundColor: 'white',
                        color: '#111827',
                        outline: 'none',
                        resize: 'vertical',
                        minHeight: '100px',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s ease',
                        opacity: confirmLoading ? 0.6 : 1
                      }}
                      onFocus={(e) => !confirmLoading && (e.target.style.borderColor = getActionColor())}
                      onBlur={(e) => !confirmLoading && (e.target.style.borderColor = '#e5e7eb')}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Footer with Action Buttons */}
            <div style={{
              padding: '16px 32px 24px 32px',
              borderTop: '1px solid #f1f5f9',
              flexShrink: 0,
              background: 'white'
            }}>
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button 
                  onClick={closeOfficerModal}
                  disabled={confirmLoading}
                  style={{
                    padding: '10px 20px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'white',
                    color: '#6b7280',
                    cursor: confirmLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: confirmLoading ? 0.6 : 1,
                    minWidth: '80px'
                  }}
                  onMouseOver={(e) => !confirmLoading && (e.target.style.background = '#f9fafb')}
                  onMouseOut={(e) => !confirmLoading && (e.target.style.background = 'white')}
                >
                  Cancel
                </button>
                
                <button 
                  onClick={confirmOfficerAction}
                  disabled={confirmLoading}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: confirmLoading 
                      ? `linear-gradient(135deg, ${getActionColor()}80, ${getActionColor()}60)` 
                      : `linear-gradient(135deg, ${getActionColor()}, ${getActionColor()}cc)`,
                    color: 'white',
                    cursor: confirmLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: confirmLoading ? 'none' : `0 4px 12px ${getActionColor()}30`
                  }}
                  onMouseOver={(e) => !confirmLoading && (e.target.style.transform = 'translateY(-1px)')}
                  onMouseOut={(e) => !confirmLoading && (e.target.style.transform = 'translateY(0)')}
                >
                  {confirmLoading ? (
                    <>
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        style={{ 
                          animation: 'spin 1s linear infinite'
                        }}
                      >
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                          <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4"></path>
                      </svg>
                      Confirm {currentAction.charAt(0).toUpperCase() + currentAction.slice(1)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && qrCodeData && (
        <div 
          onClick={closeQrModal}
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000',
            backdropFilter: 'blur(4px)',
            padding: '24px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              transform: 'scale(1)',
              transition: 'all 0.3s ease',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{
              padding: '24px 32px 16px 32px',
              borderBottom: '1px solid #f1f5f9',
              position: 'relative',
              flexShrink: 0
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '4px',
                background: 'linear-gradient(90deg, #10b981, #059669)',
                borderRadius: '20px 20px 0 0'
              }}></div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b98115, #10b98125)',
                    border: '2px solid #10b98130',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                  </div>
                  
                  <div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#111827',
                      margin: '0 0 2px 0',
                      lineHeight: '1.2'
                    }}>
                      Visit Approved! 🎉
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      margin: '0',
                      fontWeight: '500'
                    }}>
                      QR Code generated successfully
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={closeQrModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    color: '#6b7280',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseOut={(e) => e.target.style.background = 'none'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            <div style={{
              padding: '0 32px 24px 32px',
              overflow: 'auto',
              flexGrow: 1
            }}>
              {/* Success Message */}
              <div style={{
                textAlign: 'center',
                marginBottom: '24px',
                paddingTop: '16px'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: 'white',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </div>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  color: '#111827', 
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  Visit Request Approved Successfully
                </h4>
                <p style={{ 
                  margin: '0 0 6px 0', 
                  color: '#6b7280',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}>
                  The visit request has been approved and processed.
                </p>
                <p style={{ 
                  margin: '0', 
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  A QR code has been generated and sent to the client.
                </p>
              </div>

              {/* QR Code Section */}
              <div style={{
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <img 
                  src={qrCodeDataUrl} 
                  alt="Visit QR Code" 
                  style={{
                    width: '180px',
                    height: '180px',
                    margin: '0 auto 16px auto',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <div style={{ 
                  fontSize: '15px',
                  color: '#374151', 
                  marginBottom: '6px',
                  fontWeight: '600'
                }}>
                  QR Code for: {qrCodeData.clientName}
                </div>
                <div style={{ 
                  fontSize: '13px',
                  color: '#6b7280',
                  background: '#f1f5f9',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  display: 'inline-block'
                }}>
                  Visit: {qrCodeData.inmateName} on {new Date(qrCodeData.visitDate).toLocaleDateString()}
                </div>
              </div>

              {/* Action Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                paddingTop: '16px',
                borderTop: '1px solid #f1f5f9'
              }}>
                <button 
                  onClick={closeQrModal}
                  style={{
                    padding: '12px 28px',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                  Perfect! Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modern-modal-overlay" onClick={closeDetailsModal}>
          <div className="modern-modal-container landscape" onClick={(e) => e.stopPropagation()}>
            <div className="modern-modal-body">
              {/* Left Side - Visitor Information */}
              <div className="modern-modal-section">
                <div className="modern-modal-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Visitor Information
                </div>
                <div className="modern-modal-info-card" style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-color), #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: '600'
                  }}>
                    {getInitials(selectedRequest.clientName)}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '8px' }}>
                    {selectedRequest.clientName}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '24px' }}>
                    {selectedRequest.clientEmail}
                  </div>
                  
                  <div className="modern-modal-grid modern-modal-grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
                    <div className="modern-modal-info-card" style={{ padding: '20px' }}>
                      <div className="modern-modal-info-label">Relationship</div>
                      <div className="modern-modal-info-value" style={{ marginTop: '8px' }}>{selectedRequest.relationship}</div>
                    </div>
                    <div className="modern-modal-info-card" style={{ padding: '20px' }}>
                      <div className="modern-modal-info-label">Request Date</div>
                      <div className="modern-modal-info-value" style={{ marginTop: '8px' }}>{new Date(selectedRequest.submittedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div className="modern-modal-grid modern-modal-grid-2" style={{ gap: '16px' }}>
                    <div className="modern-modal-info-card" style={{ padding: '20px' }}>
                      <div className="modern-modal-info-label">Visit Purpose</div>
                      <div className="modern-modal-info-value" style={{ marginTop: '8px' }}>{selectedRequest.purpose || selectedRequest.reason || 'Not specified'}</div>
                    </div>
                    <div className="modern-modal-info-card" style={{ padding: '20px' }}>
                      <div className="modern-modal-info-label">Status</div>
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: selectedRequest.status === 'approved' ? '#10b981' : 
                                    selectedRequest.status === 'rejected' ? '#ef4444' : 
                                    selectedRequest.status === 'reschedule' ? '#f59e0b' : '#6b7280',
                          boxShadow: selectedRequest.status === 'approved' ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 
                                    selectedRequest.status === 'rejected' ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : 
                                    selectedRequest.status === 'reschedule' ? '0 0 0 3px rgba(245, 158, 11, 0.2)' : '0 0 0 3px rgba(107, 114, 128, 0.2)'
                        }}></div>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--gray-700)' }}>
                          {getStatusText(selectedRequest.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Visit Details */}
              <div className="modern-modal-section">  
                <div className="modern-modal-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Visit Details
                </div>
                
                <div className="modern-modal-info-card" style={{ padding: '24px', marginBottom: '16px' }}>
                  <div className="modern-modal-section-title" style={{ fontSize: '14px', marginBottom: '16px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                    Inmate Information
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '8px' }}>
                    {selectedRequest.inmateName}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                    {selectedRequest.purpose}
                  </div>
                </div>
                
                <div className="modern-modal-info-card" style={{ padding: '24px' }}>
                  <div className="modern-modal-section-title" style={{ fontSize: '14px', marginBottom: '16px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Visit Schedule
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '8px' }}>
                    {new Date(selectedRequest.visitDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                    {selectedRequest.visitTime}
                  </div>
                </div>
                {/* Reason card placed under Visit Schedule (hidden for approved requests) */}
                {selectedRequest.status !== 'approved' && (
                  <div className="modern-modal-info-card" style={{ padding: '24px', marginTop: '12px' }}>
                    <div className="modern-modal-section-title" style={{ fontSize: '14px', marginBottom: '12px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                      </svg>
                      Reason
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>
                      {selectedRequest.rejectionReason || selectedRequest.rescheduleReason || selectedRequest.reason || selectedRequest.purpose || 'Not specified'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitRequests;