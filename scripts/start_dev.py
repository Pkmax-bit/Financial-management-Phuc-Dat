#!/usr/bin/env python3
"""
Development startup script for Financial Management System
This script helps start the development environment
"""

import subprocess
import sys
import os
import time
from pathlib import Path

def run_command(command, cwd=None, shell=True):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, cwd=cwd, shell=shell, check=True, capture_output=True, text=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def check_python_version():
    """Check if Python version is 3.11+"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 11):
        print("❌ Python 3.11+ is required")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")
    return True

def check_node_version():
    """Check if Node.js is installed"""
    success, output = run_command("node --version")
    if not success:
        print("❌ Node.js is not installed")
        return False
    print(f"✅ Node.js {output.strip()} detected")
    return True

def install_backend_dependencies():
    """Install Python dependencies"""
    print("\n📦 Installing backend dependencies...")
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return False
    
    success, output = run_command("pip install -r requirements.txt", cwd=backend_dir)
    if not success:
        print(f"❌ Failed to install backend dependencies: {output}")
        return False
    
    print("✅ Backend dependencies installed")
    return True

def install_frontend_dependencies():
    """Install Node.js dependencies"""
    print("\n📦 Installing frontend dependencies...")
    frontend_dir = Path("frontend")
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    success, output = run_command("npm install", cwd=frontend_dir)
    if not success:
        print(f"❌ Failed to install frontend dependencies: {output}")
        return False
    
    print("✅ Frontend dependencies installed")
    return True

def check_environment_files():
    """Check if environment files exist"""
    print("\n🔧 Checking environment configuration...")
    
    backend_env = Path("backend/.env")
    frontend_env = Path("frontend/.env.local")
    
    if not backend_env.exists():
        print("⚠️  Backend .env file not found. Please copy backend/env.example to backend/.env and configure it.")
        return False
    
    if not frontend_env.exists():
        print("⚠️  Frontend .env.local file not found. Please copy frontend/env.local.example to frontend/.env.local and configure it.")
        return False
    
    print("✅ Environment files found")
    return True

def start_backend():
    """Start the backend server"""
    print("\n🚀 Starting backend server...")
    backend_dir = Path("backend")
    
    # Start backend in background
    process = subprocess.Popen(
        ["python", "-m", "uvicorn", "main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait a moment for server to start
    time.sleep(3)
    
    if process.poll() is None:
        print("✅ Backend server started on http://localhost:8000")
        print("📚 API Documentation: http://localhost:8000/docs")
        return process
    else:
        stdout, stderr = process.communicate()
        print(f"❌ Failed to start backend server: {stderr.decode()}")
        return None

def start_frontend():
    """Start the frontend server"""
    print("\n🚀 Starting frontend server...")
    frontend_dir = Path("frontend")
    
    # Start frontend in background
    process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait a moment for server to start
    time.sleep(5)
    
    if process.poll() is None:
        print("✅ Frontend server started on http://localhost:3000")
        return process
    else:
        stdout, stderr = process.communicate()
        print(f"❌ Failed to start frontend server: {stderr.decode()}")
        return None

def main():
    """Main function"""
    print("🎯 Financial Management System - Development Setup")
    print("=" * 50)
    
    # Check prerequisites
    if not check_python_version():
        return 1
    
    if not check_node_version():
        return 1
    
    # Check environment files
    if not check_environment_files():
        print("\n⚠️  Please configure your environment files before continuing.")
        return 1
    
    # Install dependencies
    if not install_backend_dependencies():
        return 1
    
    if not install_frontend_dependencies():
        return 1
    
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Configure your Supabase credentials in backend/.env")
    print("2. Configure your frontend environment in frontend/.env.local")
    print("3. Run the database schema in your Supabase project")
    print("4. Start the development servers:")
    print("   - Backend: cd backend && python -m uvicorn main:app --reload")
    print("   - Frontend: cd frontend && npm run dev")
    print("\n🌐 URLs:")
    print("   - Frontend: http://localhost:3000")
    print("   - Backend API: http://localhost:8000")
    print("   - API Docs: http://localhost:8000/docs")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
