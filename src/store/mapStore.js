import { create } from 'zustand';

const useMapStore = create((set, get) => ({
  // Animasyonlu pozisyonlar
  animatedPositions: {},

  // Marker bearing'leri (rotation)
  markerBearings: {},

  // Pozisyon güncelle
  setAnimatedPosition: (userId, position) =>
    set((state) => ({
      animatedPositions: {
        ...state.animatedPositions,
        [userId]: position
      }
    })),

  // Bearing güncelle
  setMarkerBearing: (userId, bearing) =>
    set((state) => ({
      markerBearings: {
        ...state.markerBearings,
        [userId]: bearing
      }
    })),

  // Batch update (hem pozisyon hem bearing aynı anda)
  updateMarker: (userId, position, bearing) =>
    set((state) => ({
      animatedPositions: {
        ...state.animatedPositions,
        [userId]: position
      },
      markerBearings: {
        ...state.markerBearings,
        [userId]: bearing
      }
    })),

  // Kullanıcıyı temizle
  removeUser: (userId) =>
    set((state) => {
      const newPositions = { ...state.animatedPositions };
      const newBearings = { ...state.markerBearings };
      delete newPositions[userId];
      delete newBearings[userId];
      return {
        animatedPositions: newPositions,
        markerBearings: newBearings
      };
    }),
}));

export default useMapStore;
