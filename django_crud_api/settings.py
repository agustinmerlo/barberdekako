"""
Django settings for django_crud_api project.

Usando Django 5.2.6 como backend (API con MySQL).
"""

from pathlib import Path
import os

# -------------------------------------------------------------------
# Rutas base
# -------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

# -------------------------------------------------------------------
# Básicos
# -------------------------------------------------------------------
SECRET_KEY = 'django-insecure-8npq1vwes7$#las5pabldu$bcqvzr)os7%x)km^)_j8j7vmc+p'
DEBUG = True
ALLOWED_HOSTS = []

# -------------------------------------------------------------------
# Aplicaciones instaladas
# -------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Terceros
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',

    # Apps locales
    'tasks',
    'servicios',
    'barbers',
    'reservas',
    'caja',
    'proveedores',
    'usuarios.apps.UsuariosConfig',                     
]

# -------------------------------------------------------------------
# Middleware
# -------------------------------------------------------------------
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'django_crud_api.urls'

# -------------------------------------------------------------------
# Plantillas 
# -------------------------------------------------------------------
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [], 
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'django_crud_api.wsgi.application'

# -------------------------------------------------------------------
# Base de datos MySQL
# -------------------------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'barber_clase_v',
        'USER': 'root',
        'PASSWORD': 'Fabri_87',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

# -------------------------------------------------------------------
# Validadores de contraseña
# -------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# -------------------------------------------------------------------
# Internacionalización
# -------------------------------------------------------------------
LANGUAGE_CODE = 'es'
TIME_ZONE = 'America/Argentina/Buenos_Aires'
USE_I18N = True
USE_TZ = True

# -------------------------------------------------------------------
# Archivos estáticos
# -------------------------------------------------------------------
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# -------------------------------------------------------------------
# Archivos de media
# -------------------------------------------------------------------
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# -------------------------------------------------------------------
# Configuración por defecto
# -------------------------------------------------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# -------------------------------------------------------------------
# CORS
# -------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = True

# -------------------------------------------------------------------
# Django REST Framework
# -------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
}

# -------------------------------------------------------------------
# ✅ URL DEL FRONTEND
# -------------------------------------------------------------------
FRONTEND_URL = 'http://localhost:3000'

# -------------------------------------------------------------------
# ✅ CONFIGURACIÓN DE EMAIL - GMAIL CON TU CONTRASEÑA
# -------------------------------------------------------------------
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True

# 👇 CONFIGURA AQUÍ TU CORREO DE GMAIL
EMAIL_HOST_USER = 'barberclasev@gmail.com'  # ← CAMBIA ESTO por tu correo real
EMAIL_HOST_PASSWORD = 'mlfv gxkz lfnw chlz'  # ← Tu contraseña de aplicación
DEFAULT_FROM_EMAIL = 'Barber Studio <barberclasev@gmail.com>'  # ← CAMBIA ESTO

# Configuración general de email
DEFAULT_CHARSET = 'utf-8'
FILE_CHARSET = 'utf-8'