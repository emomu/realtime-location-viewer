import React from 'react';
import './Header.css';

function Header({ userCount, isConnected }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">

          <span className="logo-text">LOCATION</span>
        </div>
        
        <div className="header-info">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span>{isConnected ? 'Bağlı' : 'Bağlantı Kesildi'}</span>
          </div>
          
          <div className="user-count-badge">
            <span>{userCount} Kullanıcı</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;