import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import firebaseService from '../firebase-services';
import './VisitLogs.css';
import './shared.css';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'rescheduled', label: 'Rescheduled' },
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
        clientName: request.clientName,
        submittedAt: request.createdAt,
        updatedAt: request.updatedAt
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

  const filteredVisits = visits.filter(v =>
    (statusFilter === '' || v.status === statusFilter) &&
    (search === '' || v.inmate.toLowerCase().includes(search.toLowerCase()))
  );

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
                      <span className={`status ${v.status}`}>
                        {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <button className="view-btn" onClick={() => setSelectedVisit(v)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View
                      </button>
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
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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

                {/* Reason Section - Only show for rejected or rescheduled requests */}
                {(selectedVisit.status === 'rejected' || selectedVisit.status === 'rescheduled') && (
                  <div className="modern-modal-info-card" style={{ padding: '24px', marginBottom: '16px' }}>
                    <div className="modern-modal-section-title" style={{ fontSize: '14px', marginBottom: '12px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                      </svg>
                      {selectedVisit.status === 'rejected' ? 'Rejection Reason' : 'Reschedule Reason'}
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280', 
                      lineHeight: '1.5',
                      padding: '12px',
                      background: selectedVisit.status === 'rejected' ? '#fef2f2' : '#fefbf2',
                      border: `1px solid ${selectedVisit.status === 'rejected' ? '#fecaca' : '#fed7aa'}`,
                      borderRadius: '8px'
                    }}>
                      {selectedVisit.status === 'rejected' 
                        ? (selectedVisit.rejectionReason || 'No specific reason provided') 
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
    </div>
  );
};

export default VisitLogs;