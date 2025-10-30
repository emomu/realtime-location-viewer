import React from 'react';
import './Header.css';

function Header({ userCount, isConnected, frequency, onLeaveFrequency, onLogout, userName }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <span className="logo-text">LOCATION</span>
          {userName && <span className="user-name-badge">{userName}</span>}
        </div>

        <div className="frequency-badge">
          📻 {frequency}
        </div>
        
        <div className="header-info">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span>{isConnected ? 'Bağlı' : 'Bağlantı Kesildi'}</span>
          </div>
          
          <div className="user-count-badge">
            <span>{userCount} Taksi</span>
          </div>

          <button className="leave-button" onClick={onLeaveFrequency}>
            FREKANS DEĞİŞTİR
          </button>

          <button className="logout-button" onClick={onLogout}>
            ÇIKIŞ
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;