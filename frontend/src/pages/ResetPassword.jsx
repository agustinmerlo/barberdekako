// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';

const RESET_PASSWORD_URL = 'http://localhost:8000/api/usuarios/password-reset-confirm/';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    // Obtener el token del URL (ej: /reset-password?token=abc123)
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setError('Enlace de recuperación inválido o expirado.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    // Validar longitud mínima
    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(RESET_PASSWORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg =
          data.error ||
          data.detail ||
          data.password?.[0] ||
          data.token?.[0] ||
          'No se pudo restablecer la contraseña.';
        throw new Error(msg);
      }

      setSuccess(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (apiError) {
      console.error('❌ Error al restablecer contraseña:', apiError);
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

        <h2>Restablecer Contraseña</h2>
        <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '20px', textAlign: 'center' }}>
          Ingresa tu nueva contraseña.
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
              ✅ Contraseña restablecida exitosamente
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.9em' }}>
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <span className="input-icon" role="img" aria-label="candado">
                🔒
              </span>
              <input
                type="password"
                placeholder="Nueva Contraseña"
                name="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={!token}
              />
            </div>

            <div className="input-group">
              <span className="input-icon" role="img" aria-label="candado">
                🔒
              </span>
              <input
                type="password"
                placeholder="Confirmar Contraseña"
                name="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={!token}
              />
            </div>

            {error && (
              <p style={{ color: 'red', fontSize: '0.9em', marginTop: '8px' }}>
                {error}
              </p>
            )}

            <button 
              type="submit" 
              className="login-button" 
              disabled={loading || !token}
            >
              {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
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

export default ResetPassword;