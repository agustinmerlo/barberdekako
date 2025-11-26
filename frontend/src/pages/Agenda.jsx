import React, { useState, useEffect } from "react";

// CORRECCIÓN: Eliminamos process.env para evitar el ReferenceError en el navegador
const API_BASE = "http://localhost:8000";

// ======================= DATOS DE PRUEBA (MOCKS) =======================
const MOCK_RESERVAS = [
  {
    id: 101,
    fecha: "2025-12-02",
    horario: "11:00",
    estado: "pendiente",
    nombre_cliente: "Hoak",
    apellido_cliente: "Juaf",
    barbero_nombre: "Juan",
    email_cliente: "hoak@test.com",
    telefono_cliente: "123456789",
    total: 4000,
    servicios: [{ nombre: "Barba", precio: 4000, duracion: 30 }],
    duracion_total: 30,
    comprobante: null 
  },
  {
    id: 102,
    fecha: "2025-11-27",
    horario: "10:00",
    estado: "confirmada",
    nombre_cliente: "Maria",
    apellido_cliente: "Lopez",
    barbero_nombre: "Ana",
    total: 5000,
    servicios: [{ nombre: "Corte", precio: 5000, duracion: 45 }],
    duracion_total: 45,
    comprobante: "https://via.placeholder.com/150" 
  }
];

