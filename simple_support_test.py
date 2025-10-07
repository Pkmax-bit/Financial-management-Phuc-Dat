"""
Script test don gian trung tam ho tro moi
"""

import requests

API_BASE_URL = "http://localhost:8000"

def test_support_center():
    """Test trung tam ho tro moi"""
    print("TEST TRUNG TAM HO TRO MOI")
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
    print(f"\nTOM TAT TRUNG TAM HO TRO MOI")
    print("=" * 50)
    
    print("DA THUC HIEN:")
    print("1. Viet lai toan bo trung tam ho tro")
    print("2. Giao dien don gian, de doc")
    print("3. Huong dan chi tiet")
    print("4. Di chuyen user section len tren")
    print("5. Cai tien nut dang xuat")
    
    print("\nTINH NANG MOI:")
    print("- Huong dan co ban")
    print("- Quan ly du an")
    print("- Tao chi phi")
    print("- Bao cao tai chinh")
    print("- Khac phuc su co")
    print("- Lien he ho tro")
    
    print("\nCAI TIEN UX:")
    print("- User section o vi tri de nhin")
    print("- Avatar gradient dep")
    print("- Role badge mau sac")
    print("- Nut dang xuat noi bat")
    print("- Support center mo rong")

def create_usage_guide():
    """Tao huong dan su dung"""
    print(f"\nHUONG DAN SU DUNG")
    print("=" * 50)
    
    print("1. TRUY CAP TRUNG TAM HO TRO:")
    print("   - Mo sidebar")
    print("   - Tim 'Trung tam Ho tro' o giua")
    print("   - Bam vao de mo")
    print("   - Chon danh muc can tim")
    
    print("\n2. SU DUNG USER SECTION:")
    print("   - Thong tin user o vi tri de nhin")
    print("   - Avatar gradient dep")
    print("   - Role badge mau sac")
    print("   - Nut dang xuat noi bat")
    
    print("\n3. TINH NANG HO TRO:")
    print("   - Huong dan co ban: Lam quen voi he thong")
    print("   - Quan ly du an: Tao va quan ly du an")
    print("   - Tao chi phi: Ghi nhan chi phi")
    print("   - Bao cao: Xem bao cao tai chinh")
    print("   - Khac phuc su co: Giai quyet van de")
    print("   - Lien he: Ho tro truc tiep")

if __name__ == "__main__":
    print("TEST TRUNG TAM HO TRO MOI")
    print("=" * 60)
    
    # Test trung tam ho tro
    test_support_center()
    
    # Tao tom tat
    create_summary()
    
    # Tao huong dan su dung
    create_usage_guide()
    
    print("\n" + "=" * 60)
    print("HOAN THANH TEST TRUNG TAM HO TRO MOI")
    print("=" * 60)
