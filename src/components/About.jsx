import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function About() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/');
    // Trigger login modal after navigation
    setTimeout(() => {
      const loginBtn = document.querySelector('.login-btn');
      if (loginBtn) loginBtn.click();
    }, 100);
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: 'calc(100vh - 200px)',
      padding: '2rem 1rem'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto'
      }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '1rem 0'
        }}>
          <h1 style={{ 
            fontSize: '2.2rem', 
            fontWeight: '700',
            marginBottom: '0.8rem',
            letterSpacing: '-0.5px',
            color: '#1e40af'
          }}>
            About the System
          </h1>
          <p style={{ 
            fontSize: '1.05rem',
            maxWidth: '900px',
            margin: '0 auto',
            lineHeight: '1.6',
            color: '#4a5568'
          }}>
            The Central Prison Camp Sablayan Penal Farm Visit Scheduling System by Scanning QR Code is designed to improve the management and scheduling of visits for relatives of Persons Deprived of Liberty (PDL) at Sablayan Penal Farm.
          </p>
        </div>

        {/* Two Column Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Left Column - Primary Objectives */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '2rem',
            boxShadow: '0 5px 20px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ 
              fontSize: '1.8rem', 
              fontWeight: '700',
              marginBottom: '1.5rem',
              color: '#2d3748',
              textAlign: 'center'
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Primary Objectives
              </span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                {
                  title: 'Digitalize the Process',
                  desc: 'Replace manual scheduling with an automated and paperless system.',
                  icon: '💻',
                  color: '#667eea'
                },
                {
                  title: 'Accelerate Registration',
                  desc: 'Fast, accurate check-in/check-out using QR Code technology.',
                  icon: '⚡',
                  color: '#f093fb'
                },
                {
                  title: 'Organize Visitor Flow',
                  desc: 'Maintain order, security, and health standards with proper capacity management.',
                  icon: '👥',
                  color: '#4facfe'
                },
                {
                  title: 'Improve Experience',
                  desc: 'Clear schedules that reduce waiting times and confusion.',
                  icon: '✨',
                  color: '#43e97b'
                }
              ].map((objective, index) => (
                <div key={index} style={{
                  background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                  padding: '1.2rem',
                  borderRadius: '10px',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ 
                    fontSize: '2rem',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    {objective.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#2d3748',
                      marginBottom: '0.3rem'
                    }}>
                      {objective.title}
                    </h3>
                    <p style={{ 
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      color: '#4a5568',
                      margin: 0
                    }}>
                      {objective.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - How It Works */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '2rem',
            boxShadow: '0 5px 20px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{ 
              fontSize: '1.8rem', 
              fontWeight: '700',
              marginBottom: '1rem',
              color: '#2d3748',
              textAlign: 'center'
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                 How It Works
              </span>
            </h2>
            <p style={{ 
              fontSize: '0.95rem', 
              color: '#4a5568',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              The system is centered on the use of QR Code technology
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                {
                  step: '1',
                  title: 'Streamline Scheduling',
                  subtitle: 'Online/Pre-registration',
                  desc: 'Visitors register and schedule their visit in advance. Each visitor receives a unique QR Code.',
                  icon: '📅',
                  gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'
                },
                {
                  step: '2',
                  title: 'Rapid Verification',
                  subtitle: 'Check-in Process',
                  desc: 'Upon arrival, visitors present their QR Code for scanning, which immediately verifies their schedule and information.',
                  icon: '📱',
                  gradient: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)'
                },
                {
                  step: '3',
                  title: 'Accurate Tracking',
                  subtitle: 'Automatic Logging',
                  desc: 'The system logs date, arrival time, and departure time, providing reliable and auditable records.',
                  icon: '📊',
                  gradient: 'linear-gradient(90deg, #6366f1, #10b981)'
                }
              ].map((feature, index) => (
                <div key={index} style={{
                  background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                  padding: '1.2rem',
                  borderRadius: '10px',
                  display: 'flex',
                  gap: '1rem',
                  border: '1px solid #e2e8f0',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '4px',
                    height: '100%',
                    background: feature.gradient
                  }} />
                  <div style={{
                    minWidth: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: feature.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    flexShrink: 0
                  }}>
                    {feature.icon}
                  </div>
                  <div style={{ flex: 1, paddingLeft: '0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '0.5rem',
                      marginBottom: '0.3rem'
                    }}>
                      <h3 style={{ 
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#2d3748',
                        margin: 0
                      }}>
                        {feature.title}
                      </h3>
                      <span style={{
                        fontSize: '0.8rem',
                        color: '#718096',
                        fontStyle: 'italic'
                      }}>
                        ({feature.subtitle})
                      </span>
                    </div>
                    <p style={{ 
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      color: '#4a5568',
                      margin: 0
                    }}>
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '15px',
          textAlign: 'center',
          boxShadow: '0 5px 20px rgba(0,0,0,0.08)'
        }}>
          <p style={{ 
            fontSize: '1.05rem',
            color: '#4a5568',
            marginBottom: '1rem',
            lineHeight: '1.6'
          }}>
            Experience a modernized, secure, and efficient visiting process designed with you in mind.
          </p>
          <div 
            onClick={handleGetStarted}
            style={{
              display: 'inline-block',
              padding: '0.8rem 2rem',
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              color: 'white',
              borderRadius: '50px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(30, 64, 175, 0.3)',
              transition: 'transform 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            Get Started Today
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
