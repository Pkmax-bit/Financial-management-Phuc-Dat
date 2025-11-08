#!/usr/bin/env python3
"""
Start frontend server with network configuration for mobile devices
"""

import subprocess
import socket
import os
import sys

def get_local_ip():
    """Get local IP address"""
    try:
        # Connect to a remote server to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except:
        return "127.0.0.1"

def start_frontend():
    """Start frontend server with network configuration"""
    print("Starting Frontend Server for Network Access")
    print("=" * 50)
    
    # Get local IP
    local_ip = get_local_ip()
    print(f"Local IP: {local_ip}")
    
    # Configuration
    port = 3000
    
    print(f"Frontend will be available at:")
    print(f"  - http://localhost:{port}")
    print(f"  - http://{local_ip}:{port}")
    
    print(f"\nFor mobile devices, use:")
    print(f"  - Frontend: http://{local_ip}:{port}")
    
    print(f"\nStarting Next.js development server...")
    print(f"Press Ctrl+C to stop")
    
    try:
        # Set environment variables for network access
        env = os.environ.copy()
        env["HOST"] = "0.0.0.0"
        env["PORT"] = str(port)
        
        # Start Next.js with network configuration
        subprocess.run([
            "npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", str(port)
        ], env=env, cwd="frontend")
        
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        print(f"Error starting server: {e}")

if __name__ == "__main__":
    start_frontend()
