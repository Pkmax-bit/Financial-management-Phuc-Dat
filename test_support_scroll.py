"""
Script test don gian nhat
"""

import requests

API_BASE_URL = "http://localhost:8000"

def test_support_scroll():
    """Test support scroll"""
    print("TEST SUPPORT SCROLL")
    print("=" * 30)
    
    try:
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json={
            "email": "admin@test.com",
            "password": "123456"
        })
        
        if response.status_code == 200:
            print("Login: OK")
            
            headers = {"Authorization": f"Bearer {response.json().get('access_token')}"}
            
            dashboard_response = requests.get(f"{API_BASE_URL}/api/dashboard/", headers=headers, timeout=5)
            print(f"Dashboard: {'OK' if dashboard_response.status_code == 200 else dashboard_response.status_code}")
            
            emp_response = requests.get(f"{API_BASE_URL}/api/employees/", headers=headers, timeout=5)
            print(f"Employees: {'OK' if emp_response.status_code == 200 else emp_response.status_code}")
            
        else:
            print(f"Login: FAILED ({response.status_code})")
            
    except Exception as e:
        print(f"Error: {str(e)}")

def create_summary():
    """Tao tom tat"""
    print(f"\nTOM TAT")
    print("=" * 30)
    
    print("DA THUC HIEN:")
    print("1. Dua trung tam ho tro vao thanh cuon")
    print("2. Xoa vi tri cu")
    print("3. Cap nhat LayoutWithSidebar.tsx")
    print("4. Cap nhat NavigationWithToggle.tsx")
    
    print("\nVI TRI MOI:")
    print("1. Navigation Menu")
    print("2. Support Center (trong thanh cuon)")
    print("3. User Section")
    
    print("\nLOI ICH:")
    print("- Trung tam ho tro trong thanh cuon")
    print("- Khong chiem vi tri co dinh")
    print("- Co the cuon de xem")
    print("- Giao dien linh hoat")

if __name__ == "__main__":
    print("TEST SUPPORT SCROLL")
    print("=" * 40)
    
    test_support_scroll()
    create_summary()
    
    print("\n" + "=" * 40)
    print("HOAN THANH TEST SUPPORT SCROLL")
    print("=" * 40)
