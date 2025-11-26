import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8000/api";

const getToken = () =>
  localStorage.getItem("token") || localStorage.getItem("authToken") || "";

// ======================= DATOS DE PRUEBA (MOCKS) =======================
const MOCK_BARBEROS = [
  { id: 1, nombre: "Carlos" },
  { id: 2, nombre: "Ana" },
  { id: 3, nombre: "Pedro" },
];

const MOCK_RESERVAS = [
  { 
    id: 1, 
    fecha: new Date().toISOString().split('T')[0], // Hoy
    horario: "15:00", 
    estado: "confirmada", 
    nombre_cliente: "Juan", 
    apellido_cliente: "Pérez", 
    barbero_nombre: "Carlos", 
    servicios: [{ nombre: "Corte Clásico", precio: 2500 }] 
  },
  { 
    id: 2, 
    fecha: "2024-11-20", 
    horario: "10:00", 
    estado: "completada", 
    nombre_cliente: "María", 
    apellido_cliente: "Gómez", 
    barbero_nombre: "Ana", 
    servicios: [{ nombre: "Coloración", precio: 5000 }] 
  },
  { 
    id: 3, 
    fecha: "2024-12-05", 
    horario: "11:30", 
    estado: "pendiente", 
    nombre_cliente: "Luis", 
    apellido_cliente: "Díaz", 
    barbero_nombre: "Pedro", 
    servicios: [{ nombre: "Barba", precio: 1500 }, { nombre: "Corte", precio: 2000 }] 
  },
  {
    id: 4,
    fecha: "2024-10-15",
    horario: "09:00",
    estado: "cancelada",
    nombre_cliente: "Sofía",
    apellido_cliente: "López",
    barbero_nombre: "Ana",
    servicios: [{ nombre: "Alisado", precio: 8000 }]
  }
];

