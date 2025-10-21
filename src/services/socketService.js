import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io('http://54.164.111.251:4004', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket bağlandı:', this.socket.id);
      this.socket.emit('viewer-connected');
      this.socket.emit('authenticate', 'viewer-token');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket bağlantısı kesildi');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket bağlantı hatası:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket hatası:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onAllLocations(callback) {
    if (this.socket) {
      this.socket.on('initial-locations', (data) => {
        console.log('📥 Initial konumlar alındı:', data);
        callback(data);
      });
    }
  }

  onLocationUpdate(callback) {
    if (this.socket) {
      this.socket.on('location-update', (data) => {
        console.log('🔄 Konum güncellendi:', data);
        callback(data);
      });
    }
  }

  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on('user-offline', (data) => {
        console.log('👋 Kullanıcı çevrimdışı:', data);
        callback(data);
      });
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

// Named instance export
const socketServiceInstance = new SocketService();
export default socketServiceInstance;