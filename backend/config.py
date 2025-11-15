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
    SUPABASE_URL = os.getenv("SUPABASE_URL", "https://mfmijckzlhevduwfigkl.supabase.co")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUzOTExMiwiZXhwIjoyMDcyMTE1MTEyfQ.rlFwoXK_Yls7kRxL_lYqYWe3huJhs0V60Wa4Ddd7Ero")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbWlqY2t6bGhldmR1d2ZpZ2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MzkxMTIsImV4cCI6MjA3MjExNTExMn0.VPFmvLghhO32JybxDzq-CGVQedgI-LN7Q07rwDhxU4E")
    
    # Database connection details
    SUPABASE_DB_HOST = os.getenv("SUPABASE_DB_HOST", "aws-1-ap-southeast-1.pooler.supabase.com")
    SUPABASE_DB_USER = os.getenv("SUPABASE_DB_USER", "postgres.mfmijckzlhevduwfigkl")
    SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD", "tudonghoa2025")
    SUPABASE_DB_NAME = os.getenv("SUPABASE_DB_NAME", "postgres")
    SUPABASE_DB_PORT = os.getenv("SUPABASE_DB_PORT", "6543")
    
    # Dify API Configuration
    DIFY_API_BASE_URL = os.getenv("DIFY_API_BASE_URL", "https://api.dify.ai/v1")
    DIFY_API_KEY = os.getenv("DIFY_API_KEY", "app-8gGZ55XJ7uNafs4TRAkqO0xl")
    
    # Email configuration
    SMTP_USER = os.getenv("SMTP_USER", "phannguyendangkhoa0915@gmail.com")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "wozhwluxehsfuqjm")
    SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    
    # JWT Configuration
    SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key_here_financial_management_2025")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Supabase JWT Configuration
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "DIiyyRJCCJrFc2FnmaKroTnzZh2I2JqouXOdhSdqu58SkZ3PTGYkpZFN9WrmP7hGfZbXgD4EdkEoatekEIrX0A==")
    
    # Application Settings
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    FRONTEND_BASE_URL = os.getenv("FRONTEND_URL") or os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
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
