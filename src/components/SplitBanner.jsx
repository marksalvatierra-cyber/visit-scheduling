import React, { useState } from 'react';
import './SplitBanner.css';

const SplitBanner = ({ onLoginClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1)); // December 2025
  const [selectedDate, setSelectedDate] = useState(null);
  const today = new Date(2025, 11, 15); // December 15, 2025

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
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null); // Clear selection when changing months
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null); // Clear selection when changing months
  };

  const handleDateClick = (day) => {
    // Check if the date is in the past
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (clickedDate < today) {
      return; // Don't allow selection of past dates
    }
    setSelectedDate(day);
  };

  const isPastDate = (day) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Set both dates to midnight for accurate comparison
    checkDate.setHours(0, 0, 0, 0);
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);
    return checkDate < todayMidnight;
  };

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);

    // Empty cells for days before the month starts
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Actual days of the month
    for (let day = 1; day <= totalDays; day++) {
      const isSelected = selectedDate === day;
      const isToday = day === today.getDate() && 
                  currentDate.getMonth() === today.getMonth() && 
                  currentDate.getFullYear() === today.getFullYear();
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
      {/* Left Side - Welcome Section */}
      <div className="split-left">
        <div className="welcome-content">
          <h1 className="welcome-title">Welcome to Our Facility</h1>
          
          <p className="welcome-description">
            Central Prison Camp Sablayan Penal Farm connects you with your loved ones. 
            Schedule your visit with ease and confidence through our streamlined booking system.
          </p>
          
          <button className="welcome-cta-btn" onClick={onLoginClick}>
            <span className="btn-text">Get Started</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>

      {/* Right Side - Calendar */}
      <div className="split-right">
        <div className="calendar-container">
          <h2 className="calendar-title">Visit Calendar</h2>
          <p className="calendar-subtitle">Select your preferred visit date</p>
          
          <div className="calendar-header">
            <button className="calendar-nav-btn" onClick={handlePrevMonth}>‹</button>
            <h3 className="calendar-month">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
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
              <button className="calendar-book-btn" onClick={onLoginClick}>
                Book This Date
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplitBanner;