"""
Configuration settings for Financial Management API
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """Application settings"""
    
    # Supabase Configuration
    # ⚠️ SECURITY: All credentials must be provided via environment variables
    # No default values for sensitive data
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    if not SUPABASE_URL:
        raise ValueError("SUPABASE_URL environment variable is required")
    
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
    if not SUPABASE_SERVICE_KEY:
        raise ValueError("SUPABASE_SERVICE_KEY environment variable is required")
    
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    if not SUPABASE_ANON_KEY:
        raise ValueError("SUPABASE_ANON_KEY environment variable is required")
    
    # Database connection details
    SUPABASE_DB_HOST = os.getenv("SUPABASE_DB_HOST")
    if not SUPABASE_DB_HOST:
        raise ValueError("SUPABASE_DB_HOST environment variable is required")
    
    SUPABASE_DB_USER = os.getenv("SUPABASE_DB_USER")
    if not SUPABASE_DB_USER:
        raise ValueError("SUPABASE_DB_USER environment variable is required")
    
    SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")
    if not SUPABASE_DB_PASSWORD:
        raise ValueError("SUPABASE_DB_PASSWORD environment variable is required")
    
    SUPABASE_DB_NAME = os.getenv("SUPABASE_DB_NAME", "postgres")
    SUPABASE_DB_PORT = os.getenv("SUPABASE_DB_PORT", "6543")
    
    # Dify API Configuration
    DIFY_API_BASE_URL = os.getenv("DIFY_API_BASE_URL", "https://api.dify.ai/v1")
    DIFY_API_KEY = os.getenv("DIFY_API_KEY")  # Optional - only required if using AI features
    
    # Email configuration
    SMTP_USER = os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")  # Required if using SMTP
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    
    # JWT Configuration
    SECRET_KEY = os.getenv("SECRET_KEY")
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable is required")
    
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Supabase JWT Configuration
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
    if not SUPABASE_JWT_SECRET:
        raise ValueError("SUPABASE_JWT_SECRET environment variable is required")
    
    # Application Settings
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    FRONTEND_BASE_URL = os.getenv("FRONTEND_URL") or os.getenv("FRONTEND_BASE_URL", "https://financial-management-frontend.onrender.com")
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = int(os.getenv("PASSWORD_RESET_TOKEN_EXPIRE_MINUTES", "30"))
    
    # File Upload Settings
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    UPLOAD_DIRECTORY = os.getenv("UPLOAD_DIRECTORY", "uploads")
    
    # Timezone
    DEFAULT_TIMEZONE = os.getenv("DEFAULT_TIMEZONE", "Asia/Ho_Chi_Minh")
    
    # API Security
    API_SECRET = os.getenv("API_SECRET", "default-dev-secret-change-in-production")
    REQUEST_SIGNING_ENABLED = os.getenv("REQUEST_SIGNING_ENABLED", "false").lower() == "true"
    REQUEST_TIMESTAMP_WINDOW = int(os.getenv("REQUEST_TIMESTAMP_WINDOW", "300"))  # 5 minutes

# Create settings instance
settings = Settings()
