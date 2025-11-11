import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import firebaseService from '../firebase-services.js';
import './Scan.css';
import './shared.css';

const Scan = ({ currentOfficer = null }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [scannerInstance, setScannerInstance] = useState(null);
  const [validationLoading, setValidationLoading] = useState(false);
  // Hardware scanner states
  const [scannerMode, setScannerMode] = useState('hardware'); // 'hardware' or 'camera'
  const [hardwareScannerInput, setHardwareScannerInput] = useState('');
  const [isHardwareScannerReady, setIsHardwareScannerReady] = useState(true);
  const fileInputRef = useRef(null);
  const scannerRef = useRef(null);
  const hardwareScannerInputRef = useRef(null);

  const startQrScanner = async () => {
    try {
      setIsScanning(true);
      
      // Clear any existing scanner
      if (scannerInstance) {
        await scannerInstance.stop();
      }

      // Create scanner configuration
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
        rememberLastUsedCamera: true
      };

      // Initialize scanner
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        config,
        false
      );

      // Set up success callback
      const onScanSuccess = (decodedText, decodedResult) => {
        console.log('QR Code detected:', decodedText);
        scanner.clear();
        setIsScanning(false);
        handleQrCodeDetected(decodedText);
      };

      // Set up error callback  
      const onScanFailure = (error) => {
        // Handle scan failure - usually just means no QR code in view
        // Don't console.log every frame, it's too noisy
      };

      scanner.render(onScanSuccess, onScanFailure);
      setScannerInstance(scanner);
      
    } catch (err) {
      console.error('Camera error:', err);
      alert('Unable to start camera. Please make sure you have granted camera permissions and try again.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerInstance) {
      try {
        await scannerInstance.clear();
        setScannerInstance(null);
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    setIsScanning(false);
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

      // Use Html5Qrcode to decode the image
      const html5QrCode = new Html5Qrcode("temp-qr-reader");
      
      try {
        const qrCodeMessage = await html5QrCode.scanFile(file, true);
        console.log('QR Code from file:', qrCodeMessage);
        handleQrCodeDetected(qrCodeMessage);
      } catch (error) {
        console.error('Error reading QR from file:', error);
        alert('Could not read QR code from this image. Please ensure the image contains a clear, valid QR code.');
      }
    } catch (err) {
      console.error('File processing error:', err);
      alert('Unable to process image file: ' + err.message);
    }
  };

  const handleQrCodeDetected = async (qrText) => {
    setValidationLoading(true);
    
    try {
      console.log('Processing QR Code:', qrText);
      
      // Try to parse QR code data
      let qrData;
      try {
        qrData = JSON.parse(qrText);
      } catch (parseError) {
        throw new Error('Invalid QR code format. This does not appear to be a valid visit QR code.');
      }

      // Validate QR code structure
      if (!qrData.visitId || !qrData.clientName || !qrData.inmateName) {
        throw new Error('QR code is missing required visit information.');
      }

      console.log('Parsed QR Data:', qrData);

      // Validate QR code with Firebase
      const validationResult = await firebaseService.validateQRCode(qrData);
      console.log('Validation result:', validationResult);

      if (validationResult.valid) {
        // QR code is valid, mark as used (skip if it's a legacy QR that wasn't in system)
        if (!validationResult.isLegacyQR) {
          await firebaseService.markQRCodeAsUsed(qrData.visitId, getCurrentOfficerName());
        }
        
        // Create log entry for successful scan
        await firebaseService.createLogEntry({
          officerName: getCurrentOfficerName(),
          action: 'scanned',
          clientName: qrData.clientName,
          visitorName: qrData.clientName,
          inmateName: qrData.inmateName,
          visitDate: qrData.visitDate,
          visitTime: qrData.visitTime,
          purpose: 'QR Code Scan Entry',
          reason: validationResult.isLegacyQR ? 'Legacy QR code validated and visitor entry authorized' : 'Visitor entry validated via QR code scan',
          visitPurpose: 'Entry Validation',
          relationship: 'N/A',
          visitRequestId: qrData.visitId,
          scanResult: 'Valid',
          qrType: validationResult.isLegacyQR ? 'Legacy' : 'Standard',
          timestamp: new Date()
        });

        setScanResult({
          data: {
            visitorName: qrData.clientName,
            inmateName: qrData.inmateName,
            visitDate: qrData.visitDate,
            time: qrData.visitTime,
            visitId: qrData.visitId,
            purpose: qrData.purpose || qrData.reason || 'Visit Entry',
            relationship: qrData.relationship || 'Verified Visitor',
            facility: qrData.facility || 'Central Prison Camp Sablayan Penal Farm',
            approvedAt: qrData.approvedAt,
            expiresAt: qrData.expiresAt,
            clientEmail: qrData.clientEmail
          },
          status: 'Valid',
          statusColor: '#10b981',
          statusReason: validationResult.isLegacyQR ? 
            'Legacy QR code validated. Visitor authorized for entry.' : 
            'QR code successfully validated. Visitor authorized for entry.',
          isValid: true,
          validationDetails: validationResult,
          isLegacy: validationResult.isLegacyQR
        });
      } else {
        // QR code is invalid - determine status and color based on validation result
        let status, statusColor;
        
        switch (validationResult.status) {
          case 'too_early':
            status = 'Too Early';
            statusColor = '#f59e0b'; // Orange
            break;
          case 'expired':
            status = 'Expired';
            statusColor = '#ef4444'; // Red
            break;
          case 'already_used':
            status = 'Already Used';
            statusColor = '#ef4444'; // Red
            break;
          case 'invalidated':
            status = 'Invalidated';
            statusColor = '#ef4444'; // Red
            break;
          case 'not_approved':
            status = 'Not Approved';
            statusColor = '#ef4444'; // Red
            break;
          case 'data_mismatch':
            status = 'Data Mismatch';
            statusColor = '#ef4444'; // Red
            break;
          default:
            status = 'Invalid';
            statusColor = '#ef4444'; // Red
        }

        setScanResult({
          data: {
            visitorName: qrData.clientName || 'Unknown',
            inmateName: qrData.inmateName || 'Unknown',
            visitDate: qrData.visitDate || 'Unknown',
            time: qrData.visitTime || 'Unknown',
            visitId: qrData.visitId || 'Unknown',
            purpose: qrData.purpose || qrData.reason || (validationResult.status === 'too_early' ? 'Scheduled Visit' : 'Invalid Visit'),
            relationship: qrData.relationship || 'Unknown',
            allowedTime: validationResult.allowedTime,
            visitTime: validationResult.visitTime,
            expirationTime: validationResult.expirationTime,
            clientEmail: qrData.clientEmail
          },
          status: status,
          statusColor: statusColor,
          statusReason: validationResult.reason || 'QR code validation failed.',
          isValid: false,
          validationDetails: validationResult
        });

        // Log failed scan attempt
        await firebaseService.createLogEntry({
          officerName: getCurrentOfficerName(),
          action: 'scan_failed',
          clientName: qrData.clientName || 'Unknown',
          visitorName: qrData.clientName || 'Unknown',
          inmateName: qrData.inmateName || 'Unknown',
          visitDate: qrData.visitDate || 'Unknown',
          visitTime: qrData.visitTime || 'Unknown',
          purpose: 'Failed QR Code Scan',
          reason: validationResult.reason || 'QR validation failed',
          visitPurpose: 'Entry Validation Failed',
          relationship: 'N/A',
          visitRequestId: qrData.visitId || 'Unknown',
          scanResult: 'Invalid',
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('QR validation error:', error);
      
      setScanResult({
        data: {
          visitorName: 'Unknown',
          inmateName: 'Unknown',
          visitDate: 'Unknown',
          time: 'Unknown',
          visitId: 'Unknown',
          purpose: 'Invalid QR Code',
          relationship: 'Unknown',
          clientEmail: 'Unknown'
        },
        status: 'Error',
        statusColor: '#ef4444',
        statusReason: error.message || 'Failed to process QR code.',
        isValid: false
      });

      // Log error
      await firebaseService.createLogEntry({
        officerName: getCurrentOfficerName(),
        action: 'scan_error',
        clientName: 'Unknown',
        visitorName: 'Unknown',
        inmateName: 'Unknown',
        visitDate: 'Unknown',
        visitTime: 'Unknown',
        purpose: 'QR Code Error',
        reason: error.message || 'QR processing error',
        visitPurpose: 'Scan Error',
        relationship: 'N/A',
        visitRequestId: 'Unknown',
        scanResult: 'Error',
        timestamp: new Date()
      });
    } finally {
      setValidationLoading(false);
    }
  };

  const getCurrentOfficerName = () => {
    return currentOfficer || 'System Officer';
  };

  // Hardware scanner functions
  const handleHardwareScannerInput = (event) => {
    const value = event.target.value;
    setHardwareScannerInput(value);
  };

  const handleHardwareScannerKeyDown = (event) => {
    if (event.key === 'Enter' && hardwareScannerInput.trim()) {
      event.preventDefault();
      processHardwareScannerInput();
    }
  };

  const processHardwareScannerInput = async () => {
    const scannedData = hardwareScannerInput.trim();
    if (!scannedData) return;

    console.log('Hardware scanner input:', scannedData);
    setIsHardwareScannerReady(false);
    
    // Clear the input field
    setHardwareScannerInput('');
    
    // Generate QR code image for display
    try {
      // Dynamically import QRCode library
      const QRCode = await import('qrcode');
      const qrDataURL = await QRCode.toDataURL(scannedData, {
        width: 180,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Store the QR image for display
      setQrImage(qrDataURL);
    } catch (error) {
      console.warn('Could not generate QR code image:', error);
      // Continue without QR image if generation fails
    }
    
    // Process the scanned QR code using existing validation logic
    await handleQrCodeDetected(scannedData);
    
    // Re-enable scanner after a short delay
    setTimeout(() => {
      setIsHardwareScannerReady(true);
      if (hardwareScannerInputRef.current) {
        hardwareScannerInputRef.current.focus();
      }
    }, 2000);
  };

  const focusHardwareScanner = () => {
    if (scannerMode === 'hardware' && hardwareScannerInputRef.current && isHardwareScannerReady) {
      setTimeout(() => hardwareScannerInputRef.current?.focus(), 100);
    }
  };

  const resetScan = async () => {
    // Stop scanner if running
    if (isScanning && scannerInstance) {
      await stopScanner();
    }
    
    setScanResult(null);
    setShowDetails(false);
    setQrImage(null);
    setValidationLoading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (scannerInstance) {
        scannerInstance.clear().catch(console.error);
      }
    };
  }, [scannerInstance]);

  // Auto-focus hardware scanner input when in hardware mode
  useEffect(() => {
    focusHardwareScanner();
  }, [scannerMode, isHardwareScannerReady, scanResult]);

  // Re-focus scanner input when clicking anywhere on the page (hardware mode)
  useEffect(() => {
    const handlePageClick = () => {
      if (scannerMode === 'hardware' && !scanResult) {
        focusHardwareScanner();
      }
    };

    if (scannerMode === 'hardware') {
      document.addEventListener('click', handlePageClick);
      return () => document.removeEventListener('click', handlePageClick);
    }
  }, [scannerMode, scanResult]);

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
        
        {/* Scanner Mode Toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setScannerMode('hardware')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: scannerMode === 'hardware' ? 'var(--primary-color)' : 'var(--gray-200)',
              color: scannerMode === 'hardware' ? 'white' : 'var(--gray-600)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Hardware Scanner
          </button>
          <button
            onClick={() => setScannerMode('camera')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: scannerMode === 'camera' ? 'var(--primary-color)' : 'var(--gray-200)',
              color: scannerMode === 'camera' ? 'white' : 'var(--gray-600)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Camera
          </button>
        </div>
      </div>

      {/* Validation Loading Overlay */}
      {validationLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid var(--primary-color)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px auto'
            }}></div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--gray-900)' }}>
              Validating QR Code...
            </div>
            <div style={{ fontSize: '14px', color: 'var(--gray-600)', marginTop: '4px' }}>
              Checking with system database
            </div>
          </div>
        </div>
      )}

      {/* QR Reader Container (Hidden) */}
      <div id="qr-reader" style={{ display: isScanning ? 'block' : 'none' }}></div>
      <div id="temp-qr-reader" style={{ display: 'none' }}></div>

      {/* Main Scanning Interface */}
      {scannerMode === 'hardware' && !scanResult ? (
        /* Hardware Scanner UI */
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          padding: '24px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '24px',
            padding: '48px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: isHardwareScannerReady ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              color: 'white',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>

            <h3 style={{
              fontSize: '28px',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '16px'
            }}>
              Hardware Scanner Ready
            </h3>

            <p style={{
              fontSize: '16px',
              color: 'var(--gray-600)',
              marginBottom: '32px',
              lineHeight: '1.6'
            }}>
              {isHardwareScannerReady 
                ? "Scan any QR code with your hardware scanner. The system is ready to receive input."
                : "Processing scanned QR code. Please wait..."
              }
            </p>

            <input
              ref={hardwareScannerInputRef}
              type="text"
              value={hardwareScannerInput}
              onChange={handleHardwareScannerInput}
              onKeyDown={handleHardwareScannerKeyDown}
              placeholder="Hardware scanner input will appear here..."
              disabled={!isHardwareScannerReady}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '16px',
                borderRadius: '12px',
                border: '2px solid var(--primary-color)',
                background: isHardwareScannerReady ? 'white' : '#f3f4f6',
                color: 'var(--gray-900)',
                textAlign: 'center',
                marginBottom: '24px',
                outline: 'none'
              }}
            />

            <div style={{
              fontSize: '14px',
              color: 'var(--gray-500)',
              fontStyle: 'italic'
            }}>
              💡 Tip: Make sure your scanner is set to add "Enter" after each scan
            </div>
          </div>
        </div>
      ) : scannerMode === 'hardware' && scanResult ? (
        /* Hardware Scanner Results Display */
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '70vh',
          padding: '24px'
        }}>
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
            {/* Display scanned QR code */}
            {qrImage && (
              <div style={{ marginBottom: '32px' }}>
                <img src={qrImage} alt="Scanned QR Code" style={{ 
                  maxWidth: '180px', 
                  height: 'auto', 
                  borderRadius: '16px', 
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  border: '4px solid white'
                }} />
                <div style={{
                  fontSize: '14px',
                  color: 'var(--gray-600)',
                  marginTop: '8px',
                  fontStyle: 'italic'
                }}>
                </div>
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
                  {scanResult.data.clientEmail && scanResult.data.clientEmail !== 'Unknown' && (
                    <div className="modern-detail-item">
                      <span className="modern-detail-label">Visitor Email:</span>
                      <span className="modern-detail-value">{scanResult.data.clientEmail}</span>
                    </div>
                  )}
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Inmate Name:</span>
                    <span className="modern-detail-value">{scanResult.data.inmateName}</span>
                  </div>
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Visit Date/Time:</span>
                    <span className="modern-detail-value">{scanResult.data.visitDate} {scanResult.data.time}</span>
                  </div>
                  
                  {/* Show additional time info for time-related validation results */}
                  {scanResult.validationDetails?.status === 'too_early' && scanResult.data.allowedTime && (
                    <div className="modern-detail-item">
                      <span className="modern-detail-label">Entry Allowed From:</span>
                      <span className="modern-detail-value" style={{ color: '#f59e0b', fontWeight: '600' }}>
                        {new Date(scanResult.data.allowedTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {scanResult.validationDetails?.status === 'expired' && scanResult.data.expirationTime && (
                    <div className="modern-detail-item">
                      <span className="modern-detail-label">Expired At:</span>
                      <span className="modern-detail-value" style={{ color: '#ef4444', fontWeight: '600' }}>
                        {new Date(scanResult.data.expirationTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {scanResult.isValid && (
                    <div className="modern-detail-item">
                      <span className="modern-detail-label">Current Time:</span>
                      <span className="modern-detail-value" style={{ color: '#10b981', fontWeight: '600' }}>
                        {new Date().toLocaleString()} ✓
                      </span>
                    </div>
                  )}
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Purpose:</span>
                    <span className="modern-detail-value">{scanResult.data.purpose}</span>
                  </div>
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Relationship:</span>
                    <span className="modern-detail-value">{scanResult.data.relationship}</span>
                  </div>
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Visit ID:</span>
                    <span className="modern-detail-value">{scanResult.data.visitId}</span>
                  </div>
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Status:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: scanResult.statusColor,
                        boxShadow: `0 0 0 3px ${scanResult.statusColor}20`
                      }}></div>
                      <span style={{ 
                        color: scanResult.statusColor, 
                        fontWeight: '600',
                        fontSize: '16px'
                      }}>
                        {scanResult.status}
                      </span>
                    </div>
                    {scanResult.statusReason && (
                      <div style={{ 
                        fontSize: '14px', 
                        color: 'var(--gray-600)', 
                        marginTop: '4px',
                        fontStyle: 'italic' 
                      }}>
                        {scanResult.statusReason}
                      </div>
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
        </div>
      ) : scannerMode === 'camera' ? (
        /* Camera Scanner UI */
        <>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '70vh',
          padding: '0 24px',
          gap: '48px'
        }}>
          {!scanResult && !isScanning ? (
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
                disabled={isScanning || validationLoading}
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
        ) : isScanning ? (
          /* Camera Scanner View */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            width: '100%',
            maxWidth: '600px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '20px',
              padding: '24px',
              width: '100%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: 'var(--gray-900)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: '#10b981',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  Camera Active
                </h3>
                <button
                  onClick={stopScanner}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Stop Scanner
                </button>
              </div>
              
              <div style={{
                fontSize: '14px',
                color: 'var(--gray-600)',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                Position the QR code within the camera view. The scanner will automatically detect and process valid visit QR codes.
              </div>
            </div>
          </div>
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
                  {scanResult.data.clientEmail && scanResult.data.clientEmail !== 'Unknown' && (
                    <div className="modern-detail-item">
                      <span className="modern-detail-label">Visitor Email:</span>
                      <span className="modern-detail-value">{scanResult.data.clientEmail}</span>
                    </div>
                  )}
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Inmate Name:</span>
                    <span className="modern-detail-value">{scanResult.data.inmateName}</span>
                  </div>
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Visit Date/Time:</span>
                    <span className="modern-detail-value">{scanResult.data.visitDate} {scanResult.data.time}</span>
                  </div>
                  
                  {/* Show additional time info for time-related validation results */}
                  {scanResult.validationDetails?.status === 'too_early' && scanResult.data.allowedTime && (
                    <div className="modern-detail-item">
                      <span className="modern-detail-label">Entry Allowed From:</span>
                      <span className="modern-detail-value" style={{ color: '#f59e0b', fontWeight: '600' }}>
                        {new Date(scanResult.data.allowedTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {scanResult.validationDetails?.status === 'expired' && scanResult.data.expirationTime && (
                    <div className="modern-detail-item">
                      <span className="modern-detail-label">Expired At:</span>
                      <span className="modern-detail-value" style={{ color: '#ef4444', fontWeight: '600' }}>
                        {new Date(scanResult.data.expirationTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  {scanResult.isValid && (
                    <div className="modern-detail-item">
                      <span className="modern-detail-label">Current Time:</span>
                      <span className="modern-detail-value" style={{ color: '#10b981', fontWeight: '600' }}>
                        {new Date().toLocaleString()} ✓
                      </span>
                    </div>
                  )}
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Purpose:</span>
                    <span className="modern-detail-value">{scanResult.data.purpose}</span>
                  </div>
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Relationship:</span>
                    <span className="modern-detail-value">{scanResult.data.relationship}</span>
                  </div>
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Visit ID:</span>
                    <span className="modern-detail-value">{scanResult.data.visitId}</span>
                  </div>
                  <div className="modern-detail-item">
                    <span className="modern-detail-label">Status:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: scanResult.statusColor,
                        boxShadow: `0 0 0 3px ${scanResult.statusColor}20`
                      }}></div>
                      <span style={{ 
                        color: scanResult.statusColor, 
                        fontWeight: '600',
                        fontSize: '16px'
                      }}>
                        {scanResult.status}
                      </span>
                    </div>
                    {scanResult.statusReason && (
                      <div style={{ 
                        fontSize: '14px', 
                        color: 'var(--gray-600)', 
                        marginTop: '4px',
                        fontStyle: 'italic' 
                      }}>
                        {scanResult.statusReason}
                      </div>
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
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        #qr-reader {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          background: white;
        }
        
        #qr-reader video {
          border-radius: 16px;
        }
        
        #qr-reader__scan_region {
          border-radius: 16px !important;
        }
        
        .modern-detail-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .modern-detail-item:last-child {
          border-bottom: none;
        }
        
        .modern-detail-label {
          font-weight: 600;
          color: var(--gray-700);
          min-width: 120px;
        }
        
        .modern-detail-value {
          font-weight: 500;
          color: var(--gray-900);
          text-align: right;
          flex: 1;
        }
      `}</style>
        </>
        ) : null}
    </div>
  );
};

export default Scan; 