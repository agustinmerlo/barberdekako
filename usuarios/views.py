# usuarios/views.py
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action, api_view, permission_classes

from .models import UserProfile, LoginAttempt  # ✅ Importar LoginAttempt
from .serializers import (
    UserRegisterSerializer,
    UserSerializer,
    UserListSerializer,
    UserRoleUpdateSerializer
)


# -------------------------------------------------------------------
# 1️⃣ REGISTRO
# -------------------------------------------------------------------
class RegisterView(APIView):
    """
    Registro de nuevos usuarios.
    """
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response(
                {
                    "message": "Registro exitoso",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email
                    },
                    "token": token.key
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -------------------------------------------------------------------
# 2️⃣ LOGIN POR EMAIL CON SISTEMA DE BLOQUEO POR INTENTOS FALLIDOS
# -------------------------------------------------------------------
class EmailLoginView(APIView):
    """
    Login usando email + password con sistema de bloqueo progresivo:
    - 3 intentos fallidos: bloqueo de 5 minutos
    - 4 intentos fallidos: bloqueo de 10 minutos
    - 5 intentos fallidos: bloqueo de 20 minutos
    - Y así sucesivamente con crecimiento exponencial
    
    Devuelve rol EFECTIVO:
    - superuser/staff => 'admin'
    - si no, role de profile (o 'cliente' si no existe)
    """
    def post(self, request):
        email = request.data.get("email", "").lower().strip()
        password = request.data.get("password", "")

        if not email or not password:
            return Response(
                {"error": "Email y contraseña son requeridos"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1️⃣ VERIFICAR SI EL EMAIL ESTÁ BLOQUEADO
        login_attempt, created = LoginAttempt.objects.get_or_create(email=email)
        
        if login_attempt.is_blocked():
            remaining_time = login_attempt.get_remaining_block_time()
            remaining_formatted = login_attempt.get_remaining_block_time_formatted()
            
            return Response({
                'error': 'Cuenta temporalmente bloqueada',
                'message': f'Has excedido el número de intentos permitidos. Intenta nuevamente en {remaining_formatted}.',
                'blocked': True,
                'blocked_until': login_attempt.blocked_until.isoformat(),
                'remaining_seconds': remaining_time,
                'failed_attempts': login_attempt.failed_attempts
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # 2️⃣ BUSCAR USUARIO POR EMAIL
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # No revelar si el usuario existe o no (seguridad)
            login_attempt.increment_failed_attempt()
            
            attempts_left = max(0, 3 - login_attempt.failed_attempts)
            
            response_data = {
                'error': 'Credenciales inválidas',
                'failed_attempts': login_attempt.failed_attempts,
                'remaining_attempts': attempts_left
            }
            
            # Si se bloqueó en este intento
            if login_attempt.is_blocked():
                remaining_formatted = login_attempt.get_remaining_block_time_formatted()
                response_data.update({
                    'blocked': True,
                    'message': f'Has excedido el número de intentos permitidos. Cuenta bloqueada por {remaining_formatted}.',
                    'blocked_until': login_attempt.blocked_until.isoformat(),
                    'remaining_seconds': login_attempt.get_remaining_block_time()
                })
                return Response(response_data, status=status.HTTP_429_TOO_MANY_REQUESTS)
            else:
                if attempts_left > 0:
                    response_data['message'] = f'Credenciales incorrectas. Te quedan {attempts_left} intento(s).'
            
            return Response(response_data, status=status.HTTP_401_UNAUTHORIZED)

        # 3️⃣ AUTENTICAR
        user_auth = authenticate(username=user.username, password=password)
        
        if not user_auth:
            # ❌ CONTRASEÑA INCORRECTA
            login_attempt.increment_failed_attempt()
            
            attempts_left = max(0, 3 - login_attempt.failed_attempts)
            
            response_data = {
                'error': 'Credenciales inválidas',
                'failed_attempts': login_attempt.failed_attempts,
                'remaining_attempts': attempts_left
            }
            
            # Si se bloqueó en este intento, informar
            if login_attempt.is_blocked():
                remaining_formatted = login_attempt.get_remaining_block_time_formatted()
                response_data.update({
                    'blocked': True,
                    'message': f'Has excedido el número de intentos permitidos. Cuenta bloqueada por {remaining_formatted}.',
                    'blocked_until': login_attempt.blocked_until.isoformat(),
                    'remaining_seconds': login_attempt.get_remaining_block_time()
                })
                return Response(response_data, status=status.HTTP_429_TOO_MANY_REQUESTS)
            else:
                if attempts_left > 0:
                    response_data['message'] = f'Credenciales incorrectas. Te quedan {attempts_left} intento(s).'
                
                return Response(response_data, status=status.HTTP_401_UNAUTHORIZED)

        # 4️⃣ LOGIN EXITOSO ✅
        # Resetear intentos fallidos
        login_attempt.reset_attempts()
        
        # Obtener o crear token
        token, _ = Token.objects.get_or_create(user=user_auth)
        
        # Determinar rol EFECTIVO
        role = 'admin' if (user_auth.is_superuser or user_auth.is_staff) else (
            getattr(getattr(user_auth, 'profile', None), 'role', 'cliente')
        )

        return Response({
            "token": token.key,
            "username": user_auth.username,
            "email": user_auth.email,
            "role": role,                # ← EFECTIVO
            "is_staff": user_auth.is_staff,
            "user_id": user_auth.id,
            "message": "Login exitoso"
        }, status=status.HTTP_200_OK)


# -------------------------------------------------------------------
# 3️⃣ PERFIL (rol EFECTIVO)
# -------------------------------------------------------------------
class UserDetailView(APIView):
    """
    Devuelve la información del usuario autenticado + rol EFECTIVO.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = 'admin' if (user.is_superuser or user.is_staff) else (
            getattr(getattr(user, 'profile', None), 'role', 'cliente')
        )

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": role,                # ← EFECTIVO
            "is_staff": user.is_staff
        }, status=status.HTTP_200_OK)


# -------------------------------------------------------------------
# 4️⃣ VIEWSET EMPLEADOS (ADMIN) - ✅ FILTRADO CORREGIDO
# -------------------------------------------------------------------
class EmpleadoViewSet(viewsets.ModelViewSet):
    """
    Gestión de usuarios y roles (solo Admin).
    ✅ Ahora filtra solo admin y barberos.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        """
        Devuelve solo usuarios con rol 'admin' o 'barbero':
        - Superusers/staff (son admin efectivo)
        - Usuarios con profile.role = 'admin' o 'barbero'
        """
        return User.objects.filter(
            Q(is_superuser=True) |  # Superusers son admin
            Q(is_staff=True) |      # Staff son admin
            Q(profile__role='admin') |  # Profile admin
            Q(profile__role='barbero')  # Profile barbero
        ).select_related('profile').distinct().order_by('-date_joined')

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        return UserSerializer

    @action(detail=True, methods=['patch'], url_path='cambiar-rol')
    def cambiar_rol(self, request, pk=None):
        """
        PATCH /api/usuarios/empleados/{id}/cambiar-rol/
        Body: { "role": "admin" | "barbero" | "cliente" }
        - Superusers/staff NUNCA se degradan (se fuerza a 'admin').
        - Para usuarios normales, se persiste en user.profile.role
        """
        user = self.get_object()

        # 1) Blindaje: superuser/staff siempre admin
        if user.is_superuser or user.is_staff:
            if hasattr(user, 'profile') and user.profile.role != 'admin':
                user.profile.role = 'admin'
                user.profile.save(update_fields=['role'])
            return Response({
                'message': 'Usuario superuser/staff: rol forzado a admin.',
                'user': UserListSerializer(user).data
            }, status=status.HTTP_200_OK)

        # 2) Usuarios normales
        new_role = (request.data.get('role') or '').lower().strip()
        if new_role not in ('admin', 'barbero', 'cliente'):
            return Response({'detail': 'Rol inválido'}, status=status.HTTP_400_BAD_REQUEST)

        # Asegura profile
        if not hasattr(user, 'profile'):
            UserProfile.objects.get_or_create(user=user, defaults={'role': 'cliente'})

        if user.profile.role != new_role:
            user.profile.role = new_role
            user.profile.save(update_fields=['role'])

        return Response({
            'message': f'Rol actualizado a {new_role}',
            'user': UserListSerializer(user).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='toggle-activo')
    def toggle_activo(self, request, pk=None):
        """
        Activa/desactiva un usuario
        PATCH /api/usuarios/empleados/{id}/toggle-activo/
        """
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()

        if hasattr(user, 'profile'):
            user.profile.activo = user.is_active
            user.profile.save()

        return Response({
            'message': f'Usuario {"activado" if user.is_active else "desactivado"}',
            'user': UserListSerializer(user).data
        }, status=status.HTTP_200_OK)


# -------------------------------------------------------------------
# 5️⃣ /api/usuarios/auth/me  (FUENTE DE VERDAD para rol)
# -------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user
    role = 'admin' if (u.is_superuser or u.is_staff) else (
        getattr(getattr(u, 'profile', None), 'role', 'cliente')
    )
    return Response({
        "user_id": u.id,
        "username": u.username,
        "email": u.email,
        "role": role,
        "is_superuser": u.is_superuser,
        "is_staff": u.is_staff,
    }, status=status.HTTP_200_OK)

# -------------------------------------------------------------------
# 6️⃣ SOLICITAR RECUPERACIÓN DE CONTRASEÑA (VERSIÓN MEJORADA)
# -------------------------------------------------------------------
@api_view(['POST'])
def password_reset_request(request):
    """
    POST /api/usuarios/password-reset/
    Body: { "email": "usuario@example.com" }
    
    ✅ Verifica si el email existe antes de enviar el correo.
    ❌ Si no existe, retorna error 404.
    """
    email = request.data.get('email', '').strip().lower()
    
    if not email:
        return Response(
            {"error": "El correo electrónico es requerido"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # ✅ VERIFICAR SI EL USUARIO EXISTE
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"error": "No existe una cuenta asociada a este correo electrónico"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Generar token único
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Crear enlace de reseteo (combinamos uid y token en uno solo)
    reset_token = f"{uid}-{token}"
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    
    # Enviar correo
    try:
        send_mail(
            subject='Recuperación de contraseña - Barber Studio',
            message=f"""
Hola {user.username},

Recibimos una solicitud para restablecer tu contraseña.

Haz clic en el siguiente enlace para crear una nueva contraseña:
{reset_link}

Este enlace expirará en 24 horas.

Si no solicitaste este cambio, ignora este correo.

Saludos,
Equipo de Barber Studio
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        
        return Response(
            {"message": "Correo de recuperación enviado exitosamente"},
            status=status.HTTP_200_OK
        )
    except Exception as e:
        print(f"❌ Error al enviar correo: {str(e)}")
        return Response(
            {"error": "Error al enviar el correo. Inténtalo más tarde."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
# -------------------------------------------------------------------
# 7️⃣ CONFIRMAR NUEVA CONTRASEÑA
# -------------------------------------------------------------------
@api_view(['POST'])
def password_reset_confirm(request):
    """
    POST /api/usuarios/password-reset-confirm/
    Body: { 
        "token": "uid-token",
        "password": "nuevaContraseña123"
    }
    
    Valida el token y actualiza la contraseña.
    """
    token_combined = request.data.get('token', '').strip()
    new_password = request.data.get('password', '').strip()
    
    if not token_combined or not new_password:
        return Response(
            {"error": "Token y contraseña son requeridos"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validar longitud de contraseña
    if len(new_password) < 8:
        return Response(
            {"error": "La contraseña debe tener al menos 8 caracteres"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Separar uid y token
    try:
        uid, token = token_combined.split('-', 1)
    except ValueError:
        return Response(
            {"error": "Token inválido"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Decodificar uid
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response(
            {"error": "Token inválido o expirado"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verificar token
    if not default_token_generator.check_token(user, token):
        return Response(
            {"error": "Token inválido o expirado"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Actualizar contraseña
    user.set_password(new_password)
    user.save()
    
    # Opcional: enviar correo de confirmación
    try:
        send_mail(
            subject='Contraseña actualizada - Barber Studio',
            message=f"""
Hola {user.username},

Tu contraseña ha sido actualizada exitosamente.

Si no realizaste este cambio, contacta con soporte inmediatamente.

Saludos,
Equipo de Barber Studio
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except:
        pass  # No fallar si el correo de confirmación falla
    
    return Response(
        {"message": "Contraseña restablecida exitosamente"},
        status=status.HTTP_200_OK
    )