import React, { useEffect, useState } from "react";
import "./Agenda.css";

const API_URL = "http://localhost:8000/api";

const getToken = () =>
  localStorage.getItem("token") || localStorage.getItem("authToken") || "";

function Agenda() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroBarbero, setFiltroBarbero] = useState("todos");
  const [barberos, setBarberos] = useState([]);
  const [eliminando, setEliminando] = useState(new Set());

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resReservas = await fetch(`${API_URL}/reservas/`, {
        headers: {
          Accept: "application/json",
          Authorization: getToken() ? `Token ${getToken()}` : undefined,
        },
      });
      if (!resReservas.ok) throw new Error(`HTTP ${resReservas.status}`);
      const dataReservas = await resReservas.json();
      const todasReservas = Array.isArray(dataReservas)
        ? dataReservas
        : dataReservas?.results ?? [];

      const resBarberos = await fetch(`${API_URL}/barberos/`);
      if (resBarberos.ok) {
        const dataBarberos = await resBarberos.json();
        setBarberos(
          Array.isArray(dataBarberos)
            ? dataBarberos
            : dataBarberos?.results ?? []
        );
      }

      const reservasOrdenadas = todasReservas.sort((a, b) => {
        const fechaA = new Date(`${a.fecha}T${a.horario}`);
        const fechaB = new Date(`${b.fecha}T${b.horario}`);
        return fechaB - fechaA;
      });

      setReservas(reservasOrdenadas);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarReserva = async (reservaId, clienteNombre) => {
    if (eliminando.has(reservaId)) return;

    if (!window.confirm(
      `¿Estás seguro de eliminar la reserva de ${clienteNombre}?\n\n` +
      `⚠️ Esta acción:\n` +
      `• Eliminará permanentemente la reserva\n` +
      `• Reversará los pagos en caja (si aplica)\n` +
      `• Notificará al cliente por email\n\n` +
      `Esta acción NO se puede deshacer.`
    )) {
      return;
    }

    setEliminando(prev => new Set(prev).add(reservaId));

    try {
      const res = await fetch(`${API_URL}/reservas/${reservaId}/eliminar/`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: getToken() ? `Token ${getToken()}` : undefined,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.mensaje || data.error || data.detail || 'No se pudo eliminar la reserva';
        alert(`❌ Error: ${errorMsg}`);
        return;
      }

      alert(`✅ ${data.mensaje || 'Reserva eliminada exitosamente'}`);
      cargarDatos(); // Recargar datos
    } catch (e) {
      console.error("Error eliminando reserva:", e);
      alert("❌ Error al eliminar la reserva. Por favor intenta nuevamente.");
    } finally {
      setEliminando(prev => {
        const next = new Set(prev);
        next.delete(reservaId);
        return next;
      });
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
      case "confirmada":
        return "#4caf50";
      case "cancelada":
        return "#f44336";
      case "pendiente":
        return "#ff9800";
      case "completada":
        return "#2196f3";
      default:
        return "#9e9e9e";
    }
  };

  return (
    <div className="agenda-container">
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
            const puedeEliminar = reserva.estado === "confirmada" || reserva.estado === "completada";

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

                  {/* BOTÓN ELIMINAR */}
                  {puedeEliminar && (
                    <button
                      className="btn-eliminar-reserva-agenda"
                      onClick={() => handleEliminarReserva(
                        reserva.id, 
                        `${reserva.nombre_cliente} ${reserva.apellido_cliente}`
                      )}
                      disabled={eliminando.has(reserva.id)}
                      title="Eliminar reserva"
                      style={{
                        marginTop: '1rem',
                        padding: '0.6rem 1rem',
                        background: eliminando.has(reserva.id) ? '#666' : '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: eliminando.has(reserva.id) ? 'not-allowed' : 'pointer',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s ease',
                        opacity: eliminando.has(reserva.id) ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!eliminando.has(reserva.id)) {
                          e.currentTarget.style.background = '#d32f2f';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!eliminando.has(reserva.id)) {
                          e.currentTarget.style.background = '#f44336';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      {eliminando.has(reserva.id) ? "⏳ Eliminando..." : "🗑️ Eliminar"}
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
    </div>
  );
}

export default Agenda;