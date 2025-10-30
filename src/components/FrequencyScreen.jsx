import React, { useState, useEffect } from 'react';
import './FrequencyScreen.css';

function FrequencyScreen({ onFrequencySelect }) {
  const [frequency, setFrequency] = useState('');
  const [activeFrequencies, setActiveFrequencies] = useState([]);

  useEffect(() => {
    fetchActiveFrequencies();
  }, []);

  const fetchActiveFrequencies = async () => {
    try {
      const response = await fetch('http://54.164.111.251:4004/api/frequencies');
      const data = await response.json();
      setActiveFrequencies(data);
      console.log('📻 Aktif frekanslar:', data);
    } catch (error) {
      console.error('❌ Frekanslar alınamadı:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (frequency.trim()) {
      onFrequencySelect(frequency.trim());
    }
  };

  return (
    <div className="frequency-screen">
      <div className="frequency-container">
        <div className="frequency-header">
          <div className="frequency-logo">📻</div>
          <h1>FREKANS SEÇ</h1>
          <p>İzlemek istediğiniz frekansı girin</p>
        </div>

        <form onSubmit={handleSubmit} className="frequency-form">
          <input
            type="text"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            placeholder="Frekans (örn: 20)"
            className="frequency-input"
          />
          <button type="submit" className="frequency-button" disabled={!frequency}>
            BAĞLAN
          </button>
        </form>

        {activeFrequencies.length > 0 && (
          <div className="active-frequencies">
            <h3>AKTİF FREKANSLAR</h3>
            <div className="frequency-list">
              {activeFrequencies.map((freq) => (
                <div
                  key={freq.frequency}
                  className="frequency-card"
                  onClick={() => onFrequencySelect(freq.frequency)}
                >
                  <div className="freq-name">📻 {freq.frequency}</div>
                  <div className="freq-users">{freq.userCount} Taksi</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FrequencyScreen;