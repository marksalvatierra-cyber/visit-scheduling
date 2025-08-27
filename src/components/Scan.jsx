import React, { useState, useRef } from 'react';
import './Scan.css';
import './shared.css';

const Scan = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const fileInputRef = useRef(null);

  const startQrScanner = async () => {
    try {
      setIsScanning(true);
      
      // For now, we'll simulate QR scanning
      // In a real implementation, you would use a QR library like html5-qrcode
      alert('QR Scanner functionality requires a QR code library to be installed.\n\nTo enable this feature, install:\n\nnpm install html5-qrcode\n\nFor now, please use the "Upload QR" option to test the functionality.');
      
      setIsScanning(false);
    } catch (err) {
      alert('Unable to start camera: ' + err);
      setIsScanning(false);
    }
  };

  const handleQrFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Show the uploaded image
      const reader = new FileReader();
      reader.onload = (e) => {
        setQrImage(e.target.result);
      };
      reader.readAsDataURL(file);

      // Simulate QR code reading with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockQrData = {
        visitorName: 'John Doe',
        inmateName: 'Jane Smith',
        visitDate: '2024-03-25',
        time: '14:30',
        visitId: 'VR-001',
        purpose: 'Family Visit',
        relationship: 'Spouse'
      };

      processQrResult(mockQrData);
    } catch (err) {
      alert('Unable to read QR code from image: ' + err);
    }
  };

  const processQrResult = (data) => {
    // Determine status
    let status = 'Valid';
    let statusColor = '#43b649';
    let statusReason = '';
    
    const visitDateTimeStr = (data.visitDate || '') + ' ' + (data.time || '');
    const visitDateTime = new Date(visitDateTimeStr);
    const now = new Date();
    
    if (!data.visitDate || !data.time) {
      status = 'Invalid';
      statusColor = '#d32f2f';
      statusReason = 'Missing visit date or time.';
    } else if (isNaN(visitDateTime.getTime())) {
      status = 'Invalid';
      statusColor = '#d32f2f';
      statusReason = 'Invalid date/time format.';
    } else {
      const validFrom = new Date(visitDateTime.getTime() - 15 * 60000); // 15 mins before
      const validUntil = new Date(visitDateTime.getTime() + 60 * 60000); // 1 hour after
      
      if (now < validFrom) {
        status = 'Invalid';
        statusColor = '#d32f2f';
        statusReason = 'Too early to use QR code.';
      } else if (now > validUntil) {
        status = 'Invalid';
        statusColor = '#d32f2f';
        statusReason = 'QR code expired.';
      }
    }

    setScanResult({
      data,
      status,
      statusColor,
      statusReason,
      isValid: status === 'Valid'
    });
  };

  const resetScan = () => {
    setScanResult(null);
    setShowDetails(false);
    setQrImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className="records-page">
      {/* Modern Scan Header */}
      <div className="modern-records-header">
        <div className="modern-records-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 1h6v6H1z"></path>
            <path d="M17 1h6v6h-6z"></path>
            <path d="M1 17h6v6H1z"></path>
            <path d="M17 17h6v6h-6z"></path>
          </svg>
          Scan QR Code
        </div>
          </div>

      {/* Modern Search Section */}
      <div className="modern-search-section">
        <div className="unified-search-container">
          <svg className="unified-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            className="unified-search-input"
            placeholder="Scan and verify visitor QR codes for appointments"
            disabled
          />
        </div>
      </div>

      {/* New Design: Split Layout */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '70vh',
        padding: '0 24px',
        gap: '48px'
      }}>
        {!scanResult ? (
          <>
            {/* Left Side - Visual QR Scanner */}
            <div style={{
              flex: '1',
              maxWidth: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '32px'
            }}>
              <div style={{
                width: '280px',
                height: '280px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                borderRadius: '24px',
                border: '2px dashed rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '200px',
                  height: '200px',
                  border: '2px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--primary-color)' }}>
                    <path d="M1 1h6v6H1z"></path>
                    <path d="M17 1h6v6h-6z"></path>
                    <path d="M1 17h6v6H1z"></path>
                    <path d="M17 17h6v6h-6z"></path>
                    <path d="M9 9h6v6H9z"></path>
                  </svg>
                </div>
                
                {/* Scanning animation dots */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  width: '8px',
                  height: '8px',
                  background: 'var(--primary-color)',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></div>
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '8px',
                  height: '8px',
                  background: 'var(--primary-color)',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite 0.5s'
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  width: '8px',
                  height: '8px',
                  background: 'var(--primary-color)',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite 1s'
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  width: '8px',
                  height: '8px',
                  background: 'var(--primary-color)',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite 1.5s'
                }}></div>
              </div>
              
              <div style={{
                textAlign: 'center',
                color: 'var(--gray-600)',
                fontSize: '14px',
                lineHeight: '1.6'
              }}>
                Position QR code within the frame
              </div>
            </div>

            {/* Right Side - Controls */}
            <div style={{
              flex: '1',
              maxWidth: '400px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '20px',
                padding: '32px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: 'var(--gray-900)',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  Quick Scan
                </h3>
                
                <p style={{
                  fontSize: '16px',
                  color: 'var(--gray-600)',
                  marginBottom: '32px',
                  textAlign: 'center',
                  lineHeight: '1.6'
                }}>
                  Choose your preferred scanning method to verify visitor QR codes
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button 
                    className="modern-btn-primary" 
                onClick={startQrScanner}
                disabled={isScanning}
                    style={{
                      padding: '16px 24px',
                      fontSize: '16px',
                      fontWeight: '600',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, var(--primary-color), #8b5cf6)',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                    {isScanning ? 'Scanning...' : 'Use Camera'}
              </button>
                  
                  <label htmlFor="qr-file-input" 
                    style={{
                      padding: '16px 24px',
                      fontSize: '16px',
                      fontWeight: '600',
                      borderRadius: '12px',
                      border: '2px solid var(--primary-color)',
                      background: 'transparent',
                      color: 'var(--primary-color)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--primary-color)';
                      e.target.style.color = 'white';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = 'var(--primary-color)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7,10 12,15 17,10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Upload QR Image
              </label>
              <input 
                type="file" 
                id="qr-file-input" 
                    style={{ display: 'none' }}
                accept="image/*" 
                onChange={handleQrFileUpload}
                ref={fileInputRef}
              />
            </div>
              </div>
          </div>
          </>
        ) : (
          /* Result Display - New Design */
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '700px',
            width: '100%',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            textAlign: 'center'
          }}>
            {qrImage && (
              <div style={{ marginBottom: '32px' }}>
                <img src={qrImage} alt="QR Scan" style={{ 
                  maxWidth: '180px', 
                  height: 'auto', 
                  borderRadius: '16px', 
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  border: '4px solid white'
                }} />
              </div>
            )}
            
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              marginBottom: '32px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '16px',
                padding: '24px',
                minWidth: '160px',
                flex: '1',
                maxWidth: '200px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, var(--primary-color), #8b5cf6)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: 'white'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '4px' }}>
                  {scanResult.data.visitorName}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Visitor</div>
            </div>
            
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '16px',
                padding: '24px',
                minWidth: '160px',
                flex: '1',
                maxWidth: '200px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: 'white'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '4px' }}>
                  {scanResult.data.inmateName}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--gray-600)' }}>Inmate</div>
              </div>
            </div>

            <button 
              className="modern-btn-secondary" 
              onClick={toggleDetails}
              style={{ marginBottom: '24px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              {showDetails ? 'Hide details' : 'View details'}
            </button>
            
            {showDetails && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'var(--gray-900)',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  Visit Details
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Visitor Name:</span>
                    <span className="modern-detail-value">{scanResult.data.visitorName}</span>
                  </div>
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Inmate Name:</span>
                    <span className="modern-detail-value">{scanResult.data.inmateName}</span>
                  </div>
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Date/Time:</span>
                    <span className="modern-detail-value">{scanResult.data.visitDate} {scanResult.data.time}</span>
                  </div>
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Purpose:</span>
                    <span className="modern-detail-value">{scanResult.data.purpose}</span>
                  </div>
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Relationship:</span>
                    <span className="modern-detail-value">{scanResult.data.relationship}</span>
                  </div>
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Status:</span>
                    <span className="modern-status-badge" style={{ color: scanResult.statusColor }}>
                      {scanResult.status}
                    </span>
                    {scanResult.status === 'Invalid' && (
                      <span className="modern-status-reason"> ({scanResult.statusReason})</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button className="modern-btn-primary" onClick={resetScan}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 1h6v6H1z"></path>
                  <path d="M17 1h6v6h-6z"></path>
                  <path d="M1 17h6v6H1z"></path>
                  <path d="M17 17h6v6h-6z"></path>
                </svg>
                Scan New QR
              </button>
              <button className="modern-btn-secondary" onClick={resetScan}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default Scan; 