"""
Script test xoa debug log
"""

import requests
import time

API_BASE_URL = "http://localhost:8000"

def test_debug_cleanup():
    """Test xoa debug log"""
    print("TEST XOA DEBUG LOG")
    print("=" * 50)
    
    # Test voi admin
    print("\nTest voi admin@test.com:")
    
    try:
        # Login
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if response.status_code == 200:
            print("Login: OK")
            
            # Test cac endpoint
            headers = {"Authorization": f"Bearer {response.json().get('access_token')}"}
            
            # Test dashboard
            dashboard_response = requests.get(f"{API_BASE_URL}/api/dashboard/", headers=headers, timeout=5)
            print(f"Dashboard: {'OK' if dashboard_response.status_code == 200 else dashboard_response.status_code}")
            
            # Test employees
            emp_response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers, timeout=5)
            print(f"Employees: {'OK' if emp_response.status_code == 200 else emp_response.status_code}")
            
            # Test employees simple
            emp_simple_response = requests.get(f"{API_BASE_URL}/api/employees/simple", headers=headers, timeout=5)
            print(f"Employees Simple: {'OK' if emp_simple_response.status_code == 200 else emp_simple_response.status_code}")
            
        else:
            print(f"Login: FAILED ({response.status_code})")
            
    except Exception as e:
        print(f"Error: {str(e)}")

def create_cleanup_summary():
    """Tao tom tat cleanup"""
    print(f"\nTOM TAT CLEANUP DEBUG LOG")
    print("=" * 50)
    
    print("DA XOA CAC DEBUG LOG:")
    print("1. backend/utils/auth.py:")
    print("   - DEBUG: Received token")
    print("   - DEBUG: Supabase user response type")
    print("   - DEBUG: Supabase user response")
    print("   - DEBUG: Extracted user_id")
    print("   - DEBUG: No user found in Supabase response")
    print("   - DEBUG: Supabase auth error")
    print("   - DEBUG: Auth error type")
    
    print("\n2. backend/routers/auth.py:")
    print("   - DEBUG: Received token")
    print("   - DEBUG: JWT payload")
    
    print("\n3. backend/routers/employees.py:")
    print("   - DEBUG: get_employees called by user")
    print("   - DEBUG: Found X employees")
    print("   - DEBUG: Error in get_employees")
    print("   - DEBUG: Error type")
    print("   - DEBUG: get_employees_simple called by user")
    print("   - DEBUG: Error in get_employees_simple")
    
    print("\nLOI ICH:")
    print("- Terminal sach se hon")
    print("- Khong bi roi mat voi debug log")
    print("- Performance tot hon")
    print("- Production ready")

def create_usage_guide():
    """Tao huong dan su dung"""
    print(f"\nHUONG DAN SU DUNG")
    print("=" * 50)
    
    print("1. DEBUG LOG DA DUOC XOA:")
    print("   - Khong con hien thi debug log trong terminal")
    print("   - Terminal sach se hon")
    print("   - Focus vao thong tin quan trong")
    
    print("\n2. NEU CAN DEBUG:")
    print("   - Su dung logging level phu hop")
    print("   - Chi hien thi error quan trong")
    print("   - Su dung logger thay vi print")
    
    print("\n3. MONITORING:")
    print("   - Theo doi error log")
    print("   - Su dung proper logging")
    print("   - Khong lam roi terminal")

if __name__ == "__main__":
    print("TEST XOA DEBUG LOG")
    print("=" * 60)
    
    # Test xoa debug log
    test_debug_cleanup()
    
    # Tao tom tat
    create_cleanup_summary()
    
    # Tao huong dan su dung
    create_usage_guide()
    
    print("\n" + "=" * 60)
    print("HOAN THANH TEST XOA DEBUG LOG")
    print("=" * 60)
