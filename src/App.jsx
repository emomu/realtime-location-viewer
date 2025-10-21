import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Map from './components/Map';
import UserList from './components/UserList';
import socketService from './services/socketService';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Socket bağlantısını başlat
    socketService.connect();

    // Bağlantı durumunu izle
    if (socketService.socket) {
      socketService.socket.on('connect', () => {
        setIsConnected(true);
        console.log('✅ Bağlantı kuruldu');
      });

      socketService.socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('❌ Bağlantı kesildi');
      });
    }

    // Tüm konumları dinle
    socketService.onAllLocations((data) => {
      const onlineUsers = data.filter((user) => user.isOnline);
      setUsers(onlineUsers);
    });

    // Konum güncellemelerini dinle
    socketService.onLocationUpdate((updatedUser) => {
      setUsers((prevUsers) => {
        const existingIndex = prevUsers.findIndex(
          (user) => user.userId === updatedUser.userId
        );

        if (existingIndex !== -1) {
          // Mevcut kullanıcıyı güncelle
          const newUsers = [...prevUsers];
          newUsers[existingIndex] = {
            ...updatedUser,
            lastUpdate: new Date(),
          };
          return newUsers;
        } else {
          // Yeni kullanıcı ekle
          return [...prevUsers, { ...updatedUser, lastUpdate: new Date() }];
        }
      });
    });

    // Kullanıcı çevrimdışı olduğunda
    socketService.onUserOffline((data) => {
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.userId !== data.userId)
      );
      
      // Seçili kullanıcı çevrimdışı olduysa, seçimi kaldır
      if (selectedUser?.userId === data.userId) {
        setSelectedUser(null);
      }
    });

    // Cleanup
    return () => {
      socketService.disconnect();
    };
  }, [selectedUser]);

  const handleMarkerClick = (user) => {
    setSelectedUser(user);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  return (
    <div className="app">
      <Header userCount={users.length} isConnected={isConnected} />
      
      <div className="app-content">
        <UserList
          users={users}
          onUserSelect={handleUserSelect}
          selectedUser={selectedUser}
        />
        
        <div className="map-container">
          <Map
            users={users}
            selectedUser={selectedUser}
            onMarkerClick={handleMarkerClick}
          />
        </div>
      </div>
    </div>
  );
}

export default App;