import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Map from './components/Map';
import UserList from './components/UserList';
import FrequencyScreen from './components/FrequencyScreen';
import LoginScreen from './components/LoginScreen';
import SettingsScreen from './components/SettingsScreen';
import socketService from './services/socketService';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Harita ayarları
  const [mapSettings, setMapSettings] = useState({
    mapTypeId: 'roadmap',
    mapStyle: 'default',
    polylineColor: '#1976D2',
    zoomControl: true,
    trafficAutoStart: false,
  });

  // Sayfa yüklendiğinde token kontrolü
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      console.log('💾 Kaydedilmiş token bulundu');
      handleLoginSuccess(savedToken, JSON.parse(savedUser), false);
    }
  }, []);

  const handleLoginSuccess = (token, user, saveToStorage = true) => {
    console.log('✅ Token alındı, socket bağlanıyor...');
    
    if (saveToStorage) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    setCurrentUser(user);
    setIsAuthenticated(true);
    
    socketService.connect(token);

    if (socketService.socket) {
      socketService.socket.on('connect', () => {
        setIsConnected(true);
        console.log('✅ Socket bağlantısı kuruldu');
      });

      socketService.socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('❌ Bağlantı kesildi');
      });

      socketService.socket.on('authenticated', (data) => {
        console.log('✅ Authenticate başarılı:', data);
      });
    }
  };

  const handleFrequencySelect = (frequency) => {
    setCurrentFrequency(frequency);
    setUsers([]);
    setSelectedUser(null);

    socketService.onFrequencyInitialLocations((data) => {
      console.log('📥 Gelen initial locations:', data);
      if (Array.isArray(data)) {
        const filtered = data
          .filter(u => u.userId !== currentUser?.id)
          .map(u => ({
            ...u,
            isMoving: u.isMoving !== undefined ? u.isMoving : true
          }));
        setUsers(filtered);
        console.log(`👥 ${filtered.length} taksi yüklendi`);
      }
    });

    socketService.onFrequencyUserJoined((user) => {
      console.log('👤 Yeni kullanıcı:', user);
      setUsers((prev) => {
        const exists = prev.find(u => u.userId === user.userId);
        if (!exists && user.userId !== currentUser?.id) {
          return [...prev, {
            ...user,
            isMoving: user.isMoving !== undefined ? user.isMoving : true
          }];
        }
        return prev;
      });
    });

    socketService.onFrequencyLocationUpdate((updatedUser) => {
      setUsers((prev) => {
        if (updatedUser.userId === currentUser?.id) return prev;

        const index = prev.findIndex(u => u.userId === updatedUser.userId);
        if (index !== -1) {
          const newUsers = [...prev];
          // Backend'den gelen isMoving parametresini kullan
          newUsers[index] = {
            ...updatedUser,
            isMoving: updatedUser.isMoving !== undefined ? updatedUser.isMoving : true
          };
          return newUsers;
        }
        return [...prev, {
          ...updatedUser,
          isMoving: updatedUser.isMoving !== undefined ? updatedUser.isMoving : true
        }];
      });
    });

    socketService.onUserMovementStatusChanged((data) => {
      setUsers((prev) => {
        const index = prev.findIndex(u => u.userId === data.userId);
        if (index !== -1) {
          const newUsers = [...prev];
          newUsers[index] = {
            ...newUsers[index],
            isMoving: data.isMoving
          };
          return newUsers;
        }
        return prev;
      });
    });

    socketService.onFrequencyUserOffline((data) => {
      setUsers((prev) => prev.filter(u => u.userId !== data.userId));
      if (selectedUser?.userId === data.userId) {
        setSelectedUser(null);
      }
    });

    setTimeout(() => {
      socketService.joinFrequency(
        frequency, 
        currentUser?.id || 'viewer-' + Date.now(), 
        currentUser?.name || 'Web Viewer'
      );
    }, 500);
  };

  const handleLeaveFrequency = () => {
    socketService.leaveFrequency();
    setCurrentFrequency(null);
    setUsers([]);
    setSelectedUser(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socketService.disconnect();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentFrequency(null);
    setUsers([]);
  };

  const handleSettingsChange = (newSettings) => {
    setMapSettings((prev) => ({ ...prev, ...newSettings }));
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (!currentFrequency) {
    return <FrequencyScreen onFrequencySelect={handleFrequencySelect} />;
  }

  return (
    <div className="app">
      <Header
        userCount={users.length}
        isConnected={isConnected}
        frequency={currentFrequency}
        onLeaveFrequency={handleLeaveFrequency}
        onLogout={handleLogout}
        userName={currentUser?.name}
        onSettingsClick={() => setShowSettings(true)}
      />

      <div className="app-content">
        <UserList
          users={users}
          onUserSelect={setSelectedUser}
          selectedUser={selectedUser}
        />

        <div className="map-container">
          <Map
            users={users}
            selectedUser={selectedUser}
            onMarkerClick={setSelectedUser}
            mapSettings={mapSettings}
          />
        </div>
      </div>

      {showSettings && (
        <SettingsScreen
          settings={mapSettings}
          onSettingsChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;