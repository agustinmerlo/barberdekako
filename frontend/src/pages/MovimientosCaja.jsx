import React, { useEffect, useState } from "react";
import "./MovimientosCaja.css";

const API_URL = "http://localhost:8000/api/caja";

const MovimientosCaja = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [movimientoEditar, setMovimientoEditar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [turnoActivo, setTurnoActivo] = useState(null);
  const [modalApertura, setModalApertura] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);
  const [modalHistorial, setModalHistorial] = useState(false);
  const [montoApertura, setMontoApertura] = useState("");

  // Estado para los MONTOS ESPERADOS / CALCULADOS y EGRESOS REALES (para el Modal de Cierre)
  const [montosEsperados, setMontosEsperados] = useState({
    efectivoEsperado: 0,
    transferenciaEsperada: 0,
    señaEsperada: 0,
    egresosEfectivo: 0,
    egresosTransferencia: 0,
    egresosSeña: 0,
  });

  // 🚩 CAMBIOS PARA CIERRE MANUAL/ASISTIDO: Estado para los MONTOS CONTADOS por el usuario
  const [montosContados, setMontosContados] = useState({
    monto_cierre_efectivo: 0,
    monto_cierre_transferencia: 0,
    monto_cierre_seña: 0,
  });

  const [observacionesCierre, setObservacionesCierre] = useState("");
  const [historialTurnos, setHistorialTurnos] = useState([]);

  // Métodos de pago disponibles para Egresos (solo efectivo y transferencia)
  const metodosPagoEgreso = [
    { value: "efectivo", label: "💵 Efectivo" },
    { value: "transferencia", label: "🏦 Transferencia" },
  ];

  // Todos los métodos de pago para Ingreso
  const metodosPagoIngreso = [
    ...metodosPagoEgreso,
    { value: "tarjeta", label: "💳 Tarjeta" },
    { value: "seña", label: "💰 Seña" },
  ];

  const categoriasMovimiento = [
    { value: "servicios", label: "✂️ Servicios" },
    { value: "productos", label: "🛍️ Productos" },
    { value: "gastos", label: "📊 Gastos" },
    { value: "sueldos", label: "👨‍💼 Sueldos" },
    { value: "alquiler", label: "🏢 Alquiler" },
    { value: "servicios_publicos", label: "💡 Servicios Públicos" },
    { value: "otros", label: "📌 Otros" },
  ];


  const [formData, setFormData] = useState({
    tipo: "ingreso",
    monto: "",
    descripcion: "",
    metodo_pago: "efectivo",
    categoria: "servicios",
    fecha: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    verificarTurnoActivo();
    cargarMovimientos();
  }, []);

  const verificarTurnoActivo = async () => {
    try {
      const res = await fetch(`${API_URL}/turnos/turno_activo/`);
      const data = await res.json();
      if (data.existe) {
        setTurnoActivo(data.turno);
      } else {
        setTurnoActivo(null);
      }
    } catch (err) {
      console.error("Error verificando turno:", err);
    }
  };

  const cargarMovimientos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/movimientos/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const todosMovimientos = Array.isArray(data) ? data : data?.results ?? [];

      const movimientosUnicos = Array.from(
        new Map(todosMovimientos.map(mov => [mov.id, mov])).values()
      );

      const movimientosOrdenados = movimientosUnicos.sort((a, b) => {
        const fechaA = new Date(a.fecha + 'T' + (a.hora || '00:00:00'));
        const fechaB = new Date(b.fecha + 'T' + (b.hora || '00:00:00'));
        return fechaB - fechaA;
      });

      setMovimientos(movimientosOrdenados);
    } catch (err) {
      console.error("Error cargando movimientos:", err);
    } finally {
      setLoading(false);
    }
  };

  const abrirCaja = async () => {
    if (!montoApertura || parseFloat(montoApertura) < 0) {
      alert("Ingresa un monto de apertura válido");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/turnos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto_apertura: parseFloat(montoApertura) })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setTurnoActivo(data);
      setModalApertura(false);
      setMontoApertura("");

      alert("✅ Caja abierta exitosamente");
      cargarMovimientos();
      verificarTurnoActivo();
    } catch (err) {
      console.error("Error abriendo caja:", err);
      alert("❌ Error al abrir la caja");
    }
  };

  const prepararCierreCaja = () => {
    if (!turnoActivo) return;

    // Filtra movimientos solo para el turno activo
    const movimientosTurno = movimientos.filter(m => m.turno === turnoActivo.id);

    // 1. Calcular Egresos por tipo (DATOS REALES)
    const egresosEfectivo = movimientosTurno
        .filter(m => m.tipo === "egreso" && m.metodo_pago === "efectivo")
        .reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);

    const egresosTransferencia = movimientosTurno
        .filter(m => m.tipo === "egreso" && m.metodo_pago === "transferencia")
        .reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);

    const egresosSeña = movimientosTurno
        .filter(m => m.tipo === "egreso" && m.metodo_pago === "seña")
        .reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);

    setObservacionesCierre("");

    // 2. Establecer Montos Esperados + Egresos Detallados
    setMontosEsperados({
      efectivoEsperado: parseFloat(turnoActivo.efectivo_esperado || 0),
      transferenciaEsperada: parseFloat(turnoActivo.transferencia_esperada || 0),
      señaEsperada: parseFloat(turnoActivo.seña_esperada || 0),
      egresosEfectivo: egresosEfectivo,
      egresosTransferencia: egresosTransferencia,
      egresosSeña: egresosSeña,
    });

    // 🚩 CAMBIOS PARA CIERRE MANUAL/ASISTIDO: Inicializar los montos contados con los montos esperados
    // para facilitar al usuario (solo debe corregir si hay diferencia).
    setMontosContados({
      monto_cierre_efectivo: parseFloat(turnoActivo.efectivo_esperado || 0),
      monto_cierre_transferencia: parseFloat(turnoActivo.transferencia_esperada || 0),
      monto_cierre_seña: parseFloat(turnoActivo.seña_esperada || 0),
    });

    setModalCierre(true);
  };

  // Función auxiliar para formatear la moneda
  const formatCurrency = (amount) => {
    const value = parseFloat(amount);
    if (isNaN(value)) return '0,00';
    return value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // 🚩 CAMBIOS PARA CIERRE MANUAL/ASISTIDO: Manejador de cambio para los inputs del modal de cierre
  const handleMontoContadoChange = (e) => {
    const { name, value } = e.target;
    // Convierte a número y asegura que sea 0 si está vacío para evitar errores de NaN
    const numValue = value === "" ? 0 : parseFloat(value);
    setMontosContados(prev => ({
      ...prev,
      [name]: numValue,
    }));
  };


  const cerrarCaja = async () => {
    if (!turnoActivo) {
      alert("❌ No hay turno activo para cerrar");
      return;
    }

    // 🚩 CAMBIOS PARA CIERRE MANUAL/ASISTIDO: Validar los montos contados
    if (isNaN(montosContados.monto_cierre_efectivo) || montosContados.monto_cierre_efectivo < 0 ||
        isNaN(montosContados.monto_cierre_transferencia) || montosContados.monto_cierre_transferencia < 0 ||
        isNaN(montosContados.monto_cierre_seña) || montosContados.monto_cierre_seña < 0) {
        
        alert("❌ Por favor, ingrese montos de cierre válidos (numéricos y no negativos) para Efectivo, Transferencia y Seña.");
        return;
    }


    try {
      // Primero actualizar el turno activo para tener los datos más recientes
      const resActualizar = await fetch(`${API_URL}/turnos/turno_activo/`);
      const dataActualizada = await resActualizar.json();

      if (!dataActualizada.existe) {
        alert("❌ No se encontró el turno activo");
        return;
      }

      const turnoActualizado = dataActualizada.turno;

      // 🚩 CAMBIOS PARA CIERRE MANUAL/ASISTIDO: Enviamos los montos CONTADOS por el usuario
      const body = {
        monto_cierre_efectivo: montosContados.monto_cierre_efectivo,
        monto_cierre_transferencia: montosContados.monto_cierre_transferencia,
        monto_cierre_mercadopago: 0, // Mantener en 0 si no se usa MercadoPago
        monto_cierre_seña: montosContados.monto_cierre_seña,
        observaciones: observacionesCierre
      };

      const res = await fetch(`${API_URL}/turnos/${turnoActivo.id}/cerrar/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorText = await res.text();
        // Intentar parsear el JSON de error si es posible
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || `HTTP ${res.status}: ${errorText}`);
        } catch {
            throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
      }

      const data = await res.json();
      const turnoCerrado = data.turno;

      setTurnoActivo(null);
      setModalCierre(false);
      setObservacionesCierre("");

      const mensaje = `✅ Caja cerrada exitosamente

💵 EFECTIVO
Esperado: $${formatCurrency(turnoCerrado.efectivo_esperado)}
Contado: $${formatCurrency(turnoCerrado.monto_cierre_efectivo)}
Diferencia: $${formatCurrency(Math.abs(turnoCerrado.diferencia_efectivo))} ${turnoCerrado.diferencia_efectivo <= 0 ? '✅' : '⚠️'}
Egresos: $${formatCurrency(turnoCerrado.total_egresos_efectivo || 0)}

🏦 TRANSFERENCIA
Esperado: $${formatCurrency(turnoCerrado.transferencia_esperada)}
Contado: $${formatCurrency(turnoCerrado.monto_cierre_transferencia)}
Diferencia: $${formatCurrency(Math.abs(turnoCerrado.diferencia_transferencia))} ${turnoCerrado.diferencia_transferencia <= 0 ? '✅' : '⚠️'}
Egresos: $${formatCurrency(turnoCerrado.total_egresos_transferencia || 0)}

💰 SEÑAS
Esperado: $${formatCurrency(turnoCerrado.seña_esperada)}
Contado: $${formatCurrency(turnoCerrado.monto_cierre_seña)}
Diferencia: $${formatCurrency(Math.abs(turnoCerrado.diferencia_seña))} ${turnoCerrado.diferencia_seña <= 0 ? '✅' : '⚠️'}
Egresos: $${formatCurrency(turnoCerrado.total_egresos_seña || 0)}

🎯 DIFERENCIA TOTAL: $${formatCurrency(Math.abs(turnoCerrado.diferencia_total))} ${turnoCerrado.diferencia_total <= 0 ? '(Sobrante)' : '(Faltante)'}`;

      alert(mensaje);
      await cargarMovimientos();
      await verificarTurnoActivo();
    } catch (err) {
      console.error("Error cerrando caja:", err);
      alert("❌ Error al cerrar la caja: " + err.message);
    }
  };

  const cargarHistorial = async () => {
    try {
      const res = await fetch(`${API_URL}/turnos/historial/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setHistorialTurnos(data.turnos || []);
      setModalHistorial(true);
    } catch (err) {
      console.error("Error cargando historial:", err);
      alert("❌ Error al cargar el historial");
    }
  };

  const abrirModalNuevo = () => {
    if (!turnoActivo) {
      alert("❌ Debes abrir la caja antes de registrar movimientos");
      return;
    }
    setModoEdicion(false);
    setMovimientoEditar(null);
    setFormData({
      tipo: "ingreso",
      monto: "",
      descripcion: "",
      metodo_pago: "efectivo",
      categoria: "servicios",
      fecha: new Date().toISOString().split('T')[0]
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (movimiento) => {
    if (!movimiento.es_editable) {
      alert("⚠️ Este movimiento no puede ser editado porque pertenece a un turno cerrado");
      return;
    }

    setModoEdicion(true);
    setMovimientoEditar(movimiento);
    setFormData({
      tipo: movimiento.tipo,
      monto: movimiento.monto.toString(),
      descripcion: movimiento.descripcion || "",
      metodo_pago: movimiento.metodo_pago || "efectivo",
      categoria: movimiento.categoria || "servicios",
      fecha: movimiento.fecha
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setMovimientoEditar(null);
    setFormData({
      tipo: "ingreso",
      monto: "",
      descripcion: "",
      metodo_pago: "efectivo",
      categoria: "servicios",
      fecha: new Date().toISOString().split('T')[0]
    });
  };

  const guardarMovimiento = async () => {
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      alert("❌ Ingresa un monto válido");
      return;
    }

    if (!formData.descripcion.trim()) {
      alert("❌ Ingresa una descripción");
      return;
    }

    setGuardando(true);
    try {
      const body = { ...formData, monto: parseFloat(formData.monto) };
      const url = modoEdicion ? `${API_URL}/movimientos/${movimientoEditar.id}/` : `${API_URL}/movimientos/`;
      const method = modoEdicion ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      alert(`✅ Movimiento ${modoEdicion ? "actualizado" : "registrado"} exitosamente`);
      cerrarModal();

      await new Promise(resolve => setTimeout(resolve, 300));
      await cargarMovimientos();
      await verificarTurnoActivo();
    } catch (err) {
      console.error("Error guardando movimiento:", err);
      alert(err.message || "❌ Error al guardar el movimiento");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarMovimiento = async (id, esEditable) => {
    if (!esEditable) {
      alert("⚠️ Este movimiento no puede ser eliminado porque pertenece a un turno cerrado");
      return;
    }

    if (!window.confirm("⚠️ ¿Estás seguro de eliminar este movimiento?")) return;

    try {
      const res = await fetch(`${API_URL}/movimientos/${id}/`, { method: "DELETE" });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      alert("✅ Movimiento eliminado exitosamente");
      cargarMovimientos();
      verificarTurnoActivo();
    } catch (err) {
      console.error("Error eliminando movimiento:", err);
      alert(err.message || "❌ Error al eliminar el movimiento");
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    const [year, month, day] = fecha.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return fecha;
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatearHora = (hora) => {
    if (!hora) return "";
    const [h, m] = hora.substring(0, 5).split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const formatearFechaHora = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // 🚩 Importante: Estos totales SÍ deben ser calculados sobre TODOS los movimientos,
  // ya que son los totales históricos o del día completo, no solo del turno activo.
  const totalIngresos = movimientos
    .filter(m => m.tipo === "ingreso")
    .reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);

  const totalEgresos = movimientos
    .filter(m => m.tipo === "egreso")
    .reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);

  const saldoCaja = totalIngresos - totalEgresos;

  return (
    <div className="container">
      <div className="header">
        <h2>💰 Movimientos de Caja</h2>
        <div className="button-group">
          {!turnoActivo ? (
            <button className="btn btn-success" onClick={() => setModalApertura(true)}>
              🔓 Abrir Caja
            </button>
          ) : (
            <>
              <button className="btn btn-danger" onClick={prepararCierreCaja}>
                🔒 Cerrar Caja
              </button>
              <button className="btn btn-warning" onClick={abrirModalNuevo}>
                ➕ Nuevo Movimiento
              </button>
            </>
          )}
          <button className="btn btn-info" onClick={cargarHistorial}>
            📋 Historial
          </button>
        </div>
      </div>

      {turnoActivo ? (
        <div className="status-card status-open">
          <div className="status-badge status-badge-open">🟢 Caja Abierta</div>

          <div className="stats-grid">
            <div className="stat-card stat-efectivo">
              <div className="stat-label">💵 Efectivo </div>
              <div className="stat-value">
                ${formatCurrency(turnoActivo.efectivo_esperado)}
              </div>
            </div>

            <div className="stat-card stat-transferencia">
              <div className="stat-label">🏦 Transferencias </div>
              <div className="stat-value">
                ${formatCurrency(turnoActivo.transferencia_esperada)}
              </div>
            </div>

            <div className="stat-card stat-seña">
              <div className="stat-label">💰 Señas </div>
              <div className="stat-value">
                ${formatCurrency(turnoActivo.seña_esperada)}
              </div>
            </div>

             <div className="stat-card stat-egresos-detail">
              <div className="stat-label">📉 Total Egresos (Acumulado)</div>
              <div className="stat-value" style={{ color: '#f44336' }}>
                {/* CAMBIO: Usamos los totales calculados por el backend en turnoActivo.
                  Asumimos que el backend está enviando los totales correctos para el turno activo.
                  Si no tienes un total consolidado en el backend, puedes usar 'totalEgresos', 
                  pero lo más preciso es el valor del objeto TurnoCaja.
                */}
                -${formatCurrency(turnoActivo.total_egresos || 0)}
              </div>
            </div>
          </div>

          <div className="status-footer">
            Abierta el: {formatearFechaHora(turnoActivo.fecha_apertura)} | Monto inicial: ${formatCurrency(turnoActivo.monto_apertura)}
          </div>
        </div>
      ) : (
        <div className="status-card status-closed">
          <div className="status-badge status-badge-closed">🔴 Caja Cerrada</div>
          <div className="status-footer">Debes abrir la caja para comenzar a operar</div>
        </div>
      )}

      <div className="totales-grid">
        <div className="total-card total-ingresos">
          <div className="total-icon">📈</div>
          <div className="total-label">Total Ingresos</div>
          <div className="total-amount">
            ${formatCurrency(totalIngresos)}
          </div>
        </div>
        <div className="total-card total-egresos">
          <div className="total-icon">📉</div>
          <div className="total-label">Total Egresos</div>
          <div className="total-amount">
            ${formatCurrency(totalEgresos)}
          </div>
        </div>
        <div className="total-card total-saldo">
          <div className="total-icon">💰</div>
          <div className="total-label">Saldo en Caja</div>
          <div className="total-amount" style={{ color: saldoCaja >= 0 ? '#4caf50' : '#f44336' }}>
            ${formatCurrency(saldoCaja)}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando movimientos...</div>
      ) : (
        <div className="movimientos-list">
          {movimientos.length === 0 ? (
            <div className="empty-state">No hay movimientos registrados</div>
          ) : (
            movimientos.map(mov => (
              <div key={mov.id} className={`movimiento-card movimiento-${mov.tipo}`}>
                <div className="movimiento-header">
                  <span className="movimiento-tipo">{mov.tipo === "ingreso" ? "📈" : "📉"} {mov.tipo.toUpperCase()}</span>
                  <span className="movimiento-monto" style={{ color: mov.tipo === "ingreso" ? "#4caf50" : "#f44336" }}>
                    ${formatCurrency(mov.monto)}
                  </span>
                </div>
                <div className="movimiento-descripcion">{mov.descripcion}</div>
                <div className="movimiento-detalles">
                  <span>{mov.metodo_pago || "efectivo"} • {mov.categoria || "otros"}</span>
                  <span>{formatearFecha(mov.fecha)} {formatearHora(mov.hora)}</span>
                </div>
                {mov.es_editable && (
                  <div className="movimiento-actions">
                    <button className="btn-icon btn-edit" onClick={() => abrirModalEditar(mov)}>✏️</button>
                    <button className="btn-icon btn-delete" onClick={() => eliminarMovimiento(mov.id, mov.es_editable)}>🗑️</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Apertura (SIN CAMBIOS) */}
      {modalApertura && (
        <div className="modal-overlay" onClick={() => setModalApertura(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>🔓 Abrir Caja</h3>
            <label>Monto de apertura:</label>
            <input
              type="number"
              value={montoApertura}
              onChange={e => setMontoApertura(e.target.value)}
              placeholder="0.00"
              className="input-field"
            />
            <div className="modal-buttons">
              <button className="btn btn-success" onClick={abrirCaja}>Abrir</button>
              <button className="btn btn-secondary" onClick={() => setModalApertura(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* 🚩 MODAL CIERRE (ACTUALIZADO PARA MONTO CONTADO MANUAL) */}
      {modalCierre && (
        <div className="modal-overlay modal-cierre-overlay" onClick={() => setModalCierre(false)}>
          <div className="modal-content modal-cierre-content" onClick={e => e.stopPropagation()}>
            <h3><span className="lock-icon">🔒</span> Cerrar Caja</h3>

            {/* Sección de Montos Esperados (Calculados) */}
            <div className="cierre-section expected-amounts">
              <h4>Montos Esperados (Calculados por el sistema):</h4>

              {/* EFECTIVO ESPERADO (Solo Display) */}
              <div className="input-group-display">
                <label className="label-expected">💵 Efectivo Esperado:</label>
                <input
                  type="text"
                  value={`$${formatCurrency(montosEsperados.efectivoEsperado)}`}
                  readOnly
                  className="input-field input-expected"
                />
              </div>

              {/* TRANSFERENCIAS ESPERADAS (Solo Display) */}
              <div className="input-group-display">
                <label className="label-expected">🏦 Transferencias Esperadas:</label>
                <input
                  type="text"
                  value={`$${formatCurrency(montosEsperados.transferenciaEsperada)}`}
                  readOnly
                  className="input-field input-expected"
                />
              </div>

              {/* SEÑAS ESPERADAS (Solo Display) */}
              <div className="input-group-display">
                <label className="label-expected">💰 Señas Esperadas:</label>
                <input
                  type="text"
                  value={`$${formatCurrency(montosEsperados.señaEsperada)}`}
                  readOnly
                  className="input-field input-expected"
                />
              </div>
            </div>

            <hr className="cierre-separator" />
            
            {/* 🚩 NUEVA SECCIÓN DE MONTO CONTADO (INPUTS EDITABLES) */}
            <div className="cierre-section counted-amounts">
              <h4>Montos Contados (Ingreso Manual):</h4>

              {/* EFECTIVO CONTADO (Input Editable) */}
              <div className="input-group-display">
                <label className="label-counted">💵 Efectivo Contado:</label>
                <input
                  type="number"
                  name="monto_cierre_efectivo"
                  value={montosContados.monto_cierre_efectivo}
                  onChange={handleMontoContadoChange}
                  className="input-field input-counted"
                  placeholder="0.00"
                />
              </div>

              {/* TRANSFERENCIAS CONTADAS (Input Editable) */}
              <div className="input-group-display">
                <label className="label-counted">🏦 Transferencias Contadas:</label>
                <input
                  type="number"
                  name="monto_cierre_transferencia"
                  value={montosContados.monto_cierre_transferencia}
                  onChange={handleMontoContadoChange}
                  className="input-field input-counted"
                  placeholder="0.00"
                />
              </div>

              {/* SEÑAS CONTADAS (Input Editable) */}
              <div className="input-group-display">
                <label className="label-counted">💰 Señas Contadas:</label>
                <input
                  type="number"
                  name="monto_cierre_seña"
                  value={montosContados.monto_cierre_seña}
                  onChange={handleMontoContadoChange}
                  className="input-field input-counted"
                  placeholder="0.00"
                />
              </div>
            </div>

            <hr className="cierre-separator" />

            {/* Sección de Egresos Detallados (Datos Reales del Turno) (SIN CAMBIOS) */}
            <div className="cierre-section egresos-detail">
              <h4>📉 Egresos del Turno:</h4>

              <div className="input-group-display">
                <label className="label-expected">💵 Egreso EFECTIVO:</label>
                <input
                  type="text"
                  value={`-$${formatCurrency(montosEsperados.egresosEfectivo)}`}
                  readOnly
                  className="input-field input-expected"
                  style={{ color: '#f44336' }}
                />
              </div>

              <div className="input-group-display">
                <label className="label-expected">🏦 Egreso TRANSFERENCIA:</label>
                <input
                  type="text"
                  value={`-$${formatCurrency(montosEsperados.egresosTransferencia)}`}
                  readOnly
                  className="input-field input-expected"
                  style={{ color: '#f44336' }}
                />
              </div>

              {montosEsperados.egresosSeña > 0 && (
                <div className="input-group-display">
                  <label className="label-expected">💰 Egreso SEÑA:</label>
                  <input
                    type="text"
                    value={`-$${formatCurrency(montosEsperados.egresosSeña)}`}
                    readOnly
                    className="input-field input-expected"
                    style={{ color: '#f44336' }}
                  />
                </div>
              )}

            </div>

            <hr className="cierre-separator" />

            {/* Observaciones (único campo editable) (SIN CAMBIOS) */}
            <div className="cierre-section observations">
              <label>📝 Observaciones (opcional):</label>
              <textarea
                value={observacionesCierre}
                onChange={e => setObservacionesCierre(e.target.value)}
                placeholder="Notas sobre el cierre de caja o cualquier anomalía..."
                className="textarea-field"
              />
            </div>

            <div className="modal-buttons">
              <button className="btn btn-secondary" onClick={() => setModalCierre(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={cerrarCaja}>Cerrar Caja</button>
            </div>
          </div>
        </div>
      )}


      {/* Modal Movimiento (SIN CAMBIOS) */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{modoEdicion ? "✏️ Editar" : "➕ Nuevo"} Movimiento</h3>

            <label>Tipo:</label>
            <select
              value={formData.tipo}
              onChange={e => {
                setFormData({
                  ...formData,
                  tipo: e.target.value,
                  // Limita a efectivo si cambia a egreso
                  metodo_pago: e.target.value === 'egreso' ? 'efectivo' : formData.metodo_pago
                })
              }}
              className="input-field"
            >
              <option value="ingreso">📈 Ingreso</option>
              <option value="egreso">📉 Egreso</option>
            </select>

            <label>Monto:</label>
            <input
              type="number"
              value={formData.monto}
              onChange={e => setFormData({ ...formData, monto: e.target.value })}
              placeholder="0.00"
              className="input-field"
            />

            <label>Descripción:</label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Descripción del movimiento"
              className="input-field"
            />

            <label>Método de pago:</label>
            <select
              value={formData.metodo_pago}
              onChange={e => setFormData({ ...formData, metodo_pago: e.target.value })}
              className="input-field"
            >
              {/* Lógica para limitar métodos de pago: Solo Efectivo y Transferencia si es Egreso */}
              {formData.tipo === 'egreso'
                ? metodosPagoEgreso.map(metodo => (
                  <option key={metodo.value} value={metodo.value}>{metodo.label}</option>
                ))
                : metodosPagoIngreso.map(metodo => (
                  <option key={metodo.value} value={metodo.value}>{metodo.label}</option>
                ))
              }
            </select>

            <label>Categoría:</label>
            <select
              value={formData.categoria}
              onChange={e => setFormData({ ...formData, categoria: e.target.value })}
              className="input-field"
            >
              {categoriasMovimiento.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <label>Fecha:</label>
            <input
              type="date"
              value={formData.fecha}
              onChange={e => setFormData({ ...formData, fecha: e.target.value })}
              className="input-field"
            />

            <div className="modal-buttons">
              <button
                className="btn btn-success"
                onClick={guardarMovimiento}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : (modoEdicion ? "Actualizar" : "Guardar")}
              </button>
              <button className="btn btn-secondary" onClick={cerrarModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial (SIN CAMBIOS) */}
      {modalHistorial && (
        <div className="modal-overlay" onClick={() => setModalHistorial(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <h3>📋 Historial de Turnos</h3>
            {historialTurnos.length === 0 ? (
              <div className="empty-state">No hay turnos cerrados</div>
            ) : (
              <div className="historial-list">
                {historialTurnos.map(turno => (
                  <div key={turno.id} className="historial-item">
                    <div className="historial-header">
                      <strong>Turno #{turno.id}</strong>
                      <span>{formatearFechaHora(turno.fecha_apertura)}</span>
                    </div>
                    <div className="historial-body">
                      <p>Apertura: ${formatCurrency(turno.monto_apertura)}</p>
                      <p>Cierre: {turno.fecha_cierre ? formatearFechaHora(turno.fecha_cierre) : "En curso"}</p>
                      {turno.diferencia_total !== undefined && (
                        <p style={{ color: turno.diferencia_total >= 0 ? '#4caf50' : '#f44336' }}>
                          Diferencia: ${formatCurrency(Math.abs(turno.diferencia_total))}
                          {turno.diferencia_total >= 0 ? ' (Sobrante)' : ' (Faltante)'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-buttons">
              <button className="btn btn-secondary" onClick={() => setModalHistorial(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovimientosCaja;