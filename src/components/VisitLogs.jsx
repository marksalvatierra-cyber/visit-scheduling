import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import firebaseService from '../firebase-services';
import './VisitLogs.css';
import './shared.css';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed Visits' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'rescheduled', label: 'Rescheduled' },
  { value: 'cancelled', label: 'Cancelled' },
];

const VisitLogs = () => {
  const [searchParams] = useSearchParams();
  const [visits, setVisits] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadVisits();
  }, []);

  // Set initial filter from URL parameter
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && ['pending', 'approved', 'rejected', 'rescheduled', 'completed'].includes(filterParam)) {
      setStatusFilter(filterParam);
    }
  }, [searchParams]);

  const loadVisits = async () => {
    setLoading(true);
    setError('');
    try {
      const currentUser = await firebaseService.getCurrentUser();
      if (!currentUser) {
        setError('You must be logged in to view your visits.');
        return;
      }

      const visitRequests = await firebaseService.getVisitRequests(currentUser.uid);

      const transformedVisits = visitRequests.map(request => ({
        id: request.id,
        inmate: request.inmateName || 'Unknown',
        date: request.visitDate,
        time: request.visitTime,
        status: ((request.status || '').toLowerCase() === 'reschedule' ? 'rescheduled' : (request.status || '').toLowerCase()),
        relationship: request.relationship,
        reason: request.reason,
        purpose: request.purpose,
        rejectionReason: request.rejectionReason,
        rescheduleReason: request.rescheduleReason,
        cancellationReason: request.cancellationReason,
        clientName: request.clientName,
        submittedAt: request.createdAt,
        updatedAt: request.updatedAt,
        completed: request.completed || false,
        completedAt: request.completedAt,
        scannedBy: request.scannedBy
      }));

      setVisits(transformedVisits);
    } catch (error) {
      console.error('Error loading visits:', error);
      setError('Failed to load your visits. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVisits();
    setRefreshing(false);
  };

  const handleCancelRequest = async () => {
    if (!selectedVisit || !cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    setCancelling(true);
    try {
      const result = await firebaseService.cancelVisitRequest(selectedVisit.id, cancellationReason);
      
      if (result.success) {
        alert('Visit request cancelled successfully');
        setShowCancelModal(false);
        setCancellationReason('');
        setSelectedVisit(null);
        await loadVisits(); // Refresh the list
      } else {
        alert('Failed to cancel visit request: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error cancelling visit:', error);
      alert('Error cancelling visit request: ' + error.message);
    } finally {
      setCancelling(false);
    }
  };

  const filteredVisits = visits.filter(v => {
    // Handle status filtering
    let statusMatch = true;
    if (statusFilter === 'completed') {
      // Special case: show only visits with completed flag
      statusMatch = v.completed === true;
    } else if (statusFilter !== '') {
      statusMatch = v.status === statusFilter;
    }
    
    // Handle search filtering
    const searchMatch = search === '' || v.inmate.toLowerCase().includes(search.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  const handleClear = () => {
    setStatusFilter('');
    setSearch('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isNoShow = (visit) => {
    // Check if visit is approved but not completed and the visit time has passed
    if (visit.status !== 'approved' || visit.completed) {
      return false;
    }
    
    if (!visit.date || !visit.time) {
      return false;
    }
    
    try {
      // Parse the visit date and time
      const dateParts = visit.date.split('-').map(num => parseInt(num));
      const visitDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const [hours, minutes] = visit.time.split(':').map(num => parseInt(num));
      visitDate.setHours(hours, minutes, 0, 0);
      
      // Add 1 hour grace period after scheduled time
      const expirationTime = new Date(visitDate.getTime() + 60 * 60 * 1000);
      const now = new Date();
      
      return now > expirationTime;
    } catch (error) {
      console.error('Error checking no-show status:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="visitlogs-page">
        <div className="loading-message">
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h3>Loading your visits...</h3>
            <p>Please wait while we fetch your visit history.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="settings-page">
      <div className="modern-records-header">
        <div className="modern-records-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="18" rx="2" />
            <line x1="8" y1="8" x2="16" y2="8" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="8" y1="16" x2="12" y2="16" />
            <polyline points="13,15 15,17 17,13" />
          </svg>
          Visit Logs
        </div>
      </div>

      {error && (
        <div className="error-message" style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          {error}
          <button
            onClick={loadVisits}
            style={{
              marginLeft: '12px',
              background: 'transparent',
              border: '1px solid #dc2626',
              color: '#dc2626',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <section className="filter-section">
        <div className="filter-controls">
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="unified-search-container">
            <svg className="unified-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search by inmate name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="unified-search-input"
            />
          </div>
          <button className="clear-btn" onClick={handleClear}>Clear Filters</button>
        </div>
      </section>

      {/* Modern Table */}
      <section className="visits-section">
        <div className="section-header">
          <h2 className="section-title">Visit Records</h2>
          <div className="section-actions">
            <button
              className="refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        <div className="visits-container">
          {filteredVisits.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>{visits.length === 0 ? 'No visits found' : 'No matching visits'}</h3>
              <p>
                {visits.length === 0
                  ? "You haven't scheduled any visits yet."
                  : "Try adjusting your filters to see more results."
                }
              </p>
              {visits.length === 0 && (
                <a href="/client/schedule" className="btn-primary">Schedule Your First Visit</a>
              )}
            </div>
          ) : (
            <table className="visits-table">
              <thead>
                <tr>
                  <th>Visit Date</th>
                  <th>Time</th>
                  <th>Inmate</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: '500' }}>
                        {formatDate(v.date)}
                      </div>
                    </td>
                    <td>
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        {formatTime(v.time)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>
                        {v.inmate}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className={`status ${v.status}`}>
                          {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                        </span>
                        {v.completed && (
                          <span className="status completed" style={{ fontSize: '0.75rem' }}>
                            ✓ Visited
                          </span>
                        )}
                        {isNoShow(v) && (
                          <span className="status rejected" style={{ 
                            fontSize: '0.75rem',
                            background: '#fee2e2',
                            color: '#991b1b'
                          }}>
                            ✗ No Show
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="view-btn" onClick={() => setSelectedVisit(v)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          View
                        </button>
                        {(v.status === 'pending' || v.status === 'approved') && !v.completed && (
                          <button 
                            className="view-btn" 
                            onClick={() => {
                              setSelectedVisit(v);
                              setShowCancelModal(true);
                            }}
                            style={{ 
                              color: '#ef4444',
                              borderColor: '#fecaca',
                              background: '#fef2f2'
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Modern Landscape Visit Details Modal */}
      {selectedVisit && (
        <div className="modern-modal-overlay" onClick={() => setSelectedVisit(null)}>
          <div className="modern-modal-container landscape" onClick={e => e.stopPropagation()}>
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
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: '600'
                  }}>
                    {getInitials(selectedVisit.clientName)}
                  </div>
                  
                  <div className="modern-modal-grid modern-modal-grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
                    <div className="modern-modal-info-card" style={{ padding: '20px' }}>
                      <div className="modern-modal-info-label">Relationship</div>
                      <div className="modern-modal-info-value" style={{ marginTop: '8px' }}>{selectedVisit.relationship}</div>
                    </div>
                    <div className="modern-modal-info-card" style={{ padding: '20px' }}>
                      <div className="modern-modal-info-label">Status</div>
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: selectedVisit.status === 'approved' ? '#10b981' : 
                                      selectedVisit.status === 'rejected' ? '#ef4444' : 
                                      selectedVisit.status === 'rescheduled' ? '#f59e0b' :
                                      selectedVisit.status === 'completed' ? '#3b82f6' : '#6b7280',
                            boxShadow: selectedVisit.status === 'approved' ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 
                                      selectedVisit.status === 'rejected' ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : 
                                      selectedVisit.status === 'rescheduled' ? '0 0 0 3px rgba(245, 158, 11, 0.2)' :
                                      selectedVisit.status === 'completed' ? '0 0 0 3px rgba(59, 130, 246, 0.2)' : '0 0 0 3px rgba(107, 114, 128, 0.2)'
                          }}></div>
                          <span className={`modern-modal-status ${selectedVisit.status}`}>
                            {selectedVisit.status.charAt(0).toUpperCase() + selectedVisit.status.slice(1)}
                          </span>
                        </div>
                        {selectedVisit.completed && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            padding: '4px 8px',
                            background: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20,6 9,17 4,12"></polyline>
                            </svg>
                            Visited
                          </div>
                        )}
                        {isNoShow(selectedVisit) && (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            padding: '4px 8px',
                            background: '#fee2e2',
                            color: '#991b1b',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            No Show
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="modern-modal-grid modern-modal-grid-2" style={{ gap: '16px' }}>
                    <div className="modern-modal-info-card" style={{ padding: '20px' }}>
                      <div className="modern-modal-info-label">Visit Purpose</div>
                      <div className="modern-modal-info-value" style={{ marginTop: '8px' }}>
                        {selectedVisit.purpose || selectedVisit.reason || 'Purpose not specified'}
                      </div>
                    </div>
                    {selectedVisit.submittedAt && (
                      <div className="modern-modal-info-card" style={{ padding: '20px' }}>
                        <div className="modern-modal-info-label">Submitted</div>
                        <div className="modern-modal-info-value" style={{ marginTop: '8px' }}>
                          {selectedVisit.submittedAt?.toDate ?
                            selectedVisit.submittedAt.toDate().toLocaleDateString() :
                            formatDate(selectedVisit.submittedAt)
                          }
                        </div>
                      </div>
                    )}
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
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                    {selectedVisit.inmate}
                  </div>
                </div>
                
                <div className="modern-modal-info-card" style={{ padding: '24px', marginBottom: '16px' }}>
                  <div className="modern-modal-section-title" style={{ fontSize: '14px', marginBottom: '16px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Visit Schedule
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                    {new Date(selectedVisit.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {formatTime(selectedVisit.time)}
                  </div>
                </div>

                {/* Visit Completed Section */}
                {selectedVisit.completed && selectedVisit.completedAt && (
                  <div className="modern-modal-info-card" style={{ 
                    padding: '20px', 
                    marginBottom: '16px',
                    background: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
                    border: '2px solid #3b82f6'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22,4 12,14.01 9,11.01"></polyline>
                      </svg>
                      <div className="modern-modal-info-label" style={{ color: '#1e40af', fontWeight: '600' }}>
                        VISIT COMPLETED
                      </div>
                    </div>
                    <div className="modern-modal-info-value" style={{ color: '#1e40af', fontWeight: '600', fontSize: '16px' }}>
                      {selectedVisit.completedAt?.toDate ?
                        selectedVisit.completedAt.toDate().toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) :
                        new Date(selectedVisit.completedAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }
                    </div>
                    {selectedVisit.scannedBy && (
                      <div style={{ 
                        marginTop: '8px', 
                        fontSize: '0.875rem', 
                        color: '#6b7280' 
                      }}>
                        Scanned by: {selectedVisit.scannedBy}
                      </div>
                    )}
                  </div>
                )}

                {/* Reason Section - Only show for rejected, rescheduled, or cancelled requests */}
                {(selectedVisit.status === 'rejected' || selectedVisit.status === 'rescheduled' || selectedVisit.status === 'cancelled') && (
                  <div className="modern-modal-info-card" style={{ padding: '24px', marginBottom: '16px' }}>
                    <div className="modern-modal-section-title" style={{ fontSize: '14px', marginBottom: '12px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                      </svg>
                      {selectedVisit.status === 'rejected' ? 'Rejection Reason' : 
                       selectedVisit.status === 'cancelled' ? 'Cancellation Reason' : 'Reschedule Reason'}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280', 
                      lineHeight: '1.5',
                      padding: '12px',
                      background: selectedVisit.status === 'rejected' ? '#fef2f2' : 
                                 selectedVisit.status === 'cancelled' ? '#f3f4f6' : '#fefbf2',
                      border: `1px solid ${selectedVisit.status === 'rejected' ? '#fecaca' : 
                                          selectedVisit.status === 'cancelled' ? '#d1d5db' : '#fed7aa'}`,
                      borderRadius: '8px'
                    }}>
                      {selectedVisit.status === 'rejected' 
                        ? (selectedVisit.rejectionReason || 'No specific reason provided') 
                        : selectedVisit.status === 'cancelled'
                        ? (selectedVisit.cancellationReason || 'Client cancelled the visit')
                        : (selectedVisit.rescheduleReason || 'No specific reason provided')
                      }
                    </div>
                  </div>
                )}

        
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && selectedVisit && (
        <div className="modern-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modern-modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ padding: '24px' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                Cancel Visit Request
              </h2>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>
                Please provide a reason for cancelling this visit.
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Cancellation Reason
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="e.g., Unable to make it due to personal reasons..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellationReason('');
                  }}
                  disabled={cancelling}
                  style={{
                    padding: '10px 20px',
                    background: 'white',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: cancelling ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Keep Visit
                </button>
                <button
                  onClick={handleCancelRequest}
                  disabled={cancelling || !cancellationReason.trim()}
                  style={{
                    padding: '10px 20px',
                    background: cancelling || !cancellationReason.trim() ? '#9ca3af' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (cancelling || !cancellationReason.trim()) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {cancelling ? 'Cancelling...' : 'Cancel Visit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitLogs;