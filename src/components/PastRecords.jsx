import React, { useState, useEffect } from 'react';
import firebaseService from '../firebase-services.js';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import './Settings.css';
import './shared.css';

const PastRecords = () => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    inmateName: '',
    relationship: '',
    requestDate: '',
    visitDate: '',
    visitTime: '',
    purpose: '',
    status: 'completed',
    scannedBy: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [timeError, setTimeError] = useState('');
  const [inmates, setInmates] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch inmates
        const inmatesSnapshot = await firebaseService.db.collection('inmates').get();
        const inmatesList = inmatesSnapshot.docs.map(doc => {
          const data = doc.data();
          const fullName = `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.trim().replace(/\s+/g, ' ');
          return {
            id: doc.id,
            name: fullName,
            ...data
          };
        });
        setInmates(inmatesList);
        console.log('Loaded inmates:', inmatesList);

        // Fetch officers/admins
        const usersSnapshot = await firebaseService.db.collection('users')
          .where('role', 'in', ['admin', 'officer'])
          .get();
        const officersList = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
            ...data
          };
        });
        setOfficers(officersList);
        console.log('Loaded officers:', officersList);

        // Fetch all users (potential visitors)
        const allUsersSnapshot = await firebaseService.db.collection('users').get();
        const visitorsList = allUsersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
            email: data.email,
            ...data
          };
        });
        setVisitors(visitorsList);
        console.log('Loaded visitors:', visitorsList);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear time error when user changes time
    if (name === 'visitTime' && timeError) {
      setTimeError('');
    }
    
    // If visitor name is selected, auto-fill email
    if (name === 'clientName') {
      const selectedVisitor = visitors.find(v => v.name === value);
      setFormData(prev => ({
        ...prev,
        clientName: value,
        clientEmail: selectedVisitor ? selectedVisitor.email : prev.clientEmail
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form data on submit:', formData);
    
    // Validate required fields
    if (!formData.clientName || !formData.inmateName || !formData.requestDate || !formData.visitDate || !formData.visitTime) {
      console.log('Missing fields:', {
        clientName: !formData.clientName,
        inmateName: !formData.inmateName,
        requestDate: !formData.requestDate,
        visitDate: !formData.visitDate,
        visitTime: !formData.visitTime
      });
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Find the visitor's real UID
      const selectedVisitor = visitors.find(v => v.name === formData.clientName);
      const clientId = selectedVisitor?.id || `past_${Date.now()}`;
      
      console.log('Selected visitor:', selectedVisitor);
      console.log('Using clientId:', clientId);
      
      // Parse dates properly
      const [reqYear, reqMonth, reqDay] = formData.requestDate.split('-').map(Number);
      const requestDate = new Date(reqYear, reqMonth - 1, reqDay, 0, 0, 0);
      
      const [year, month, day] = formData.visitDate.split('-').map(Number);
      const [hours, minutes] = formData.visitTime.split(':').map(Number);
      const visitDateTime = new Date(year, month - 1, day, hours, minutes);
      
      // Determine actual status - if completed, it was approved first
      const actualStatus = formData.status === 'completed' ? 'approved' : formData.status;
      
      // Create the visit request
      const visitData = {
        clientId: clientId,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail || `${clientId}@legacy.local`,
        inmateName: formData.inmateName,
        relationship: formData.relationship || 'Not specified',
        visitDate: formData.visitDate,
        visitTime: formData.visitTime,
        purpose: formData.purpose || 'Past visit record',
        reason: formData.purpose || 'Historical data entry',
        status: actualStatus,
        isPastRecord: true,
        notes: formData.notes,
        submittedAt: requestDate.toISOString(),
        createdAt: firebase.firestore.Timestamp.fromDate(requestDate),
        updatedAt: new Date()
      };

      // If status is completed, add completion data
      if (formData.status === 'completed') {
        visitData.completed = true;
        visitData.completedAt = visitDateTime;
        visitData.scannedBy = formData.scannedBy || 'Historical Record';
      }

      // Add to Firestore
      const result = await firebaseService.db.collection('visitRequests').add(visitData);

      // Create log entry - use the scanning officer's name if completed, otherwise System Admin
      const logOfficerName = (formData.status === 'completed' && formData.scannedBy) 
        ? formData.scannedBy 
        : 'System Admin';
      
      const logAction = formData.status === 'completed' 
        ? 'completed_visit' 
        : 'added_past_record';

      await firebaseService.createLogEntry({
        officerName: logOfficerName,
        action: logAction,
        clientName: formData.clientName,
        visitorName: formData.clientName,
        inmateName: formData.inmateName,
        visitDate: formData.visitDate,
        visitTime: formData.visitTime,
        purpose: formData.purpose || 'Past visit record',
        relationship: formData.relationship,
        visitRequestId: result.id,
        actionReason: formData.status === 'completed' ? 'Historical completed visit' : 'Historical data entry',
        timestamp: new Date()
      });

      setMessage({ type: 'success', text: 'Past record added successfully!' });
      
      // Reset form
      setFormData({
        clientName: '',
        clientEmail: '',
        inmateName: '',
        relationship: '',
        visitDate: '',
        visitTime: '',
        purpose: '',
        status: 'completed',
        scannedBy: '',
        notes: ''
      });

    } catch (error) {
      console.error('Error adding past record:', error);
      setMessage({ type: 'error', text: 'Failed to add past record: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      inmateName: '',
      relationship: '',
      visitDate: '',
      visitTime: '',
      purpose: '',
      status: 'completed',
      scannedBy: '',
      notes: ''
    });
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="settings-page">
      <div className="modern-records-header">
        <div className="modern-records-title">
          Add Past Records
        </div>
        <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
          Record historical visit data for archival purposes
        </p>
      </div>

      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
          border: `1px solid ${message.type === 'success' ? '#86efac' : '#fecaca'}`,
          color: message.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '14px'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            Visitor Information
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Visitor Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                required
                disabled={loadingData}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: loadingData ? '#f3f4f6' : 'white'
                }}
              >
                <option value="">Select visitor</option>
                {visitors.map(visitor => (
                  <option key={visitor.id} value={visitor.name}>
                    {visitor.name} - {visitor.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Email (Optional)
              </label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleInputChange}
                placeholder="visitor@example.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Inmate Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                name="inmateName"
                value={formData.inmateName}
                onChange={handleInputChange}
                required
                disabled={loadingData}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: loadingData ? '#f3f4f6' : 'white'
                }}
              >
                <option value="">Select inmate</option>
                {inmates.map(inmate => (
                  <option key={inmate.id} value={inmate.name}>
                    {inmate.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Relationship
              </label>
              <input
                type="text"
                name="relationship"
                value={formData.relationship}
                onChange={handleInputChange}
                placeholder="e.g., Family, Friend, Lawyer"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            Visit Details
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Request Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                name="requestDate"
                value={formData.requestDate}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Visit Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Visit Time <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="time"
                name="visitTime"
                value={formData.visitTime}
                onChange={handleInputChange}
                min="07:00"
                max="15:00"
                step="900"
                required
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value) {
                    const [hours, minutes] = value.split(':').map(Number);
                    const timeInMinutes = hours * 60 + minutes;
                    if (timeInMinutes < 420 || timeInMinutes > 900) {
                      setTimeError('Visit time must be between 7:00 AM and 3:00 PM');
                      setFormData((prev) => ({ ...prev, visitTime: '' }));
                    }
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: timeError ? '1px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
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

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="completed">Completed</option>
                <option value="approved">Approved (No Show)</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Scanned By (if completed)
              </label>
              <select
                name="scannedBy"
                value={formData.scannedBy}
                onChange={handleInputChange}
                disabled={formData.status !== 'completed' || loadingData}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: formData.status !== 'completed' ? '#f3f4f6' : 'white',
                  cursor: formData.status !== 'completed' ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">Select officer/admin</option>
                {officers.map(officer => (
                  <option key={officer.id} value={officer.name}>
                    {officer.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Purpose / Notes
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                placeholder="Visit purpose or additional notes..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            style={{
              padding: '10px 24px',
              background: 'white',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 24px',
              background: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {loading ? 'Adding...' : 'Add Past Record'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PastRecords;
