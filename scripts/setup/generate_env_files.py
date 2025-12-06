#!/usr/bin/env python3
"""
Script to generate .env files for backend and frontend with detailed comments
"""

import os
from pathlib import Path

# Get project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent

BACKEND_ENV_TEMPLATE = """# ⚠️ SECURITY WARNING: This file contains sensitive information
# DO NOT commit this file to git. It's already in .gitignore
# Copy values from your secure storage or Render environment variables

# ============================================
# SUPABASE CONFIGURATION
# ============================================
# Get these from: Supabase Dashboard → Settings → API
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_SERVICE_KEY="your_supabase_service_role_key_here"
SUPABASE_ANON_KEY="your_supabase_anon_key_here"

# Database connection details
# Get from: Supabase Dashboard → Settings → Database → Connection string
SUPABASE_DB_HOST="aws-1-ap-southeast-1.pooler.supabase.com"
SUPABASE_DB_USER="postgres.your_project_id"
SUPABASE_DB_PASSWORD="your_database_password_here"
SUPABASE_DB_NAME="postgres"
SUPABASE_DB_PORT="6543"

# ============================================
# DIFY AI API CONFIGURATION
# ============================================
# Get from: Dify Dashboard → API Keys
DIFY_API_BASE_URL="https://api.dify.ai/v1"
DIFY_API_KEY="your_dify_api_key_here"

# ============================================
# EMAIL CONFIGURATION
# ============================================
# Email provider: 'smtp' (default), 'resend', or 'n8n'
EMAIL_PROVIDER="smtp"

# SMTP Configuration (for local development)
# For Gmail: Use App Password (not regular password)
# Get App Password: Google Account → Security → App Passwords
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_app_password_here"
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_TIMEOUT="30"

# Resend API Configuration (alternative to SMTP)
# Get from: Resend Dashboard → API Keys
RESEND_API_KEY="your_resend_api_key_here"
RESEND_FROM_EMAIL="noreply@resend.dev"

# n8n Webhook Configuration (for n8n automation)
# Get from: n8n Dashboard → Webhooks
N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/your-webhook-id"
N8N_WEBHOOK_ID="your_webhook_id_here"
N8N_API_KEY="your_n8n_api_key_here"

# Email Debug
EMAIL_DEBUG="0"

# ============================================
# JWT CONFIGURATION
# ============================================
# Generate a secure secret key:
# On Linux/Mac: openssl rand -base64 32
# On Windows: Use PowerShell: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
SECRET_KEY="generate_a_secure_random_key_here"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="30"

# Supabase JWT Secret
# Get from: Supabase Dashboard → Settings → API → JWT Settings
SUPABASE_JWT_SECRET="your_supabase_jwt_secret_here"

# ============================================
# APPLICATION SETTINGS
# ============================================
DEBUG="True"
ENVIRONMENT="development"
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"

# Frontend URL for password reset links and other redirects
# For local development: http://localhost:3000
# For production: https://your-frontend-url.onrender.com
FRONTEND_URL="http://localhost:3000"

# ============================================
# FILE UPLOAD SETTINGS
# ============================================
MAX_FILE_SIZE="10485760"
UPLOAD_DIRECTORY="uploads"

# ============================================
# TIMEZONE
# ============================================
DEFAULT_TIMEZONE="Asia/Ho_Chi_Minh"

# ============================================
# RATE LIMITING SETTINGS
# ============================================
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW_SECONDS="60"

# ============================================
# REQUEST SIGNING SETTINGS
# ============================================
# Generate a secure API secret:
# On Linux/Mac: openssl rand -base64 32
# On Windows: Use PowerShell: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
API_SECRET="generate_a_secure_random_secret_here"
REQUEST_SIGNING_ENABLED="false"
REQUEST_TIMESTAMP_WINDOW="300"

# ============================================
# PASSWORD RESET SETTINGS
# ============================================
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES="30"
"""

FRONTEND_ENV_TEMPLATE = """# ⚠️ SECURITY WARNING: This file contains sensitive information
# DO NOT commit this file to git. It's already in .gitignore
# Copy values from your secure storage or Render environment variables

# ============================================
# SUPABASE CONFIGURATION
# ============================================
# Get these from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key_here"

# ============================================
# API CONFIGURATION
# ============================================
# Backend API URL
# For local development: http://localhost:8000
# For production: https://your-backend-url.onrender.com
# Leave empty to auto-detect from current URL (recommended for network access)
NEXT_PUBLIC_API_URL="http://localhost:8000"

# ============================================
# DIFY AI API CONFIGURATION
# ============================================
# Get from: Dify Dashboard → API Keys
NEXT_PUBLIC_DIFY_API_BASE_URL="https://api.dify.ai/v1"
NEXT_PUBLIC_DIFY_API_KEY="your_dify_api_key_here"
"""


def generate_backend_env():
    """Generate backend/.env file"""
    backend_env_path = PROJECT_ROOT / "backend" / ".env"
    
    if backend_env_path.exists():
        print(f"⚠️  File {backend_env_path} already exists!")
        response = input("Do you want to overwrite it? (y/N): ").strip().lower()
        if response != 'y':
            print("❌ Skipped generating backend/.env")
            return
    
    try:
        with open(backend_env_path, 'w', encoding='utf-8') as f:
            f.write(BACKEND_ENV_TEMPLATE)
        print(f"✅ Created {backend_env_path}")
        print("   Please fill in all the API keys and credentials!")
    except Exception as e:
        print(f"❌ Error creating {backend_env_path}: {e}")


def generate_frontend_env():
    """Generate frontend/.env.local file"""
    frontend_env_path = PROJECT_ROOT / "frontend" / ".env.local"
    
    if frontend_env_path.exists():
        print(f"⚠️  File {frontend_env_path} already exists!")
        response = input("Do you want to overwrite it? (y/N): ").strip().lower()
        if response != 'y':
            print("❌ Skipped generating frontend/.env.local")
            return
    
    try:
        with open(frontend_env_path, 'w', encoding='utf-8') as f:
            f.write(FRONTEND_ENV_TEMPLATE)
        print(f"✅ Created {frontend_env_path}")
        print("   Please fill in all the API keys and credentials!")
    except Exception as e:
        print(f"❌ Error creating {frontend_env_path}: {e}")


def main():
    """Main function"""
    print("=" * 60)
    print("🔑 Generate .env Files for Backend and Frontend")
    print("=" * 60)
    print()
    
    print("📝 This script will create:")
    print("   1. backend/.env")
    print("   2. frontend/.env.local")
    print()
    print("⚠️  These files contain placeholders that you need to fill in!")
    print("📖 See docs/guides/HUONG_DAN_LAY_API_KEYS.md for detailed instructions")
    print()
    
    generate_backend_env()
    print()
    generate_frontend_env()
    print()
    
    print("=" * 60)
    print("✅ Done!")
    print("=" * 60)
    print()
    print("📋 Next steps:")
    print("   1. Open backend/.env and fill in all API keys")
    print("   2. Open frontend/.env.local and fill in all API keys")
    print("   3. See docs/guides/HUONG_DAN_LAY_API_KEYS.md for help")
    print()


if __name__ == "__main__":
    main()