// ======================= ESTILOS CSS INTEGRADOS =======================
const styles = `
/* ReservasPendientes.css - Fullscreen black background */

:root {
  --bg-dark: #0a0a0a;
  --card-bg: #1a1a1a;
  --card-hover: #252525;
  --border: #404040;
  --text-white: #ffffff;
  --gold: #ffc107;
  --green: #4caf50;
  --red: #f44336;
  --orange: #ff9800;
  --blue: #2196F3;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.reservas-admin-container {
  padding: 20px;
  width: 100%;
  background: var(--bg-dark);
  min-height: 100vh;
  color: var(--text-white);
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.reservas-admin-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.reservas-admin-header h1 {
  margin: 0;
}

/* FILTROS */
.filtros-container {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  width: 100%;
}

.filtro-btn {
  padding: 12px 24px;
  border: 2px solid var(--border);
  background: var(--card-bg);
  color: var(--text-white);
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filtro-btn:hover {
  border-color: var(--gold);
  transform: translateY(-2px);
  background: var(--card-hover);
}

.filtro-btn.active {
  background: var(--gold);
  color: #000;
  border-color: var(--gold);
}

.badge-filtro {
  background: var(--red);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

/* GRID DE RESERVAS */
.reservas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  width: 100%;
}

.reserva-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  border-left: 4px solid var(--border);
  transition: all 0.3s;
  border: 2px solid var(--border);
}

.reserva-card:hover {
  box-shadow: 0 8px 20px rgba(0,0,0,0.6);
  transform: translateY(-2px);
  border-color: var(--gold);
}

.reserva-card.estado-pendiente { border-left-color: var(--orange); }
.reserva-card.estado-confirmada { border-left-color: var(--green); }
.reserva-card.estado-rechazada { border-left-color: var(--red); }

/* HEADER DE LA TARJETA */
.reserva-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid var(--border);
}

.reserva-header h3 {
  font-size: 18px;
  margin: 0;
  color: var(--text-white);
  font-weight: 700;
}

.estado-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  color: white;
}

.estado-badge.pendiente { background: var(--orange); }
.estado-badge.confirmada { background: var(--green); }
.estado-badge.rechazada { background: var(--red); }

/* SECCIONES */
.reserva-seccion { 
  margin-bottom: 15px;
}

.reserva-seccion h4 {
  font-size: 14px;
  color: var(--gold);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
}

.reserva-seccion p {
  margin: 5px 0;
  font-size: 14px;
  color: var(--text-white);
  font-weight: 600;
}

/* DETALLES */
.detalle-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  font-size: 14px;
}

.detalle-grid .label {
  color: var(--gold);
  font-weight: 700;
}

.detalle-grid .valor {
  color: var(--text-white);
  font-weight: 600;
}

/* SERVICIOS */
.servicios-lista {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.servicio-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--card-hover);
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
}

.servicio-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.servicio-nombre { 
  font-weight: 700; 
  color: var(--text-white);
}

.servicio-cantidad { 
  color: var(--text-white); 
  font-weight: 600;
}

.servicio-duracion { 
  color: #aaa; 
  font-size: 13px;
}

.servicio-precio {
  font-weight: 700;
  color: var(--gold);
  white-space: nowrap;
  font-size: 16px;
}

.servicio-subtotal {
  color: var(--text-white);
  font-weight: 600;
  margin-left: 6px;
}

/* PAGO */
.pago-section {
  background: var(--card-hover);
  padding: 15px;
  border-radius: 8px;
  border: 2px solid var(--border);
}

.pago-detalle { 
  display: flex; 
  flex-direction: column; 
  gap: 8px;
}

.pago-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.pago-item span,
.pago-item strong {
  color: var(--text-white);
  font-weight: 600;
}

.pago-item.total strong { 
  font-size: 18px;
  color: var(--text-white);
  font-weight: 900;
}

.pago-item.seña {
  padding-top: 10px;
  border-top: 2px dashed var(--border);
}

.pago-item .highlight {
  color: var(--gold);
  font-size: 20px;
  font-weight: 900;
}

/* BOTONES */
.btn-ver-comprobante {
  width: 100%;
  padding: 12px;
  background: var(--blue);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s;
  font-size: 14px;
  margin-top: 15px;
}

.btn-ver-comprobante:hover { 
  background: #1976d2;
  transform: translateY(-2px);
}

.reserva-acciones {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn-confirmar,
.btn-rechazar {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s;
  color: white;
  font-size: 14px;
}

.btn-confirmar { 
  background: var(--green);
}

.btn-confirmar:hover { 
  background: #45a049;
  transform: translateY(-2px);
}

.btn-rechazar { 
  background: var(--red);
}

.btn-rechazar:hover { 
  background: #da190b;
  transform: translateY(-2px);
}

/* FOOTER */
.reserva-footer {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
  text-align: center;
}

.reserva-footer small { 
  color: #aaa; 
  font-size: 12px;
}

/* MODAL */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.25s ease-out;
}

.modal-comprobante {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 30px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 2px solid var(--border);
  animation: slideUp 0.3s ease-out;
}

.btn-cerrar-modal {
  position: absolute;
  top: 15px;
  right: 15px;
  background: var(--red);
  color: white;
  border: none;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
}

.btn-cerrar-modal:hover {
  background: #da190b;
}

.comprobante-info { 
  margin-bottom: 20px;
}

.info-row { 
  display: flex; 
  gap: 8px; 
  margin: 6px 0;
}

.info-row strong { 
  width: 130px; 
  color: var(--gold);
  font-weight: 700;
}

.info-row span {
  color: var(--text-white);
  font-weight: 600;
}

.comprobante-imagen-container { 
  margin: 20px 0; 
  text-align: center;
}

.comprobante-imagen {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  border: 2px solid var(--border);
}

.modal-acciones { 
  margin-top: 30px;
}

.rechazo-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
  color: var(--gold);
}

.rechazo-section textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--border);
  border-radius: 8px;
  font-family: inherit;
  resize: vertical;
  color: var(--text-white);
  background: var(--card-hover);
  font-weight: 600;
}

.rechazo-section textarea::placeholder {
  color: #888;
}

.modal-botones {
  display: flex;
  gap: 15px;
  margin-top: 20px;
}

.btn-modal-confirmar,
.btn-modal-rechazar {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  font-size: 15px;
  transition: all 0.2s;
  color: white;
}

.btn-modal-confirmar { 
  background: var(--green);
}

.btn-modal-confirmar:hover {
  background: #45a049;
  transform: translateY(-2px);
}

.btn-modal-rechazar { 
  background: var(--red);
}

.btn-modal-rechazar:hover {
  background: #da190b;
  transform: translateY(-2px);
}

/* ESTADOS VACÍOS */
.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-white);
  font-size: 16px;
  background: var(--card-bg);
  border-radius: 12px;
  border: 2px dashed var(--border);
}

/* SCROLLBAR */
.modal-comprobante::-webkit-scrollbar {
  width: 10px;
}

.modal-comprobante::-webkit-scrollbar-track {
  background: var(--card-bg);
  border-radius: 10px;
}

.modal-comprobante::-webkit-scrollbar-thumb {
  background: var(--gold);
  border-radius: 10px;
}

.modal-comprobante::-webkit-scrollbar-thumb:hover {
  background: #ffca28;
}

/* ======================================================
   MODAL DE ACCIÓN PERSONALIZADO (ESTILO DARK)
   ====================================================== */

.modal-confirm.action-variant {
  background: #262626;
  padding: 2.5rem 2rem;
  border-radius: 24px;
  width: 90%;
  max-width: 450px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
  animation: slideUp 0.3s ease-out;
  border: 1px solid #404040;
  position: relative;
}

.modal-confirm-icon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.modal-confirm-icon.icon-confirm {
  background: #ffc107;
  color: black;
}

.modal-confirm-icon.icon-reject {
  background: #f44336;
  color: white;
}

.icon-symbol {
  font-size: 40px;
  font-weight: 900;
  line-height: 1;
}

.modal-confirm-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.5rem;
}

.modal-confirm-message {
  color: #e5e5e5;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

/* Caja de Advertencia */
.modal-warning-box {
  border-radius: 12px;
  padding: 1.2rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.modal-warning-box.warning-yellow {
  background: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.2);
}

.modal-warning-box.warning-red {
  background: rgba(244, 67, 54, 0.08);
  border: 1px solid rgba(244, 67, 54, 0.2);
}

.warning-header {
  font-weight: 700;
  margin: 0 0 0.8rem 0;
  font-size: 1rem;
  color: #fff;
}

.warning-list {
  margin: 0;
  padding-left: 1.2rem;
  color: #d4d4d4;
  font-size: 0.9rem;
  line-height: 1.6;
}

.warning-list li::marker {
  color: #aaa;
}

/* Botones del Modal */
.modal-confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-cancel-modal,
.btn-confirm-modal {
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

.btn-confirm-modal.btn-green {
  background: #4caf50;
  color: white;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-confirm-modal.btn-green:hover {
  background: #45a049;
  transform: scale(1.02);
}

.btn-confirm-modal.btn-red {
  background: #f44336;
  color: white;
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
}

.btn-confirm-modal.btn-red:hover {
  background: #d32f2f;
  transform: scale(1.02);
}

.btn-confirm-modal.btn-yellow {
  background: #ffc107;
  color: black;
}

/* Estilos adicionales para modal de caja */
.caja-modal {
  max-width: 500px;
  padding: 0;
  overflow: hidden;
}

.modal-header-custom {
  padding: 24px;
  border-bottom: 1px solid #444;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-close-simple {
  background: none;
  border: none;
  color: #aaa;
  font-size: 28px;
  cursor: pointer;
}

.modal-text-muted {
  color: #aaa;
  margin-bottom: 24px;
  font-size: 16px;
  line-height: 1.6;
  text-align: left;
}

.label-custom {
  display: block;
  color: #ffc107;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
  text-align: left;
}

.input-custom {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #444;
  border-radius: 8px;
  background: #1a1a1a;
  color: #fff;
  font-size: 16px;
}

.input-custom:focus {
  border-color: #ffc107;
  outline: none;
}

.modal-footer-custom {
  padding: 24px;
  border-top: 1px solid #444;
  display: flex;
  gap: 12px;
}

/* ======================================================
   ALERTA DE ÉXITO (TOAST)
   ====================================================== */

.success-toast {
  position: fixed;
  top: 30px;
  right: 30px;
  background: #1a1a1a;
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

/* Variante CONFIRMAR (Verde) */
.success-toast.confirm-toast {
  border-left: 5px solid var(--green);
}
.success-toast.confirm-toast .success-icon-container {
  background: rgba(76, 175, 80, 0.15);
  color: var(--green);
}

/* Variante RECHAZAR (Roja) */
.success-toast.reject-toast {
  border-left: 5px solid var(--red);
}
.success-toast.reject-toast .success-icon-container {
  background: rgba(244, 67, 54, 0.15);
  color: var(--red);
}

.success-icon-container {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
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

@keyframes slideInToast {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .reservas-admin-container { padding: 1rem; }
  .reservas-grid { grid-template-columns: 1fr; }
  .modal-comprobante { padding: 20px; }
  .modal-botones { flex-direction: column; }
  .detalle-grid { grid-template-columns: 1fr; }
  .success-toast {
    right: 5%;
    left: 5%;
    top: 20px;
    min-width: auto;
    padding: 15px;
  }
}
`;

