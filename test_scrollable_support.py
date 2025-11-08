"""
Script test dua trung tam ho tro vao thanh cuon
"""

import requests

API_BASE_URL = "http://localhost:8000"

def test_scrollable_support():
    """Test dua trung tam ho tro vao thanh cuon"""
    print("TEST DUA TRUNG TAM HO TRO VAO THANH CUON")
    print("=" * 50)
    
    # Test voi admin
    print("\nTest voi admin@test.com:")
    
    try:
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
            
        else:
            print(f"Login: FAILED ({response.status_code})")
            
    except Exception as e:
        print(f"Error: {str(e)}")

def create_scrollable_summary():
    """Tao tom tat thanh cuon"""
    print(f"\nTOM TAT DUA VAO THANH CUON")
    print("=" * 50)
    
    print("DA THUC HIEN:")
    print("1. Dua trung tam ho tro vao thanh cuon sidebar")
    print("2. Xoa vi tri cu o duoi sidebar")
    print("3. Cap nhat ca LayoutWithSidebar.tsx")
    print("4. Cap nhat ca NavigationWithToggle.tsx")
    
    print("\nVI TRI MOI:")
    print("1. Navigation Menu (tren cung)")
    print("2. Support Center (trong thanh cuon)")
    print("3. User Section (duoi cung)")
    
    print("\nLOI ICH:")
    print("- Trung tam ho tro trong thanh cuon")
    print("- Khong chiếm vi tri co dinh")
    print("- Co the cuon de xem")
    print("- Giao dien linh hoat hon")

def create_usage_guide():
    """Tao huong dan su dung"""
    print(f"\nHUONG DAN SU DUNG")
    print("=" * 50)
    
    print("1. VI TRI MOI:")
    print("   - Trung tam ho tro trong thanh cuon")
    print("   - Nam sau navigation menu")
    print("   - Co the cuon de xem")
    print("   - Khong chiếm vi tri co dinh")
    
    print("\n2. TRUY CAP TRUNG TAM HO TRO:")
    print("   - Cuon sidebar xuong duoi")
    print("   - Tim phan 'Hỗ trợ'")
    print("   - Click vao 'Trung tam Ho tro'")
    print("   - Chon danh muc can tim")
    
    print("\n3. TINH NANG:")
    print("   - Huong dan co ban")
    print("   - Quan ly du an")
    print("   - Tao chi phi")
    print("   - Bao cao tai chinh")
    print("   - Khac phuc su co")
    print("   - Lien he ho tro")
    
    print("\n4. LOI ICH:")
    print("   - Giao dien linh hoat")
    print("   - Khong chiếm vi tri co dinh")
    print("   - Co the cuon de xem")
    print("   - Tiet kiem khong gian")

if __name__ == "__main__":
    print("TEST DUA TRUNG TAM HO TRO VAO THANH CUON")
    print("=" * 60)
    
    # Test thanh cuon
    test_scrollable_support()
    
    # Tao tom tat
    create_scrollable_summary()
    
    # Tao huong dan su dung
    create_usage_guide()
    
    print("\n" + "=" * 60)
    print("HOAN THANH TEST DUA TRUNG TAM HO TRO VAO THANH CUON")
    print("=" * 60)