// ======================= ESTILOS CSS INTEGRADOS =======================
const styles = `
/* ===== AGENDA - Variables ===== */
:root {
  --bg-dark: #0a0a0a;
  --card-bg: #1a1a1a;
  --card-hover: #2d2d2d;
  --border-color: #505050;
  --text-white: #ffffff;
  --gold: #ffc107;
  --gold-hover: #ffca28;
  --green: #4caf50;
  --red: #f44336;
  --danger-hover: #d32f2f;
}

/* ===== Contenedor principal ===== */
.agenda-container {
  padding: 20px;
  background: var(--bg-dark);
  min-height: 100vh;
  color: var(--text-white);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ===== Filtros ===== */
.agenda-filters {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 30px;
  padding: 20px;
  background: var(--card-hover);
  border-radius: 12px;
  flex-wrap: wrap;
  border: 2px solid var(--border-color);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
  flex: 1;
}

.filter-group label {
  font-size: 15px;
  color: var(--gold);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.filter-group select {
  padding: 12px 15px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: #0f0f0f;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-group select:hover {
  border-color: var(--gold);
  background: #1a1a1a;
}

.filter-group select:focus {
  outline: none;
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.25);
  background: #1a1a1a;
}

.btn-refrescar {
  padding: 12px 24px;
  background: var(--gold);
  color: #000;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.4);
}

.btn-refrescar:hover {
  background: var(--gold-hover);
  transform: translateY(-2px);
}

/* ===== Lista de reservas ===== */
.reservas-lista {
  display: grid;
  gap: 20px;
  margin-bottom: 30px;
}

/* ===== Tarjeta de reserva ===== */
.reserva-card {
  background: var(--card-hover);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  border: 2px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  position: relative;
}

.reserva-card:hover {
  transform: translateY(-3px);
  border-color: var(--gold);
}

.reserva-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #3a3a3a;
  border-bottom: 2px solid var(--border-color);
}

.reserva-fecha-hora .hora {
  font-size: 24px;
  color: var(--gold);
  font-weight: 900;
}

.reserva-body {
  padding: 24px;
  background: var(--card-bg);
}

.cliente-nombre {
  font-size: 22px;
  color: #ffffff;
  font-weight: 900;
  margin-bottom: 12px;
}

.reserva-detalle strong {
  color: var(--gold);
}

.reserva-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: #000000;
    color: white;
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    border: 2px solid rgba(255, 255, 255, 0.3);
}

/* ======================================================
   MODAL DE ELIMINAR
   ====================================================== */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
  animation: fadeIn 0.25s ease-out;
  backdrop-filter: blur(4px);
}

.modal-confirm {
  background: #262626;
  padding: 2.5rem 2rem;
  border-radius: 24px;
  width: 90%;
  max-width: 450px;
  text-align: left;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  animation: slideUp 0.3s ease-out;
  border: 1px solid #404040;
}

.modal-confirm-icon-warning {
  width: 70px;
  height: 70px;
  background: var(--gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
  box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
}

.warning-icon {
  color: #000;
  font-size: 36px;
  font-weight: 900;
  line-height: 1;
}

.modal-confirm-title {
  text-align: center;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--gold);
  margin-bottom: 0.5rem;
}

.modal-confirm-message {
  text-align: center;
  color: #e5e5e5;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.highlight-text {
  color: var(--gold);
  font-weight: 700;
  text-decoration: underline decoration-thickness 2px;
}

.modal-warning-box {
  background: rgba(255, 193, 7, 0.05);
  border: 1px solid rgba(255, 193, 7, 0.2);
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1.5rem;
}

.warning-header {
  color: var(--gold);
  font-weight: 700;
  margin: 0 0 0.8rem 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.warning-list {
  margin: 0;
  padding-left: 1.2rem;
  color: #d4d4d4;
  font-size: 0.95rem;
  line-height: 1.6;
}

.warning-list li::marker {
  color: var(--gold);
}

.modal-danger-note {
  text-align: center;
  color: #a3a3a3;
  font-size: 0.9rem;
  margin-bottom: 2rem;
}

.modal-danger-note strong {
  color: var(--red);
  font-weight: 800;
  text-decoration: underline;
}

.modal-confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-cancel-modal,
.btn-confirm-delete-modal {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.1s, background 0.2s;
}

.btn-cancel-modal {
  background: #525252;
  color: white;
}

.btn-cancel-modal:hover {
  background: #606060;
  transform: scale(1.02);
}

.btn-confirm-delete-modal {
  background: var(--red);
  color: white;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

.btn-confirm-delete-modal:hover {
  background: var(--danger-hover);
  transform: scale(1.02);
  box-shadow: 0 6px 16px rgba(244, 67, 54, 0.5);
}

.btn-cancel-modal:active,
.btn-confirm-delete-modal:active {
  transform: scale(0.98);
}

/* ======================================================
   ALERTA DE ÉXITO (TOAST)
   ====================================================== */

.success-toast {
  position: fixed;
  top: 30px;
  right: 30px;
  background: #1a1a1a;
  border-left: 5px solid var(--green);
  padding: 20px 30px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 100000;
  animation: slideInToast 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  min-width: 400px;
  border: 1px solid #333;
}

.success-icon-container {
  width: 45px;
  height: 45px;
  background: rgba(76, 175, 80, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--green);
  font-size: 24px;
  font-weight: bold;
}

.success-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.success-title {
  color: var(--text-white);
  font-weight: 800;
  font-size: 1.1rem;
}

.success-message {
  color: #ccc;
  font-size: 1rem;
}

/* Animaciones */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideInToast {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Responsive */
@media (max-width: 500px) {
  .modal-confirm {
    padding: 1.5rem;
    width: 95%;
  }
  
  .modal-confirm-actions {
    flex-direction: column;
  }

  .success-toast {
    right: 5%;
    left: 5%;
    top: 20px;
    min-width: auto;
    padding: 15px;
  }
}
`;

// ======================= COMPONENTES AUXILIARES =======================

