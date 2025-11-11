import React, { useState, useEffect } from 'react';
import './LogTrails.css';
import './shared.css';
import firebaseService from '../firebase-services.js';

const LogTrails = ({ officerFilter = null }) => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    if (officerFilter) {
      // For officers, fetch only their own logs
      const fetchOfficerLogs = async () => {
        try {
          console.log('🔍 DEBUG: Fetching logs for officer:', `"${officerFilter}"`);
          console.log('🔍 DEBUG: Officer filter length:', officerFilter?.length);
          
          const officerLogs = await firebaseService.getLogsByOfficer(officerFilter);
          console.log('📋 DEBUG: Found officer logs:', officerLogs.length, 'entries');
          
          // Also fetch all logs to compare
          const allLogs = await firebaseService.getLogs(50);
          console.log('📊 DEBUG: All logs in system:', allLogs.length, 'entries');
          
          const officerNamesInLogs = [...new Set(allLogs.map(log => log.officerName))];
          console.log('🔍 DEBUG: Officer names in all logs:', officerNamesInLogs);
          
          // Check for exact matches and case-insensitive matches
          const exactMatch = officerNamesInLogs.find(name => name === officerFilter);
          const caseInsensitiveMatch = officerNamesInLogs.find(name => 
            name?.toLowerCase() === officerFilter?.toLowerCase()
          );
          
          console.log('🔍 DEBUG: Exact match found:', exactMatch);
          console.log('🔍 DEBUG: Case-insensitive match found:', caseInsensitiveMatch);
          
          const logsArr = officerLogs.map(log => ({
            ...log,
            timestamp: log.timestamp?.toDate
              ? log.timestamp.toDate()
              : log.timestamp
          }));
          setLogs(logsArr);
        } catch (error) {
          console.error('Error fetching officer logs:', error);
          setLogs([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchOfficerLogs();
      
      // Set up a shorter interval to refresh officer logs
      const interval = setInterval(fetchOfficerLogs, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    } else {
      // For admins, show all logs with real-time updates
      const unsubscribe = firebaseService.db.collection('logs')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .onSnapshot(snapshot => {
          const logsArr = [];
          snapshot.forEach(doc => {
            logsArr.push({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate
                ? doc.data().timestamp.toDate()
                : doc.data().timestamp
            });
          });
          setLogs(logsArr);
          setLoading(false);
        }, error => {
          console.error('Error listening to logs:', error);
          setLoading(false);
        });

      return () => unsubscribe();
    }
  }, [officerFilter]);

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionDescription = (log) => {
    const action = capitalize(log.action);
    let description = `${action} `;
    
    if (log.action === 'added') {
      description += `inmate ${log.inmateName || 'Unknown'}`;
    } else {
      description += `visitation request`;
      const visitorName = log.clientName || log.visitorName;
      if (visitorName) {
        description += ` of ${visitorName}`;
      }
      if (log.inmateName) {
        description += ` for inmate ${log.inmateName}`;
      }
    }
    
    return description;
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      case 'rescheduled':
        return '#f59e0b';
      case 'added':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getActionStatusText = (action) => {
    switch (action) {
      case 'approved':
        return 'ACCEPTED';
      case 'rejected':
        return 'DENIED';
      case 'rescheduled':
        return 'RESCHEDULED';
      case 'added':
        return 'ADDED';
      default:
        return action?.toUpperCase() || 'UNKNOWN';
    }
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const visitorName = log.clientName || log.visitorName || '';
    const purpose = log.purpose || log.reason || log.visitPurpose || '';
    
    return (
      log.officerName?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower) ||
      visitorName.toLowerCase().includes(searchLower) ||
      log.inmateName?.toLowerCase().includes(searchLower) ||
      purpose.toLowerCase().includes(searchLower)
    );
  });

  const debugLogData = (log) => {
    console.log('=== DEBUG LOG DATA ===');
    console.log('Full log object:', log);
    console.log('clientName:', log.clientName);
    console.log('visitorName:', log.visitorName);
    console.log('inmateName:', log.inmateName);
    console.log('purpose:', log.purpose);
    console.log('reason:', log.reason);
    console.log('visitPurpose:', log.visitPurpose);
    console.log('action:', log.action);
    console.log('officerName:', log.officerName);
    console.log('All available fields:', Object.keys(log));
    console.log('======================');
  };

  const showLogDetails = (log) => {
    debugLogData(log); // Debug function to help troubleshoot
    console.log('Selected log data:', log); // Keep existing debug log
    setSelectedLog(log);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLog(null);
  };

  // Helper function to get visitor name with fallbacks
  const getVisitorName = (log) => {
    return log.clientName || log.visitorName || 'Not specified';
  };

  // Helper function to get purpose with fallbacks
  const getVisitPurpose = (log) => {
    return log.purpose || log.reason || log.visitPurpose || 'Purpose not specified';
  };

  // Helper to choose whether to display the original purpose (for accepted requests)
  // or the reason (for non-accepted requests). This enforces the UI rule:
  // - If action === 'approved' -> show Purpose of Visit
  // - Otherwise -> show Reason
  const getDisplayedPurposeOrReason = (log) => {
    if (!log) return '';
    if (log.action === 'approved') {
      return log.purpose || log.visitPurpose || 'Purpose not specified';
    }
    // For non-approved actions prefer more specific reason fields if available
    if (log.action === 'rejected') {
      return log.rejectionReason || log.actionReason || log.reason || 'Reason not specified';
    }
    if (log.action === 'rescheduled' || log.action === 'reschedule') {
      return log.rescheduleReason || log.actionReason || log.reason || 'Reason not specified';
    }
    // Generic fallback for other actions (scan failures, denials, etc.)
    return log.actionReason || log.reason || log.purpose || 'Reason not specified';
  };

  return (
    <div className="records-page">
      {/* Modern Header - Matching Records Design */}
      <div className="modern-records-header">
        <div className="modern-records-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
          {officerFilter ? `My Activity Logs` : 'Log Trails'}
        </div>
      </div>

      {/* Modern Search Section */}
      <div className="modern-search-section">
        <div className="unified-search-container">
          <svg className="unified-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="unified-search-input"
            placeholder={officerFilter ? "Search my logs by action, visitor, inmate, or purpose..." : "Search logs by officer, action, visitor, inmate, or purpose..."}
          />
        </div>
      </div>

      {/* Modern Log Table */}
      <div className="unified-table-container">
        {loading ? (
          <div className="unified-table-loading">
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '16px',
              padding: '48px'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--primary-color)', opacity: '0.8' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              <div style={{ fontSize: '16px', color: 'var(--gray-600)' }}>Loading logs...</div>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="unified-table-empty">
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '16px',
              padding: '48px'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--gray-400)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              <div style={{ fontSize: '16px', color: 'var(--gray-600)' }}>
                {searchTerm ? 'No logs found matching your search.' : 'No logs available.'}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="unified-table-header">
              <div className="unified-table-title">{officerFilter ? 'My Activity Logs' : 'System Activity Logs'}</div>
              <div className="unified-table-subtitle">Showing {filteredLogs.length} log entries{officerFilter ? ' by ' + officerFilter : ''}</div>
            </div>
            
            <div className="unified-table-grid">
              <div className="unified-table-header-row table-layout-4cols">
                <div className="unified-table-cell" style={{ fontWeight: '600', color: 'var(--gray-700)' }}>Officer</div>
                <div className="unified-table-cell" style={{ fontWeight: '600', color: 'var(--gray-700)' }}>Action</div>
                <div className="unified-table-cell" style={{ fontWeight: '600', color: 'var(--gray-700)' }}>Description</div>
                <div className="unified-table-cell" style={{ fontWeight: '600', color: 'var(--gray-700)' }}>Date/Time</div>
              </div>
              
              <div className="unified-table-body">
                {filteredLogs.map(log => (
                  <div 
                    key={log.id} 
                    className="unified-table-row table-layout-4cols"
                    onClick={() => showLogDetails(log)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="unified-table-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--gray-600), var(--gray-700))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {log.officerName?.charAt(0) || 'O'}
                        </div>
                        <span style={{ fontWeight: '500', color: 'var(--gray-900)' }}>{log.officerName}</span>
                      </div>
                    </div>
                    
                    <div className="unified-table-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: getActionColor(log.action)
                        }}></div>
                        <span style={{ 
                          color: getActionColor(log.action),
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {capitalize(log.action)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="unified-table-cell">
                      <span style={{ 
                        fontSize: '14px', 
                        color: 'var(--gray-600)',
                        lineHeight: '1.4'
                      }}>
                        {getActionDescription(log)}
                      </span>
                    </div>
                    
                    <div className="unified-table-cell">
                      <span style={{ 
                        fontSize: '14px', 
                        color: 'var(--gray-500)',
                        fontFamily: 'monospace'
                      }}>
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Enhanced Log Details Modal */}
      {showModal && selectedLog && (
        <div 
          onClick={closeModal}
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000',
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: getActionColor(selectedLog.action)
                }}></div>
                Log Details
              </h3>
              
              <button 
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#6b7280'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* Officer & Action Status */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Officer</div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#6b7280',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {selectedLog.officerName?.charAt(0) || 'O'}
                    </div>
                    {selectedLog.officerName || 'Unknown Officer'}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Request Status</div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    color: getActionColor(selectedLog.action),
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {getActionStatusText(selectedLog.action)}
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Date & Time</div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#111827',
                  fontFamily: 'monospace'
                }}>
                  {formatDateTime(selectedLog.timestamp)}
                </div>
              </div>

              {/* Visitor and Inmate Info - FIXED SECTION */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Visitor Name</div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: getVisitorName(selectedLog) !== 'Not specified' ? '#111827' : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#6b7280' }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    {getVisitorName(selectedLog)}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Inmate Name</div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: selectedLog.inmateName ? '#111827' : '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#6b7280' }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    {selectedLog.inmateName || 'Not specified'}
                  </div>
                </div>
              </div>

              {/* Purpose of Visit / Reason - Dynamic Label Based on Action */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  {selectedLog.action === 'approved' ? 'Purpose of Visit' : 'Reason'}
                </div>
                <div style={{
                  background: '#f3f4f6',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    color: getDisplayedPurposeOrReason(selectedLog) && getDisplayedPurposeOrReason(selectedLog).indexOf('not specified') === -1 ? '#374151' : '#9ca3af',
                    lineHeight: '1.4',
                    fontWeight: '500',
                    fontStyle: getDisplayedPurposeOrReason(selectedLog) && getDisplayedPurposeOrReason(selectedLog).indexOf('not specified') === -1 ? 'normal' : 'italic'
                  }}>
                    {getDisplayedPurposeOrReason(selectedLog)}
                  </div>
                </div>
              </div>


              {/* Close Button */}
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button 
                  onClick={closeModal}
                  style={{
                    padding: '10px 24px',
                    background: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#e5e7eb';
                    e.target.style.borderColor = '#9ca3af';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#f3f4f6';
                    e.target.style.borderColor = '#d1d5db';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogTrails;