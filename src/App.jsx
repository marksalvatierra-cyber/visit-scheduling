import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import './App.css'
import LoginModal from './LoginModal'
import AdminDashboard from './components/AdminDashboard'
import OfficerDashboard from './components/OfficerDashboard'
import ClientDashboard from './components/ClientDashboard'
import About from './components/About'
import Contacts from './components/Contacts'
import SplitBanner from './components/SplitBanner'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLoginClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
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
                      <img src="/image/12.png" alt="Central Prison Camp Sablayan Penal Farm Logo" className="logo-image" />
                    </div>
                    <div className="header-text">
                      <div className="republic-text">
                        <div className="republic">Republic of the Philippines</div>
                        <div className="republic-underline"></div>
                      </div>
                      <div className="bureau">Central Prison Camp Sablayan</div>
                      <div className="bureau-sub">Penal Farm</div>
                      <div className="tagline">"Bagong Pilipinas Bagong Pag-asa"</div>
                    </div>
                  </div>
                </div>
              </div>
              <nav className="main-nav">
                <div className="nav-links">
                  <Link to="/">Home</Link>
                  <Link to="/about">About</Link>
                  <Link to="/contacts">Contacts</Link>
                </div>
                <button className="login-btn" onClick={handleLoginClick}>Login</button>
              </nav>
              
              {/* Mobile Hamburger Menu */}
              <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
                <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
                <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
              </button>
            </header>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={closeMobileMenu}>
              <nav className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="mobile-nav-links">
                  <Link to="/" onClick={closeMobileMenu}>Home</Link>
                  <Link to="/about" onClick={closeMobileMenu}>About</Link>
                  <Link to="/contacts" onClick={closeMobileMenu}>Contacts</Link>
                </div>
                <button className="mobile-login-btn" onClick={() => { handleLoginClick(); closeMobileMenu(); }}>Login</button>
              </nav>
            </div>

            {/* Main Content */}
            <main className="main-content">
              <section className="hero-section">
                <SplitBanner onLoginClick={handleLoginClick} />
              </section>

              <section className="bottom-section">
                <div className="featured-story">
                  <h2>Featured Story</h2>
                  <a href="https://www.facebook.com/share/p/1E9Gx92CAW/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="story-card">
                    <div className="story-thumb">
                      <img src="/image/1st.png" alt="Story Thumbnail" className="story-thumb-image" />
                    </div>
                    <div className="story-content">
                      <div className="story-title">DPETS Conducts 7K TAMA Lecture at Sablayan Prison and Penal Farm</div>
                      <div className="story-desc">The 7K TAMA is designed to provide a comprehensive educational foundation, shaping personnel into dedicated, principled, and globally competent Corrections Officers who embody the highest standards of honesty and ethical behavior....</div>
                      <div className="story-date">21-23 February 2026</div>
                    </div>
                  </div>
                  </a>
                  <a href="https://www.facebook.com/share/v/18EZA2MCET/?mibextid=adiEgM" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="story-card">
                    <div className="story-thumb">
                      <img src="/image/2nd.png" alt="Story Thumbnail" className="story-thumb-image" />
                    </div>
                    <div className="story-content">
                      <div className="story-title">SPPF Personnel Undergo Emergency Readiness through Intensive Firefighting Refresher Training</div>
                      <div className="story-desc">From 20-22 February 2026, the Sablayan Prison and Penal Farm (SPPF), through the Learning and Development Section (LDS), led by CSO3 Lorelie G Silva, organized a...</div>
                      <div className="story-date">20-22 February 2026</div>
                    </div>
                  </div>
                  </a>
                  <a href="https://www.facebook.com/share/v/14WYUisLsHu/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="story-card">
                    <div className="story-thumb">
                      <img src="/image/3rd.png" alt="Story Thumbnail" className="story-thumb-image" />
                    </div>
                    <div className="story-content">
                      <div className="story-title">SPPF Women Personnel Joins Simultaneous Clean-up Drive Activity</div>
                      <div className="story-desc">A total of 150 women personnel from Sablayan Prison and Penal Farm (SPPF) participated in a simultaneous clean-up drive in celebration of National Women's Month 2025 on 14 March 2025...</div>
                      <div className="story-date">14 March 2025</div>
                    </div>
                  </div>
                  </a>
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
                    <div className="contact-org">Central Prison Camp Sablayan Penal Farm</div>
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
                <span>&copy; 2025 Central Prison Camp Sablayan Penal Farm. All rights reserved.</span>
                <span className="footer-divider">|</span>
                <span>Sablayan Prison and Penal Farm, Philippines</span>
                <a href="mailto:info@bucor.gov.ph" className="footer-icon" aria-label="Email">✉️</a>
              </div>
            </footer>
            
            {/* Login Modal */}
            <LoginModal isOpen={isModalOpen} onClose={handleCloseModal} />
          </div>
        } />
        
        {/* About Page Route */}
        <Route path="/about" element={(
          <div className="app landing-page">
            {/* Header */}
            <header className="main-header">
              <div className="header-left">
                <div className="header-branding">
                  <div className="main-branding">
                    <div className="logo">
                      <img src="/image/12.png" alt="Central Prison Camp Sablayan Penal Farm Logo" className="logo-image" />
                    </div>
                    <div className="header-text">
                      <div className="republic-text">
                        <div className="republic">Republic of the Philippines</div>
                        <div className="republic-underline"></div>
                      </div>
                      <div className="bureau">Central Prison Camp Sablayan</div>
                      <div className="bureau-sub">Penal Farm</div>
                      <div className="tagline">"Bagong Pilipinas Bagong Pag-asa"</div>
                    </div>
                  </div>
                </div>
              </div>
              <nav className="main-nav">
                <div className="nav-links">
                  <Link to="/">Home</Link>
                  <Link to="/about">About</Link>
                  <Link to="/contacts">Contacts</Link>
                </div>
                <button className="login-btn" onClick={handleLoginClick}>Login</button>
              </nav>
            </header>

            {/* Main Content - About Page */}
            <main className="main-content">
              <About />
            </main>

            {/* Footer */}
            <footer className="main-footer">
              <div className="footer-content">
                <span>&copy; 2025 Central Prison Camp Sablayan Penal Farm. All rights reserved.</span>
                <span className="footer-divider">|</span>
                <span>Sablayan Prison and Penal Farm, Philippines</span>
                <a href="mailto:info@bucor.gov.ph" className="footer-icon" aria-label="Email">✉️</a>
              </div>
            </footer>
            
            {/* Login Modal */}
            <LoginModal isOpen={isModalOpen} onClose={handleCloseModal} />
          </div>
        )} />
        
        {/* Contacts Page Route */}
        <Route path="/contacts" element={(
          <div className="app landing-page">
            {/* Header */}
            <header className="main-header">
              <div className="header-left">
                <div className="header-branding">
                  <div className="main-branding">
                    <div className="logo">
                      <img src="/image/12.png" alt="Central Prison Camp Sablayan Penal Farm Logo" className="logo-image" />
                    </div>
                    <div className="header-text">
                      <div className="republic-text">
                        <div className="republic">Republic of the Philippines</div>
                        <div className="republic-underline"></div>
                      </div>
                      <div className="bureau">Central Prison Camp Sablayan</div>
                      <div className="bureau-sub">Penal Farm</div>
                      <div className="tagline">"Bagong Pilipinas Bagong Pag-asa"</div>
                    </div>
                  </div>
                </div>
              </div>
              <nav className="main-nav">
                <div className="nav-links">
                  <Link to="/">Home</Link>
                  <Link to="/about">About</Link>
                  <Link to="/contacts">Contacts</Link>
                </div>
                <button className="login-btn" onClick={handleLoginClick}>Login</button>
              </nav>
            </header>

            {/* Main Content - Contacts Page */}
            <main className="main-content">
              <Contacts />
            </main>

            {/* Footer */}
            <footer className="main-footer">
              <div className="footer-content">
                <span>&copy; 2025 Central Prison Camp Sablayan Penal Farm. All rights reserved.</span>
                <span className="footer-divider">|</span>
                <span>Sablayan Prison and Penal Farm, Philippines</span>
                <a href="mailto:info@bucor.gov.ph" className="footer-icon" aria-label="Email">✉️</a>
              </div>
            </footer>
            
            {/* Login Modal */}
            <LoginModal isOpen={isModalOpen} onClose={handleCloseModal} />
          </div>
        )} />
        
        {/* Contacts Page Route */}
        <Route path="/contacts" element={(
          <div className="app landing-page">
            {/* Header */}
            <header className="main-header">
              <div className="header-left">
                <div className="header-branding">
                  <div className="main-branding">
                    <div className="logo">
                      <img src="/image/12.png" alt="Central Prison Camp Sablayan Penal Farm Logo" className="logo-image" />
                    </div>
                    <div className="header-text">
                      <div className="republic-text">
                        <div className="republic">Republic of the Philippines</div>
                        <div className="republic-underline"></div>
                      </div>
                      <div className="bureau">Central Prison Camp Sablayan Penal Farm</div>
                      <div className="tagline">"Bagong Pilipinas Bagong Pag-asa"</div>
                    </div>
                  </div>
                </div>
              </div>
              <nav className="main-nav">
                <div className="nav-links">
                  <Link to="/">Home</Link>
                  <Link to="/about">About</Link>
                  <Link to="/contacts">Contacts</Link>
                </div>
                <button className="login-btn" onClick={handleLoginClick}>Login</button>
              </nav>
            </header>

            {/* Main Content - Contacts Page */}
            <main className="main-content">
              <Contacts />
            </main>

            {/* Footer */}
            <footer className="main-footer">
              <div className="footer-content">
                <span>&copy; 2025 Central Prison Camp Sablayan Penal Farm. All rights reserved.</span>
                <span className="footer-divider">|</span>
                <span>Sablayan Prison and Penal Farm, Philippines</span>
                <a href="mailto:info@bucor.gov.ph" className="footer-icon" aria-label="Email">✉️</a>
              </div>
            </footer>
            
            {/* Login Modal */}
            <LoginModal isOpen={isModalOpen} onClose={handleCloseModal} />
          </div>
        )} />
        
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
