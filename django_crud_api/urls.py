from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework.routers import DefaultRouter

# ViewSets
from barbers.views import BarberViewSet
from servicios.views import ServicioViewSet
from proveedores.views import ProveedorViewSet

# Router único para todos los ViewSets
router = DefaultRouter()
router.register(r'barbers', BarberViewSet, basename='barbers')
router.register(r'servicios', ServicioViewSet, basename='servicios')
router.register(r'proveedores', ProveedorViewSet, basename='proveedores')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/usuarios/', include('usuarios.urls')),
    path('api/caja/', include('caja.urls')),
    path('api/', include('reservas.urls')),  # ✅ Incluye TODAS las rutas de reservas
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)