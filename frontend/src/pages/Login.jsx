// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ÍCONOS FLUENT UI (Microsoft Edge)
import {
  Person24Regular,
  LockClosed24Regular,
  Eye24Regular,
  EyeOff24Regular,
  ErrorCircle24Regular,
  Warning24Regular,
  LockShield24Regular
} from "@fluentui/react-icons";

import './Login.css';

const DJANGO_LOGIN_URL = 'http://localhost:8000/api/usuarios/login/';
const AUTH_ME_URL = 'http://localhost:8000/api/usuarios/auth/me';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (remainingSeconds > 0) {
      const timer = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            setError(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [remainingSeconds]);

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins > 0) return `${mins} minuto${mins !== 1 ? 's' : ''} y ${secs} segundo${secs !== 1 ? 's' : ''}`;
    return `${secs} segundo${secs !== 1 ? 's' : ''}`;
  };

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (isBlocked) return;

    setError(null);
    setLoading(true);

    try {
      const loginRes = await fetch(DJANGO_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const loginData = await loginRes.json();

      if (loginRes.status === 429) {
        setIsBlocked(true);
        setRemainingSeconds(loginData.remaining_seconds || 300);
        setFailedAttempts(loginData.failed_attempts || 0);
        setError(loginData.message || 'Cuenta temporalmente bloqueada');
        setLoading(false);
        return;
      }

      if (!loginRes.ok) {
        if (loginData.failed_attempts !== undefined) {
          setFailedAttempts(loginData.failed_attempts);
          setRemainingAttempts(loginData.remaining_attempts || 0);
        }

        const msg =
          loginData.message ||
          loginData.error ||
          loginData.detail ||
          loginData.non_field_errors?.[0] ||
          loginData.email?.[0] ||
          loginData.password?.[0] ||
          'Credenciales inválidas.';

        throw new Error(msg);
      }

      const token = loginData.token;
      if (!token) throw new Error('El backend no devolvió token.');

      const meRes = await fetch(AUTH_ME_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      });

      const meData = await meRes.json();
      if (!meRes.ok) throw new Error(meData.error || 'No se pudo obtener el perfil.');

      const role = (meData.role || 'cliente').toLowerCase();
      const userId = meData.user_id;

      login({
        user_id: userId,
        email: meData.email,
        nombre: meData.nombre || '',
        apellido: meData.apellido || '',
        telefono: meData.telefono || '',
        role,
      }, token);

      setFailedAttempts(0);
      setRemainingAttempts(3);

      if (role === 'admin') navigate('/home');
      else if (role === 'barbero') navigate('/barbero/home');
      else navigate('/cliente');

    } catch (err) {
      setError(err.message);
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

        <h2>Iniciar Sesión</h2>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <Person24Regular className="input-icon" />
            <input
              type="email"
              placeholder="Correo Electrónico"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isBlocked || loading}
              required
            />
          </div>

          <div className="input-group password-group">
            <LockClosed24Regular className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isBlocked || loading}
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <EyeOff24Regular /> : <Eye24Regular />}
            </button>
          </div>

          {error && (
            <div className={`alert ${isBlocked ? 'alert-blocked' : 'alert-error'}`}>
              <strong>
                {isBlocked ? <LockShield24Regular /> : <ErrorCircle24Regular />}
                &nbsp;{isBlocked ? 'Cuenta Bloqueada' : 'Error'}
              </strong>
              <p>{error}</p>
            </div>
          )}

          {!isBlocked && failedAttempts > 0 && (
            <div className="attempts-warning">
              <p>
                <Warning24Regular /> Intentos fallidos: <strong>{failedAttempts}</strong>
              </p>
              <p>Restantes: {remainingAttempts}</p>
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading || isBlocked}>
            {isBlocked ? 'Bloqueado' : loading ? 'Iniciando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
          <p className="register-link-container">¿No tienes una cuenta? <Link to="/register">Regístrate</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
