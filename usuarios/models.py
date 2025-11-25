# usuarios/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


# ============================================
#  MODELO UserProfile
# ============================================

class UserProfile(models.Model):
    """
    Perfil extendido del usuario con rol y datos adicionales
    """
    ROLE_CHOICES = [
        ('cliente', 'Cliente'),
        ('barbero', 'Barbero'),
        ('admin', 'Administrador'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name='Usuario'
    )
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='cliente',
        verbose_name='Rol'
    )
    
    telefono = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Teléfono'
    )
    
    direccion = models.TextField(
        blank=True,
        null=True,
        verbose_name='Dirección'
    )
    
    fecha_nacimiento = models.DateField(
        blank=True,
        null=True,
        verbose_name='Fecha de Nacimiento'
    )
    
    activo = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de Creación'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Última Actualización'
    )
    
    class Meta:
        verbose_name = 'Perfil de Usuario'
        verbose_name_plural = 'Perfiles de Usuarios'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"


# ============================================
#  MODELO LoginAttempt
# ============================================

class LoginAttempt(models.Model):
    """
    Modelo para rastrear intentos de login fallidos y bloqueos
    """
    email = models.EmailField(
        unique=True,
        verbose_name="Email del usuario"
    )
    
    failed_attempts = models.IntegerField(
        default=0,
        verbose_name="Intentos fallidos"
    )
    
    last_attempt = models.DateTimeField(
        auto_now=True,
        verbose_name="Último intento"
    )
    
    blocked_until = models.DateTimeField(
        null=True, 
        blank=True, 
        verbose_name="Bloqueado hasta"
    )
    
    class Meta:
        verbose_name = "Intento de Login"
        verbose_name_plural = "Intentos de Login"
        ordering = ['-last_attempt']
    
    def __str__(self):
        return f"{self.email} - {self.failed_attempts} intentos"
    
    def is_blocked(self):
        """Verifica si el usuario está actualmente bloqueado"""
        if not self.blocked_until:
            return False
        return timezone.now() < self.blocked_until
    
    def get_block_duration(self):
        """Calcula la duración del bloqueo según intentos fallidos"""
        if self.failed_attempts < 3:
            return None
        elif self.failed_attempts == 3:
            return timedelta(minutes=5)
        elif self.failed_attempts == 4:
            return timedelta(minutes=10)
        elif self.failed_attempts == 5:
            return timedelta(minutes=20)
        elif self.failed_attempts == 6:
            return timedelta(minutes=40)
        else:
            # Bloqueo exponencial: 2^(intentos-6) * 40 minutos
            return timedelta(minutes=40 * (2 ** (self.failed_attempts - 6)))
    
    def increment_failed_attempt(self):
        """Incrementa los intentos fallidos y aplica bloqueo si es necesario"""
        self.failed_attempts += 1
        
        # Aplicar bloqueo si se exceden 2 intentos
        if self.failed_attempts >= 3:
            duration = self.get_block_duration()
            if duration:
                self.blocked_until = timezone.now() + duration
        
        self.save()
    
    def reset_attempts(self):
        """Resetea los intentos cuando el login es exitoso"""
        self.failed_attempts = 0
        self.blocked_until = None
        self.save()
    
    def get_remaining_block_time(self):
        """Devuelve el tiempo restante de bloqueo en segundos"""
        if not self.is_blocked():
            return 0
        
        remaining = (self.blocked_until - timezone.now()).total_seconds()
        return max(0, int(remaining))
    
    def get_remaining_block_time_formatted(self):
        """Devuelve el tiempo restante formateado"""
        seconds = self.get_remaining_block_time()
        
        if seconds == 0:
            return "0 segundos"
        
        minutes = seconds // 60
        secs = seconds % 60
        
        if minutes > 0:
            return f"{int(minutes)} minuto{'s' if minutes != 1 else ''} y {int(secs)} segundo{'s' if secs != 1 else ''}"
        else:
            return f"{int(secs)} segundo{'s' if secs != 1 else ''}"