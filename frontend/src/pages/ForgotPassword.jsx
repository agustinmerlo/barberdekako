// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';

const FORGOT_PASSWORD_URL = 'http://localhost:8000/api/usuarios/password-reset/';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(FORGOT_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg =
          data.error ||
          data.detail ||
          data.email?.[0] ||
          'No se pudo enviar el correo de recuperación.';
        throw new Error(msg);
      }

      setSuccess(true);
      setEmail('');
    } catch (apiError) {
      console.error('❌ Error al solicitar recuperación:', apiError);
      setError(apiError.message || 'Error de red o del servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background"></div>
      <div className="login-card">
        <div className="login-logo-container">
          <img src="/assets/logo.png" alt="Logo Barber Studio" className="logo-image" />
        </div>

        <h2>Recuperar Contraseña</h2>
        <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '20px', textAlign: 'center' }}>
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {success ? (
          <div style={{ 
            backgroundColor: '#d4edda', 
            color: '#155724', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontWeight: '500' }}>
              ✅ Correo enviado exitosamente
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.9em' }}>
              Revisa tu bandeja de entrada y sigue las instrucciones.
            </p>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <span className="input-icon" role="img" aria-label="correo">
                📧
              </span>
              <input
                type="email"
                placeholder="Correo Electrónico"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <p style={{ color: 'red', fontSize: '0.9em', marginTop: '8px' }}>
                {error}
              </p>
            )}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
            </button>
          </form>
        )}

        <p className="register-link-container">
          <Link to="/login">← Volver al inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;