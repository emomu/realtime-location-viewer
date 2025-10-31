import React from 'react';
import './SettingsScreen.css';

function SettingsScreen({ onClose, settings, onSettingsChange }) {
  const mapTypes = [
    { id: 'roadmap', name: 'Normal', desc: 'Varsayılan harita görünümü', icon: '🗺️' },
    { id: 'satellite', name: 'Uydu', desc: 'Gerçek uydu görüntüsü', icon: '🛰️' },
    { id: 'hybrid', name: 'Hibrit', desc: 'Uydu + yol isimleri', icon: '🏞️' },
    { id: 'terrain', name: 'Arazi', desc: 'Topografik harita', icon: '⛰️' },
  ];

  const mapStyles = [
    { id: 'default', name: 'Açık Mod', desc: 'Beyaz tema', icon: '☀️' },
    { id: 'dark', name: 'Koyu Mod', desc: 'Gece modu', icon: '🌙' },
    { id: 'silver', name: 'Gümüş', desc: 'Minimalist gri', icon: '🎨' },
    { id: 'retro', name: 'Retro', desc: 'Nostaljik görünüm', icon: '📻' },
  ];


  return (
    <div className="settings-overlay">
      <div className="settings-container">
        <div className="settings-header">
          <h2>AYARLAR</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          {/* HARİTA KATMANI */}
          <div className="settings-section">
            <h3>HARİTA KATMANI</h3>
            <div className="settings-grid">
              {mapTypes.map((type) => (
                <div
                  key={type.id}
                  className={`settings-card ${settings.mapTypeId === type.id ? 'active' : ''}`}
                  onClick={() => onSettingsChange({ mapTypeId: type.id })}
                >
                  <span className="card-icon">{type.icon}</span>
                  <div className="card-text">
                    <div className="card-title">{type.name}</div>
                    <div className="card-desc">{type.desc}</div>
                  </div>
                  {settings.mapTypeId === type.id && <span className="check-icon">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* HARİTA STİLİ */}
          <div className="settings-section">
            <h3>HARİTA STİLİ</h3>
            <div className="settings-grid">
              {mapStyles.map((style) => (
                <div
                  key={style.id}
                  className={`settings-card ${settings.mapStyle === style.id ? 'active' : ''}`}
                  onClick={() => onSettingsChange({ mapStyle: style.id })}
                >
                  <span className="card-icon">{style.icon}</span>
                  <div className="card-text">
                    <div className="card-title">{style.name}</div>
                    <div className="card-desc">{style.desc}</div>
                  </div>
                  {settings.mapStyle === style.id && <span className="check-icon">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* HARİTA KONTROLLERİ */}
          <div className="settings-section">
            <h3>HARİTA KONTROLLERİ</h3>
            <div className="settings-grid">
              <div className="settings-switch">
                <span className="switch-icon">🧭</span>
                <div className="switch-text">
                  <div className="switch-title">Zoom Kontrolleri</div>
                  <div className="switch-desc">Haritada zoom butonları</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.zoomControl}
                    onChange={(e) => onSettingsChange({ zoomControl: e.target.checked })}
                  />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="settings-switch">
                <span className="switch-icon">🚦</span>
                <div className="switch-text">
                  <div className="switch-title">Trafik Otomatik Aç</div>
                  <div className="switch-desc">Başlangıçta trafik göster</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={settings.trafficAutoStart}
                    onChange={(e) => onSettingsChange({ trafficAutoStart: e.target.checked })}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsScreen;
