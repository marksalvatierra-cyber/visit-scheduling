import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import firebaseService from '../firebase-services.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AddInmate = () => {
  const [formData, setFormData] = useState({
    inmateNumber: '',
    securityCategory: '',
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    reasonForImprisonment: '',
    photoBase64: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [totalInmates, setTotalInmates] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addedInmate, setAddedInmate] = useState(null);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingNumber, setGeneratingNumber] = useState(false);

  useEffect(() => {
    loadInmateStatistics();
    loadInmatesChart();
  }, []);

  const loadInmateStatistics = async () => {
    try {
      const inmates = await firebaseService.getInmates();
      setTotalInmates(inmates.length);
    } catch (error) {
      console.error('Error loading inmate statistics:', error);
      setError('Failed to load inmate statistics');
    }
  };

  const loadInmatesChart = async () => {
    try {
      setChartLoading(true);
      // Get inmates data for the last 6 months
      const inmates = await firebaseService.getInmatesByMonth(6);
      
      // Group inmates by month
      const currentDate = new Date();
      const months = [];
      const counts = [];
      
      // Initialize monthly counts
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push(date.toLocaleDateString('en-US', { month: 'short' }));
        counts.push(0);
      }
      
      // Count inmates by month (handle Firestore Timestamps and Date strings)
      inmates.forEach(inmate => {
        if (!inmate.createdAt) return;

        let inmateDate;
        try {
          // Firestore Timestamp with toDate()
          if (inmate.createdAt && typeof inmate.createdAt.toDate === 'function') {
            inmateDate = inmate.createdAt.toDate();
          } else if (inmate.createdAt && typeof inmate.createdAt.seconds === 'number') {
            // Plain object with seconds
            inmateDate = new Date(inmate.createdAt.seconds * 1000);
          } else {
            // Fallback: try to construct Date from string or number
            inmateDate = new Date(inmate.createdAt);
          }
        } catch (e) {
          return;
        }

        if (!inmateDate || isNaN(inmateDate.getTime())) return;

        const monthDiff = currentDate.getMonth() - inmateDate.getMonth() +
                         (currentDate.getFullYear() - inmateDate.getFullYear()) * 12;

        if (monthDiff >= 0 && monthDiff < 6) {
          counts[5 - monthDiff]++;
        }
      });
      
      // Calculate cumulative totals
      let cumulative = 0;
      const cumulativeCounts = counts.map(count => {
        cumulative += count;
        return cumulative;
      });
      
      const chartData = {
        labels: months,
        datasets: [{
          label: 'Total Inmates',
          data: cumulativeCounts,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          pointBackgroundColor: '#6366f1',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          borderWidth: 2,
        }]
      };
      setChartData(chartData);
    } catch (error) {
      console.error('Error loading chart data:', error);
      // Fallback to mock data if Firebase fails
    const mockData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Total Inmates',
        data: [120, 125, 130, 135, 140, 156],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4,
        fill: true,
      }]
    };
    setChartData(mockData);
    } finally {
      setChartLoading(false);
    }
  };

  // Auto-generate inmate number function with INM- prefix
  const generateInmateNumber = async () => {
    setGeneratingNumber(true);
    try {
      // Get all existing inmates
      const inmates = await firebaseService.getInmates();
      
      // Extract inmate numbers that follow the INM-XXXX format
      const existingNumbers = inmates
        .map(inmate => {
          const inmateNumber = inmate.inmateNumber;
          // Check if it matches INM-XXXX format
          if (inmateNumber && inmateNumber.startsWith('INM-')) {
            const numberPart = inmateNumber.substring(4); // Remove "INM-" prefix
            const num = parseInt(numberPart);
            return !isNaN(num) ? num : null;
          }
          return null;
        })
        .filter(num => num !== null)
        .sort((a, b) => a - b);

      console.log('Existing INM numbers:', existingNumbers);

      // Find the next available number
      let nextNumber = 1;
      
      if (existingNumbers.length > 0) {
        // Check for gaps in the sequence starting from 1
        for (let i = 0; i < existingNumbers.length; i++) {
          if (existingNumbers[i] !== nextNumber) {
            // Found a gap, use this number
            break;
          }
          nextNumber++;
        }
        
        // If no gaps found, use the next number after the highest
        if (nextNumber === existingNumbers[existingNumbers.length - 1]) {
          nextNumber = existingNumbers[existingNumbers.length - 1] + 1;
        }
      }

      // Format with INM- prefix and 4-digit padding (INM-0001, INM-0002, etc.)
      const formattedNumber = `INM-${nextNumber.toString().padStart(4, '0')}`;
      
      setFormData(prev => ({
        ...prev,
        inmateNumber: formattedNumber
      }));

      console.log('Generated inmate number:', formattedNumber);
      
    } catch (error) {
      console.error('Error generating inmate number:', error);
      setError('Failed to generate inmate number');
    } finally {
      setGeneratingNumber(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    console.log('Photo selected:', file);
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setPhotoFile(file);
      console.log('Photo file set in state:', file.name);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        console.log('Photo preview created');
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Form submitted. Photo file state:', photoFile?.name);
      
      // Validate required fields
      if (!formData.inmateNumber || !formData.securityCategory || !formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.reasonForImprisonment) {
        throw new Error('Please fill in all required fields');
      }

      // Check if inmate number already exists
      const existingInmates = await firebaseService.getInmates();
      const inmateExists = existingInmates.some(inmate => inmate.inmateNumber === formData.inmateNumber);
      
      if (inmateExists) {
        throw new Error('Inmate number already exists');
      }

      // Prepare inmate data
      let inmateData = {
        ...formData,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      // Debug: Log the data being sent
      console.log('Saving inmate data:', inmateData);

      // Add inmate to Firebase first
      const result = await firebaseService.addInmate(inmateData);

      if (result.success) {
        // Add photo as Base64 if provided
        if (photoFile) {
          console.log('Compressing and converting inmate photo...');
          try {
            const base64Photo = await firebaseService.compressAndConvertImage(photoFile);
            console.log('Photo converted to Base64');
            
            const photoData = {
              photoBase64: base64Photo,
              photoFileName: photoFile.name,
              photoFileType: photoFile.type,
              photoFileSize: photoFile.size,
              photoUploadedAt: new Date().toISOString()
            };
            
            // Update inmate with photo data
            const updateResult = await firebaseService.updateInmate(result.inmateId, photoData);
            console.log('Photo data update result:', updateResult);
            
            if (updateResult.success) {
              inmateData.photoBase64 = photoData.photoBase64;
              inmateData.photoFileName = photoData.photoFileName;
              inmateData.photoFileType = photoData.photoFileType;
              inmateData.photoFileSize = photoData.photoFileSize;
              inmateData.photoUploadedAt = photoData.photoUploadedAt;
            } else {
              console.error('Failed to update inmate with photo:', updateResult.error);
              setError('Inmate added but photo save failed: ' + updateResult.error);
            }
          } catch (photoError) {
            console.error('Error during photo conversion:', photoError);
            setError('Inmate added but photo save failed: ' + photoError.message);
          }
        }

        const newInmate = {
          ...formData,
          id: result.inmateId,
          photoBase64: inmateData.photoBase64 || '',
          createdAt: new Date().toISOString()
        };
        
        setAddedInmate(newInmate);
        setShowSuccessModal(true);
        setFormData({
          inmateNumber: '',
          securityCategory: '',
          firstName: '',
          lastName: '',
          middleName: '',
          dateOfBirth: '',
          reasonForImprisonment: '',
          photoBase64: ''
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        
        // Update statistics
        await loadInmateStatistics();
        await loadInmatesChart();
      } else {
        throw new Error(result.error || 'Failed to add inmate');
      }
    } catch (error) {
      console.error('Error adding inmate:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setAddedInmate(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#6366f1',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: function(context) {
            return `Month: ${context[0].label}`;
          },
          label: function(context) {
            return `Total Inmates: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { 
          stepSize: 1,
          color: '#6b7280',
          font: {
            size: 12
          }
        },
        grid: {
          color: '#f3f4f6',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: '#6b7280',
          font: {
            size: 12
          }
        },
        grid: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      point: {
        hoverRadius: 8,
        hoverBorderWidth: 2
      }
    }
  };

  // Custom styles
  const styles = {
    page: {
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      backgroundColor: '#f8fafc',
      minHeight: '100vh'
    },
    header: {
      marginBottom: '32px'
    },
    headerTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '28px',
      fontWeight: '700',
      color: '#1e293b',
      margin: '0'
    },
    mainLayout: {
      display: 'grid',
      gridTemplateColumns: '1fr 400px',
      gap: '32px',
      alignItems: 'start'
    },
    formCard: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden'
    },
    formContainer: {
      padding: '32px'
    },
    sectionTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '18px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '24px',
      paddingBottom: '12px',
      borderBottom: '2px solid #f1f5f9'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '24px',
      marginBottom: '32px'
    },
    fullWidth: {
      gridColumn: '1 / -1'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '8px'
    },
    input: {
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      backgroundColor: 'white',
      outline: 'none'
    },
    inputWithButton: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    inputWithButtonField: {
      padding: '12px 50px 12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'all 0.2s ease',
      backgroundColor: 'white',
      outline: 'none',
      width: '100%'
    },
    autoGenerateButton: {
      position: 'absolute',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'white',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: '#374151',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
    },
    submitButton: {
      width: '100%',
      padding: '16px 24px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    statsColumn: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    statsCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e2e8f0',
      textAlign: 'center'
    },
    statsIcon: {
      fontSize: '48px',
      marginBottom: '16px',
      color: '#3b82f6',
      opacity: '0.8'
    },
    statsLabel: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '8px'
    },
    statsValue: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1f2937'
    },
    chartCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e2e8f0'
    },
    chartTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '18px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '16px'
    },
    chartContainer: {
      height: '200px'
    },
    modal: {
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
    },
    modalContent: {
      background: 'white',
      borderRadius: '20px',
      padding: '32px',
      maxWidth: '500px',
      width: '90vw',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
    },
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px'
    },
    modalTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '20px',
      fontWeight: '600',
      color: '#059669'
    },
    closeButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      color: '#6b7280'
    },
    modalGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    },
    infoCard: {
      background: '#f8fafc',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    },
    infoLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#6b7280',
      marginBottom: '4px'
    },
    infoValue: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1f2937'
    },
    modalFooter: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end'
    },
    modalButton: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    primaryButton: {
      background: '#3b82f6',
      color: 'white'
    },
    secondaryButton: {
      background: '#f1f5f9',
      color: '#374151'
    }
  };

    return (
    <div className="records-page">
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
      {/* Modern Header - Matching Records Design */}
      <div className="modern-records-header">
        <div className="modern-records-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="m22 21-2-2"></path>
            <path d="M16 16h6"></path>
          </svg>
          Add New Inmate
        </div>
      </div>

      {/* Main Layout */}
      <div style={styles.mainLayout}>
        {/* Left Column - Form */}
        <div style={styles.formCard}>
          <div style={styles.formContainer}>
            <div style={styles.sectionTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              Inmate Information
            </div>
            
            <div>
              <div style={styles.formGrid}>
                {/* Inmate Number with Auto-Generate Button */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Inmate Number
                  </label>
                  <div style={styles.inputWithButton}>
                    <input
                      type="text"
                      name="inmateNumber"
                      style={styles.inputWithButtonField}
                      placeholder="e.g., INM-0001"
                      value={formData.inmateNumber}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      required
                    />
                    <button
                      type="button"
                      style={{
                        ...styles.autoGenerateButton,
                        opacity: generatingNumber ? 0.6 : 1,
                        cursor: generatingNumber ? 'not-allowed' : 'pointer',
                        borderColor: generatingNumber ? '#d1d5db' : '#e2e8f0',
                        color: generatingNumber ? '#9ca3af' : '#374151'
                      }}
                      onClick={generateInmateNumber}
                      disabled={generatingNumber}
                      onMouseOver={(e) => {
                        if (!generatingNumber) {
                          e.target.style.borderColor = '#3b82f6';
                          e.target.style.color = '#3b82f6';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!generatingNumber) {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.color = '#374151';
                        }
                      }}
                      title="Auto-generate next available INM number"
                    >
                      {generatingNumber ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                          </circle>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                          <path d="M2 2l7.586 7.586"></path>
                          <circle cx="11" cy="11" r="2"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Security Category</label>
                  <select
                    name="securityCategory"
                    style={styles.input}
                    value={formData.securityCategory}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    required
                  >
                    <option value="">Select security category</option>
                    <option value="Minimum">Minimum</option>
                    <option value="Medium">Medium</option>
                    <option value="Maximum">Maximum</option>
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    style={styles.input}
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    style={styles.input}
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    required
                  />
                </div>
                
                <div style={{...styles.formGroup, ...styles.fullWidth}}>
                  <label style={styles.label}>Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    style={styles.input}
                    placeholder="Enter middle name (optional)"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                
                <div style={{...styles.formGroup, ...styles.fullWidth}}>
                  <label style={styles.label}>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    style={styles.input}
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    required
                  />
                </div>
                
                <div style={{...styles.formGroup, ...styles.fullWidth}}>
                  <label style={styles.label}>Reason for Imprisonment</label>
                  <textarea
                    name="reasonForImprisonment"
                    style={{
                      ...styles.input,
                      minHeight: '100px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    placeholder="Enter the reason for imprisonment"
                    value={formData.reasonForImprisonment}
                    onChange={handleInputChange}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    required
                  />
                </div>

                <div style={{...styles.formGroup, ...styles.fullWidth}}>
                  <label style={styles.label}>Inmate Photo (Optional)</label>
                  {photoPreview ? (
                    <div style={{
                      position: 'relative',
                      width: '200px',
                      height: '200px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid #e2e8f0',
                      margin: '0 auto'
                    }}>
                      <img
                        src={photoPreview}
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#dc2626'}
                        onMouseOut={(e) => e.target.style.background = '#ef4444'}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <label
                        htmlFor="photo-upload"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '200px',
                          height: '200px',
                          border: '2px dashed #d1d5db',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: '#f9fafb'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.background = '#eff6ff';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          e.currentTarget.style.background = '#f9fafb';
                        }}
                      >
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <span style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>Click to upload photo</span>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>PNG, JPG up to 5MB</span>
                      </label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                onClick={handleSubmit}
                style={{
                  ...styles.submitButton,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                    Adding Inmate...
                  </>
                ) : (
                  <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="m22 21-2-2"></path>
                  <path d="M16 16h6"></path>
                </svg>
                Add Inmate
                  </>
                )}
              </button>
              {error && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px',
                  marginTop: '16px',
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
            </div>
          </div>
        </div>

        {/* Right Column - Stats and Chart */}
        <div style={styles.statsColumn}>
          {/* Total Inmates Card - Modern Design */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#3b82f6'
              }}></div>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '8px'
            }}>
              {totalInmates.toLocaleString()}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '8px'
            }}>
              Total Inmates
            </div>
            <div style={{
              fontSize: '12px',
              color: '#10b981',
              fontWeight: '500'
            }}>
              +{Math.floor(totalInmates * 0.05)} from last month
            </div>
          </div>

          {/* Chart Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '18px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '16px'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
              Inmate Growth (Last 6 Months)
            </div>
            <div style={{
              height: '200px',
              position: 'relative'
            }}>
              {chartLoading ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  fontSize: '14px',
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
                  Loading chart data...
                </div>
              ) : (
              <Line data={chartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && addedInmate && (
        <div style={styles.modal} onClick={closeSuccessModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
                Inmate Added Successfully!
              </h3>
              <button style={styles.closeButton} onClick={closeSuccessModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div style={styles.modalGrid}>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Full Name</div>
                <div style={styles.infoValue}>
                  {`${addedInmate.firstName} ${addedInmate.middleName ? addedInmate.middleName + ' ' : ''}${addedInmate.lastName}`}
                </div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Inmate Number</div>
                <div style={styles.infoValue}>{addedInmate.inmateNumber}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Security Category</div>
                <div style={styles.infoValue}>{addedInmate.securityCategory}</div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Date of Birth</div>
                <div style={styles.infoValue}>{formatDate(addedInmate.dateOfBirth)}</div>
              </div>
            </div>
            
            <div style={{...styles.infoCard, marginTop: '16px'}}>
              <div style={styles.infoLabel}>Reason for Imprisonment</div>
              <div style={{...styles.infoValue, whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>
                {addedInmate.reasonForImprisonment || 'N/A'}
              </div>
            </div>

            {addedInmate.photoBase64 && (
              <div style={{...styles.infoCard, marginTop: '16px', textAlign: 'center'}}>
                <div style={styles.infoLabel}>Inmate Photo</div>
                <img
                  src={addedInmate.photoBase64}
                  alt={`${addedInmate.firstName} ${addedInmate.lastName}`}
                  style={{
                    width: '150px',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    marginTop: '12px',
                    border: '2px solid #e2e8f0'
                  }}
                />
              </div>
            )}
            
            <div style={styles.modalFooter}>
              <button 
                onClick={closeSuccessModal} 
                style={{...styles.modalButton, ...styles.secondaryButton}}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="m22 21-2-2"></path>
                  <path d="M16 16h6"></path>
                </svg>
                Add Another Inmate
              </button>
              <button 
                onClick={() => alert('Navigate to records page')} 
                style={{...styles.modalButton, ...styles.primaryButton}}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                View Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddInmate;