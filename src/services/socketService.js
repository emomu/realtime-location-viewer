import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentFrequency = null;
  }

  connect(token = 'viewer-token-' + Date.now()) {
    if (this.socket?.connected) return;

    this.socket = io("http://54.164.111.251:4004", {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket bağlandı:', this.socket.id);
      // Authenticate et (mobil app gibi)
      this.socket.emit('authenticate', token);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket bağlantısı kesildi');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Bağlantı hatası:', error.message);
    });

    this.socket.on('auth-error', (data) => {
      console.error('❌ Auth hatası:', data);
    });
  }

  // MOBİL APP İLE AYNI! (join-frequency-viewer DEĞİL, join-frequency!)
  joinFrequency(frequency, userId = 'viewer-' + Date.now(), name = 'Web Viewer') {
    if (this.socket && this.socket.connected) {
      this.currentFrequency = frequency;
      
      this.socket.emit('join-frequency', {
        frequency: frequency,
        userId: userId,
        name: name
      });
      
      console.log(`📻 Frekansa katıldı: ${frequency}`);
    } else {
      console.error('❌ Socket bağlı değil!');
    }
  }

  leaveFrequency() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave-frequency');
      console.log('👋 Frekanstan ayrıldı');
      this.currentFrequency = null;
    }
  }

  // MOBİL APP İLE AYNI EVENT İSİMLERİ
  onFrequencyInitialLocations(callback) {
    if (this.socket) {
      this.socket.off('frequency-initial-locations');
      this.socket.on('frequency-initial-locations', (data) => {
        console.log('📥 Initial locations:', data);
        callback(data);
      });
    }
  }

  onFrequencyUserJoined(callback) {
    if (this.socket) {
      this.socket.off('frequency-user-joined');
      this.socket.on('frequency-user-joined', (data) => {
        console.log('👤 Kullanıcı katıldı:', data.name);
        callback(data);
      });
    }
  }

  onFrequencyLocationUpdate(callback) {
    if (this.socket) {
      this.socket.off('frequency-location-update');
      this.socket.on('frequency-location-update', (data) => {
        console.log('🔄 Konum güncellendi:', data.name);
        callback(data);
      });
    }
  }

  onFrequencyUserOffline(callback) {
    if (this.socket) {
      this.socket.off('frequency-user-offline');
      this.socket.on('frequency-user-offline', (data) => {
        console.log('👋 Kullanıcı offline:', data.userId);
        callback(data);
      });
    }
  }

  // Yeni: Hareket durumu değişikliği
  onUserMovementStatusChanged(callback) {
    if (this.socket) {
      this.socket.off('user-movement-status-changed');
      this.socket.on('user-movement-status-changed', (data) => {
        console.log(`🚦 ${data.name} ${data.isMoving ? 'harekete geçti' : 'durdu'}`);
        callback(data);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.leaveFrequency();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socketServiceInstance = new SocketService();
export default socketServiceInstance;