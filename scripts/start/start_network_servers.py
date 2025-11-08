#!/usr/bin/env python3
"""
Start both backend and frontend servers with network configuration
for mobile device access
"""

import subprocess
import socket
import os
import sys
import threading
import time
import signal

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

def start_backend():
    """Start backend server"""
    print("Starting Backend Server...")
    try:
        os.chdir("backend")
        subprocess.run([
            "python", "-m", "uvicorn", "main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ])
    except Exception as e:
        print(f"Backend error: {e}")

def start_frontend():
    """Start frontend server"""
    print("Starting Frontend Server...")
    try:
        os.chdir("frontend")
        subprocess.run([
            "npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"
        ])
    except Exception as e:
        print(f"Frontend error: {e}")

def main():
    """Main function"""
    print("Starting Network Servers for Mobile Access")
    print("=" * 60)
    
    # Get local IP
    local_ip = get_local_ip()
    print(f"Local IP: {local_ip}")
    
    print(f"\nServers will be available at:")
    print(f"  Backend:  http://{local_ip}:8000")
    print(f"  Frontend: http://{local_ip}:3000")
    
    print(f"\nFor mobile devices:")
    print(f"  1. Connect to the same WiFi network")
    print(f"  2. Open browser and go to: http://{local_ip}:3000")
    print(f"  3. Login with any test account")
    
    print(f"\nTest Accounts:")
    print(f"  - Admin: admin@test.com / 123456")
    print(f"  - Sales: sales@example.com / 123456")
    print(f"  - Workshop: xuong@gmail.com / 123456")
    print(f"  - Transport: transport@test.com / 123456")
    print(f"  - Customer: customer@test.com / 123456")
    print(f"  - Worker: worker@test.com / 123456")
    
    print(f"\nStarting servers...")
    print(f"Press Ctrl+C to stop both servers")
    
    # Start backend in a separate thread
    backend_thread = threading.Thread(target=start_backend, daemon=True)
    backend_thread.start()
    
    # Wait a bit for backend to start
    time.sleep(3)
    
    # Start frontend in main thread
    try:
        start_frontend()
    except KeyboardInterrupt:
        print("\nShutting down servers...")
        sys.exit(0)

if __name__ == "__main__":
    main()
