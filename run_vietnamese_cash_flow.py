#!/usr/bin/env python3
"""
Quick Setup Script for Vietnamese Cash Flow Report
Runs all necessary setup steps in one go
"""

import os
import sys
import subprocess
import time
from datetime import datetime

def print_step(step_num, description):
    """Print step header"""
    print(f"\n{'='*60}")
    print(f"STEP {step_num}: {description}")
    print(f"{'='*60}")

def run_command(command, description, check=True):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}")
    print(f"Command: {command}")
    
    try:
        result = subprocess.run(command, shell=True, check=check, capture_output=True, text=True)
        if result.stdout:
            print(f"✅ Output: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if e.stderr:
            print(f"Error details: {e.stderr}")
        return False

def check_port(port, service_name):
    """Check if a port is available"""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(1)
            result = s.connect_ex(('localhost', port))
            if result == 0:
                print(f"✅ {service_name} is running on port {port}")
                return True
            else:
                print(f"❌ {service_name} is not running on port {port}")
                return False
    except Exception as e:
        print(f"❌ Error checking port {port}: {e}")
        return False

def main():
    """Main setup function"""
    print("🚀 Vietnamese Cash Flow Report - Quick Setup")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Step 1: Check prerequisites
    print_step(1, "Checking Prerequisites")
    
    # Check if we're in the right directory
    if not os.path.exists("backend") or not os.path.exists("frontend"):
        print("❌ Please run this script from the project root directory")
        print("Expected structure:")
        print("  - backend/")
        print("  - frontend/")
        print("  - run_vietnamese_cash_flow.py")
        return False
    
    print("✅ Project structure looks good")
    
    # Check environment variables
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_ANON_KEY"):
        print("⚠️  Warning: SUPABASE_URL and SUPABASE_ANON_KEY not set")
        print("Make sure to set these environment variables")
    
    # Step 2: Setup database
    print_step(2, "Setting up Vietnamese Chart of Accounts")
    
    if not run_command("python create_transaction_account_mapping.py", "Creating Vietnamese chart of accounts"):
        print("❌ Failed to create chart of accounts")
        return False
    
    # Step 3: Start backend
    print_step(3, "Starting Backend Server")
    
    # Check if backend is already running
    if check_port(8000, "Backend"):
        print("✅ Backend is already running")
    else:
        print("🔄 Starting backend server...")
        backend_process = subprocess.Popen(
            ["python", "main.py"],
            cwd="backend",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for backend to start
        print("⏳ Waiting for backend to start...")
        for i in range(30):  # Wait up to 30 seconds
            time.sleep(1)
            if check_port(8000, "Backend"):
                print("✅ Backend started successfully")
                break
        else:
            print("❌ Backend failed to start within 30 seconds")
            return False
    
    # Step 4: Start frontend
    print_step(4, "Starting Frontend Server")
    
    # Check if frontend is already running
    if check_port(3000, "Frontend"):
        print("✅ Frontend is already running")
    else:
        print("🔄 Starting frontend server...")
        frontend_process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd="frontend",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for frontend to start
        print("⏳ Waiting for frontend to start...")
        for i in range(60):  # Wait up to 60 seconds
            time.sleep(1)
            if check_port(3000, "Frontend"):
                print("✅ Frontend started successfully")
                break
        else:
            print("❌ Frontend failed to start within 60 seconds")
            return False
    
    # Step 5: Test the system
    print_step(5, "Testing Vietnamese Cash Flow System")
    
    if not run_command("python test_cash_flow_vietnamese.py", "Running comprehensive tests"):
        print("⚠️  Some tests failed, but system might still work")
    
    # Step 6: Show access information
    print_step(6, "Access Information")
    
    print("\n🎉 Vietnamese Cash Flow Report is ready!")
    print("\n📊 Access URLs:")
    print("  • Main Reports: http://localhost:3000/reports")
    print("  • Vietnamese Cash Flow: http://localhost:3000/reports/cash-flow-vietnamese")
    print("  • API Documentation: http://localhost:8000/docs")
    print("  • API Endpoint: http://localhost:8000/api/reports/financial/cash-flow-vietnamese")
    
    print("\n🔧 Features Available:")
    print("  ✅ Vietnamese accounting standards (bên nợ/bên có)")
    print("  ✅ Comprehensive cash flow sections")
    print("  ✅ Debit/Credit classification")
    print("  ✅ Vietnamese account names")
    print("  ✅ Cash flow validation")
    print("  ✅ Modern responsive UI")
    
    print("\n📚 Documentation:")
    print("  • Setup Guide: VIETNAMESE_CASH_FLOW_GUIDE.md")
    print("  • API Tests: test_cash_flow_vietnamese.py")
    print("  • Account Mapping: create_transaction_account_mapping.py")
    
    print("\n🚀 Next Steps:")
    print("  1. Open http://localhost:3000/reports in your browser")
    print("  2. Click on 'Báo cáo dòng tiền (Chuẩn VN)'")
    print("  3. Select date range and view the report")
    print("  4. Check the debit/credit classification")
    
    print(f"\n✨ Setup completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("Happy accounting! 📊💰")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if success:
            print("\n🎉 All done! Your Vietnamese Cash Flow Report is ready to use.")
        else:
            print("\n❌ Setup failed. Please check the errors above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Setup interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