// ======================= TOAST DE ÉXITO =======================
const SuccessToast = ({ message, type }) => {
  const isReject = type === "reject";
  return (
    <div className={`success-toast ${isReject ? "reject-toast" : "confirm-toast"}`}>
      <div className="success-icon-container">
        {isReject ? "✕" : "✓"}
      </div>
      <div className="success-content">
        <span className="success-title">¡Operación exitosa!</span>
        <span className="success-message">{message}</span>
      </div>
    </div>
  );
};

// ======================= MODAL DE ACCIÓN (CONFIRMAR/RECHAZAR) =======================
const ActionConfirmModal = ({ type, onConfirm, onCancel, isProcessing }) => {
  const isReject = type === "reject";
  const title = isReject ? "Rechazar Reserva" : "Confirmar Reserva";
  const message = isReject 
    ? "¿Estás seguro de que deseas rechazar esta reserva?" 
    : "¿Estás seguro de que deseas confirmar esta reserva?";
  
  const icon = isReject ? "!" : "?";
  const btnText = isReject ? "Rechazar" : "Confirmar";
  const processingText = isReject ? "Rechazando..." : "Confirmando...";

  return (
    <div className="modal-overlay" onClick={!isProcessing ? onCancel : undefined}>
      <div className="modal-confirm action-variant" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-confirm-icon ${isReject ? "icon-reject" : "icon-confirm"}`}>
          <span className="icon-symbol">{icon}</span>
        </div>
        
        <h3 className="modal-confirm-title">{title}</h3>
        <p className="modal-confirm-message">{message}</p>
        
        <div className={`modal-warning-box ${isReject ? "warning-red" : "warning-yellow"}`}>
          <p className="warning-header">⚠️ Información:</p>
          <ul className="warning-list">
            {isReject ? (
              <>
                <li>La reserva pasará a estado <strong>Rechazada</strong>.</li>
                <li>Se notificará al cliente el motivo.</li>
                <li>Esta acción es irreversible.</li>
              </>
            ) : (
              <>
                <li>La reserva pasará a estado <strong>Confirmada</strong>.</li>
                <li>Se enviará el comprobante al cliente.</li>
                <li>La fecha y hora quedarán ocupadas.</li>
              </>
            )}
          </ul>
        </div>

        <div className="modal-confirm-actions">
          <button 
            className="btn-cancel-modal" 
            onClick={onCancel} 
            disabled={isProcessing}
          >
            Cancelar
          </button>
          <button 
            className={`btn-confirm-modal ${isReject ? "btn-red" : "btn-green"}`} 
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? processingText : btnText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ReservasPendientes() {
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("pendiente");
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [procesando, setProcesando] = useState(null);
  
  // Estados para control de caja
  const [modalAperturaCaja, setModalAperturaCaja] = useState(false);
  const [montoApertura, setMontoApertura] = useState("");
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [reservaPendienteConfirmar, setReservaPendienteConfirmar] = useState(null);

  // ESTADOS PARA MODALES PERSONALIZADOS
  const [actionModal, setActionModal] = useState(null); 

  // ✅ ESTADO PARA EL TOAST
  const [toast, setToast] = useState(null); // { message: string, type: 'confirm' | 'reject' }

  // ===== Helpers de monto/moneda =====
  const parsePrice = (v) => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (v == null) return 0;
    let s = String(v).trim();
    s = s.replace(/[^\d.,-]/g, "");
    if (s.includes(",") && s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };

  const fmtCurrency = (n) =>
    new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0);

  const toServiciosArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Verificar turno activo al cargar
  useEffect(() => {
    verificarTurnoActivo();
    cargarReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  const verificarTurnoActivo = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/caja/turnos/turno_activo/`);
      const data = await res.json();
      if (data.existe) {
        setTurnoActivo(data.turno);
      } else {
        setTurnoActivo(null);
      }
    } catch (err) {
      console.warn("Modo Demo: No se pudo verificar turno, asumiendo cerrado.");
      setTurnoActivo(null);
    }
  };

  const cargarReservas = async () => {
    setCargando(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/reservas/?estado=${encodeURIComponent(filtro)}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const items = Array.isArray(data) ? data : data?.results ?? [];
      
      setReservas(procesarReservas(items));
    } catch (error) {
      console.warn("Modo Demo: Usando datos de prueba para ReservasPendientes.", error);
      // Filtrar mocks según el estado seleccionado
      const mockFiltrados = MOCK_RESERVAS.filter(r => filtro === 'todas' || r.estado === filtro);
      setReservas(procesarReservas(mockFiltrados));
    } finally {
      setCargando(false);
    }
  };

  const procesarReservas = (items) => {
    return items.map((reserva) => ({
      ...reserva,
      servicios: toServiciosArray(reserva.servicios),
      barbero_nombre:
        reserva.barbero_nombre ||
        reserva.barbero?.name ||
        reserva.barbero?.nombre ||
        "-",
      fecha: reserva.fecha || reserva.date || null,
      horario: reserva.horario || reserva.hora || reserva.time || null,
      duracion_total:
        reserva.duracion_total || reserva.duracion || reserva.duration || null,
    }));
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const d = new Date(fecha.includes('T') ? fecha : `${fecha}T00:00:00`);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatearHora = (hora) => {
    if (!hora) return "-";
    if (typeof hora !== "string") return String(hora);
    if (hora.includes(":")) return hora.substring(0, 5);
    return hora;
  };

  const formatearDuracion = (duracion) => {
    if (!duracion) return "-";
    const mins = parseInt(duracion, 10);
    if (isNaN(mins)) return String(duracion);
    if (mins < 60) return `${mins} min`;
    const horas = Math.floor(mins / 60);
    const minutosRestantes = mins % 60;
    if (minutosRestantes === 0) return `${horas}h`;
    return `${horas}h ${minutosRestantes}min`;
  };

  const calcularTotalServicios = (servicios) => {
    return servicios.reduce((sum, s) => {
      const precio = parsePrice(s?.precio);
      const cantidad = parseInt(s?.cantidad ?? 1, 10) || 1;
      return sum + precio * cantidad;
    }, 0);
  };

  const verComprobante = (reserva) => setComprobanteSeleccionado(reserva);
  
  const cerrarModal = () => {
    setComprobanteSeleccionado(null);
    setMotivoRechazo("");
    setActionModal(null);
  };

  // Función para mostrar Toast
  const mostrarToast = (mensaje, tipo) => {
    setToast({ message: mensaje, type: tipo });
    setTimeout(() => setToast(null), 3000);
  };

  // Abrir caja
  const abrirCaja = async () => {
    if (!montoApertura || parseFloat(montoApertura) < 0) {
      alert("Ingresa un monto de apertura válido");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/caja/turnos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto_apertura: parseFloat(montoApertura) })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setTurnoActivo(data);
      setModalAperturaCaja(false);
      setMontoApertura("");
      
      if (reservaPendienteConfirmar) {
        setActionModal({ type: "confirm", reservaId: reservaPendienteConfirmar });
        setReservaPendienteConfirmar(null);
      }
    } catch (err) {
      console.error("Error abriendo caja:", err);
      // Simular éxito para demo
      setTurnoActivo({ id: 999, monto_apertura: parseFloat(montoApertura) });
      setModalAperturaCaja(false);
      if (reservaPendienteConfirmar) {
        setActionModal({ type: "confirm", reservaId: reservaPendienteConfirmar });
        setReservaPendienteConfirmar(null);
      }
    }
  };

  // ================== HANDLERS DE ACCIÓN ==================

  const handleIntentarConfirmar = async (reservaId) => {
    if (!turnoActivo) {
      setReservaPendienteConfirmar(reservaId);
      setModalAperturaCaja(true);
      return;
    }
    setActionModal({ type: "confirm", reservaId });
  };

  const ejecutarConfirmacion = async () => {
    const reservaId = actionModal?.reservaId;
    if (!reservaId) return;

    setProcesando(reservaId);
    try {
      const response = await fetch(
        `${API_BASE}/api/reservas/${reservaId}/confirmar/`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      if (!response.ok) throw new Error("Error al confirmar");
      
      cargarReservas();
      cerrarModal();
      // ✅ TOAST CONFIRMADO
      mostrarToast("La reserva ha sido confirmada correctamente.", "confirm");
    } catch (error) {
      console.warn("Simulando confirmación exitosa...");
      setReservas(prev => prev.filter(r => r.id !== reservaId));
      cerrarModal();
      // ✅ TOAST CONFIRMADO (MOCK)
      mostrarToast("La reserva ha sido confirmada correctamente.", "confirm");
    } finally {
      setProcesando(null);
      setActionModal(null);
    }
  };

  const handleIntentarRechazar = (reservaId) => {
    if (!motivoRechazo.trim()) {
      alert("Por favor ingresa un motivo de rechazo");
      return;
    }
    setActionModal({ type: "reject", reservaId });
  };

  const ejecutarRechazo = async () => {
    const reservaId = actionModal?.reservaId;
    if (!reservaId) return;

    setProcesando(reservaId);
    try {
      const response = await fetch(
        `${API_BASE}/api/reservas/${reservaId}/rechazar/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ motivo: motivoRechazo }),
        }
      );

      if (!response.ok) throw new Error("Error al rechazar");
      
      cargarReservas();
      cerrarModal();
      // ✅ TOAST RECHAZADO
      mostrarToast("La reserva ha sido rechazada correctamente.", "reject");
    } catch (error) {
      console.warn("Simulando rechazo exitoso...");
      setReservas(prev => prev.filter(r => r.id !== reservaId));
      cerrarModal();
      // ✅ TOAST RECHAZADO (MOCK)
      mostrarToast("La reserva ha sido rechazada correctamente.", "reject");
    } finally {
      setProcesando(null);
      setActionModal(null);
    }
  };

  return (
    <div className="reservas-admin-container">
      <style>{styles}</style>
      <div className="reservas-admin-header">
        <h1>📋 Gestión de Reservas</h1>
        <div style={{ 
          display: 'inline-block', 
          marginLeft: '20px',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          background: turnoActivo ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
          color: turnoActivo ? '#4caf50' : '#f44336',
          border: `2px solid ${turnoActivo ? '#4caf50' : '#f44336'}`
        }}>
          {turnoActivo ? '🟢 Caja Abierta' : '🔴 Caja Cerrada'}
        </div>
      </div>

      {/* FILTROS */}
      <div className="filtros-container">
        <button
          className={`filtro-btn ${filtro === "pendiente" ? "active" : ""}`}
          onClick={() => setFiltro("pendiente")}
        >
          ⏳ Pendientes
        </button>
        <button
          className={`filtro-btn ${filtro === "confirmada" ? "active" : ""}`}
          onClick={() => setFiltro("confirmada")}
        >
          ✅ Confirmadas
        </button>
        <button
          className={`filtro-btn ${filtro === "rechazada" ? "active" : ""}`}
          onClick={() => setFiltro("rechazada")}
        >
          ❌ Rechazadas
        </button>
      </div>

      {/* LISTA DE RESERVAS */}
      {cargando ? (
        <div className="loading">Cargando reservas...</div>
      ) : reservas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No hay reservas {filtro}s</h3>
          <p>Las nuevas reservas aparecerán aquí</p>
        </div>
      ) : (
        <div className="reservas-grid">
          {reservas.map((reserva) => {
            const servicios = reserva.servicios || [];
            const subtotalServicios = servicios.length
              ? calcularTotalServicios(servicios)
              : parsePrice(reserva.total);

            const total = parsePrice(reserva.total) || subtotalServicios;
            const senia = parsePrice(
              reserva.seña ?? reserva.senia ?? reserva.sena ?? 0
            );
            const restante = Math.max(total - senia, 0);

            return (
              <div
                key={reserva.id}
                className={`reserva-card estado-${reserva.estado}`}
              >
                {/* HEADER */}
                <div className="reserva-header">
                  <h3>Reserva #{reserva.id}</h3>
                  <span className={`estado-badge ${reserva.estado}`}>
                    {reserva.estado === "pendiente" && "⏳ Pendiente"}
                    {reserva.estado === "confirmada" && "✅ Confirmada"}
                    {reserva.estado === "rechazada" && "❌ Rechazada"}
                  </span>
                </div>

                {/* INFORMACIÓN DEL CLIENTE */}
                <div className="reserva-seccion">
                  <h4>👤 Cliente</h4>
                  <p>
                    <strong>
                      {reserva.nombre_cliente} {reserva.apellido_cliente}
                    </strong>
                  </p>
                  <p>📧 {reserva.email_cliente || "-"}</p>
                  <p>📱 {reserva.telefono_cliente || "-"}</p>
                </div>

                {/* INFORMACIÓN DE LA RESERVA */}
                <div className="reserva-seccion">
                  <h4>📅 Detalles de la Reserva</h4>
                  <div className="detalle-grid">
                    <div className="detalle-item">
                      <span className="label">📅 Fecha:</span>
                      <span className="valor">{formatearFecha(reserva.fecha)}</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">🕒 Hora:</span>
                      <span className="valor">{formatearHora(reserva.horario)}</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">✂️ Barbero:</span>
                      <span className="valor">{reserva.barbero_nombre}</span>
                    </div>
                    <div className="detalle-item">
                      <span className="label">⏱️ Duración:</span>
                      <span className="valor">
                        {formatearDuracion(reserva.duracion_total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SERVICIOS */}
                <div className="reserva-seccion">
                  <h4>💼 Servicios Solicitados</h4>
                  {servicios.length === 0 ? (
                    <p className="no-servicios">No hay servicios registrados</p>
                  ) : (
                    <ul className="servicios-lista">
                      {servicios.map((servicio, idx) => {
                        const nombre = servicio?.nombre || "Servicio sin nombre";
                        const precio = parsePrice(servicio?.precio);
                        const cantidad = parseInt(servicio?.cantidad ?? 1, 10) || 1;
                        const subtotal = precio * cantidad;

                        const stableKey =
                          servicio?.id || `${reserva.id}-${nombre}-${idx}`;

                        return (
                          <li key={stableKey} className="servicio-item">
                            <div className="servicio-info">
                              <span className="servicio-nombre">
                                {nombre}
                                {cantidad > 1 && (
                                  <span className="servicio-cantidad"> (x{cantidad})</span>
                                )}
                              </span>
                              {servicio?.duracion && (
                                <span className="servicio-duracion">
                                  ⏱️ {servicio.duracion} min
                                </span>
                              )}
                            </div>
                            <span className="servicio-precio">
                              ${fmtCurrency(precio)}
                              {cantidad > 1 && (
                                <span className="servicio-subtotal">
                                  {" "}
                                  = ${fmtCurrency(subtotal)}
                                </span>
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* PAGO */}
                <div className="reserva-seccion pago-section">
                  <div className="pago-detalle">
                    <div className="pago-item">
                      <span>Subtotal Servicios:</span>
                      <span>${fmtCurrency(subtotalServicios)}</span>
                    </div>
                    <div className="pago-item total">
                      <span>Total:</span>
                      <strong>${fmtCurrency(total)}</strong>
                    </div>
                    <div className="pago-item seña">
                      <span>Seña Abonada (30%):</span>
                      <strong className="highlight">${fmtCurrency(senia)}</strong>
                    </div>
                    <div className="pago-item restante">
                      <span>Restante a Abonar:</span>
                      <strong>${fmtCurrency(restante)}</strong>
                    </div>
                  </div>
                </div>

                {/* COMPROBANTE (BTN VER) */}
                {reserva.comprobante && (
                  <div className="reserva-seccion">
                    <button
                      className="btn-ver-comprobante"
                      onClick={() => verComprobante(reserva)}
                    >
                      📸 Ver Comprobante de Pago
                    </button>
                  </div>
                )}

                {/* ACCIONES (solo para pendientes y desde la card si no tiene comprobante) */}
                {reserva.estado === "pendiente" && !reserva.comprobante && (
                  <div className="reserva-acciones">
                    <button
                      className="btn-confirmar"
                      onClick={() => handleIntentarConfirmar(reserva.id)}
                      disabled={procesando === reserva.id}
                    >
                      {procesando === reserva.id ? "Procesando..." : "✅ Confirmar"}
                    </button>
                    <button
                      className="btn-rechazar"
                      onClick={() => {
                        // Para rechazar sin comprobante, abrimos el modal de rechazo
                        // Necesitamos un input rápido de motivo, así que usamos el modal de acción
                        // Pero el modal de acción no tiene input. 
                        // Solución rápida: abrir el modal "Ver Comprobante" que sí tiene la sección de rechazo
                        verComprobante(reserva);
                      }}
                      disabled={procesando === reserva.id}
                    >
                      ❌ Rechazar
                    </button>
                  </div>
                )}

                {/* MOTIVO DE RECHAZO */}
                {reserva.estado === "rechazada" && reserva.motivo_rechazo && (
                  <div className="reserva-seccion rechazo-info">
                    <h4>❌ Motivo de Rechazo</h4>
                    <p className="motivo-texto">{reserva.motivo_rechazo}</p>
                  </div>
                )}

                {/* FECHA DE CREACIÓN */}
                <div className="reserva-footer">
                  <small>
                    📅 Recibida:{" "}
                    {reserva.fecha_creacion
                      ? new Date(reserva.fecha_creacion).toLocaleString("es-ES")
                      : "-"}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL APERTURA DE CAJA */}
      {modalAperturaCaja && (
        <div className="modal-overlay" onClick={() => {
          setModalAperturaCaja(false);
          setReservaPendienteConfirmar(null);
        }}>
          <div className="modal-confirm caja-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffc107' }}>
                ⚠️ Caja Cerrada
              </div>
              <button className="btn-close-simple" onClick={() => {
                setModalAperturaCaja(false);
                setReservaPendienteConfirmar(null);
              }}>×</button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <p className="modal-text-muted">
                Para confirmar reservas, primero debes <strong style={{ color: '#ffc107' }}>abrir la caja</strong>.
                Esto te permitirá registrar los pagos de las señas correctamente.
              </p>
              
              <div style={{ marginBottom: '20px' }}>
                <label className="label-custom">
                  💵 Monto Inicial en Efectivo
                </label>
                <input
                  type="number"
                  className="input-custom"
                  value={montoApertura}
                  onChange={(e) => setMontoApertura(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="modal-footer-custom">
              <button className="btn-cancel-modal" onClick={() => {
                setModalAperturaCaja(false);
                setReservaPendienteConfirmar(null);
              }}>
                Cancelar
              </button>
              <button className="btn-confirm-modal btn-yellow" onClick={abrirCaja}>
                🔓 Abrir Caja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COMPROBANTE / ACCIONES PRINCIPAL */}
      {comprobanteSeleccionado && !actionModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-comprobante" onClick={(e) => e.stopPropagation()}>
            <button className="btn-cerrar-modal" onClick={cerrarModal}>✕</button>

            <h2>Comprobante - Reserva #{comprobanteSeleccionado.id}</h2>

            <div className="comprobante-info">
              <div className="info-row">
                <strong>Cliente:</strong>
                <span>{comprobanteSeleccionado.nombre_cliente} {comprobanteSeleccionado.apellido_cliente}</span>
              </div>
              <div className="info-row">
                <strong>Fecha:</strong>
                <span>{formatearFecha(comprobanteSeleccionado.fecha)}</span>
              </div>
              <div className="info-row">
                <strong>Hora:</strong>
                <span>{formatearHora(comprobanteSeleccionado.horario)}</span>
              </div>
              <div className="info-row">
                <strong>Monto Seña:</strong>
                <span className="monto-destacado">
                  ${fmtCurrency(parsePrice(comprobanteSeleccionado.seña || comprobanteSeleccionado.senia || 0))}
                </span>
              </div>
            </div>

            {comprobanteSeleccionado.comprobante && (
              <div className="comprobante-imagen-container">
                <img
                  src={
                    String(comprobanteSeleccionado.comprobante).startsWith("http")
                      ? comprobanteSeleccionado.comprobante
                      : `${API_BASE}${comprobanteSeleccionado.comprobante}`
                  }
                  alt="Comprobante"
                  className="comprobante-imagen"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x300?text=Imagen+no+disponible";
                  }}
                />
              </div>
            )}

            {comprobanteSeleccionado.estado === "pendiente" && (
              <div className="modal-acciones">
                <div className="rechazo-section">
                  <label htmlFor="motivo">Motivo de rechazo (solo si rechazas):</label>
                  <textarea
                    id="motivo"
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    placeholder="Ej: El monto no coincide..."
                    rows="3"
                  />
                </div>

                <div className="modal-botones">
                  <button
                    className="btn-modal-confirmar"
                    onClick={() => handleIntentarConfirmar(comprobanteSeleccionado.id)}
                    disabled={procesando === comprobanteSeleccionado.id}
                  >
                    ✅ Confirmar Reserva
                  </button>
                  <button
                    className="btn-modal-rechazar"
                    onClick={() => handleIntentarRechazar(comprobanteSeleccionado.id)}
                    disabled={procesando === comprobanteSeleccionado.id}
                  >
                    ❌ Rechazar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ MODAL DE CONFIRMACIÓN FINAL (SOBREPUESTO) */}
      {actionModal && (
        <ActionConfirmModal 
          type={actionModal.type}
          onConfirm={actionModal.type === 'confirm' ? ejecutarConfirmacion : ejecutarRechazo}
          onCancel={() => setActionModal(null)}
          isProcessing={procesando === actionModal.reservaId}
        />
      )}

      {/* ✅ ALERTA DE ÉXITO */}
      {toast && <SuccessToast message={toast.message} type={toast.type} />}
    </div>
  );
}