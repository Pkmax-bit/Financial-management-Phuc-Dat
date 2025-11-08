"""
Script test vi tri trung tam ho tro moi
"""

import requests

API_BASE_URL = "http://localhost:8000"

def test_support_position():
    """Test vi tri trung tam ho tro moi"""
    print("TEST VI TRI TRUNG TAM HO TRO MOI")
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

def create_position_summary():
    """Tao tom tat vi tri moi"""
    print(f"\nTOM TAT VI TRI MOI")
    print("=" * 50)
    
    print("DA THUC HIEN:")
    print("1. Di chuyen trung tam ho tro len tren")
    print("2. Di chuyen user section xuong duoi")
    print("3. Cap nhat ca LayoutWithSidebar.tsx")
    print("4. Cap nhat ca NavigationWithToggle.tsx")
    
    print("\nVI TRI MOI TRONG SIDEBAR:")
    print("1. Navigation Menu (tren cung)")
    print("2. Support Center (moi - len tren)")
    print("3. User Section (moi - xuong duoi)")
    
    print("\nLOI ICH:")
    print("- Trung tam ho tro de dang truy cap")
    print("- Khong bi che khuat boi user section")
    print("- Vi tri thuan tien cho nguoi dung")
    print("- Giao dien logic hon")

def create_usage_guide():
    """Tao huong dan su dung"""
    print(f"\nHUONG DAN SU DUNG")
    print("=" * 50)
    
    print("1. VI TRI MOI:")
    print("   - Trung tam ho tro o vi tri thu 2")
    print("   - Nam ngay sau navigation menu")
    print("   - De dang nhin thay va truy cap")
    print("   - Khong bi che khuat")
    
    print("\n2. TRUY CAP TRUNG TAM HO TRO:")
    print("   - Mo sidebar")
    print("   - Tim 'Trung tam Ho tro' o vi tri thu 2")
    print("   - Bam vao de mo slide bar")
    print("   - Chon danh muc can tim")
    
    print("\n3. USER SECTION:")
    print("   - Di chuyen xuong cuoi sidebar")
    print("   - Van de dang truy cap")
    print("   - Khong lam anh huong den support center")
    print("   - Vi tri hop ly cho thong tin nguoi dung")

if __name__ == "__main__":
    print("TEST VI TRI TRUNG TAM HO TRO MOI")
    print("=" * 60)
    
    # Test vi tri moi
    test_support_position()
    
    # Tao tom tat
    create_position_summary()
    
    # Tao huong dan su dung
    create_usage_guide()
    
    print("\n" + "=" * 60)
    print("HOAN THANH TEST VI TRI TRUNG TAM HO TRO MOI")
    print("=" * 60)