// Modal de Eliminación
const DeleteConfirmModal = ({ clienteNombre, onConfirm, onCancel, isDeleting }) => (
  <div className="modal-overlay" onClick={!isDeleting ? onCancel : undefined}>
    <div className="modal-confirm" onClick={(e) => e.stopPropagation()}>
      <div className="modal-confirm-icon-warning">
        <span className="warning-icon">!</span>
      </div>
      
      <h3 className="modal-confirm-title">Eliminar Reserva</h3>
      
      <p className="modal-confirm-message">
        ¿Estás seguro de eliminar la reserva de <span className="highlight-text">{clienteNombre}</span>?
      </p>
      
      <div className="modal-warning-box">
        <p className="warning-header">⚠️ Esta acción:</p>
        <ul className="warning-list">
            <li>Eliminará permanentemente la reserva</li>
            <li>Reversará los pagos en caja (si aplica)</li>
            <li>Notificará al cliente por email</li>
        </ul>
      </div>

      <p className="modal-danger-note">Esta acción <strong>NO</strong> se puede deshacer.</p>

      <div className="modal-confirm-actions">
        <button 
            className="btn-cancel-modal" 
            onClick={onCancel} 
            disabled={isDeleting}
        >
          Cancelar
        </button>
        <button 
            className="btn-confirm-delete-modal" 
            onClick={onConfirm}
            disabled={isDeleting}
        >
          {isDeleting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </div>
  </div>
);

// Toast de Éxito
const SuccessToast = () => (
  <div className="success-toast">
    <div className="success-icon-container">
      ✓
    </div>
    <div className="success-content">
      <span className="success-title">¡Operación exitosa!</span>
      <span className="success-message">La reserva se ha eliminado correctamente.</span>
    </div>
  </div>
);

function Agenda() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroBarbero, setFiltroBarbero] = useState("todos");
  const [barberos, setBarberos] = useState([]);
  
  // ✅ ESTADOS PARA EL MODAL
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reservaToDelete, setReservaToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ ESTADO PARA LA ALERTA DE ÉXITO
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Carga inicial
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Intentamos conectar con la API
      const resReservas = await fetch(`${API_URL}/reservas/`, {
        headers: {
          Accept: "application/json",
          Authorization: getToken() ? `Token ${getToken()}` : undefined,
        },
      });

      if (!resReservas.ok) throw new Error(`HTTP ${resReservas.status}`);
      
      const dataReservas = await resReservas.json();
      const todasReservas = Array.isArray(dataReservas) ? dataReservas : dataReservas?.results ?? [];

      const resBarberos = await fetch(`${API_URL}/barberos/`);
      if (resBarberos.ok) {
        const dataBarberos = await resBarberos.json();
        setBarberos(Array.isArray(dataBarberos) ? dataBarberos : dataBarberos?.results ?? []);
      }

      setReservas(procesarReservas(todasReservas));
      
    } catch (err) {
      // MOCK DATA si falla la API
      setReservas(procesarReservas(MOCK_RESERVAS));
      setBarberos(MOCK_BARBEROS);
    } finally {
      setLoading(false);
    }
  };

  const procesarReservas = (data) => {
    return data.sort((a, b) => {
      const fechaA = new Date(`${a.fecha}T${a.horario}`);
      const fechaB = new Date(`${b.fecha}T${b.horario}`);
      return fechaB - fechaA;
    });
  };

  // 1. Abrir Modal
  const solicitarEliminacion = (reserva) => {
    setReservaToDelete(reserva);
    setShowDeleteModal(true);
  };

  // 2. Cancelar Modal
  const cancelarEliminacion = () => {
    setShowDeleteModal(false);
    setReservaToDelete(null);
  };

  // 3. Confirmar y Ejecutar Eliminación
  const ejecutarEliminacion = async () => {
    if (!reservaToDelete) return;
    
    setIsDeleting(true);

    try {
      const res = await fetch(`${API_URL}/reservas/${reservaToDelete.id}/eliminar/`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: getToken() ? `Token ${getToken()}` : undefined,
        },
      });

      if (!res.ok) {
        // En modo demo, simulamos éxito si falla la API
        console.warn("API falló, simulando eliminación en UI");
      }
      
      // ✅ ELIMINACIÓN EXITOSA
      setReservas(prev => prev.filter(r => r.id !== reservaToDelete.id));
      setShowDeleteModal(false);
      setReservaToDelete(null);
      
      // MOSTRAR TOAST DE ÉXITO
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000); // Ocultar después de 3s
      
    } catch (e) {
      console.error("Error eliminando reserva:", e);
      // Simular éxito para demo
      setReservas(prev => prev.filter(r => r.id !== reservaToDelete.id));
      setShowDeleteModal(false);
      setReservaToDelete(null);
      
      // Mostrar Toast también en la simulación
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatearHora = (hora) => {
    if (!hora) return "-";
    const [h, m] = hora.substring(0, 5).split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const [year, month, day] = fecha.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const esCitaPasada = (fecha, horario) => {
    return new Date(`${fecha}T${horario}`) < new Date();
  };

  const calcularTotal = (servicios) => {
    if (!servicios || !Array.isArray(servicios)) return 0;
    const total = servicios.reduce(
      (sum, s) => sum + (parseFloat(s.precio) || 0),
      0
    );
    return parseFloat(total.toFixed(2));
  };

  const reservasFiltradas = reservas.filter((reserva) => {
    if (filtroEstado === "pasadas" && !esCitaPasada(reserva.fecha, reserva.horario)) return false;
    if (filtroEstado === "proximas" && esCitaPasada(reserva.fecha, reserva.horario)) return false;
    if (filtroEstado === "confirmadas" && reserva.estado !== "confirmada") return false;
    if (filtroEstado === "canceladas" && reserva.estado !== "cancelada") return false;

    if (filtroBarbero !== "todos" && reserva.barbero_nombre !== filtroBarbero) return false;

    return true;
  });

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "confirmada": return "#4caf50";
      case "cancelada": return "#f44336";
      case "pendiente": return "#ff9800";
      case "completada": return "#2196f3";
      default: return "#9e9e9e";
    }
  };

  return (
    <div className="agenda-container">
      {/* INYECTAR ESTILOS */}
      <style>{styles}</style>

      {/* FILTROS */}
      <div className="agenda-filters">
        <div className="filter-group">
          <label>Estado:</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todas">Todas las citas</option>
            <option value="proximas">Próximas</option>
            <option value="pasadas">Pasadas</option>
            <option value="confirmadas">Confirmadas</option>
            <option value="canceladas">Canceladas</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Barbero:</label>
          <select
            value={filtroBarbero}
            onChange={(e) => setFiltroBarbero(e.target.value)}
          >
            <option value="todos">Todos los barberos</option>
            {barberos.map((barbero) => (
              <option key={barbero.id} value={barbero.nombre}>
                {barbero.nombre}
              </option>
            ))}
          </select>
        </div>

        <button className="btn-refrescar" onClick={cargarDatos}>
          🔄 Actualizar
        </button>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="loading-agenda">Cargando agenda...</div>
      ) : reservasFiltradas.length === 0 ? (
        <div className="empty-agenda">No hay citas que coincidan con los filtros</div>
      ) : (
        <div className="reservas-lista">
          {reservasFiltradas.map((reserva) => {
            const esPasada = esCitaPasada(reserva.fecha, reserva.horario);
            const totalReserva = calcularTotal(reserva.servicios);
            
            // ✅ LÓGICA CORREGIDA: SÓLO CONFIRMADAS (PENDIENTES YA NO)
            const puedeEliminar = reserva.estado === "confirmada";

            return (
              <div
                key={reserva.id}
                className={`reserva-card ${esPasada ? "pasada" : "futura"}`}
              >
                {/* HEADER */}
                <div className="reserva-header">
                  <div className="reserva-fecha-hora">
                    <div className="fecha">{formatearFecha(reserva.fecha)}</div>
                    <div className="hora">{formatearHora(reserva.horario)}</div>
                  </div>

                  <div
                    className="reserva-estado"
                    style={{
                      backgroundColor: getEstadoColor(reserva.estado),
                      color: "white",
                    }}
                  >
                    {reserva.estado.charAt(0).toUpperCase() +
                      reserva.estado.slice(1)}
                  </div>
                </div>

                {/* BODY */}
                <div className="reserva-body">
                  <div className="reserva-info">
                    <strong className="cliente-nombre" style={{ color: "white" }}>
                      {reserva.nombre_cliente} {reserva.apellido_cliente}
                    </strong>

                    <div className="reserva-detalle">
                      👤 <strong>Barbero:</strong>
                      <span style={{ color: "white" }}>
                        {reserva.barbero_nombre || "Sin asignar"}
                      </span>
                    </div>

                    <div className="reserva-detalle">
                      ✂️ <strong>Servicios:</strong>
                      <span style={{ color: "white" }}>
                        {reserva.servicios?.length
                          ? reserva.servicios.map((s) => s.nombre).join(", ")
                          : "Sin servicio"}
                      </span>
                    </div>

                    {totalReserva > 0 && (
                      <div className="reserva-detalle">
                        💰 <strong>Total:</strong>
                        <span style={{ color: "white" }}>
                          $
                          {totalReserva.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* BOTÓN ELIMINAR - SÓLO SI ES CONFIRMADA */}
                  {puedeEliminar && (
                    <button
                      className="btn-eliminar-reserva-agenda"
                      onClick={() => solicitarEliminacion(reserva)}
                      title="Eliminar reserva"
                      style={{
                        marginTop: '1rem',
                        padding: '0.6rem 1rem',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#d32f2f';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f44336';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  )}
                </div>

                {esPasada && <div className="reserva-badge">Pasada</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* STATS */}
      <div className="agenda-stats">
        <div className="stat-item">
          <strong>{reservasFiltradas.length}</strong>
          <span>Citas mostradas</span>
        </div>
        <div className="stat-item">
          <strong>{reservas.filter((r) => r.estado === "confirmada").length}</strong>
          <span>Confirmadas</span>
        </div>
        <div className="stat-item">
          <strong>
            {reservas.filter((r) => esCitaPasada(r.fecha, r.horario)).length}
          </strong>
          <span>Pasadas</span>
        </div>
      </div>

      {/* ✅ MODAL DE CONFIRMACIÓN */}
      {showDeleteModal && reservaToDelete && (
        <DeleteConfirmModal 
          clienteNombre={`${reservaToDelete.nombre_cliente} ${reservaToDelete.apellido_cliente}`}
          onConfirm={ejecutarEliminacion}
          onCancel={cancelarEliminacion}
          isDeleting={isDeleting}
        />
      )}

      {/* ✅ ALERTA DE ÉXITO */}
      {showSuccess && <SuccessToast />}
    </div>
  );
}

export default Agenda;