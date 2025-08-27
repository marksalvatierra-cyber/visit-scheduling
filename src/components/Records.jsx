import React, { useState, useEffect } from 'react';
import firebaseService from '../firebase-services.js';
import './Records.css';
import './shared.css';

// Loading animation (same style as notifications)
const RecordsLoadingAnimation = () => (
  <div className="loading-message">
    <div style={{ textAlign: 'center', padding: '48px' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
      <h3>Loading inmate records...</h3>
      <p>Please wait while we fetch the records.</p>
    </div>
  </div>
);


const Records = () => {
  const [currentView, setCurrentView] = useState('sections'); // 'sections' or 'inmates'
  const [currentSection, setCurrentSection] = useState('');
  const [allInmates, setAllInmates] = useState([]);
  const [filteredInmates, setFilteredInmates] = useState([]);
  const [inmateUpcomingVisitsMap, setInmateUpcomingVisitsMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [visitFilter, setVisitFilter] = useState('all');
  const [selectedInmate, setSelectedInmate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visitRequests, setVisitRequests] = useState([]);
  const [visitHistoryLoading, setVisitHistoryLoading] = useState(false);

  // Alphabet sections
  const sections = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  useEffect(() => {
    loadAllInmates();
  }, []);

  useEffect(() => {
    setVisitHistoryLoading(true);
    const loadVisitRequests = async () => {
      try {
        const requests = await firebaseService.getVisitRequests();
        setVisitRequests(requests);
      } catch (error) {
        setVisitRequests([]);
        console.error('Error loading visit requests:', error);
      } finally {
        setVisitHistoryLoading(false);
      }
    };
    loadVisitRequests();
  }, []);

  const loadAllInmates = async () => {
    setLoading(true);
    try {
      const inmates = await firebaseService.getInmates();
const sortedInmates = [...inmates].sort((a, b) => {
  const nameA = (a.lastName || '').toUpperCase();
  const nameB = (b.lastName || '').toUpperCase();
  if (nameA < nameB) return -1;
  if (nameA > nameB) return 1;
  return 0;
});
setAllInmates(sortedInmates);
setFilteredInmates(sortedInmates);

      // Load visit requests for each inmate for badge (not for modal)
      const visitRequestsForBadge = await firebaseService.getVisitRequests();
      const upcomingVisitsMap = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      inmates.forEach(inmate => {
        const inmateUpcomingVisits = visitRequestsForBadge.filter(request => {
          if (request.inmateId !== inmate.id || request.status !== 'approved') return false;
          const visitDate = new Date(request.visitDate);
          visitDate.setHours(0, 0, 0, 0);
          return visitDate >= today;
        });
        upcomingVisitsMap[inmate.id] = inmateUpcomingVisits.length > 0;
      });

      setInmateUpcomingVisitsMap(upcomingVisitsMap);

    } catch (error) {
      console.error('Error loading inmates:', error);
      // Fallback to mock data if Firebase fails
      const mockInmates = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Anderson',
          middleName: 'Michael',
          inmateNumber: 'INM-001',
          cellNumber: 'A-101',
          dateOfBirth: '1985-03-15',
          status: 'active'
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Brown',
          middleName: 'Elizabeth',
          inmateNumber: 'INM-002',
          cellNumber: 'B-205',
          dateOfBirth: '1990-07-22',
          status: 'active'
        },
        {
          id: '3',
          firstName: 'Michael',
          lastName: 'Davis',
          middleName: 'Robert',
          inmateNumber: 'INM-003',
          cellNumber: 'C-312',
          dateOfBirth: '1988-11-08',
          status: 'inactive'
        },
        {
          id: '4',
          firstName: 'Emily',
          lastName: 'Wilson',
          middleName: 'Grace',
          inmateNumber: 'INM-004',
          cellNumber: 'D-401',
          dateOfBirth: '1992-04-30',
          status: 'active'
        }
      ];

      setAllInmates(mockInmates);
      setFilteredInmates(mockInmates);

      // Mock upcoming visits data
      const mockUpcomingVisits = {
        '1': true,
        '2': false,
        '3': false,
        '4': true
      };
      setInmateUpcomingVisitsMap(mockUpcomingVisits);
    } finally {
      setLoading(false);
    }
  };

  const showSection = async (section) => {
    setCurrentSection(section);
    setCurrentView('inmates');

    // Filter inmates by section (first letter of last name)
    const sectionInmates = allInmates.filter(inmate => {
      const lastName = inmate.lastName || '';
      return lastName.toUpperCase().startsWith(section);
    });

    setFilteredInmates(sectionInmates);
  };

  const showSectionGrid = () => {
    setCurrentView('sections');
    setCurrentSection('');
    setFilteredInmates([]);
  };

  const searchInmates = () => {
    if (!searchTerm.trim()) return;

    setCurrentView('inmates');
    setCurrentSection('');

    const results = allInmates.filter(inmate => {
      const fullName = `${inmate.firstName} ${inmate.middleName || ''} ${inmate.lastName}`.toLowerCase();
      const inmateNumber = (inmate.inmateNumber || '').toLowerCase();
      const cellNumber = (inmate.cellNumber || '').toLowerCase();
      return fullName.includes(searchTerm.toLowerCase()) ||
        inmateNumber.includes(searchTerm.toLowerCase()) ||
        cellNumber.includes(searchTerm.toLowerCase());
    });

    setFilteredInmates(results);
  };

  const filterInmatesByVisit = () => {
    if (visitFilter === 'all') {
      return filteredInmates;
    } else {
      return filteredInmates.filter(inmate => inmateUpcomingVisitsMap[inmate.id]);
    }
  };

  const viewInmateDetails = (inmate) => {
    setSelectedInmate(inmate);
    setShowModal(true);
  };

  const closeInmateModal = () => {
    setShowModal(false);
    setSelectedInmate(null);
  };

  const deleteInmate = async () => {
    if (!selectedInmate) return;

    if (window.confirm('Are you sure you want to delete this inmate record? This action cannot be undone.')) {
      try {
        // Delete from Firebase
        const result = await firebaseService.deleteInmate(selectedInmate.id);

        if (result.success) {
          setAllInmates(prev => prev.filter(inmate => inmate.id !== selectedInmate.id));
          setFilteredInmates(prev => prev.filter(inmate => inmate.id !== selectedInmate.id));
          closeInmateModal();
          alert('Inmate record deleted successfully!');
        } else {
          throw new Error(result.error || 'Failed to delete inmate');
        }
      } catch (error) {
        console.error('Error deleting inmate:', error);
        alert('Error deleting inmate: ' + error.message);
      }
    }
  };

  const markInmateInactive = async (inmateId, event) => {
    event.stopPropagation();

    if (window.confirm('Mark this inmate as inactive?')) {
      try {
        // Update in Firebase
        const result = await firebaseService.updateInmate(inmateId, { status: 'inactive' });

        if (result.success) {
          setAllInmates(prev => prev.map(inmate =>
            inmate.id === inmateId ? { ...inmate, status: 'inactive' } : inmate
          ));
          setFilteredInmates(prev => prev.map(inmate =>
            inmate.id === inmateId ? { ...inmate, status: 'inactive' } : inmate
          ));
          alert('Inmate marked as inactive.');
        } else {
          throw new Error(result.error || 'Failed to update inmate');
        }
      } catch (error) {
        console.error('Error updating inmate:', error);
        alert('Error updating inmate: ' + error.message);
      }
    }
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

  const formatVisitDate = (dateString, timeString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return `${formattedDate} at ${timeString || 'N/A'}`;
  };

  // VISIT HISTORY LOGIC (for modal)
  let upcomingVisits = [];
  let pastVisits = [];
  if (selectedInmate) {
    const today = new Date().setHours(0, 0, 0, 0);
    const inmateRequests = visitRequests.filter(
      req => req.inmateId === selectedInmate.id && req.status === "approved"
    );
    upcomingVisits = inmateRequests.filter(
      req => new Date(req.visitDate).setHours(0, 0, 0, 0) >= today
    );
    pastVisits = inmateRequests.filter(
      req => new Date(req.visitDate).setHours(0, 0, 0, 0) < today
    );
  }

  const displayInmates = () => {
    const inmatesToShow = filterInmatesByVisit();

    if   (loading) {
    return (
      <div className="loading-message">
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h3>Loading inmate records...</h3>
          <p>Please wait while we fetch the records.</p>
        </div>
      </div>
    );
  }

  if (inmatesToShow.length === 0) {
    return <div className="no-inmates">
      {currentSection ? `No inmates found in section ${currentSection}` : 'No inmates found'}
    </div>;
  }

    return inmatesToShow.map(inmate => {
      const hasUpcoming = inmateUpcomingVisitsMap[inmate.id];
      return (
        <div
          key={inmate.id}
          className={`modern-inmate-card ${inmate.status === 'inactive' ? 'inactive' : hasUpcoming ? 'has-upcoming-visit' : ''}`}
          onClick={() => viewInmateDetails(inmate)}
        >
          <div className="modern-inmate-header">
            <div className="modern-inmate-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="modern-inmate-status">
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: selectedInmate?.status === 'active' ? '#10b981' : '#ef4444'
              }}></div>
            </div>
          </div>

          <div className="modern-inmate-info">
            <div className="modern-inmate-name">
              {inmate.firstName} {inmate.middleName ? inmate.middleName + ' ' : ''}{inmate.lastName}
            </div>
            <div className="modern-inmate-id">{inmate.inmateNumber || 'N/A'}</div>
          </div>

          <div className="modern-inmate-details">
            <div className="modern-inmate-detail">
              <span className="modern-detail-label">Cell:</span>
              <span className="modern-detail-value">{inmate.cellNumber || 'N/A'}</span>
            </div>
            <div className="modern-inmate-detail">
              <span className="modern-detail-label">Status:</span>
              <span className={`modern-detail-value ${inmate.status === 'active' ? 'active' : 'inactive'}`}>
                {inmate.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {inmate.status !== 'inactive' && (
            <button
              className="modern-mark-inactive-btn"
              onClick={(e) => markInmateInactive(inmate.id, e)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Mark Inactive
            </button>
          )}

          {hasUpcoming && (
            <div className="modern-upcoming-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              Upcoming Visit
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="records-page">

      {/* Modern Records Header */}
      <div className="modern-records-header">
        <div className="modern-records-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
          Inmates Records
        </div>
        {currentView === 'inmates' && (
          <div className="modern-records-filter">
            <select
              value={visitFilter}
              onChange={(e) => setVisitFilter(e.target.value)}
              className="modern-filter-dropdown"
            >
              <option value="all">All Inmates</option>
              <option value="upcoming">Inmates with Upcoming Visits</option>
            </select>
          </div>
        )}
      </div>

      {/* Modern Search Bar */}
      <div className="modern-search-section">
        <div className="unified-search-container">
          <svg className="unified-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchInmates()}
            className="unified-search-input"
            placeholder="Search by name, inmate number, or cell number..."
          />
        </div>
      </div>

      {/* Modern Sections Grid */}
      {currentView === 'sections' && (
        <div className="modern-sections-grid">
          {sections.map(section => (
            <div
              key={section}
              className="modern-section-card"
              onClick={() => showSection(section)}
            >
              <div className="modern-section-letter">{section}</div>
              <div className="modern-section-label">Section</div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Inmates Grid */}
      {currentView === 'inmates' && (
        <div className="modern-inmate-section">
          <button onClick={showSectionGrid} className="modern-back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
            Back to Sections
          </button>
          <div className="modern-inmate-grid">
            {displayInmates()}
          </div>
        </div>
      )}

      {/* Inmate Details Modal */}
      {showModal && selectedInmate && (
        <div className="modern-modal-overlay" onClick={closeInmateModal}>
          <div className="modern-modal-container landscape" onClick={(e) => e.stopPropagation()}>
            <div className="modern-modal-body">
              {/* Left Side - Inmate Information */}
              <div className="modern-modal-section">
                <div className="modern-modal-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Inmate Information
                </div>
                <div className="modern-modal-info-card" style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--gray-600), var(--gray-700))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                    color: 'white',
                    fontSize: '32px'
                  }}>
                    👤
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '8px' }}>
                    {selectedInmate.firstName} {selectedInmate.middleName ? selectedInmate.middleName + ' ' : ''}{selectedInmate.lastName}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--gray-600)', marginBottom: '24px' }}>
                    {selectedInmate.inmateNumber || 'N/A'}
                  </div>

                  <div className="modern-modal-grid modern-modal-grid-2" style={{ gap: '16px' }}>
                    <div className="modern-modal-info-card" style={{ padding: '20px' }}>
                      <div className="modern-modal-info-label">Cell Number</div>
                      <div className="modern-modal-info-value" style={{ marginTop: '8px' }}>{selectedInmate.cellNumber || 'N/A'}</div>
                    </div>
                    <div className="modern-modal-info-card" style={{ padding: '20px' }}>
                      <div className="modern-modal-info-label">Date of Birth</div>
                      <div className="modern-modal-info-value" style={{ marginTop: '8px' }}>{formatDate(selectedInmate.dateOfBirth)}</div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '16px',
                    padding: '12px 20px',
                    background: 'var(--gray-50)',
                    borderRadius: '12px',
                    border: '1px solid var(--gray-200)'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: selectedInmate.status === 'active' ? '#10b981' : '#ef4444',
                      boxShadow: selectedInmate.status === 'active' ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : '0 0 0 3px rgba(239, 68, 68, 0.2)'
                    }}></div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'var(--gray-700)'
                    }}>
                      {selectedInmate.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side - Visit History (with skeleton!) */}
              <div className="modern-modal-section">
                <div className="modern-modal-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                  </svg>
                  Visit History
                </div>
                {visitHistoryLoading ? (
                  <VisitHistorySkeleton />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Upcoming Visits */}
                    <div className="modern-modal-info-card">
                      <div className="modern-modal-section-title" style={{ fontSize: '14px', marginBottom: '12px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12,6 12,12 16,14"></polyline>
                        </svg>
                        Upcoming Visits
                      </div>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {upcomingVisits.length === 0 ? (
                          <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '14px', padding: '20px' }}>
                            No upcoming visits
                          </div>
                        ) : (
                          upcomingVisits.map((visit, idx) => (
                            <div key={visit.id || idx} style={{
                              padding: '12px',
                              border: '1px solid var(--gray-200)',
                              borderRadius: '8px',
                              marginBottom: '8px',
                              background: 'var(--gray-50)'
                            }}>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '4px' }}>
                                {new Date(visit.visitDate).toLocaleDateString()} at {visit.visitTime}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                                {visit.clientName} ({visit.relationship})
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    {/* Past Visits */}
                    <div className="modern-modal-info-card">
                      <div className="modern-modal-section-title" style={{ fontSize: '14px', marginBottom: '12px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                        Past Visits
                      </div>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {pastVisits.length === 0 ? (
                          <div style={{ textAlign: 'center', color: 'var(--gray-500)', fontSize: '14px', padding: '20px' }}>
                            No past visits
                          </div>
                        ) : (
                          pastVisits.map((visit, idx) => (
                            <div key={visit.id || idx} style={{
                              padding: '12px',
                              border: '1px solid var(--gray-200)',
                              borderRadius: '8px',
                              marginBottom: '8px',
                              background: 'var(--gray-50)'
                            }}>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '4px' }}>
                                {new Date(visit.visitDate).toLocaleDateString()} at {visit.visitTime}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                                {visit.clientName} ({visit.relationship})
                              </div>
                            </div>
                          ))
                        )}
                      </div>
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

export default Records;