import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginModal.css';
import firebaseService from './firebase-services';
import { firebaseConfig } from './firebase-config';

const LoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('login');
  const [showPassword, setShowPassword] = useState({ login: false, register: false, registerConfirm: false });
  const [formData, setFormData] = useState({
    login: { email: '', password: '' },
    register: { name: '', phone: '', email: '', password: '', confirmPassword: '' },
    forgot: { email: '' }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      if (formData.register.password !== formData.register.confirmPassword) {
        setError('Passwords do not match!');
        return;
      }
      if (formData.register.password.length < 6) {
        setError('Password must be at least 6 characters long!');
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
          name: formData.register.name,
          phone: formData.register.phone,
          role: 'client', // Default to client
          uid: null // Will be set by Firebase Auth
        };
        
        // Create user account with Firebase Authentication and save data
        const result = await firebaseService.signUp(
          formData.register.email, 
          formData.register.password,
          userData
        );
        
        if (result.success) {
          // After successful registration, sign out the user and redirect to login
          await firebaseService.signOut();
          
          setSuccess('Registration successful! Please login with your credentials.');
          
          // Clear registration form and switch to login view
          setFormData(prev => ({
            ...prev,
            register: { name: '', phone: '', email: '', password: '', confirmPassword: '' },
            login: { email: formData.register.email, password: '' } // Pre-fill email for convenience
          }));
          
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
    
    // Only clear forms when manually switching views (not after successful registration)
    if (view !== 'login' || !success.includes('Registration successful')) {
      setFormData({
        login: { email: '', password: '' },
        register: { name: '', phone: '', email: '', password: '', confirmPassword: '' },
        forgot: { email: '' }
      });
    }
    
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    setCurrentView('login');
    setFormData({
      login: { email: '', password: '' },
      register: { name: '', phone: '', email: '', password: '', confirmPassword: '' },
      forgot: { email: '' }
    });
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
          <form className="modal-form" onSubmit={(e) => handleSubmit(e, 'register')} autoComplete="off">
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                type="text"
                className="modal-input"
                placeholder="Name"
                required
                aria-label="Name"
                value={formData.register.name}
                onChange={(e) => handleInputChange('register', 'name', e.target.value)}
              />
            </div>
            <div className="input-wrapper">
              <span className="input-icon">📞</span>
              <input
                type="tel"
                className="modal-input"
                placeholder="Phone number"
                required
                aria-label="Phone number"
                value={formData.register.phone}
                onChange={(e) => handleInputChange('register', 'phone', e.target.value)}
              />
            </div>
            <div className="input-wrapper">
              <span className="input-icon">📧</span>
              <input
                type="email"
                className="modal-input"
                placeholder="Email address"
                required
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
                required
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
                required
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
            <div className="form-message" id="register-form-message"></div>
            <button type="submit" className="modal-login-btn">Register</button>
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