import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginModal.css';
import firebaseService from './firebase-services';
import { firebaseConfig } from './firebase-config';

const LoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('login');
  const [registrationStep, setRegistrationStep] = useState(1); // Multi-step state
  const [showPassword, setShowPassword] = useState({ login: false, register: false, registerConfirm: false });
  const [countryCode, setCountryCode] = useState('+63'); // Default to Philippines
  const [formData, setFormData] = useState({
    login: { email: '', password: '' },
    register: { 
      firstName: '', 
      middleName: '', 
      surname: '', 
      country: '', 
      completeAddress: '', 
      mobileNumber: '', 
      affiliation: '', 
      idType: '', 
      email: '', 
      password: '', 
      confirmPassword: '' 
    },
    forgot: { email: '' }
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Multi-step form configuration
  const totalSteps = 4;
  const stepTitles = [
    'Personal Information',
    'Contact & Address',
    'Identity Verification',
    'Account Setup'
  ];
  
  // Country codes mapping
  const countryCodes = {
    'Philippines': '+63',
    'United States': '+1',
    'Canada': '+1',
    'United Kingdom': '+44',
    'Australia': '+61',
    'Japan': '+81',
    'South Korea': '+82',
    'Singapore': '+65',
    'Malaysia': '+60',
    'Thailand': '+66',
    'Indonesia': '+62',
    'Vietnam': '+84',
    'China': '+86',
    'India': '+91',
    'United Arab Emirates': '+971',
    'Saudi Arabia': '+966',
    'Qatar': '+974',
    'Hong Kong': '+852',
    'Taiwan': '+886',
    'New Zealand': '+64',
    'Germany': '+49',
    'France': '+33',
    'Italy': '+39',
    'Spain': '+34',
    'Netherlands': '+31',
    'Switzerland': '+41',
    'Sweden': '+46',
    'Norway': '+47',
    'Denmark': '+45',
    'Other': '+'
  };

  const handleInputChange = (form, field, value) => {
    setFormData(prev => ({
      ...prev,
      [form]: {
        ...prev[form],
        [field]: value
      }
    }));
    setError('');
    setSuccess('');
  };

  // Handle country change and update country code
  const handleCountryChange = (country) => {
    handleInputChange('register', 'country', country);
    
    // Update country code and reset mobile number
    if (countryCodes[country]) {
      setCountryCode(countryCodes[country]);
      setFormData(prev => ({
        ...prev,
        register: {
          ...prev.register,
          country: country,
          mobileNumber: '' // Reset mobile number when country changes
        }
      }));
    }
  };

  // Handle mobile number input with country code prefix
  const handleMobileNumberChange = (value) => {
    // Only allow digits after the country code
    const digitsOnly = value.replace(/\D/g, '');
    setFormData(prev => ({
      ...prev,
      register: {
        ...prev.register,
        mobileNumber: digitsOnly
      }
    }));
  };

  // Validate current step before proceeding
  const validateStep = (step) => {
    const registerData = formData.register;
    
    switch(step) {
      case 1: // Personal Information
        if (!registerData.firstName?.trim()) {
          setError('First name is required!');
          return false;
        }
        if (!registerData.surname?.trim()) {
          setError('Surname is required!');
          return false;
        }
        break;
        
      case 2: // Contact & Address
        if (!registerData.country?.trim()) {
          setError('Country is required!');
          return false;
        }
        if (!registerData.completeAddress?.trim()) {
          setError('Complete address is required!');
          return false;
        }
        if (!registerData.mobileNumber?.trim()) {
          setError('Mobile number is required!');
          return false;
        }
        // Validate mobile number (only digits, reasonable length)
        if (registerData.mobileNumber.length < 7 || registerData.mobileNumber.length > 15) {
          setError('Please enter a valid mobile number (7-15 digits)!');
          return false;
        }
        if (!registerData.affiliation?.trim()) {
          setError('Affiliation is required!');
          return false;
        }
        break;
        
      case 3: // Identity Verification
        if (!registerData.idType) {
          setError('Please select an ID type!');
          return false;
        }
        if (!uploadedFile) {
          setError('Please upload your proof of identity!');
          return false;
        }
        break;
        
      case 4: // Account Setup
        if (!registerData.email?.trim()) {
          setError('Email is required!');
          return false;
        }
        if (!registerData.password) {
          setError('Password is required!');
          return false;
        }
        if (registerData.password.length < 6) {
          setError('Password must be at least 6 characters long!');
          return false;
        }
        if (registerData.password !== registerData.confirmPassword) {
          setError('Passwords do not match!');
          return false;
        }
        break;
    }
    
    setError('');
    return true;
  };

  // Navigate to next step
  const handleNextStep = () => {
    if (validateStep(registrationStep)) {
      if (registrationStep < totalSteps) {
        setRegistrationStep(registrationStep + 1);
      }
    }
  };

  // Navigate to previous step
  const handlePrevStep = () => {
    if (registrationStep > 1) {
      setRegistrationStep(registrationStep - 1);
      setError('');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (images only)
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (PNG, JPG, JPEG)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setUploadedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const togglePassword = (form) => {
    setShowPassword(prev => ({
      ...prev,
      [form]: !prev[form]
    }));
  };

  const handleSubmit = async (e, formType) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Password validation for registration
    if (formType === 'register') {
      // Final validation before submission
      if (!validateStep(registrationStep)) {
        return;
      }
    }

    if (formType === 'login') {
      // Use firebaseService for login
      const result = await firebaseService.signIn(formData.login.email, formData.login.password);
      if (result.success) {
        setSuccess('Login successful! Redirecting...');
        const userData = await firebaseService.getUserData(result.user.uid);
        setTimeout(() => {
          // Check both 'role' and 'userType' fields for compatibility
          const userRole = userData?.role || userData?.userType;
          
          if (userData && userRole === 'admin') {
            onClose();
            navigate('/admin/dashboard');
          } else if (userData && userRole === 'officer') {
            onClose();
            navigate('/officer/dashboard');
          } else if (userData && userRole === 'client') {
            onClose();
            navigate('/client/dashboard');
          } else {
            setError('User type not recognized.');
          }
        }, 1000);
      } else {
        if (result.error && result.error.toLowerCase().includes('auth/invalid-credential')) {
          setError('Incorrect email or password. Please try again.');
        } else {
          setError(result.error || 'Login failed.');
        }
      }
      return;
    }

    if (formType === 'register') {
      try {
        // Prepare user data for registration
        const userData = {
          firstName: formData.register.firstName,
          middleName: formData.register.middleName,
          surname: formData.register.surname,
          fullName: `${formData.register.firstName} ${formData.register.middleName} ${formData.register.surname}`.replace(/\s+/g, ' ').trim(),
          country: formData.register.country,
          completeAddress: formData.register.completeAddress,
          mobileNumber: `${countryCode}${formData.register.mobileNumber}`, // Save with country code
          affiliation: formData.register.affiliation,
          idType: formData.register.idType,
          role: 'client', // Default to client
          uid: null, // Will be set by Firebase Auth
          profileStatus: 'pending_verification', // New users need verification
          registrationDate: new Date().toISOString()
        };
        
        // Create user account with Firebase Authentication and save data
        const result = await firebaseService.signUp(
          formData.register.email, 
          formData.register.password,
          userData,
          uploadedFile
        );
        
        if (result.success) {
          // After successful registration, sign out the user and redirect to login
          await firebaseService.signOut();
          
          setSuccess('Registration successful! Please login with your credentials.');
          
          // Clear registration form and switch to login view
          setFormData(prev => ({
            ...prev,
            register: { 
              firstName: '', 
              middleName: '', 
              surname: '', 
              country: '', 
              completeAddress: '', 
              mobileNumber: '', 
              affiliation: '', 
              idType: '', 
              email: '', 
              password: '', 
              confirmPassword: '' 
            },
            login: { email: formData.register.email, password: '' } // Pre-fill email for convenience
          }));
          
          // Clear uploaded file
          setUploadedFile(null);
          setFilePreview(null);
          
          // Switch to login view after a short delay
          setTimeout(() => {
            setCurrentView('login');
            setSuccess(''); // Clear success message when switching views
          }, 2000);
          
        } else {
          setError(result.error || 'Registration failed.');
        }
      } catch (error) {
        setError('Registration failed: ' + error.message);
      }
      return;
    }

    if (formType === 'forgot') {
      try {
        const result = await firebaseService.sendPasswordReset(formData.forgot.email);
        if (result.success) {
          setSuccess('Password reset email sent! Check your inbox.');
          
          // Switch back to login view after sending reset email
          setTimeout(() => {
            setCurrentView('login');
            setSuccess('');
          }, 3000);
        } else {
          setError(result.error || 'Failed to send reset email.');
        }
      } catch (error) {
        setError('Failed to send reset email: ' + error.message);
      }
      return;
    }
  };

  const switchView = (view) => {
    setCurrentView(view);
    setRegistrationStep(1); // Reset to step 1 when switching views
    
    // Only clear forms when manually switching views (not after successful registration)
    if (view !== 'login' || !success.includes('Registration successful')) {
      setFormData({
        login: { email: '', password: '' },
        register: { 
          firstName: '', 
          middleName: '', 
          surname: '', 
          country: '', 
          completeAddress: '', 
          mobileNumber: '', 
          affiliation: '', 
          idType: '', 
          email: '', 
          password: '', 
          confirmPassword: '' 
        },
        forgot: { email: '' }
      });
      setUploadedFile(null);
      setFilePreview(null);
    }
    
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    setCurrentView('login');
    setRegistrationStep(1); // Reset to step 1
    setFormData({
      login: { email: '', password: '' },
      register: { 
        firstName: '', 
        middleName: '', 
        surname: '', 
        country: '', 
        completeAddress: '', 
        mobileNumber: '', 
        affiliation: '', 
        idType: '', 
        email: '', 
        password: '', 
        confirmPassword: '' 
      },
      forgot: { email: '' }
    });
    setUploadedFile(null);
    setFilePreview(null);
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      {/* Floating alert outside the modal */}
      {(success || error) && (
        <div className="modal-alert-outer">
          {success && <div className="form-message success" id="login-form-success">{success}</div>}
          {error && <div className="form-message error" id="login-form-message">{error}</div>}
        </div>
      )}
      <div className="modal-stack-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Login Modal */}
        <div className={`modal-box modal-login-box ${currentView === 'login' ? 'show' : 'hide-left'}`}>
          <button className="modal-close" onClick={handleClose} aria-label="Close">&times;</button>
          <h2 className="modal-title">Welcome back!</h2>
          <form className="modal-form" onSubmit={(e) => handleSubmit(e, 'login')} autoComplete="off">
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
              <input
                type="email"
                className="modal-input"
                placeholder="Email address"
                required
                aria-label="Email"
                autoFocus
                value={formData.login.email}
                onChange={(e) => handleInputChange('login', 'email', e.target.value)}
              />
            </div>
            <div className="input-wrapper password-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword.login ? 'text' : 'password'}
                className="modal-input"
                placeholder="Password"
                required
                aria-label="Password"
                autoComplete="new-password"
                value={formData.login.password}
                onChange={(e) => handleInputChange('login', 'password', e.target.value)}
              />
              <span
                className="toggle-password"
                onClick={() => togglePassword('login')}
                tabIndex="0"
                aria-label="Show password"
              >
                {showPassword.login ? '👁️' : '🙈'}
              </span>
            </div>
            <div className="modal-row">
              <a href="#" className="modal-forgot" onClick={(e) => { e.preventDefault(); switchView('forgot'); }}>
                Forgot password?
              </a>
            </div>
            <button type="submit" className="modal-login-btn">Login</button>
          </form>
          <div className="modal-footer">
            Don't have an account? <a href="#" className="modal-register" onClick={(e) => { e.preventDefault(); switchView('register'); }}>Register here</a>
          </div>
        </div>
        {/* Register Modal */}
        <div className={`modal-box modal-register-box ${currentView === 'register' ? 'show show-right' : 'hide-right'}`}>
          <button className="modal-close" onClick={handleClose} aria-label="Close">&times;</button>
          <h2 className="modal-title">Create an Account</h2>
          
          {/* Progress Indicator */}
          <div className="step-progress">
            <div className="step-progress-bar">
              <div 
                className="step-progress-fill" 
                style={{ width: `${(registrationStep / totalSteps) * 100}%` }}
              ></div>
            </div>
            <div className="step-indicators">
              {[...Array(totalSteps)].map((_, index) => (
                <div 
                  key={index} 
                  className={`step-indicator ${registrationStep > index ? 'completed' : ''} ${registrationStep === index + 1 ? 'active' : ''}`}
                >
                  <div className="step-number">{index + 1}</div>
                  <div className="step-label">{stepTitles[index]}</div>
                </div>
              ))}
            </div>
          </div>

          <form className="modal-form" onSubmit={(e) => handleSubmit(e, 'register')} autoComplete="off">
            
            {/* Step 1: Personal Information */}
            {registrationStep === 1 && (
              <div className="step-content step-fade-in">
                <h3 className="step-title">Tell us about yourself</h3>
                
                <div className="form-row">
                  <div className="input-wrapper half-width">
                    <span className="input-icon">👤</span>
                    <input
                      type="text"
                      className="modal-input"
                      placeholder="First Name"
                      aria-label="First Name"
                      value={formData.register.firstName}
                      onChange={(e) => handleInputChange('register', 'firstName', e.target.value)}
                    />
                  </div>
                  <div className="input-wrapper half-width">
                    <span className="input-icon">👤</span>
                    <input
                      type="text"
                      className="modal-input"
                      placeholder="Middle Name (Optional)"
                      aria-label="Middle Name"
                      value={formData.register.middleName}
                      onChange={(e) => handleInputChange('register', 'middleName', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="Surname"
                    aria-label="Surname"
                    value={formData.register.surname}
                    onChange={(e) => handleInputChange('register', 'surname', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Contact & Address */}
            {registrationStep === 2 && (
              <div className="step-content step-fade-in">
                <h3 className="step-title">Where can we reach you?</h3>
                
                <div className="input-wrapper">
                  <span className="input-icon">🌍</span>
                  <select
                    className="modal-input modal-select"
                    aria-label="Country"
                    value={formData.register.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                  >
                    <option value="">Select Country</option>
                    <option value="Philippines">Philippines</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="Japan">Japan</option>
                    <option value="South Korea">South Korea</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="China">China</option>
                    <option value="India">India</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="Qatar">Qatar</option>
                    <option value="Hong Kong">Hong Kong</option>
                    <option value="Taiwan">Taiwan</option>
                    <option value="New Zealand">New Zealand</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Italy">Italy</option>
                    <option value="Spain">Spain</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Sweden">Sweden</option>
                    <option value="Norway">Norway</option>
                    <option value="Denmark">Denmark</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="input-wrapper">
                  <span className="input-icon">📍</span>
                  <textarea
                    className="modal-input modal-textarea"
                    placeholder="Complete Address"
                    aria-label="Complete Address"
                    rows="3"
                    value={formData.register.completeAddress}
                    onChange={(e) => handleInputChange('register', 'completeAddress', e.target.value)}
                  />
                </div>

                <div className="input-wrapper mobile-input-wrapper">
                  <span className="input-icon">📱</span>
                  <span className="country-code-prefix">{countryCode}</span>
                  <input
                    type="tel"
                    className="modal-input mobile-input"
                    placeholder="9123456789"
                    aria-label="Mobile Number"
                    value={formData.register.mobileNumber}
                    onChange={(e) => handleMobileNumberChange(e.target.value)}
                    maxLength="15"
                  />
                </div>
                <div className="info-message mobile-hint">
                  <span className="info-icon">💡</span>
                  <p>Enter your mobile number without the country code</p>
                </div>
                
                <div className="input-wrapper">
                  <span className="input-icon">🏢</span>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="Affiliation (Organization/Company)"
                    aria-label="Affiliation"
                    value={formData.register.affiliation}
                    onChange={(e) => handleInputChange('register', 'affiliation', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Identity Verification */}
            {registrationStep === 3 && (
              <div className="step-content step-fade-in">
                <h3 className="step-title">Verify your identity</h3>
                
                <div className="input-wrapper">
                  <span className="input-icon">🆔</span>
                  <select
                    className="modal-input modal-select"
                    aria-label="ID Type"
                    value={formData.register.idType}
                    onChange={(e) => handleInputChange('register', 'idType', e.target.value)}
                  >
                    <option value="">Select ID Type</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="national_id">National ID</option>
                    <option value="voters_id">Voter's ID</option>
                    <option value="employee_id">Employee ID</option>
                    <option value="student_id">Student ID</option>
                    <option value="senior_citizen_id">Senior Citizen ID</option>
                    <option value="philhealth_id">PhilHealth ID</option>
                    <option value="sss_id">SSS ID</option>
                    <option value="tin_id">TIN ID</option>
                  </select>
                </div>

                <div className="file-upload-wrapper">
                  <label className="file-upload-label">
                    <span className="input-icon">📎</span>
                    <span>Upload Proof of Identity</span>
                    <input
                      type="file"
                      accept="image/*"
                      aria-label="Proof of Identity"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {filePreview && (
                    <div className="file-preview">
                      <img src={filePreview} alt="ID Preview" className="preview-image" />
                      <span className="file-name">{uploadedFile?.name}</span>
                    </div>
                  )}
                </div>
                
                <div className="info-message">
                  <span className="info-icon">ℹ️</span>
                  <p>Your ID will be verified by our team. Accepted formats: JPG, PNG (max 5MB)</p>
                </div>
              </div>
            )}

            {/* Step 4: Account Setup */}
            {registrationStep === 4 && (
              <div className="step-content step-fade-in">
                <h3 className="step-title">Secure your account</h3>
                
                <div className="input-wrapper">
                  <span className="input-icon">📧</span>
                  <input
                    type="email"
                    className="modal-input"
                    placeholder="Email address"
                    aria-label="Email"
                    value={formData.register.email}
                    onChange={(e) => handleInputChange('register', 'email', e.target.value)}
                  />
                </div>
                
                <div className="input-wrapper password-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword.register ? 'text' : 'password'}
                    className="modal-input"
                    placeholder="Password"
                    aria-label="Password"
                    autoComplete="new-password"
                    value={formData.register.password}
                    onChange={(e) => handleInputChange('register', 'password', e.target.value)}
                  />
                  <span
                    className="toggle-password"
                    onClick={() => togglePassword('register')}
                    tabIndex="0"
                    aria-label="Show password"
                  >
                    {showPassword.register ? '👁️' : '🙈'}
                  </span>
                </div>
                
                <div className="input-wrapper password-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword.registerConfirm ? 'text' : 'password'}
                    className="modal-input"
                    placeholder="Confirm Password"
                    aria-label="Confirm Password"
                    autoComplete="new-password"
                    value={formData.register.confirmPassword}
                    onChange={(e) => handleInputChange('register', 'confirmPassword', e.target.value)}
                  />
                  <span
                    className="toggle-password"
                    onClick={() => togglePassword('registerConfirm')}
                    tabIndex="0"
                    aria-label="Show confirm password"
                  >
                    {showPassword.registerConfirm ? '👁️' : '🙈'}
                  </span>
                </div>
                
                <div className="info-message">
                  <span className="info-icon">🔐</span>
                  <p>Password must be at least 6 characters long</p>
                </div>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="step-navigation">
              {registrationStep > 1 && (
                <button 
                  type="button" 
                  className="step-btn step-btn-back"
                  onClick={handlePrevStep}
                >
                  ← Back
                </button>
              )}
              
              {registrationStep < totalSteps ? (
                <button 
                  type="button" 
                  className="step-btn step-btn-next"
                  onClick={handleNextStep}
                >
                  Next →
                </button>
              ) : (
                <button type="submit" className="step-btn step-btn-submit">
                  Create Account ✓
                </button>
              )}
            </div>
          </form>
          <div className="modal-footer">
            Already have an account? <a href="#" className="modal-login" onClick={(e) => { e.preventDefault(); switchView('login'); }}>Login here</a>
          </div>
        </div>

        {/* Forgot Password Modal */}
        <div className={`modal-box modal-forgot-box ${currentView === 'forgot' ? 'show show-right' : 'hide-right'}`}>
          <button className="modal-close" onClick={handleClose} aria-label="Close">&times;</button>
          <h2 className="modal-title">Reset Password</h2>
          <form className="modal-form" onSubmit={(e) => handleSubmit(e, 'forgot')} autoComplete="off">
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
              <input
                type="email"
                className="modal-input"
                placeholder="Enter your email address"
                required
                aria-label="Email"
                value={formData.forgot.email}
                onChange={(e) => handleInputChange('forgot', 'email', e.target.value)}
              />
            </div>
            <div className="form-message" id="forgot-form-message"></div>
            <button type="submit" className="modal-login-btn">Send Reset Link</button>
          </form>
          <div className="modal-footer">
            Remembered your password? <a href="#" className="modal-login" onClick={(e) => { e.preventDefault(); switchView('login'); }}>Login here</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;