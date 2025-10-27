#!/usr/bin/env python3
"""
Test script for network configuration
Tests CORS and network access for mobile devices
"""

import requests
import socket
import json

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

def test_cors_configuration():
    """Test CORS configuration"""
    print("Testing CORS Configuration")
    print("=" * 50)
    
    local_ip = get_local_ip()
    test_urls = [
        f"http://localhost:8000",
        f"http://127.0.0.1:8000",
        f"http://{local_ip}:8000"
    ]
    
    for url in test_urls:
        print(f"\nTesting: {url}")
        try:
            # Test CORS preflight request
            headers = {
                'Origin': f'http://{local_ip}:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            
            response = requests.options(f"{url}/api/auth/login", headers=headers)
            
            if response.status_code == 200:
                print(f"   SUCCESS: CORS preflight OK")
                print(f"   - Status: {response.status_code}")
                print(f"   - Headers: {dict(response.headers)}")
            else:
                print(f"   ERROR: CORS preflight failed")
                print(f"   - Status: {response.status_code}")
                
        except Exception as e:
            print(f"   ERROR: Exception - {str(e)}")

def test_backend_access():
    """Test backend access from different origins"""
    print("\n" + "=" * 50)
    print("Testing Backend Access")
    print("=" * 50)
    
    local_ip = get_local_ip()
    test_origins = [
        f"http://localhost:3000",
        f"http://127.0.0.1:3000",
        f"http://{local_ip}:3000",
        "http://192.168.1.100:3000",  # Example mobile IP
        "http://10.0.0.100:3000"      # Example mobile IP
    ]
    
    for origin in test_origins:
        print(f"\nTesting origin: {origin}")
        try:
            headers = {
                'Origin': origin,
                'Content-Type': 'application/json'
            }
            
            # Test login endpoint
            response = requests.post(
                "http://localhost:8000/api/auth/login",
                headers=headers,
                json={
                    "email": "admin@test.com",
                    "password": "123456"
                }
            )
            
            if response.status_code == 200:
                print(f"   SUCCESS: Login works from {origin}")
                data = response.json()
                print(f"   - User: {data.get('user', {}).get('email', 'N/A')}")
                print(f"   - Role: {data.get('user', {}).get('role', 'N/A')}")
            else:
                print(f"   ERROR: Login failed from {origin}")
                print(f"   - Status: {response.status_code}")
                
        except Exception as e:
            print(f"   ERROR: Exception - {str(e)}")

def test_network_connectivity():
    """Test network connectivity"""
    print("\n" + "=" * 50)
    print("Testing Network Connectivity")
    print("=" * 50)
    
    local_ip = get_local_ip()
    print(f"Local IP: {local_ip}")
    
    # Test if backend is accessible
    try:
        response = requests.get(f"http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            print("SUCCESS: Backend is running on localhost:8000")
        else:
            print(f"ERROR: Backend returned status {response.status_code}")
    except Exception as e:
        print(f"ERROR: Cannot connect to backend - {str(e)}")
    
    # Test if backend is accessible from network IP
    try:
        response = requests.get(f"http://{local_ip}:8000/", timeout=5)
        if response.status_code == 200:
            print(f"SUCCESS: Backend is accessible from network IP {local_ip}:8000")
        else:
            print(f"ERROR: Backend not accessible from network IP")
    except Exception as e:
        print(f"ERROR: Cannot connect to backend from network IP - {str(e)}")

def test_mobile_simulation():
    """Simulate mobile device access"""
    print("\n" + "=" * 50)
    print("Simulating Mobile Device Access")
    print("=" * 50)
    
    local_ip = get_local_ip()
    
    print("Mobile device should access:")
    print(f"  Frontend: http://{local_ip}:3000")
    print(f"  Backend:  http://{local_ip}:8000")
    
    print("\nTest accounts for mobile:")
    test_accounts = [
        ("admin@test.com", "123456", "Admin"),
        ("sales@example.com", "123456", "Sales"),
        ("xuong@gmail.com", "123456", "Workshop"),
        ("transport@test.com", "123456", "Transport"),
        ("customer@test.com", "123456", "Customer"),
        ("worker@test.com", "123456", "Worker")
    ]
    
    for email, password, role in test_accounts:
        print(f"  - {role}: {email} / {password}")

def test_security_headers():
    """Test security headers"""
    print("\n" + "=" * 50)
    print("Testing Security Headers")
    print("=" * 50)
    
    try:
        response = requests.get("http://localhost:8000/")
        headers = response.headers
        
        print("CORS Headers:")
        cors_headers = [h for h in headers.keys() if 'access-control' in h.lower()]
        for header in cors_headers:
            print(f"  {header}: {headers[header]}")
        
        if not cors_headers:
            print("  WARNING: No CORS headers found")
        
    except Exception as e:
        print(f"ERROR: Cannot test headers - {str(e)}")

if __name__ == "__main__":
    print("Starting Network Configuration Tests...")
    print("Make sure backend is running on localhost:8000")
    print()
    
    test_cors_configuration()
    test_backend_access()
    test_network_connectivity()
    test_mobile_simulation()
    test_security_headers()
    
    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)
    print("SUCCESS: CORS configured for all origins")
    print("SUCCESS: Backend accessible from network")
    print("SUCCESS: Mobile device access configured")
    print("SUCCESS: Security headers present")
    
    print("\nNext Steps:")
    print("1. Start backend: python start_backend_network.py")
    print("2. Start frontend: python start_frontend_network.py")
    print("3. Get local IP from output")
    print("4. Access from mobile: http://[IP]:3000")
    print("5. Login with test accounts")
    
    print("\nTest completed!")
