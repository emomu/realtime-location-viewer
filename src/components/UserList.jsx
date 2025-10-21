import React from 'react';
import './UserList.css';

function UserList({ users, onUserSelect, selectedUser }) {
  return (
    <div className="user-list">
      <div className="user-list-header">
        <h2>Çevrimiçi Kullanıcılar</h2>
        <span className="user-count">{users.length}</span>
      </div>
      
      <div className="user-list-items">
        {users.length === 0 ? (
          <div className="empty-state">
            <p>Henüz çevrimiçi kullanıcı yok</p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.userId}
              className={`user-item ${selectedUser?.userId === user.userId ? 'selected' : ''}`}
              onClick={() => onUserSelect(user)}
            >
              <img 
                src="/taxi.png" 
                alt="taxi" 
                className="user-icon"
              />
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-location">
                  📍 {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}
                </div>
              </div>
              <div className="user-status">
                <span className="status-dot online"></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UserList;