import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import LoginModal from './LoginModal'
import AdminDashboard from './components/AdminDashboard'
import OfficerDashboard from './components/OfficerDashboard'
import ClientDashboard from './components/ClientDashboard'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLoginClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <Router>
      <Routes>
        {/* Landing Page Route */}
        <Route path="/" element={
          <div className="app landing-page">
            {/* Header */}
            <header className="main-header">
              <div className="header-left">
                <div className="header-branding">
                  <div className="main-branding">
                    <div className="logo">
                      <img src="/image/Logo.png" alt="Bureau of Corrections Logo" className="logo-image" />
                    </div>
                    <div className="header-text">
                      <div className="republic-text">
                        <div className="republic">Republic of the Philippines</div>
                        <div className="republic-underline"></div>
                      </div>
                      <div className="bureau">Bureau of Corrections</div>
                      <div className="tagline">"Bagong Pilipinas Bagong Pag-asa"</div>
                    </div>
                  </div>
                </div>
              </div>
              <nav className="main-nav">
                <div className="nav-links">
                  <a href="#" className="active">Home</a>
                  <a href="#">About</a>
                  <a href="#">Contacts</a>
                </div>
                <button className="login-btn" onClick={handleLoginClick}>Login</button>
              </nav>
            </header>

            {/* Main Content */}
            <main className="main-content">
              <section className="top-section">
                <div className="banner-large">
                  <div className="banner-image-container">
                    <img src="/image/Banner.png" alt="Panata sa Bagong Pilipinas" />
                  </div>
                </div>
                <div className="banner-side">
                  <div className="side-banner hiring-banner">
                    <div className="hiring-image-container">
                      <img src="/image/Hiring.png" alt="Panata sa Bagong Pilipinas" />
                    </div>
                  </div>
                  <div className="side-banner vision-banner">
                    <div className="vision-image-container">
                      <img src="/image/Info.png" alt="Panata sa Bagong Pilipinas" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="bottom-section">
                <div className="featured-story">
                  <h2>Featured Story</h2>
                  <div className="story-card">
                    <div className="story-thumb">
                      <img src="/image/Logo.png" alt="Story Thumbnail" className="story-thumb-image" />
                    </div>
                    <div className="story-content">
                      <div className="story-title">IPPF CONTINUOUSLY IMPLEMENTS REFORMATION PROGRAMS THROUGH AGRICULTURAL ACTIVITIES</div>
                      <div className="story-desc">On 20 February 2025, the Iwahig Prison and Penal Farm (IPPF) successfully completed planting rice in four (4) hectares of...</div>
                      <div className="story-date">20 February 2025</div>
                    </div>
                  </div>
                  <div className="story-card">
                    <div className="story-thumb">
                      <img src="/image/Info.png" alt="Story Thumbnail" className="story-thumb-image" />
                    </div>
                    <div className="story-content">
                      <div className="story-title">BUCOR, PHILIPPINE PLAYHOUSE, INC. FORGE PARTNERSHIP TO ENHANCE CIW ANG TEATRO PROGRAM</div>
                      <div className="story-desc">The Bureau of Corrections (BuCor) and Philippine Playhouse, Inc. officially signed a Memorandum of Agreement (MOA) to strengthen the implementation...</div>
                      <div className="story-date">22 February 2025</div>
                    </div>
                  </div>
                  <div className="story-card">
                    <div className="story-thumb">
                      <img src="/image/Hiring.png" alt="Story Thumbnail" className="story-thumb-image" />
                    </div>
                    <div className="story-content">
                      <div className="story-title">IPPF PDLs RECEIVE ASSISTANCE FROM DOLE</div>
                      <div className="story-desc">Iwahig, Puerto Princesa – The Department of Labor and Employment (DOLE) in partnership with the Bureau of Jail Management and...</div>
                      <div className="story-date">21 February 2025</div>
                    </div>
                  </div>
                </div>
                <div className="map-section map-section-small unified-contact-card">
                  <div className="contact-title">Get in Touch</div>
                  <div className="map-embed-wrapper">
                    <iframe 
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3889.7820458383467!2d120.90903437411848!3d12.857349317374755!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bb799cac32c5f7%3A0x807760b2a341547f!2sSablayan%20Prison%20and%20Penal%20Farm!5e0!3m2!1sen!2sph!4v1753605808134!5m2!1sen!2sph" 
                      style={{border: 0, width: '100%', height: '100%'}} 
                      allowFullScreen="" 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Sablayan Prison and Penal Farm Location"
                    ></iframe>
                  </div>
                  <div className="map-divider"></div>
                  <div className="map-contact">
                    <div className="contact-org">Bureau of Corrections</div>
                    <div className="contact-address">Sablayan Prison and Penal Farm, Philippines</div>
                    <div className="contact-divider"></div>
                    <div className="contact-row">
                      <span className="contact-icon">📞</span>
                      <span className="contact-label">Phone</span>
                      <a href="tel:+63212345678" className="contact-link">(02) 1234-5678</a>
                    </div>
                    <div className="contact-row">
                      <span className="contact-icon">✉️</span>
                      <span className="contact-label">Email</span>
                      <a href="mailto:info@bucor.gov.ph" className="contact-link">info@bucor.gov.ph</a>
                    </div>
                  </div>
                </div>
              </section>
            </main>

            {/* Footer */}
            <footer className="main-footer">
              <div className="footer-content">
                <span>&copy; 2025 Bureau of Corrections. All rights reserved.</span>
                <span className="footer-divider">|</span>
                <span>Sablayan Prison and Penal Farm, Philippines</span>
                <a href="mailto:info@bucor.gov.ph" className="footer-icon" aria-label="Email">✉️</a>
              </div>
            </footer>
            
            {/* Login Modal */}
            <LoginModal isOpen={isModalOpen} onClose={handleCloseModal} />
          </div>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminDashboard />} />
        {/* Officer Routes */}
        <Route path="/officer/*" element={<OfficerDashboard />} />
        {/* Client Routes */}
        <Route path="/client/*" element={<ClientDashboard />} />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
