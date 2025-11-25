from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils import timezone

from .models import UserProfile, LoginAttempt


# ============================================
#  ADMIN DE UserProfile INLINE PARA USER
# ============================================

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name = 'Perfil'
    verbose_name_plural = 'Perfil'
    fields = ('role', 'telefono', 'direccion', 'fecha_nacimiento', 'activo')


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    
    list_display = (
        'username', 'email', 'first_name', 'last_name',
        'get_role', 'is_staff', 'is_active'
    )
    
    list_filter = (
        'is_staff', 'is_superuser', 'is_active',
        'profile__role'
    )
    
    search_fields = ('username', 'email', 'first_name', 'last_name')

    def get_role(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.get_role_display()
        return '-'
    
    get_role.short_description = 'Rol'
    get_role.admin_order_field = 'profile__role'


# Re-registrar el modelo User con el admin personalizado
admin.site.unregister(User)
admin.site.register(User, UserAdmin)


# ============================================
#  ADMIN DE UserProfile NORMAL
# ============================================

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'telefono', 'activo', 'created_at']
    list_filter = ['role', 'activo', 'created_at']
    search_fields = ['user__username', 'user__email', 'telefono']
    list_editable = ['role', 'activo']
    ordering = ['-created_at']
    readonly_fields = ('created_at', 'updated_at')


# ============================================
#  ADMIN DE LoginAttempt
# ============================================

@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    """
    Administración de intentos de login fallidos
    """
    list_display = [
        'email',
        'failed_attempts',
        'status_display',
        'last_attempt',
        'blocked_until',
        'actions_display'
    ]
    list_filter = ['last_attempt']
    search_fields = ['email']
    
    readonly_fields = [
        'email',
        'failed_attempts',
        'last_attempt',
        'blocked_until',
        'remaining_time_display'
    ]

    ordering = ['-last_attempt']
    
    fieldsets = (
        ('Información del Usuario', {
            'fields': ('email',)
        }),
        ('Estado del Bloqueo', {
            'fields': (
                'failed_attempts',
                'last_attempt',
                'blocked_until',
                'remaining_time_display'
            )
        }),
    )
    
    def status_display(self, obj):
        """Muestra el estado del bloqueo con colores"""
        if obj.is_blocked():
            return format_html('<span style="color: red; font-weight: bold;">🔒 BLOQUEADO</span>')
        elif obj.failed_attempts > 0:
            return format_html('<span style="color: orange;">⚠️ {} intentos</span>', obj.failed_attempts)
        else:
            return format_html('<span style="color: green;">✅ OK</span>')
    
    status_display.short_description = 'Estado'
    
    def remaining_time_display(self, obj):
        """Muestra el tiempo restante de bloqueo"""
        if obj.is_blocked():
            return obj.get_remaining_block_time_formatted()
        return "No bloqueado"
    
    remaining_time_display.short_description = 'Tiempo restante'
    
    def actions_display(self, obj):
        """Botón para resetear intentos en admin"""
        if obj.failed_attempts > 0:
            return format_html(
                '<a class="button" href="#" onclick="if(confirm(\'¿Resetear intentos?\')) {{ '
                'fetch(\'/admin/usuarios/loginattempt/{}/reset/\', {{method: \'POST\'}})'
                '.then(() => location.reload()); }} return false;">Resetear</a>',
                obj.pk
            )
        return "Sin acciones"
    
    actions_display.short_description = 'Acciones'
    
    def has_add_permission(self, request):
        """No permitir crear intentos manualmente"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Permitir eliminar intentos"""
        return True
