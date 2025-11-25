# caja/utils.py
from decimal import Decimal
from rest_framework.exceptions import ValidationError
from .models import TurnoCaja, MovimientoCaja


def obtener_turno_activo():
    """
    Obtiene el turno de caja activo (abierto) más reciente
    """
    return TurnoCaja.objects.filter(estado='abierto').order_by('-fecha_apertura').first()


def validar_caja_abierta():
    """
    Valida que exista un turno de caja abierto
    Lanza ValidationError si no hay caja abierta
    """
    turno_activo = obtener_turno_activo()
    
    if not turno_activo:
        raise ValidationError({
            'error': 'Caja cerrada',
            'mensaje': 'No hay ninguna caja abierta en este momento.',
            'detalle': 'Para realizar operaciones de pago, primero debes abrir la caja.',
            'sugerencia': 'Ve a "Caja" → "Abrir Caja" para comenzar un nuevo turno.'
        })
    
    return turno_activo


def registrar_pago_en_caja(reserva, monto, metodo_pago, tipo_pago='saldo', usuario=None):
    """
    Registra un pago de reserva en la caja actual
    
    Args:
        reserva: Instancia de Reserva
        monto: Decimal - Monto del pago
        metodo_pago: str - Método de pago (efectivo, transferencia, mercadopago, seña)
        tipo_pago: str - Tipo de pago ('seña' o 'saldo')
        usuario: Usuario que registra (opcional)
    
    Returns:
        MovimientoCaja: El movimiento creado
    """
    # Validar que haya caja abierta
    turno_activo = validar_caja_abierta()
    
    # Convertir monto a Decimal si no lo es
    if not isinstance(monto, Decimal):
        monto = Decimal(str(monto))
    
    # Validar monto
    if monto <= 0:
        raise ValidationError({
            'error': 'Monto inválido',
            'mensaje': 'El monto debe ser mayor a 0'
        })
    
    # Construir descripción
    if tipo_pago == 'seña':
        descripcion = f"Seña de reserva #{reserva.id} - {reserva.nombre_cliente} {reserva.apellido_cliente}"
    else:
        descripcion = f"Pago de saldo - Reserva #{reserva.id} - {reserva.nombre_cliente} {reserva.apellido_cliente}"
    
    # Crear movimiento
    movimiento = MovimientoCaja.objects.create(
        turno=turno_activo,
        tipo='ingreso',
        monto=monto,
        descripcion=descripcion,
        metodo_pago=metodo_pago,
        categoria='servicios',
        reserva=reserva,
        usuario_registro=usuario,  # ✅ CORREGIDO
        comprobante=reserva.comprobante if hasattr(reserva, 'comprobante') else None
    )
    
    print(f"✅ Pago registrado en caja: ${monto} ({metodo_pago}) - Movimiento #{movimiento.id}")
    
    return movimiento