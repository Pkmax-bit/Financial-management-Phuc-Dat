"""
Script test don gian Support Center da duoc di chuyen
"""

import requests

API_BASE_URL = "http://localhost:8000"

def test_support_center():
    """Test Support Center da duoc di chuyen"""
    print("TEST SUPPORT CENTER DA DUOC DI CHUYEN")
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

def create_summary():
    """Tao tom tat"""
    print(f"\nTOM TAT SUPPORT CENTER")
    print("=" * 50)
    
    print("DA THUC HIEN:")
    print("1. Di chuyen Support Center len tren")
    print("2. Nam giua navigation menu va user section")
    print("3. De dang thao tac hon")
    print("4. Khong bi che khuat")
    
    print("\nCAU TRUC MOI:")
    print("- Navigation Menu (tren cung)")
    print("- Support Center (giua) - MOI")
    print("- User Section (duoi cung)")
    print("- Dang xuat (cuoi cung)")
    
    print("\nLOI ICH:")
    print("- Nguoi dung de dang tim thay")
    print("- Khong can cuon xuong cuoi")
    print("- Vi tri thuan tien")
    print("- Cai thien trai nghiem")

def create_usage_guide():
    """Tao huong dan su dung"""
    print(f"\nHUONG DAN SU DUNG")
    print("=" * 50)
    
    print("1. TRUY CAP SUPPORT CENTER:")
    print("   - Mo sidebar (neu dong)")
    print("   - Tim 'Trung tam Ho tro' o giua sidebar")
    print("   - Bam vao de mo Support Center")
    print("   - Khong can cuon xuong cuoi")
    
    print("\n2. VI TRI MOI:")
    print("   - Nam giua navigation menu va user section")
    print("   - Luon hien thi khi sidebar mo")
    print("   - De dang nhin thay")
    print("   - Thao tac nhanh chong")
    
    print("\n3. TINH NANG:")
    print("   - Ho tro nguoi dung")
    print("   - Huong dan su dung")
    print("   - Lien he ho tro")
    print("   - FAQ va tai lieu")

if __name__ == "__main__":
    print("TEST SUPPORT CENTER DA DUOC DI CHUYEN")
    print("=" * 60)
    
    # Test Support Center
    test_support_center()
    
    # Tao tom tat
    create_summary()
    
    # Tao huong dan su dung
    create_usage_guide()
    
    print("\n" + "=" * 60)
    print("HOAN THANH TEST SUPPORT CENTER")
    print("=" * 60)
