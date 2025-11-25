# usuarios/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    EmailLoginView,
    UserDetailView,
    EmpleadoViewSet,
    me,
    password_reset_request,      # ✅ Nueva
    password_reset_confirm,       # ✅ Nueva
)

router = DefaultRouter()
router.register(r'empleados', EmpleadoViewSet, basename='empleados')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', EmailLoginView.as_view(), name='email-login'),
    path('profile/', UserDetailView.as_view(), name='user-detail'),
    path('auth/me/', me, name='auth-me'),
    
    # ✅ RECUPERACIÓN DE CONTRASEÑA
    path('password-reset/', password_reset_request, name='password-reset'),
    path('password-reset-confirm/', password_reset_confirm, name='password-reset-confirm'),
    
    path('', include(router.urls)),
]