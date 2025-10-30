import React, { useState } from 'react';
import './LoginScreen.css';

function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://54.164.111.251:4004/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        console.log('✅ Login başarılı:', data);
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.error || 'Giriş başarısız');
      }
    } catch (err) {
      console.error('❌ Login hatası:', err);
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">📍</div>
          </div>
          <h1>GİRİŞ YAP</h1>
          <p>İzleyici hesabınızla giriş yapın</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-POSTA"
            className="login-input"
            disabled={loading}
            required
          />
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ŞİFRE"
            className="login-input"
            disabled={loading}
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;