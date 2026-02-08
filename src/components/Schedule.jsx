import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import firebaseService from '../firebase-services';
import './Schedule.css';

// Toast notification component
const Toast = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      zIndex: '9999',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      minWidth: '320px',
      animation: 'slideInRight 0.3s ease-out'
    }}>
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <span style={{
        fontSize: '16px',
        marginRight: '4px'
      }}>
        {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
      </span>
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '2px',
          marginLeft: 'auto',
          opacity: '0.8',
          fontSize: '14px'
        }}
        onMouseOver={(e) => e.target.style.opacity = '1'}
        onMouseOut={(e) => e.target.style.opacity = '0.8'}
      >
        ✕
      </button>
    </div>
  );
};

const initialForm = {
  visitDate: '',
  visitorName: '',
  inmateNumber: '',
  relationship: '',
  visitReason: '',
  visitTime: '',
};

const Schedule = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [showPreview, setShowPreview] = useState(false);
  const [inmates, setInmates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });
  const [validatingInmate, setValidatingInmate] = useState(false);
  const [inmateValidation, setInmateValidation] = useState({ isValid: null, inmateName: '', status: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalRequest, setOriginalRequest] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [checkingVerification, setCheckingVerification] = useState(true);

  // Load inmates and check verification on component mount
  useEffect(() => {
    loadInmates();
    checkUserVerification();
  }, []);

  // Check user verification status
  const checkUserVerification = async () => {
    setCheckingVerification(true);
    try {
      const user = await firebaseService.getCurrentUser();
      if (user) {
        const userData = await firebaseService.getUserData(user.uid);
        setUserProfile(userData);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setCheckingVerification(false);
    }
  };

  // Load request data if editing
  useEffect(() => {
    const requestToEdit = location.state?.requestToEdit;
    console.log('Location state:', location.state);
    console.log('Request to edit:', requestToEdit);
    console.log('Inmates loaded:', inmates.length);
    
    if (requestToEdit && inmates.length > 0) {
      console.log('Pre-filling form with:', requestToEdit);
      setIsEditMode(true);
      setOriginalRequest(requestToEdit);
      setForm({
        visitDate: requestToEdit.date || requestToEdit.visitDate || '',
        visitorName: requestToEdit.clientName || '',
        inmateNumber: requestToEdit.inmateNumber || '',
        relationship: requestToEdit.relationship || '',
        visitReason: requestToEdit.reason || '',
        visitTime: requestToEdit.time || requestToEdit.visitTime || '',
      });
      // Validate the inmate number
      if (requestToEdit.inmateNumber) {
        validateInmateNumber(requestToEdit.inmateNumber);
      }
    }
  }, [location.state, inmates]);

  // Validate inmate number when inmates are loaded and there's an input
  useEffect(() => {
    if (inmates.length > 0 && form.inmateNumber.trim()) {
      validateInmateNumber(form.inmateNumber);
    }
  }, [inmates]);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const loadInmates = async () => {
    setLoading(true);
    try {
      // Load all inmates (not just active) to validate against all existing inmate numbers
      const inmateList = await firebaseService.getInmates(); // Remove 'active' filter
      setInmates(inmateList.map(inmate => ({
        id: inmate.id,
        name: `${inmate.firstName} ${inmate.middleName ? inmate.middleName + ' ' : ''}${inmate.lastName}`,
        inmateNumber: inmate.inmateNumber, // Use inmateNumber field from Records
        status: inmate.status
      })));
    } catch (error) {
      console.error('Error loading inmates:', error);
      setError('Failed to load inmates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Validate inmate number function
  const validateInmateNumber = async (inmateNumber) => {
    if (!inmateNumber.trim()) {
      setInmateValidation({ isValid: null, inmateName: '', status: '' });
      return;
    }

    setValidatingInmate(true);
    try {
      const foundInmate = inmates.find(inmate => 
        inmate.inmateNumber && inmate.inmateNumber.toLowerCase() === inmateNumber.toLowerCase()
      );
      
      if (foundInmate) {
        if (foundInmate.status === 'active') {
          setInmateValidation({ isValid: true, inmateName: foundInmate.name, status: 'active' });
        } else {
          setInmateValidation({ isValid: false, inmateName: foundInmate.name, status: 'inactive' });
        }
      } else {
        setInmateValidation({ isValid: false, inmateName: '', status: '' });
      }
    } catch (error) {
      console.error('Error validating inmate number:', error);
      setInmateValidation({ isValid: false, inmateName: '', status: '' });
    } finally {
      setValidatingInmate(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (name === 'visitTime' && timeError) setTimeError('');
    
    // Validate inmate number when it changes
    if (name === 'inmateNumber' && inmates.length > 0) {
      validateInmateNumber(value);
    }
  };

  // Helper function to get allowed visit days based on relationship
  const getAllowedVisitDays = (relationship) => {
    if (!relationship.trim()) return null;
    
    const relationshipLower = relationship.toLowerCase();
    const isFriend = relationshipLower.includes('friend');
    const isConjugal = relationshipLower.includes('spouse') || 
                       relationshipLower.includes('wife') || 
                       relationshipLower.includes('husband');
    const isRelative = relationshipLower.includes('brother') || 
                       relationshipLower.includes('sister') || 
                       relationshipLower.includes('mother') || 
                       relationshipLower.includes('father') || 
                       relationshipLower.includes('son') || 
                       relationshipLower.includes('daughter') || 
                       relationshipLower.includes('parent') || 
                       relationshipLower.includes('child') || 
                       relationshipLower.includes('sibling') || 
                       relationshipLower.includes('relative') ||
                       relationshipLower.includes('aunt') ||
                       relationshipLower.includes('uncle') ||
                       relationshipLower.includes('cousin') ||
                       relationshipLower.includes('grandparent') ||
                       relationshipLower.includes('grandson') ||
                       relationshipLower.includes('granddaughter');

    if (isFriend && !isRelative && !isConjugal) {
      return { days: 'Wednesday', type: 'friend', color: '#0ea5e9' };
    } else if (isConjugal) {
      return { days: 'Saturday & Sunday', type: 'conjugal', color: '#a855f7' };
    } else if (isRelative) {
      return { days: 'Thursday - Friday', type: 'relative', color: '#10b981' };
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!form.visitDate || !form.visitorName || !form.inmateNumber ||
        !form.relationship || !form.visitReason || !form.visitTime) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validate inmate number
    if (!inmateValidation.isValid) {
      setError('Please enter a valid inmate number.');
      return;
    }

    // Check if visit date is in the future
    const selectedDate = new Date(form.visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setError('Visit date must be in the future.');
      return;
    }

    // Validate visitation schedule based on day of week and relationship
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const relationshipLower = form.relationship.toLowerCase();
    
    // Check if relationship indicates friend, relative, or conjugal
    const isFriend = relationshipLower.includes('friend');
    const isConjugal = relationshipLower.includes('spouse') || 
                       relationshipLower.includes('wife') || 
                       relationshipLower.includes('husband');
    const isRelative = relationshipLower.includes('brother') || 
                       relationshipLower.includes('sister') || 
                       relationshipLower.includes('mother') || 
                       relationshipLower.includes('father') || 
                       relationshipLower.includes('son') || 
                       relationshipLower.includes('daughter') || 
                       relationshipLower.includes('parent') || 
                       relationshipLower.includes('child') || 
                       relationshipLower.includes('sibling') || 
                       relationshipLower.includes('relative') ||
                       relationshipLower.includes('aunt') ||
                       relationshipLower.includes('uncle') ||
                       relationshipLower.includes('cousin') ||
                       relationshipLower.includes('grandparent') ||
                       relationshipLower.includes('grandson') ||
                       relationshipLower.includes('granddaughter');

    // Monday (1) and Tuesday (2) - No visits
    if (dayOfWeek === 1 || dayOfWeek === 2) {
      setError('No visits are allowed on Mondays and Tuesdays. Please select another day.');
      return;
    }

    // Wednesday (3) - Friends only
    if (dayOfWeek === 3) {
      if (!isFriend && !isRelative && !isConjugal) {
        setError('Wednesday is for friends only. Please specify "Friend" as your relationship or choose another day for relatives/conjugal visits.');
        return;
      }
      if ((isRelative || isConjugal) && !isFriend) {
        setError('Wednesday is designated for friends only. Relatives can visit Thursday-Friday, and conjugal visits are on Saturday-Sunday.');
        return;
      }
    }

    // Thursday (4) - Friday (5) - Relatives only (non-conjugal)
    if (dayOfWeek === 4 || dayOfWeek === 5) {
      if (isFriend && !isRelative) {
        setError('Thursday and Friday are for relatives only. Friends can visit on Wednesday.');
        return;
      }
      if (isConjugal) {
        setError('Thursday and Friday are for relatives only. Conjugal visits are allowed on Saturday and Sunday.');
        return;
      }
      if (!isRelative && !isFriend && !isConjugal) {
        setError('Thursday and Friday are for relatives only. Please specify your relationship (e.g., parent, sibling).');
        return;
      }
    }

    // Saturday (6) and Sunday (0) - Conjugal visits only
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      if (!isConjugal) {
        setError('Saturday and Sunday are for conjugal visits only. Please specify your relationship as "Spouse", "Wife", or "Husband". Friends can visit on Wednesday, and other relatives can visit Thursday-Friday.');
        return;
      }
    }

    setShowPreview(true);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const currentUser = await firebaseService.getCurrentUser();
      if (!currentUser) {
        setError('You must be logged in to submit a visit request.');
        return;
      }

      // Get user's profile data including profile picture
      const userData = await firebaseService.getUserData(currentUser.uid);

      const selectedInmate = inmates.find(inmate => 
        inmate.inmateNumber && inmate.inmateNumber.toLowerCase() === form.inmateNumber.toLowerCase()
      );
      
      const visitRequestData = {
        clientId: currentUser.uid,
        clientName: form.visitorName,
        clientEmail: currentUser.email,
        userProfilePicture: userData?.profilePicture || null,
        inmateId: selectedInmate?.id || '',
        inmateNumber: form.inmateNumber,
        inmateName: selectedInmate?.name || '',
        visitDate: form.visitDate,
        visitTime: form.visitTime,
        relationship: form.relationship,
        reason: form.visitReason,
        status: 'pending',
        submittedAt: new Date().toISOString()
      };

      // Only add original request fields if this is a resubmission and they have valid values
      if (isEditMode && originalRequest) {
        if (originalRequest.id) {
          visitRequestData.originalRequestId = originalRequest.id;
        }
        if (originalRequest.date || originalRequest.visitDate) {
          visitRequestData.originalRequestDate = originalRequest.date || originalRequest.visitDate;
        }
      }

      // Always create a new request (even when in edit mode)
      const result = await firebaseService.createVisitRequest(visitRequestData);
      
      // If this was a resubmission from a rescheduled request, mark the old one as replaced
      // but keep its original status (don't change it to 'replaced')
      if (result.success && isEditMode && originalRequest && originalRequest.id) {
        try {
          await firebaseService.updateVisitRequest(originalRequest.id, {
            replacedBy: result.requestId,
            replacedAt: new Date().toISOString(),
            isReplaced: true
          });
        } catch (error) {
          console.error('Error marking old request as replaced:', error);
          // Continue anyway - the new request was created successfully
        }
      }
      
      if (result.success) {
        setShowPreview(false);
        setForm(initialForm);
        setIsEditMode(false);
        setOriginalRequest(null);
        showToast(
          isEditMode 
            ? 'New visit request submitted successfully! You will receive an email confirmation once reviewed.' 
            : 'Visit request submitted successfully! You will receive an email confirmation once reviewed.', 
          'success'
        );
        // Redirect back to visit logs after a short delay
        if (isEditMode) {
          setTimeout(() => {
            navigate('/client/visitlogs');
          }, 2000);
        }
      } else {
        setError(result.error || 'Failed to submit visit request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting visit request:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while checking verification
  if (checkingVerification) {
    return (
      <div className="settings-page">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Verifying account status...</p>
        </div>
      </div>
    );
  }

  // Show verification required message if user is not verified
  if (userProfile && userProfile.profileStatus !== 'verified') {
    return (
      <div className="settings-page">
        <div className="modern-records-header">
          <div className="modern-records-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Schedule Visit
          </div>
        </div>
        
        <div style={{
          marginTop: '24px',
          padding: '32px',
          borderRadius: '12px',
          background: userProfile.profileStatus === 'rejected' ? '#fef2f2' : '#fef9c3',
          border: `2px solid ${userProfile.profileStatus === 'rejected' ? '#fecaca' : '#fef08a'}`,
          maxWidth: '800px',
          margin: '24px auto'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              background: userProfile.profileStatus === 'rejected' ? '#fee2e2' : '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={userProfile.profileStatus === 'rejected' ? '#dc2626' : '#ca8a04'} strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2 style={{
              margin: '0 0 12px 0',
              fontSize: '24px',
              fontWeight: '600',
              color: userProfile.profileStatus === 'rejected' ? '#991b1b' : '#854d0e'
            }}>
              {userProfile.profileStatus === 'rejected' ? '🚫 Account Verification Required' : '⏳ Verification Pending'}
            </h2>
            <p style={{
              margin: '0',
              fontSize: '16px',
              color: userProfile.profileStatus === 'rejected' ? '#991b1b' : '#854d0e',
              lineHeight: '1.6'
            }}>
              {userProfile.profileStatus === 'rejected' ? (
                userProfile.rejectionReason ? (
                  <>
                    Your account verification was rejected and you cannot schedule visits at this time.
                    <br /><br />
                    <strong>Rejection Reason:</strong> {userProfile.rejectionReason}
                  </>
                ) : (
                  <>
                    Your account verification was rejected and you cannot schedule visits at this time.
                    <br />
                    Please contact support for more information.
                  </>
                )
              ) : (
                'Your account is currently under review. You cannot submit visit requests until your account is verified by an administrator.'
              )}
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {userProfile.profileStatus === 'rejected' && (
              <button
                onClick={() => navigate('/client/profile')}
                style={{
                  padding: '12px 24px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
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
            <button
              onClick={() => navigate('/client/dashboard')}
              style={{
                padding: '12px 24px',
                background: '#f1f5f9',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.target.style.background = '#e2e8f0'}
              onMouseOut={(e) => e.target.style.background = '#f1f5f9'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="settings-page">
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
      {/* Modern Scan Header */}
      <div className="modern-records-header">
        <div className="modern-records-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
       Schedule
        </div>
          </div>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Form Section */}
        <div className="form-section">
          <div className="form-header">
            <h2>{isEditMode ? 'Edit & Resubmit Visit Request' : 'Visit Request Form'}</h2>
            <p>{isEditMode ? 'Update your visit details and resubmit for approval' : 'Please fill out all required information below'}</p>
            {isEditMode && originalRequest?.rescheduleReason && (
              <div style={{
                marginTop: '12px',
                padding: '12px 16px',
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                <strong style={{ color: '#92400e' }}>Reschedule Reason:</strong>
                <p style={{ margin: '4px 0 0 0', color: '#78350f' }}>{originalRequest.rescheduleReason}</p>
              </div>
            )}
          </div>
          
          <div className="form-content">
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="visitDate" className="form-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Visit Date *
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    id="visitDate"
                    name="visitDate"
                    value={form.visitDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="visitTime" className="form-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                    Preferred Time (7:00 AM - 3:00 PM) *
                  </label>
                  <input
                    type="time"
                    className={`form-input ${timeError ? 'invalid' : ''}`}
                    id="visitTime"
                    name="visitTime"
                    value={form.visitTime}
                    onChange={handleChange}
                    min="07:00"
                    max="15:00"
                    required
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value) {
                        const [hours, minutes] = value.split(':').map(Number);
                        const timeInMinutes = hours * 60 + minutes;
                        if (timeInMinutes < 420 || timeInMinutes > 900) {
                          setTimeError('Visit time must be between 7:00 AM and 3:00 PM');
                          setForm((prev) => ({ ...prev, visitTime: '' }));
                        }
                      }
                    }}
                  />
                  {timeError && (
                    <div style={{
                      color: '#ef4444',
                      fontSize: '13px',
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      {timeError}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="visitorName" className="form-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    id="visitorName"
                    name="visitorName"
                    value={form.visitorName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="relationship" className="form-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Relationship *
                  </label>
                  <select
                    className="form-input"
                    id="relationship"
                    name="relationship"
                    value={form.relationship}
                    onChange={handleChange}
                    required
                    style={{
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '12px',
                      paddingRight: '36px'
                    }}
                  >
                    <option value="">-- Select Relationship --</option>
                    <optgroup label="Friend (Wednesday Visits)">
                      <option value="Friend">Friend</option>
                    </optgroup>
                    <optgroup label="Family/Relatives (Thursday-Friday Visits)">
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Grandfather">Grandfather</option>
                      <option value="Grandmother">Grandmother</option>
                      <option value="Grandson">Grandson</option>
                      <option value="Granddaughter">Granddaughter</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Aunt">Aunt</option>
                      <option value="Cousin">Cousin</option>
                      <option value="Nephew">Nephew</option>
                      <option value="Niece">Niece</option>
                    </optgroup>
                    <optgroup label="Conjugal (Saturday-Sunday Visits)">
                      <option value="Spouse">Spouse</option>
                      <option value="Wife">Wife</option>
                      <option value="Husband">Husband</option>
                    </optgroup>
                  </select>
                  {form.relationship && getAllowedVisitDays(form.relationship) && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: getAllowedVisitDays(form.relationship).type === 'friend' ? '#f0f9ff' : 
                                       getAllowedVisitDays(form.relationship).type === 'conjugal' ? '#faf5ff' : '#f0fdf4',
                      border: `1px solid ${getAllowedVisitDays(form.relationship).color}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: getAllowedVisitDays(form.relationship).type === 'friend' ? '#0369a1' : 
                             getAllowedVisitDays(form.relationship).type === 'conjugal' ? '#6b21a8' : '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4M12 8h.01"></path>
                      </svg>
                      {getAllowedVisitDays(form.relationship).type === 'friend' ? 
                        `As a friend, you can visit on ${getAllowedVisitDays(form.relationship).days}` :
                        getAllowedVisitDays(form.relationship).type === 'conjugal' ?
                        `For conjugal visits, you can visit on ${getAllowedVisitDays(form.relationship).days}` :
                        `As a relative, you can visit on ${getAllowedVisitDays(form.relationship).days}`
                      }
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="inmateNumber" className="form-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <path d="M20 8v6M23 11h-6"></path>
                  </svg>
                  Inmate Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className={`form-input ${
                      inmateValidation.isValid === true ? 'valid' : 
                      inmateValidation.isValid === false ? 'invalid' : ''
                    }`}
                    id="inmateNumber"
                    name="inmateNumber"
                    value={form.inmateNumber}
                    onChange={handleChange}
                    placeholder="Enter inmate number (e.g., INM-2024-001)"
                    required
                    style={{
                      paddingRight: validatingInmate || inmateValidation.isValid !== null ? '40px' : '12px'
                    }}
                  />
                  {validatingInmate && (
                    <div style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                    </div>
                  )}
                  {!validatingInmate && inmateValidation.isValid === true && (
                    <div style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#10b981'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"></polyline>
                      </svg>
                    </div>
                  )}
                  {!validatingInmate && inmateValidation.isValid === false && (
                    <div style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#ef4444'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    </div>
                  )}
                </div>
                {inmateValidation.isValid === true && inmateValidation.inmateName && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #0ea5e9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#0369a1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22,4 12,14.01 9,11.01"></polyline>
                    </svg>
                    Inmate found: {inmateValidation.inmateName} (Active)
                  </div>
                )}
                {inmateValidation.isValid === false && form.inmateNumber.trim() && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    {inmateValidation.status === 'inactive' && inmateValidation.inmateName ? 
                      `Inmate ${inmateValidation.inmateName} is inactive and cannot receive visits.` :
                      'Invalid inmate number. Please check and try again.'}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="visitReason" className="form-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  Reason for Visit *
                </label>
                <textarea
                  className="form-textarea"
                  id="visitReason"
                  name="visitReason"
                  value={form.visitReason}
                  onChange={handleChange}
                  placeholder="Please provide a reason for your visit..."
                  required
                />
              </div>

              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
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

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3 3L22 4"></path>
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                    </svg>
                    Preview Request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Info Cards Sidebar */}
        <div className="info-sidebar">
          <div className="info-card" style={{ backgroundColor: '#f0f9ff', borderLeft: '4px solid #0ea5e9' }}>
            <div className="info-card-header">
              <div className="info-icon" style={{ backgroundColor: '#0ea5e9' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3>Weekly Visitation Schedule</h3>
            </div>
            <div style={{ marginTop: '12px', fontSize: '14px', lineHeight: '1.6' }}>
              <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#fee2e2', borderRadius: '6px', color: '#991b1b' }}>
                <strong>🚫 Monday & Tuesday:</strong> No visits
              </div>
              <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                <strong>👥 Wednesday:</strong> Friends only
              </div>
              <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                <strong>👨‍👩‍👧 Thursday - Friday:</strong> Relatives (non-conjugal)
              </div>
              <div style={{ padding: '8px', backgroundColor: '#fce7f3', borderRadius: '6px', color: '#831843' }}>
                <strong>💑 Saturday & Sunday:</strong> Conjugal visits only
              </div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <div className="info-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h3>Visit Guidelines</h3>
            </div>
            <p>Visits are typically 1-2 hours. Please arrive 15 minutes early for check-in.</p>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <div className="info-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3>Required Items</h3>
            </div>
            <p>Bring valid photo ID. No electronic devices, bags, or food items allowed.</p>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <div className="info-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
              </div>
              <h3>Processing Time</h3>
            </div>
            <p>Requests are reviewed within 24-48 hours. You'll receive email confirmation.</p>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <div className="info-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
                </svg>
              </div>
              <h3>Need Help?</h3>
            </div>
            <p>Contact visitor services at (555) 123-4567 for assistance.</p>
          </div>
        </div>
      </div>

      {/* Modern Preview Modal */}
      {showPreview && (
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
        }} onClick={() => {
          setShowPreview(false);
          setError('');
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '600px',
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
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                </svg>
                Preview Visit Request
              </h3>
              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                color: '#6b7280'
              }} onClick={() => {
                setShowPreview(false);
                setError('');
              }}>
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
              Please review your visit request details before submitting
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
                  Visitor Name
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {form.visitorName}
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
                  Relationship
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {form.relationship}
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
                  Inmate Number
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {form.inmateNumber}
                </div>
                {inmateValidation.inmateName && (
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '4px'
                  }}>
                    ({inmateValidation.inmateName})
                  </div>
                )}
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
                  Visit Date
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {new Date(form.visitDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
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
                  Preferred Time
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  {new Date(`2000-01-01T${form.visitTime}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
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
                  Reason for Visit
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937',
                  lineHeight: '1.5'
                }}>
                  {form.visitReason}
                </div>
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
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#f1f5f9',
                  color: '#374151',
                  opacity: submitting ? 0.6 : 1
                }}
                onClick={() => {
                  setShowPreview(false);
                  setError('');
                }}
                disabled={submitting}
                onMouseOver={(e) => !submitting && (e.target.style.background = '#e2e8f0')}
                onMouseOut={(e) => !submitting && (e.target.style.background = '#f1f5f9')}
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
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: submitting ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  opacity: submitting ? 0.8 : 1
                }}
                onClick={handleFinalSubmit}
                disabled={submitting}
                onMouseOver={(e) => !submitting && (e.target.style.background = '#2563eb')}
                onMouseOut={(e) => !submitting && (e.target.style.background = '#3b82f6')}
              >
                {submitting ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ 
                      animation: 'spin 1s linear infinite' 
                    }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 11l3 3L22 4"></path>
                      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                    </svg>
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
};

export default Schedule;