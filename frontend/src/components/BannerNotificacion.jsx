// src/components/BannerNotificacion.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BannerNotificacion.css';

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

const BannerNotificacion = ({ userEmail }) => {
  const navigate = useNavigate();
  const [turnosAfectados, setTurnosAfectados] = useState([]);
  const [mostrar, setMostrar] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    const verificarTurnosAfectados = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/reservas/turnos-afectados/?email=${encodeURIComponent(userEmail)}`
        );
        
        if (!response.ok) {
          throw new Error('Error al verificar turnos');
        }
        
        const data = await response.json();
        console.log('📊 Turnos afectados:', data);
        
        if (data.tiene_turnos_afectados && data.turnos_afectados.length > 0) {
          setTurnosAfectados(data.turnos_afectados);
          setMostrar(true);
        }
      } catch (error) {
        console.error('❌ Error verificando turnos afectados:', error);
      } finally {
        setLoading(false);
      }
    };

    verificarTurnosAfectados();
  }, [userEmail]);

  const handleIrAReservas = () => {
    navigate('/panel-cliente');
    setMostrar(false);
  };

  const handleCerrar = () => {
    // Guardar en localStorage que el usuario ya vio la alerta (por sesión)
    sessionStorage.setItem('banner-visto', 'true');
    setMostrar(false);
  };

  // No mostrar si ya se cerró en esta sesión
  useEffect(() => {
    const yaVisto = sessionStorage.getItem('banner-visto');
    if (yaVisto) {
      setMostrar(false);
    }
  }, []);

  if (loading || !mostrar || turnosAfectados.length === 0) {
    return null;
  }

  const plural = turnosAfectados.length > 1;

  return (
    <div className="banner-notificacion-overlay">
      <div className="banner-notificacion alerta">
        <button 
          className="banner-cerrar" 
          onClick={handleCerrar}
          aria-label="Cerrar"
        >
          ×
        </button>
        
        <div className="banner-icon">🔔</div>
        
        <div className="banner-contenido">
          <h3 className="banner-titulo">
            ¡Atención! Tenés {turnosAfectados.length} turno{plural ? 's' : ''} afectado{plural ? 's' : ''}
          </h3>
          
          <p className="banner-mensaje">
            Tu barbero no podrá atenderte en {plural ? 'estas fechas' : 'esta fecha'}. 
            Por favor, revisá tus reservas para reprogramar o cancelar.
          </p>
          
          <div className="banner-turnos-lista">
            {turnosAfectados.map((turno, idx) => (
              <div key={idx} className="turno-afectado-mini">
                <span className="turno-fecha">📅 {turno.fecha_formateada}</span>
                <span className="turno-hora">🕒 {turno.horario}</span>
                <span className="turno-barbero">✂️ {turno.barbero_nombre}</span>
              </div>
            ))}
          </div>
          
          <div className="banner-acciones">
            <button 
              className="btn-banner-primary" 
              onClick={handleIrAReservas}
            >
              📅 Ver mis reservas
            </button>
            <button 
              className="btn-banner-secondary" 
              onClick={handleCerrar}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerNotificacion;