import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 39.9334,
  lng: 32.8597,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

function Map({ users, selectedUser, onMarkerClick }) {
  const [map, setMap] = useState(null);
  const hasInitialized = useRef(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyDxQUHqQ4cWyUuZf3cpQLfGheGa4l7SYXc',
  });

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // SADECE kullanıcı listeden birine tıkladığında zoom yap
  useEffect(() => {
    if (map && selectedUser) {
      map.panTo({ lat: selectedUser.latitude, lng: selectedUser.longitude });
      map.setZoom(16);
    }
  }, [selectedUser]); // map'i kaldırdık, sadece selectedUser değişince çalışsın

  // Sadece İLK YÜKLEMEDE tüm kullanıcıları göster (BİR KERELİK)
  useEffect(() => {
    if (map && users.length > 0 && !hasInitialized.current) {
      const bounds = new window.google.maps.LatLngBounds();
      users.forEach((user) => {
        bounds.extend({ lat: user.latitude, lng: user.longitude });
      });
      map.fitBounds(bounds);
      hasInitialized.current = true;
      console.log('🗺️ Harita ilk kez ayarlandı, artık hiç değişmeyecek');
    }
  }, [map, users.length]); // Sadece map ve user sayısı değişince kontrol et

  if (!isLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: 20, color: '#000', letterSpacing: 2, fontSize: 11 }}>YÜKLENİYOR</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {users.map((user) => (
        <Marker
          key={user.userId}
          position={{ lat: user.latitude, lng: user.longitude }}
          title={user.name}
          icon={{
            url: '/taxi.png',
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20),
          }}
          onClick={() => onMarkerClick(user)}
        />
      ))}
    </GoogleMap>
  );
}

export default React.memo(Map);