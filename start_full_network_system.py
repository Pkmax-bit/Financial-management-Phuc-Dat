#!/usr/bin/env python3
"""
Start complete system with network configuration for mobile access
"""

import subprocess
import socket
import os
import sys
import threading
import time
import webbrowser

def get_local_ip():
    """Get local IP address"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except:
        return "127.0.0.1"

def print_banner():
    """Print system banner"""
    print("=" * 80)
    print("🚀 FINANCIAL MANAGEMENT SYSTEM - NETWORK ACCESS")
    print("=" * 80)
    print("📱 Mobile Device Access Enabled")
    print("🌐 Network Configuration Active")
    print("=" * 80)

def print_network_info(local_ip):
    """Print network information"""
    print(f"\n📍 NETWORK INFORMATION:")
    print(f"   Local IP: {local_ip}")
    print(f"   Backend:  http://{local_ip}:8000")
    print(f"   Frontend: http://{local_ip}:3000")
    
    print(f"\n📱 MOBILE ACCESS:")
    print(f"   1. Connect mobile device to same WiFi")
    print(f"   2. Open browser on mobile")
    print(f"   3. Go to: http://{local_ip}:3000")
    print(f"   4. Login with test accounts below")

def print_test_accounts():
    """Print test accounts"""
    print(f"\n🔑 TEST ACCOUNTS:")
    accounts = [
        ("admin@test.com", "123456", "Admin", "Full access"),
        ("sales@example.com", "123456", "Sales", "Sales management"),
        ("xuong@gmail.com", "123456", "Workshop", "Production costs"),
        ("transport@test.com", "123456", "Transport", "Transport costs"),
        ("customer@test.com", "123456", "Customer", "Customer portal"),
        ("worker@test.com", "123456", "Worker", "Basic costs")
    ]
    
    for email, password, role, description in accounts:
        print(f"   {role:12} | {email:25} | {password:6} | {description}")

def start_backend():
    """Start backend server"""
    print(f"\n🔧 Starting Backend Server...")
    try:
        os.chdir("backend")
        process = subprocess.Popen([
            "python", "-m", "uvicorn", "main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return process
    except Exception as e:
        print(f"❌ Backend error: {e}")
        return None

def start_frontend():
    """Start frontend server"""
    print(f"🎨 Starting Frontend Server...")
    try:
        os.chdir("frontend")
        process = subprocess.Popen([
            "npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return process
    except Exception as e:
        print(f"❌ Frontend error: {e}")
        return None

def check_servers(local_ip):
    """Check if servers are running"""
    print(f"\n🔍 Checking servers...")
    
    # Check backend
    try:
        import requests
        response = requests.get(f"http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            print(f"✅ Backend running on http://{local_ip}:8000")
        else:
            print(f"❌ Backend not responding")
    except:
        print(f"❌ Backend not accessible")
    
    # Check frontend
    try:
        response = requests.get(f"http://localhost:3000/", timeout=5)
        if response.status_code == 200:
            print(f"✅ Frontend running on http://{local_ip}:3000")
        else:
            print(f"❌ Frontend not responding")
    except:
        print(f"❌ Frontend not accessible")

def main():
    """Main function"""
    print_banner()
    
    # Get local IP
    local_ip = get_local_ip()
    
    # Print network info
    print_network_info(local_ip)
    print_test_accounts()
    
    print(f"\n🚀 Starting servers...")
    print(f"   Press Ctrl+C to stop all servers")
    
    # Start backend
    backend_process = start_backend()
    if not backend_process:
        print("❌ Failed to start backend")
        return
    
    # Wait for backend to start
    print(f"⏳ Waiting for backend to start...")
    time.sleep(5)
    
    # Start frontend
    frontend_process = start_frontend()
    if not frontend_process:
        print("❌ Failed to start frontend")
        backend_process.terminate()
        return
    
    # Wait for frontend to start
    print(f"⏳ Waiting for frontend to start...")
    time.sleep(10)
    
    # Check servers
    check_servers(local_ip)
    
    print(f"\n🎉 SYSTEM READY!")
    print(f"   Desktop: http://localhost:3000")
    print(f"   Mobile:  http://{local_ip}:3000")
    
    # Open browser
    try:
        webbrowser.open(f"http://localhost:3000")
        print(f"🌐 Browser opened automatically")
    except:
        print(f"💡 Open browser manually: http://localhost:3000")
    
    print(f"\n📱 For mobile devices:")
    print(f"   Open browser and go to: http://{local_ip}:3000")
    
    try:
        # Keep running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n\n🛑 Shutting down servers...")
        
        if backend_process:
            backend_process.terminate()
            print(f"✅ Backend stopped")
        
        if frontend_process:
            frontend_process.terminate()
            print(f"✅ Frontend stopped")
        
        print(f"👋 Goodbye!")

if __name__ == "__main__":
    main()
