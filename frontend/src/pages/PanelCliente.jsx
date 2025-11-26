// src/pages/PanelCliente.jsx - VERSIÓN CON NOTIFICACIONES Y MODAL DE LOGOUT
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BannerNotificacion from "../components/BannerNotificacion";
import "./PanelCliente.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

// 📞 CONFIGURACIÓN DE CONTACTO
const CONTACTO_BARBERIA = {
  telefono: "+5493874000000",
  whatsapp: "5493874000000",
  mensajeDefault: "Hola, necesito ayuda con mi reserva en Barbería Clase V"
};

// ======================= MODAL DE CONFIRMACIÓN =======================
const LogoutConfirmModal = ({ onConfirm, onCancel }) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="modal-confirm" onClick={(e) => e.stopPropagation()}>
      <div className="modal-confirm-icon-warning">
        <span className="warning-icon">!</span>
      </div>
      <h3 className="modal-confirm-title">Aviso</h3>
      <p className="modal-confirm-message">¿Deseas cerrar sesión?</p>
      <div className="modal-confirm-actions">
        <button className="btn-cancel-modal" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn-confirm-logout-modal" onClick={onConfirm}>
          Confirmar
        </button>
      </div>
    </div>
  </div>
);

function PanelCliente() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [seccionActiva, setSeccionActiva] = useState("reservas");
  const [filtroReservas, setFiltroReservas] = useState("proximas");
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // ✅ NUEVO: Estado para el modal de confirmación
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Estado para turnos afectados
  const [turnosAfectados, setTurnosAfectados] = useState([]);
  const [cargandoAfectados, setCargandoAfectados] = useState(false);

  const [contadores, setContadores] = useState({
    proximas: 0,
    pendientes: 0,
    confirmadas: 0,
    rechazadas: 0,
    canceladas: 0,
    completadas: 0,
  });
  const [cargandoContadores, setCargandoContadores] = useState(false);

  const getToken = () =>
    localStorage.getItem("token") || localStorage.getItem("authToken") || "";

  const apiGet = async (path, params = {}) => {
    const url = new URL(`${API_BASE}${path}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
    const headers = { Accept: "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`GET ${url.pathname} ${res.status}: ${txt}`);
    }
    return res.json();
  };

  const apiPost = async (path, body = {}) => {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const token = getToken();
    if (token) headers.Authorization = `Token ${token}`;
    
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.mensaje || data.error || `Error ${res.status}`);
    }
    return res.json();
  };

  // Redirige si no hay sesión
  useEffect(() => {
    if (!user || !user.email) navigate("/login");
  }, [user, navigate]);

  // Cargar turnos afectados
  const cargarTurnosAfectados = async (email) => {
    setCargandoAfectados(true);
    try {
      const data = await apiGet("/api/reservas/turnos-afectados/", { email });
      const afectados = data?.turnos_afectados || [];
      setTurnosAfectados(afectados);
      console.log(`🔔 ${afectados.length} turnos afectados detectados`);
    } catch (e) {
      console.error("❌ Error cargando turnos afectados:", e);
      setTurnosAfectados([]);
    } finally {
      setCargandoAfectados(false);
    }
  };

  // Carga contadores + lista inicial + turnos afectados
  useEffect(() => {
    if (user?.email) {
      cargarContadores(user.email);
      cargarLista(filtroReservas, user.email);
      cargarTurnosAfectados(user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Cuando cambia el filtro, pide al backend la lista correspondiente
  useEffect(() => {
    if (user?.email) {
      cargarLista(filtroReservas, user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroReservas]);

  const cargarContadores = async (email) => {
    setCargandoContadores(true);
    try {
      const data = await apiGet("/api/reservas/cliente/contadores/", { email });
      setContadores({
        proximas: Number(data?.proximas ?? 0),
        pendientes: Number(data?.pendientes ?? 0),
        confirmadas: Number(data?.confirmadas ?? 0),
        rechazadas: Number(data?.rechazadas ?? 0),
        canceladas: Number(data?.canceladas ?? 0),
        completadas: Number(data?.completadas ?? 0),
      });
    } catch (e) {
      console.error("❌ contadores:", e);
    } finally {
      setCargandoContadores(false);
    }
  };

  const cargarLista = async (estadoUI, email) => {
    setCargando(true);
    try {
      if (estadoUI === "proximas") {
        const data = await apiGet("/api/reservas/cliente/", {
          estado: "proximas",
          email,
        });
        setReservas(normalizaResultados(data));
      } else if (estadoUI === "pendientes") {
        const data = await apiGet("/api/reservas/cliente/", {
          estado: "pendiente",
          email,
        });
        setReservas(normalizaResultados(data));
      } else if (estadoUI === "pasadas") {
        const [conf, rej, can] = await Promise.all([
          apiGet("/api/reservas/cliente/", { estado: "confirmada", email }),
          apiGet("/api/reservas/cliente/", { estado: "rechazada", email }),
          apiGet("/api/reservas/cliente/", { estado: "cancelada", email }),
        ]);
        const ahora = new Date();
        const confirmadasPasadas = normalizaResultados(conf).filter((r) => {
          const d = safeDate(r.fecha, r.horario);
          return d && d < ahora;
        });
        const rejList = normalizaResultados(rej);
        const canList = normalizaResultados(can);
        setReservas(
          [...confirmadasPasadas, ...rejList, ...canList].sort(
            (a, b) =>
              (safeDate(b.fecha, b.horario)?.getTime() || 0) -
              (safeDate(a.fecha, a.horario)?.getTime() || 0)
          )
        );
      } else {
        const data = await apiGet("/api/reservas/cliente/", { email });
        setReservas(normalizaResultados(data));
      }
    } catch (e) {
      console.error("❌ lista:", e);
      setReservas([]);
    } finally {
      setCargando(false);
    }
  };

  const normalizaResultados = (data) =>
    Array.isArray(data) ? data : data?.results ?? [];

  // Verificar si una reserva está afectada
  const estaAfectada = (reservaId) => {
    return turnosAfectados.some(t => t.reserva_id === reservaId);
  };

  // Obtener info del turno afectado
  const getInfoAfectado = (reservaId) => {
    return turnosAfectados.find(t => t.reserva_id === reservaId);
  };

  // Solicitar reprogramación
  const handleSolicitarReprogramacion = async (reservaId) => {
    if (!window.confirm("¿Deseas solicitar la reprogramación de este turno?\n\nSerás contactado para coordinar una nueva fecha.")) {
      return;
    }

    try {
      const response = await apiPost(
        `/api/reservas/${reservaId}/solicitar-reprogramacion/`,
        { email_cliente: user.email }
      );

      alert(response.mensaje || "Solicitud enviada exitosamente");
      
      // Recargar datos
      if (user?.email) {
        cargarContadores(user.email);
        cargarLista(filtroReservas, user.email);
        cargarTurnosAfectados(user.email);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  // Cancelar por indisponibilidad
  const handleCancelarPorIndisponibilidad = async (reservaId) => {
    if (!window.confirm("¿Deseas cancelar este turno?\n\nLa seña permanecerá registrada para un posible reembolso o futura reserva.")) {
      return;
    }

    try {
      const response = await apiPost(
        `/api/reservas/${reservaId}/cancelar-por-indisponibilidad/`,
        { email_cliente: user.email }
      );

      alert(response.mensaje || "Turno cancelado exitosamente");
      
      // Recargar datos
      if (user?.email) {
        cargarContadores(user.email);
        cargarLista(filtroReservas, user.email);
        cargarTurnosAfectados(user.email);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  // ====== formateadores ======
  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const d = new Date(fecha.includes("T") ? fecha : `${fecha}T00:00:00`);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatearHora = (hora) => {
    if (!hora) return "-";
    const hhmm = typeof hora === "string" ? hora.substring(0, 5) : String(hora).substring(0, 5);
    const [h, m] = hhmm.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  // ====== badge ======
  const obtenerEstadoBadge = (reserva) => {
    const ahora = new Date();
    const fechaReserva = safeDate(reserva.fecha, reserva.horario);
    if (reserva.estado === "pendiente") {
      return { texto: "⏳ Pendiente de confirmación", clase: "pendiente" };
    }
    if (reserva.estado === "confirmada") {
      return fechaReserva && fechaReserva > ahora
        ? { texto: "✅ Confirmada", clase: "confirmada" }
        : { texto: "✔️ Completada", clase: "completada" };
    }
    if (reserva.estado === "rechazada") {
      return { texto: "❌ Rechazada", clase: "rechazada" };
    }
    if (reserva.estado === "cancelada") {
      return { texto: "🚫 Cancelada", clase: "cancelada" };
    }
    return { texto: reserva.estado, clase: "" };
  };

  // Sólo ordenamos lo que vino del backend (ya viene filtrado)
  const reservasOrdenadas = useMemo(
    () =>
      [...reservas].sort(
        (a, b) =>
          (safeDate(b.fecha, b.horario)?.getTime() || 0) -
          (safeDate(a.fecha, a.horario)?.getTime() || 0)
      ),
    [reservas]
  );

  // Stats mostrados
  const stats = {
    proximas: contadores.proximas,
    pendientes: contadores.pendientes,
    completadas: contadores.completadas,
  };

  // ====== HANDLERS DE NAVEGACIÓN Y LOGOUT ======
  const handleVolverInicio = () => navigate("/cliente");
  const handleNuevaReserva = () => navigate("/reservar");

  // Modificado: Ahora abre el modal en lugar de logout directo
  const handleCerrarSesion = () => {
    setShowLogoutConfirm(true);
  };

  // Nuevo: Ejecuta el logout real tras confirmar
  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate("/login");
  };

  // Nuevo: Cierra el modal sin hacer nada
  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  // 📞 CONTACTAR POR WHATSAPP
  const handleContactarWhatsApp = () => {
    const mensaje = encodeURIComponent(
      `${CONTACTO_BARBERIA.mensajeDefault}\n\n` +
      `Cliente: ${user.email}\n` +
      `Motivo: Consulta general / Cancelación de reserva`
    );
    const urlWhatsApp = `https://wa.me/${CONTACTO_BARBERIA.whatsapp}?text=${mensaje}`;
    window.open(urlWhatsApp, '_blank');
  };

  if (!user) return null;

  return (
    <div className="panel-cliente">
      {/* ✅ BANNER DE NOTIFICACIÓN GLOBAL */}
      <BannerNotificacion userEmail={user.email} />

      {/* SIDEBAR */}
      <aside className="sidebar-cliente">
        <div className="sidebar-header">
          <h2 className="brand">✂️ Barbería Clase V</h2>
        </div>

        <nav className="menu-cliente">
          <button
            className={`menu-item ${seccionActiva === "reservas" ? "active" : ""}`}
            onClick={() => setSeccionActiva("reservas")}
          >
            <span className="icon">📅</span>
            Mis Reservas
            {stats.pendientes > 0 && (
              <span className="badge-notif">{stats.pendientes}</span>
            )}
          </button>
          <button
            className={`menu-item ${seccionActiva === "perfil" ? "active" : ""}`}
            onClick={() => setSeccionActiva("perfil")}
          >
            <span className="icon">👤</span>
            Mi Perfil
          </button>
          <button className="menu-item" onClick={handleVolverInicio}>
            <span className="icon">🏠</span>
            Volver al Inicio
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-nueva-reserva" onClick={handleNuevaReserva}>
            ➕ Nueva Reserva
          </button>
          <button className="btn-cerrar-sesion" onClick={handleCerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="contenido-cliente">
        <header className="header-cliente">
          <h1>{seccionActiva === "reservas" ? "Mis Reservas" : "Mi Perfil"}</h1>
          <div className="header-user">
            <div className="avatar-user">{user.email.charAt(0).toUpperCase()}</div>
            <span>{user.email}</span>
          </div>
        </header>

        {seccionActiva === "reservas" && (
          <div className="seccion-reservas">
            {/* CARDS */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon proximas">📅</div>
                <div className="stat-info">
                  <h3>{cargandoContadores ? "…" : stats.proximas}</h3>
                  <p>Próximas citas</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon pendientes">⏳</div>
                <div className="stat-info">
                  <h3>{cargandoContadores ? "…" : stats.pendientes}</h3>
                  <p>Pendientes</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon completadas">✔️</div>
                <div className="stat-info">
                  <h3>{cargandoContadores ? "…" : stats.completadas}</h3>
                  <p>Completadas</p>
                </div>
              </div>
            </div>

            {/* TABS/FILTROS */}
            <div className="filtros-reservas">
              <button
                className={`filtro-btn ${filtroReservas === "proximas" ? "active" : ""}`}
                onClick={() => setFiltroReservas("proximas")}
              >
                📅 Próximas ({stats.proximas})
              </button>
              <button
                className={`filtro-btn ${filtroReservas === "pendientes" ? "active" : ""}`}
                onClick={() => setFiltroReservas("pendientes")}
              >
                ⏳ Pendientes ({stats.pendientes})
              </button>
              <button
                className={`filtro-btn ${filtroReservas === "pasadas" ? "active" : ""}`}
                onClick={() => setFiltroReservas("pasadas")}
              >
                📜 Historial
              </button>
              <button
                className="filtro-btn refresh"
                onClick={() => {
                  if (user?.email) {
                    cargarContadores(user.email);
                    cargarLista(filtroReservas, user.email);
                    cargarTurnosAfectados(user.email);
                  }
                }}
                title="Recargar"
              >
                ↻
              </button>
            </div>

            {/* LISTA */}
            {cargando ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Cargando tus reservas...</p>
              </div>
            ) : reservasOrdenadas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No tienes reservas {filtroReservas}</h3>
                <p>
                  {filtroReservas === "proximas" && "Agenda tu próxima cita con nosotros"}
                  {filtroReservas === "pendientes" && "Todas tus reservas están confirmadas"}
                  {filtroReservas === "pasadas" && "Aún no tienes historial de reservas"}
                </p>
                <button className="btn-primary" onClick={handleNuevaReserva}>
                  ➕ Reservar ahora
                </button>
              </div>
            ) : (
              <div className="reservas-lista">
                {reservasOrdenadas.map((reserva) => {
                  const badge = obtenerEstadoBadge(reserva);
                  const afectada = estaAfectada(reserva.id);
                  const infoAfectado = afectada ? getInfoAfectado(reserva.id) : null;

                  return (
                    <div key={reserva.id} className={`reserva-card ${badge.clase} ${afectada ? 'afectada' : ''}`}>
                      
                      {/* ✅ ALERTA DE TURNO AFECTADO */}
                      {afectada && infoAfectado && (
                        <div className="alerta-turno-afectado">
                          <div className="alerta-header">
                            <span className="alerta-icon">🔔</span>
                            <h4 className="alerta-titulo">¡AVISO IMPORTANTE!</h4>
                          </div>
                          <p className="alerta-mensaje">
                            Tu barbero <strong>{infoAfectado.barbero_nombre}</strong> no podrá atenderte en esta fecha.
                          </p>
                          {infoAfectado.motivo && (
                            <p className="alerta-motivo">
                              <strong>Motivo:</strong> {infoAfectado.motivo}
                            </p>
                          )}
                          <p className="alerta-accion-texto">
                            Por favor, elegí una nueva fecha y hora:
                          </p>
                          <div className="alerta-acciones">
                            <button 
                              className="btn-reprogramar"
                              onClick={() => handleSolicitarReprogramacion(reserva.id)}
                            >
                              📅 Reprogramar turno
                            </button>
                            <button 
                              className="btn-cancelar-afectado"
                              onClick={() => handleCancelarPorIndisponibilidad(reserva.id)}
                            >
                              🚫 Cancelar turno
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="reserva-card-header">
                        <div>
                          <h3>Reserva #{reserva.id}</h3>
                          <span className={`estado-badge ${badge.clase}`}>
                            {badge.texto}
                          </span>
                        </div>
                        <div className="reserva-fecha-principal">
                          <div className="fecha-dia">
                            {new Date(`${reserva.fecha}T00:00:00`).getDate()}
                          </div>
                          <div className="fecha-mes">
                            {new Date(`${reserva.fecha}T00:00:00`).toLocaleDateString("es-ES", { month: "short" })}
                          </div>
                        </div>
                      </div>

                      <div className="reserva-card-body">
                        <div className="detalle-row">
                          <span className="detalle-label">📅 Fecha</span>
                          <span className="detalle-valor">{formatearFecha(reserva.fecha)}</span>
                        </div>
                        <div className="detalle-row">
                          <span className="detalle-label">🕒 Hora</span>
                          <span className="detalle-valor">{formatearHora(reserva.horario)}</span>
                        </div>
                        <div className="detalle-row">
                          <span className="detalle-label">✂️ Barbero</span>
                          <span className="detalle-valor">{reserva.barbero_nombre || "-"}</span>
                        </div>

                        {Array.isArray(reserva.servicios) && reserva.servicios.length > 0 && (
                          <div className="servicios-reserva">
                            <span className="detalle-label">💼 Servicios</span>
                            <ul className="servicios-list">
                              {reserva.servicios.map((s, idx) => (
                                <li key={idx}>• {s.nombre}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="reserva-total">
                          <div className="total-row">
                            <span>Total</span>
                            <strong>${reserva.total}</strong>
                          </div>
                          <div className="total-row sena">
                            <span>Seña pagada</span>
                            <strong>${reserva["seña"]}</strong>
                          </div>
                          {reserva.estado === "confirmada" && (
                            <div className="total-row restante">
                              <span>A pagar en barbería</span>
                              <strong>
                                ${Number(reserva.total - reserva["seña"] || 0).toFixed(0)}
                              </strong>
                            </div>
                          )}
                        </div>

                        {reserva.estado === "rechazada" && reserva.notas_admin && (
                          <div className="alerta-rechazo">
                            <strong>❌ Motivo del rechazo:</strong>
                            <p>{reserva.notas_admin}</p>
                          </div>
                        )}
                      </div>

                      <div className="reserva-card-footer">
                        <small>
                          Creada el{" "}
                          {reserva.fecha_creacion
                            ? new Date(reserva.fecha_creacion).toLocaleDateString("es-ES")
                            : "-"}
                        </small>
                        {reserva.estado === "pendiente" && !afectada && (
                          <span className="ayuda-texto">
                            💡 Tu reserva será confirmada en 24hs
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {seccionActiva === "perfil" && (
          <div className="seccion-perfil">
            <div className="perfil-card">
              <div className="perfil-header">
                <div className="avatar-grande">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="perfil-info">
                  <h2>
                    {user.nombre || reservas[0]?.nombre_cliente || "Cliente"}{" "}
                    {user.apellido || reservas[0]?.apellido_cliente || ""}
                  </h2>
                  <p className="perfil-email">{user.email}</p>
                  {(user.telefono || reservas[0]?.telefono_cliente) && (
                    <p className="perfil-telefono">
                      📱 {user.telefono || reservas[0].telefono_cliente}
                    </p>
                  )}
                </div>
              </div>

              <div className="perfil-stats">
                <h3>Tu actividad</h3>
                <div className="stats-detalle">
                  <div className="stat-item">
                    <span className="stat-numero">{contadores.pendientes + contadores.confirmadas + contadores.rechazadas + contadores.canceladas}</span>
                    <span className="stat-label">Reservas totales</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-numero">{contadores.completadas}</span>
                    <span className="stat-label">Visitas completadas</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-numero">{contadores.proximas}</span>
                    <span className="stat-label">Citas próximas</span>
                  </div>
                </div>
              </div>

              <div className="perfil-acciones">
                <button className="btn-editar" onClick={() => alert("Función de edición en desarrollo")}>
                  ✏️ Editar perfil
                </button>
                <button className="btn-ayuda" onClick={handleContactarWhatsApp}>
                  💬 Contactar por WhatsApp
                </button>
              </div>

              {/* 📞 INFO DE CONTACTO */}
              <div className="info-contacto">
                <h4>¿Necesitas ayuda?</h4>
                <p>Contáctanos para:</p>
                <ul>
                  <li>✅ Consultas sobre tu reserva</li>
                  <li>✅ Cancelar o modificar una cita</li>
                  <li>✅ Información sobre servicios</li>
                  <li>✅ Cualquier otra duda</li>
                </ul>
                <div className="contacto-directo">
                  <a 
                    href={`tel:${CONTACTO_BARBERIA.telefono}`}
                    className="btn-contacto telefono"
                  >
                    📞 Llamar
                  </a>
                  <button 
                    onClick={handleContactarWhatsApp}
                    className="btn-contacto whatsapp"
                  >
                    💬 WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {reservas.length > 0 && (
              <div className="ultima-reserva-card">
                <h3>📌 Última reserva</h3>
                <div className="ultima-reserva-info">
                  <p><strong>Fecha:</strong> {formatearFecha(reservas[0].fecha)}</p>
                  <p><strong>Barbero:</strong> {reservas[0].barbero_nombre || "-"}</p>
                  <p><strong>Estado:</strong> {obtenerEstadoBadge(reservas[0]).texto}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ✅ MODAL DE CONFIRMACIÓN */}
      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />
      )}
    </div>
  );
}

function safeDate(fecha, horario) {
  if (!fecha) return null;
  const h = typeof horario === "string" ? horario : String(horario || "00:00");
  const hhmm = h.slice(0, 5);
  const d = new Date(`${fecha}T${hhmm}:00`);
  return isNaN(d.getTime()) ? null : d;
}

export default PanelCliente;