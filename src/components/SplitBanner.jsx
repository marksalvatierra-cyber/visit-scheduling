import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SplitBanner.css';

const SplitBanner = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const today = new Date();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    if (clickedDate < today) {
      return;
    }
    setSelectedDate(day);
  };

  const isPastDate = (day) => {
    const checkDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
    checkDate.setHours(0, 0, 0, 0);
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);
    return checkDate < todayMidnight;
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(calendarDate);
    const startDay = firstDayOfMonth(calendarDate);

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const isSelected = selectedDate === day;
      const isToday = day === today.getDate() && 
                  calendarDate.getMonth() === today.getMonth() && 
                  calendarDate.getFullYear() === today.getFullYear();
      const isPast = isPastDate(day);
      
      days.push(
        <button
          key={day}
          type="button"
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}`}
          onClick={() => handleDateClick(day)}
          disabled={isPast}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="split-banner">
      <div className="hero-container">
        {/* Main Hero Content */}
        <div className="hero-content">
          <h1 className="hero-title">
            Connecting Families,
            <br />
            <span className="hero-title-gradient">Building Hope Together</span>
          </h1>
          
          <p className="hero-description">
            Schedule inmate visits with ease through our secure, streamlined booking system. 
            Bringing loved ones closer with transparency, efficiency, and care.
          </p>

          <div className="hero-cta-group">
            <button className="hero-btn-primary" onClick={onLoginClick}>
              Schedule a Visit
              <span className="btn-icon">→</span>
            </button>
            <button className="hero-btn-secondary" onClick={() => navigate('/about')}>
              Learn More
            </button>
          </div>

          {/* Tips for Scheduling */}
          <div className="hero-tips">
            <h3 className="tips-heading">Tips for Scheduling Your Visit</h3>
            <ul className="tips-list">
              <li>Check available dates before planning your visit.</li>
              <li>Prepare all required documents (valid ID, authorization, etc.).</li>
              <li>Review visitor guidelines and restrictions.</li>
            </ul>
          </div>
        </div>

        {/* DateTime Widget */}
        <div className="datetime-widget">
          <div className="datetime-card">
            <div className="calendar-header">
              <button className="calendar-nav-btn" onClick={handlePrevMonth}>‹</button>
              <h3 className="calendar-month">
                {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </h3>
              <button className="calendar-nav-btn" onClick={handleNextMonth}>›</button>
            </div>

            <div className="calendar-weekdays">
              <div className="calendar-weekday">Su</div>
              <div className="calendar-weekday">Mo</div>
              <div className="calendar-weekday">Tu</div>
              <div className="calendar-weekday">We</div>
              <div className="calendar-weekday">Th</div>
              <div className="calendar-weekday">Fr</div>
              <div className="calendar-weekday">Sa</div>
            </div>

            <div className="calendar-grid">
              {renderCalendar()}
            </div>

            {selectedDate && (
              <div className="calendar-footer">
                <div className="selected-date-info">
                  Selected: {monthNames[calendarDate.getMonth()]} {selectedDate}, {calendarDate.getFullYear()}
                </div>
              </div>
            )}

            <div className="time-selection">
              <label htmlFor="visitTime" className="time-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                Preferred Time
              </label>
              <input
                type="time"
                id="visitTime"
                className="time-input"
                value={selectedTime || ''}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>

            <button className="datetime-cta" onClick={onLoginClick}>
              Book Your Visit Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitBanner;