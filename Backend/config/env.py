import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()
from corsheaders.defaults import default_headers
import firebase_admin
from firebase_admin import credentials
BASE_DIR = Path(__file__).resolve().parent.parent

cred_path = os.path.join(BASE_DIR, "firebase-key.json")
if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
else:
    print(f"Warning: Firebase certificate not found at {cred_path}")

#Django Settings
CORS_ALLOW_CREDENTIALS = True
DEBUG = os.getenv('DEBUG', True)
SECRET_KEY = os.getenv("SECRET_KEY")
BASE_DIR = Path(__file__).resolve().parent.parent
STRIPE_PUBLIC_KEY = os.getenv('STRIPE_PUBLIC_KEY')
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY')
DATA_UPLOAD_MAX_MEMORY_SIZE = 1048576
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
CORS_ALLOW_HEADERS = list(default_headers) + ['ngrok-skip-browser-warning',]
CORS_ALLOW_ORIGINS =  os.getenv('CORS_ALLOW_ORIGINS', 'localhost:8000,localhost:3000,https://hecticly-rural-kittie.ngrok-free.dev').split(',')
CSRF_TRUSTED_ORIGINS = os.getenv('CSRF_TRUSTED_ORIGINS', 'localhost:8000,localhost:3000,hecticly-rural-kittie.ngrok-free.dev').split(',')
FRONTEND_URL=os.getenv('FRONTEND_URL')
BACKEND_URL=os.getenv('BACKEND_URL')
BACKEND_PORT=os.getenv('BACKEND_PORT')
DB_PORT=os.getenv('DB_PORT')
REDIS_PORT=os.getenv('REDIS_PORT')

#Celery Settings
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/0')

#Email Settings
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', True)
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL")


# JWT Settings
SIMPLE_JWT_CONFIG = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30)
}

# OpenAI Settings
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')


#Database Settings
USE_PSQL = os.getenv('USE_PSQL', 'False')
DB_NAME = os.getenv('DB_NAME')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = int(os.getenv('DB_PORT')) if os.getenv('DB_PORT') else None


#Swagger Settings
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Bearer': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header',
            'description': 'Type in the *Value* input box below: **Bearer &lt;JWT&gt;**, where JWT is the token'
        }
    },
    'USE_SESSION_AUTH': True,
    'LOGIN_URL': '/api-auth/login/',
    'LOGOUT_URL': '/api-auth/logout/',
}