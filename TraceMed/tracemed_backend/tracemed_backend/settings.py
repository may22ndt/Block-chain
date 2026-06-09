import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from the project .env file next to manage.py.
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'tracemed-local-development-secret-key-change-before-production',
)

DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3000,http://127.0.0.1:3000',
    ).split(',')
    if origin.strip()
]

INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'medicine',
]

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

ROOT_URLCONF = 'tracemed_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'tracemed_backend.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/tracemed')
MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME', 'tracemed')
WEB3_PROVIDER_URL = os.environ.get('WEB3_PROVIDER_URL', '')
CONTRACT_ADDRESS = os.environ.get('CONTRACT_ADDRESS', '')
CHAIN_ID = int(os.environ.get('CHAIN_ID') or '0')
PRIVATE_KEY = os.environ.get('PRIVATE_KEY', '')
ADMIN_PRIVATE_KEY = os.environ.get('ADMIN_PRIVATE_KEY', '')
MANUFACTURER_PRIVATE_KEY = os.environ.get('MANUFACTURER_PRIVATE_KEY', '')
INSPECTOR_PRIVATE_KEY = os.environ.get('INSPECTOR_PRIVATE_KEY', '')
LOGISTICS_PRIVATE_KEY = os.environ.get('LOGISTICS_PRIVATE_KEY', '')
PHARMACY_PRIVATE_KEY = os.environ.get('PHARMACY_PRIVATE_KEY', '')
BLOCKCHAIN_ENABLED = os.environ.get('BLOCKCHAIN_ENABLED', 'False') == 'True'

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_FILTER_BACKENDS': ['rest_framework.filters.SearchFilter'],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}
