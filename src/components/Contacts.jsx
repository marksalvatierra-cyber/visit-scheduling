import React from 'react';
import '../App.css';

function Contacts() {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: 'calc(100vh - 200px)',
      padding: '1.5rem 0.75rem'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto'
      }}>
        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '1rem 0'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(1.55rem, 5vw, 2.2rem)', 
            fontWeight: '700',
            marginBottom: '0.8rem',
            letterSpacing: '-0.5px',
            color: '#1e40af'
          }}>
            Contact Us
          </h1>
          <p style={{ 
            fontSize: 'clamp(0.9rem, 2.8vw, 1.05rem)',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.6',
            color: '#4a5568'
          }}>
            Get in touch with us for any inquiries about visit scheduling, requirements, or general information.
          </p>
        </div>

        {/* Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          {/* Contact Information Card */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '1.25rem',
            boxShadow: '0 5px 20px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{
              fontSize: 'clamp(1.25rem, 3.8vw, 1.5rem)',
              fontWeight: '700',
              color: '#1e40af',
              marginBottom: '1rem'
            }}>
              Contact Information
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Location */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  📍
                </div>
                <div>
                  <h3 style={{ 
                    fontSize: '0.98rem', 
                    fontWeight: '600', 
                    color: '#2d3748',
                    marginBottom: '0.3rem'
                  }}>
                    Location
                  </h3>
                  <p style={{ 
                    fontSize: '0.82rem', 
                    color: '#4a5568', 
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    Sablayan Prison and Penal Farm<br />
                    Sablayan, Occidental Mindoro<br />
                    Philippines
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  📞
                </div>
                <div>
                  <h3 style={{ 
                    fontSize: '0.98rem', 
                    fontWeight: '600', 
                    color: '#2d3748',
                    marginBottom: '0.3rem'
                  }}>
                    Phone
                  </h3>
                  <p style={{ 
                    fontSize: '0.82rem', 
                    color: '#4a5568',
                    margin: 0
                  }}>
                    <a href="tel:+63212345678" style={{ 
                      color: '#3b82f6', 
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}>
                      (02) 1234-5678
                    </a>
                  </p>
                </div>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(90deg, #6366f1, #10b981)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  ✉️
                </div>
                <div>
                  <h3 style={{ 
                    fontSize: '0.98rem', 
                    fontWeight: '600', 
                    color: '#2d3748',
                    marginBottom: '0.3rem'
                  }}>
                    Email
                  </h3>
                  <p style={{ 
                    fontSize: '0.82rem', 
                    color: '#4a5568',
                    margin: 0
                  }}>
                    <a href="mailto:info@bucor.gov.ph" style={{ 
                      color: '#3b82f6', 
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}>
                      info@bucor.gov.ph
                    </a>
                  </p>
                </div>
              </div>

              {/* Office Hours */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{
                  minWidth: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  🕐
                </div>
                <div>
                  <h3 style={{ 
                    fontSize: '0.98rem', 
                    fontWeight: '600', 
                    color: '#2d3748',
                    marginBottom: '0.3rem'
                  }}>
                    Office Hours
                  </h3>
                  <p style={{ 
                    fontSize: '0.82rem', 
                    color: '#4a5568', 
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    Monday - Friday: 8:00 AM - 5:00 PM<br />
                    Saturday - Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            overflow: 'hidden',
            boxShadow: '0 5px 20px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              padding: '1.5rem',
              color: 'white'
            }}>
              <h2 style={{
                fontSize: 'clamp(1.2rem, 3.6vw, 1.5rem)',
                color: 'white',
                fontWeight: '700',
                margin: 0
              }}>
                Find Us Here
              </h2>
            </div>
            <div style={{ height: '100%', minHeight: '320px' }}>
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.7820458383467!2d120.90903437411848!3d12.857349317374755!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bb799cac32c5f7%3A0x807760b2a341547f!2sSablayan%20Prison%20and%20Penal%20Farm!5e0!3m2!1sen!2sph!4v1753605808134!5m2!1sen!2sph" 
                style={{border: 0, width: '100%', height: '100%'}} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Sablayan Prison and Penal Farm Location"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Quick Links / FAQ Section */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '1.25rem',
          boxShadow: '0 5px 20px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{
            fontSize: 'clamp(1.2rem, 3.6vw, 1.5rem)',
            fontWeight: '700',
            color: '#1e40af',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            Frequently Asked Questions
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <h3 style={{
                fontSize: '0.98rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '0.5rem'
              }}>
                What do I need to schedule a visit?
              </h3>
              <p style={{
                fontSize: '0.85rem',
                color: '#4a5568',
                lineHeight: '1.6',
                margin: 0
              }}>
                You'll need a valid ID, the inmate's information, and to create an account in our scheduling system.
              </p>
            </div>

            <div>
              <h3 style={{
                fontSize: '0.98rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '0.5rem'
              }}>
                How far in advance can I schedule?
              </h3>
              <p style={{
                fontSize: '0.85rem',
                color: '#4a5568',
                lineHeight: '1.6',
                margin: 0
              }}>
                Visits can be scheduled up to 30 days in advance through our online system.
              </p>
            </div>

            <div>
              <h3 style={{
                fontSize: '0.98rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '0.5rem'
              }}>
                What are the visiting hours?
              </h3>
              <p style={{
                fontSize: '0.85rem',
                color: '#4a5568',
                lineHeight: '1.6',
                margin: 0
              }}>
                Visiting hours are typically on weekends from 8:00 AM to 3:00 PM. Please check the schedule for specific dates.
              </p>
            </div>

            <div>
              <h3 style={{
                fontSize: '0.98rem',
                fontWeight: '600',
                color: '#2d3748',
                marginBottom: '0.5rem'
              }}>
                Can I cancel or reschedule my visit?
              </h3>
              <p style={{
                fontSize: '0.85rem',
                color: '#4a5568',
                lineHeight: '1.6',
                margin: 0
              }}>
                Yes, you can cancel or reschedule through your account at least 24 hours before your scheduled visit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contacts;
