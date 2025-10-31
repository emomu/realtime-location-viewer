import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, OverlayView, useJsApiLoader } from '@react-google-maps/api';
import useMapStore from '../store/mapStore';

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

function Map({ users, selectedUser, onMarkerClick, mapSettings }) {
  const [map, setMap] = useState(null);
  const [zoom, setZoom] = useState(10);
  const hasInitialized = useRef(false);

  // Zustand store'dan state ve actions al
  const animatedPositions = useMapStore((state) => state.animatedPositions);
  const markerBearings = useMapStore((state) => state.markerBearings);
  const setAnimatedPosition = useMapStore((state) => state.setAnimatedPosition);
  const setMarkerBearing = useMapStore((state) => state.setMarkerBearing);
  const updateMarker = useMapStore((state) => state.updateMarker);

  // Kullanıcıların son hareket zamanları ve yönleri
  const lastMovementTime = useRef({});
  const userBearings = useRef({});
  const previousPositions = useRef({});
  const lastReceivedPositions = useRef({}); // Son alınan pozisyonlar (tekrar animasyon tetiklenmesini önlemek için)

  // Animasyon ve idle state tracking
  const animationTimers = useRef({});
  const idleAnimationTimers = useRef({});
  const basePositions = useRef({});
  const idleAnimationSteps = useRef({});
  const lastUpdateTime = useRef({});
  const isAnimating = useRef({}); // Hangi user animate oluyor (infinite loop önleme)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyDxQUHqQ4cWyUuZf3cpQLfGheGa4l7SYXc',
  });

  const onLoad = useCallback((map) => {
    setMap(map);
    setZoom(map.getZoom());
    map.addListener('zoom_changed', () => {
      setZoom(map.getZoom());
    });
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Mesafe hesaplama (Haversine formülü)
  const calculateDistance = useCallback((pos1, pos2) => {
    const R = 6371e3; // Dünya yarıçapı (metre)
    const lat1 = (pos1.lat * Math.PI) / 180;
    const lat2 = (pos2.lat * Math.PI) / 180;
    const deltaLat = ((pos2.lat - pos1.lat) * Math.PI) / 180;
    const deltaLng = ((pos2.lng - pos1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Metre cinsinden
  }, []);

  // Bearing (yön) hesaplama fonksiyonu
  const calculateBearing = useCallback((start, end) => {
    const lat1 = (start.lat * Math.PI) / 180;
    const lat2 = (end.lat * Math.PI) / 180;
    const dLon = ((end.lng - start.lng) * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  }, []);

  // Hız hesaplama (km/h)
  const calculateSpeed = useCallback((start, end, startTime, endTime) => {
    const distance = calculateDistance(start, end);
    const duration = (endTime - startTime) / 1000; // saniye

    if (duration <= 0) return 0;

    const speedMps = distance / duration; // m/s
    const speedKmh = speedMps * 3.6; // km/h
    return speedKmh;
  }, [calculateDistance]);

  // Smooth bearing interpolation (yumuşak dönme)
  const interpolateBearing = useCallback((currentBearing, targetBearing, t) => {
    let diff = targetBearing - currentBearing;

    // En kısa yolu bul (180 dereceden fazla fark varsa ters dön)
    if (diff > 180) {
      diff -= 360;
    } else if (diff < -180) {
      diff += 360;
    }

    const newBearing = currentBearing + diff * t;
    return (newBearing + 360) % 360;
  }, []);

  // Idle animasyonu durdur
  const stopIdleAnimation = useCallback((userId) => {
    if (idleAnimationTimers.current[userId]) {
      clearInterval(idleAnimationTimers.current[userId]);
      delete idleAnimationTimers.current[userId];
    }
    delete basePositions.current[userId];
    delete idleAnimationSteps.current[userId];
  }, []);

  // Idle animasyon başlat (Martı/Uber GPS drift efekti)
  const startIdleAnimation = useCallback((userId, position, name) => {
    stopIdleAnimation(userId);

    basePositions.current[userId] = position;
    idleAnimationSteps.current[userId] = 0;

    if (process.env.NODE_ENV === 'development') {
      console.log(`🎭 ${name} için idle animasyon başlatıldı`);
    }

    idleAnimationTimers.current[userId] = setInterval(() => {
      const step = idleAnimationSteps.current[userId] || 0;
      idleAnimationSteps.current[userId] = (step + 1) % 360;

      // Dairesel GPS drift (1.5-2 metre)
      const angle = (step * Math.PI) / 180;
      const radius = 0.000015; // ~1.5-2 metre

      const offsetLat = Math.cos(angle) * radius;
      const offsetLng = Math.sin(angle) * radius;

      const basePos = basePositions.current[userId];
      if (!basePos) return;

      const animatedPosition = {
        lat: basePos.lat + offsetLat,
        lng: basePos.lng + offsetLng,
      };

      // Zustand store'a kaydet (marker'lar bu pozisyonu kullanacak)
      setAnimatedPosition(userId, animatedPosition);
    }, 1000); // Her 1 saniyede (2000'den 1000'e - daha hızlı drift)
  }, [stopIdleAnimation, setAnimatedPosition]);

  // Hareketsizlik kontrolü - ARTIK BACKEND'DEN GELİYOR (isMoving)
  // NOT: useCallback kullanmıyoruz çünkü useEffect dependency'sinde sorun çıkarıyor
  const isUserInactive = (user) => {
    // Backend'den gelen isMoving parametresini kullan
    if (user.isMoving === false) {
      // Hareketsiz ise idle animasyonu durdur
      stopIdleAnimation(user.userId);
      return true;
    }
    return false;
  };

  // Zoom seviyesine göre marker boyutunu hesapla (Uber/Martı tarzı)
  const getMarkerSize = useCallback(() => {
    // Aspect ratio: 114:232 (yaklaşık 1:2)
    const aspectRatio = 114 / 232;

    // Uber/Martı: Marker boyutu her zoom'da görünür, minimal değişiklik
    let baseHeight;
    if (zoom <= 10) {
      baseHeight = 45; // Çok uzaktan bile görünür
    } else if (zoom <= 13) {
      baseHeight = 55; // Optimal boyut
    } else if (zoom <= 15) {
      baseHeight = 60; // Yakın
    } else {
      baseHeight = 65; // Çok yakın (ama abartısız)
    }

    const height = baseHeight;
    const width = height * aspectRatio;

    return {
      width,
      height,
      anchorX: width / 2,
      anchorY: height / 2,
    };
  }, [zoom]);

  useEffect(() => {
    if (map && selectedUser) {
      map.panTo({ lat: selectedUser.latitude, lng: selectedUser.longitude });
      map.setZoom(16);
    }
  }, [map, selectedUser]);

  // Kullanıcı pozisyon değişikliklerini takip et ve animasyon başlat
  useEffect(() => {
    // Her user için animasyon kontrolü
    const processUser = (user) => {
      const currentPos = { lat: user.latitude, lng: user.longitude };
      const prevPos = previousPositions.current[user.userId];
      const now = Date.now();

      // Eğer bu user zaten animate oluyorsa, tekrar başlatma (INFINITE LOOP ÖNLEME)
      if (isAnimating.current[user.userId]) {
        return;
      }

      // Bu pozisyon daha önce işlendi mi? (Tekrar animasyon tetiklenmesini önle)
      const lastReceived = lastReceivedPositions.current[user.userId];
      if (lastReceived) {
        const latDiff = Math.abs(lastReceived.lat - currentPos.lat);
        const lngDiff = Math.abs(lastReceived.lng - currentPos.lng);

        // Çok küçük değişiklikler (floating point hataları) için ignore
        if (latDiff < 0.0000001 && lngDiff < 0.0000001) {
          return; // Aynı pozisyon, animasyon başlatma
        }
      }

      // Bu pozisyonu kaydet (bir sonraki karşılaştırma için)
      lastReceivedPositions.current[user.userId] = { ...currentPos };

      // İlk pozisyon
      if (!prevPos) {
        previousPositions.current[user.userId] = currentPos;
        lastMovementTime.current[user.userId] = now;
        lastUpdateTime.current[user.userId] = now;
        userBearings.current[user.userId] = 0;
        isAnimating.current[user.userId] = true; // İlk pozisyon da animating olarak işaretle

        // İlk pozisyonu Zustand store'a kaydet
        setAnimatedPosition(user.userId, currentPos);
        setMarkerBearing(user.userId, 0);

        // İlk pozisyonda idle animasyon başlat
        setTimeout(() => {
          isAnimating.current[user.userId] = false; // Artık yeni animasyonlar başlayabilir
          // Backend'den gelen isMoving kontrolü (direkt user objesinden)
          if (user.isMoving !== false) {
            startIdleAnimation(user.userId, currentPos, user.name);
          }
        }, 100);

        return;
      }

      // Pozisyon değişti mi kontrol et (3 metreden fazla - daha hassas)
      const distance = calculateDistance(prevPos, currentPos);

      if (distance > 3) {
        // Mevcut animasyonu durdur
        if (animationTimers.current[user.userId]) {
          clearInterval(animationTimers.current[user.userId]);
        }
        stopIdleAnimation(user.userId);

        // Bu user için animasyon başlatılıyor olarak işaretle
        isAnimating.current[user.userId] = true;

        const lastTime = lastUpdateTime.current[user.userId] || now - 5000;
        const speed = calculateSpeed(prevPos, currentPos, lastTime, now);

        // Hıza göre animasyon süresi (DAHA HIZLI - gerçek zamanlı)
        let durationMs;
        if (speed < 5) {
          durationMs = 1500; // Yavaş (yürüyüş) - 3000'den 1500'e düşürüldü
        } else if (speed < 20) {
          durationMs = 1000; // Normal (bisiklet/scooter) - 2000'den 1000'e
        } else if (speed < 60) {
          durationMs = 600; // Hızlı (araba) - 1200'den 600'e
        } else {
          durationMs = 400; // Çok hızlı (otoyol) - 800'den 400'e
        }

        // Development mode'da log
        if (process.env.NODE_ENV === 'development') {
          console.log(`🏎️ ${user.name} hareket etti (${distance.toFixed(0)}m, ${speed.toFixed(1)} km/h) → ${durationMs}ms animasyon`);
        }

        // Bearing hesapla
        const targetBearing = calculateBearing(prevPos, currentPos);
        const startBearing = userBearings.current[user.userId] || targetBearing;

        // Daha az adım = daha responsive (30'dan 20'ye)
        const steps = 20;
        let currentStep = 0;

        animationTimers.current[user.userId] = setInterval(() => {
          currentStep++;

          if (currentStep >= steps) {
            clearInterval(animationTimers.current[user.userId]);
            delete animationTimers.current[user.userId];

            userBearings.current[user.userId] = targetBearing;
            previousPositions.current[user.userId] = currentPos;

            // Final pozisyonu Zustand store'a kaydet
            updateMarker(user.userId, currentPos, targetBearing);

            // Animasyon bitti işaretini kaldır
            isAnimating.current[user.userId] = false;

            // Animasyon bitti, idle animasyon başlat
            // Backend'den gelen isMoving kontrolü (direkt user objesinden)
            if (user.isMoving !== false) {
              startIdleAnimation(user.userId, currentPos, user.name);
            }
            return;
          }

          const t = currentStep / steps;

          // Smooth position interpolation
          const interpolatedPos = {
            lat: prevPos.lat + (currentPos.lat - prevPos.lat) * t,
            lng: prevPos.lng + (currentPos.lng - prevPos.lng) * t
          };

          // Smooth bearing rotation
          const currentBearing = interpolateBearing(startBearing, targetBearing, t);
          userBearings.current[user.userId] = currentBearing;

          // Zustand store'a kaydet (marker bu pozisyonu kullanacak)
          updateMarker(user.userId, interpolatedPos, currentBearing);
        }, durationMs / steps);

        // Son hareket zamanını güncelle
        lastMovementTime.current[user.userId] = now;
        lastUpdateTime.current[user.userId] = now;
      }
    };

    // Tüm user'ları işle
    users.forEach(processUser);
  }, [users, calculateBearing, calculateDistance, calculateSpeed, interpolateBearing, startIdleAnimation, setAnimatedPosition, setMarkerBearing, updateMarker]);

  // Harita bounds ayarla (ilk yüklemede)
  useEffect(() => {
    if (map && users.length > 0 && !hasInitialized.current) {
      const bounds = new window.google.maps.LatLngBounds();
      users.forEach((user) => {
        bounds.extend({ lat: user.latitude, lng: user.longitude });
      });
      map.fitBounds(bounds);
      hasInitialized.current = true;
      console.log('🗺️ Harita ilk kez ayarlandı');
    }
  }, [map, users]);

  // Cleanup: Tüm timer'ları temizle
  useEffect(() => {
    const animTimers = animationTimers.current;
    const idleTimers = idleAnimationTimers.current;

    return () => {
      // Animasyon timer'larını temizle
      Object.values(animTimers).forEach(timer => {
        if (timer) clearInterval(timer);
      });

      // Idle animasyon timer'larını temizle
      Object.values(idleTimers).forEach(timer => {
        if (timer) clearInterval(timer);
      });
    };
  }, []);

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

  // Map style JSON'ları
  const getMapStyle = () => {
    if (!mapSettings?.mapStyle || mapSettings.mapStyle === 'default') return null;

    const styles = {
      dark: [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] }
      ],
      silver: [
        { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
        { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] }
      ],
      retro: [
        { elementType: 'geometry', stylers: [{ color: '#ebe3cd' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#523735' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f1e6' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#f5f1e6' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] }
      ]
    };

    return styles[mapSettings.mapStyle] || null;
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        ...mapOptions,
        mapTypeId: mapSettings?.mapTypeId || 'roadmap',
        zoomControl: mapSettings?.zoomControl !== false,
        styles: getMapStyle(),
      }}
    >
      {users.map((user) => {
        const markerSize = getMarkerSize();
        const bearing = markerBearings[user.userId] || 0; // State'ten al (smooth rotation için)
        const isInactive = isUserInactive(user); // Backend'den gelen isMoving kontrolü

        // Animasyon pozisyonunu kullan (varsa), yoksa gerçek pozisyon
        const displayPosition = animatedPositions[user.userId] || {
          lat: user.latitude,
          lng: user.longitude
        };

        return (
          <OverlayView
            key={user.userId}
            position={displayPosition}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              onClick={() => onMarkerClick(user)}
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) rotate(${bearing}deg)`,
                transition: 'transform 0.1s linear', // Smooth rotation
                cursor: 'pointer',
                width: `${markerSize.width}px`,
                height: `${markerSize.height}px`,
              }}
              title={user.name}
            >
              <img
                src={`${process.env.PUBLIC_URL}/taxi_marker.png`}
                alt={user.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: isInactive ? 'grayscale(100%) opacity(0.5)' : 'none', // Hareketsiz = Gri
                  transition: 'filter 0.3s ease',
                }}
              />
            </div>
          </OverlayView>
        );
      })}
    </GoogleMap>
  );
}

export default React.memo(Map);